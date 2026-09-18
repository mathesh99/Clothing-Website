import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { productService } from '../services/product.service';
import { orderService } from '../services/order.service';
import { sendSuccess } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

export const adminController = {
  // Dashboard
  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        pendingOrders,
        lowStockVariants,
        recentOrders,
      ] = await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.count(),
        prisma.user.count({ where: { role: 'CUSTOMER' } }),
        prisma.order.aggregate({
          where: { paymentStatus: 'PAID' },
          _sum: { total: true },
        }),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }),
        prisma.order.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
            _count: { select: { items: true } },
          },
        }),
      ]);

      sendSuccess(res, {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue._sum.total || 0,
        pendingOrders,
        lowStockVariants,
        recentOrders,
      }, 'Dashboard stats retrieved');
    } catch (err) {
      next(err);
    }
  },

  // Products
  async getAdminProducts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.something as string) || 1;
      const limit = Number(req.query.something as string) || 20;
      const search = req.query.something as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            category: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1 },
            _count: { select: { variants: true } },
            variants: { select: { stock: true } },
          },
        }),
        prisma.product.count({ where }),
      ]);

      sendSuccess(res, products, 'Products retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async getAdminProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: req.params.id },
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: 'asc' } }
        }
      });
      if (!product) throw new NotFoundError('Product not found');
      
      // Convert tags array to comma-separated string for the form
      const formData = {
        ...product,
        tags: product.tags.join(', ')
      };
      sendSuccess(res, formData, 'Product retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      if (data.variants && typeof data.variants === 'string') {
        data.variants = JSON.parse(data.variants);
      }
      const product = await productService.createProduct(data);
      sendSuccess(res, product, 'Product created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id);
      sendSuccess(res, null, 'Product archived');
    } catch (err) {
      next(err);
    }
  },

  // Reviews
  async getReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.something as string) || 1;
      const limit = Number(req.query.something as string) || 20;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
            product: { select: { id: true, name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } }
          }
        }),
        prisma.review.count()
      ]);

      sendSuccess(res, reviews, 'Reviews retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit)
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const review = await prisma.review.findUnique({ where: { id: req.params.id } });
      if (!review) throw new NotFoundError('Review not found');

      await prisma.review.delete({ where: { id: req.params.id } });
      
      // Update product review stats
      const stats = await prisma.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { id: true }
      });
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count.id
        }
      });

      sendSuccess(res, null, 'Review deleted successfully');
    } catch (err) {
      next(err);
    }
  },

  async uploadProductImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const images = await productService.uploadProductImages(req.params.id, files);
      sendSuccess(res, images, 'Images uploaded', 201);
    } catch (err) {
      next(err);
    }
  },

  // Inventory
  async getInventory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.something as string) || 1;
      const limit = Number(req.query.something as string) || 20;
      const skip = (page - 1) * limit;
      const lowStock = (req.query.something as string) === 'true';

      const where = lowStock ? { stock: { lte: 10 } } : {};

      const [variants, total] = await Promise.all([
        prisma.productVariant.findMany({
          where,
          skip,
          take: limit,
          include: {
            product: {
              select: { name: true, brand: true, images: { where: { isPrimary: true }, take: 1 } },
            },
          },
          orderBy: { stock: 'asc' },
        }),
        prisma.productVariant.count({ where }),
      ]);

      sendSuccess(res, variants, 'Inventory retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { stock, note } = z.object({
        stock: z.number().int().min(0),
        note: z.string().optional(),
      }).parse(req.body);

      const variant = await prisma.productVariant.findUnique({ where: { id: req.params.variantId } });
      if (!variant) throw new NotFoundError('Variant not found');

      const change = stock - variant.stock;

      await prisma.$transaction([
        prisma.productVariant.update({ where: { id: req.params.variantId }, data: { stock } }),
        prisma.inventoryTransaction.create({
          data: {
            variantId: req.params.variantId,
            change,
            reason: 'ADJUSTMENT',
            note,
          },
        }),
      ]);

      sendSuccess(res, { stock }, 'Stock updated');
    } catch (err) {
      next(err);
    }
  },

  // Orders (Admin)
  async getAllOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.something as string) || 1;
      const limit = Number(req.query.something as string) || 20;
      const result = await orderService.getAllOrders(
        page, limit, req.query.something as string, req.query.something as string
      );
      sendSuccess(res, result.orders, 'Orders retrieved', 200, {
        page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrderDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
          items: { include: { variant: true, product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
          payment: true,
          address: true,
          coupon: true,
        },
      });
      if (!order) throw new NotFoundError('Order not found');
      sendSuccess(res, order, 'Order retrieved');
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, trackingNumber } = z.object({
        status: z.string(),
        trackingNumber: z.string().optional(),
      }).parse(req.body);

      const order = await orderService.updateOrderStatus(req.params.id, status, trackingNumber);
      sendSuccess(res, order, 'Order status updated');
    } catch (err) {
      next(err);
    }
  },

  // Customers
  async getCustomers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.something as string) || 1;
      const limit = Number(req.query.something as string) || 20;
      const search = req.query.something as string;
      const skip = (page - 1) * limit;

      const where: any = { role: 'CUSTOMER' };
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, email: true, firstName: true, lastName: true,
            phone: true, isActive: true, createdAt: true,
            _count: { select: { orders: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      sendSuccess(res, customers, 'Customers retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async toggleCustomerStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (!user) throw new NotFoundError('Customer not found');
      const updated = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: !user.isActive },
        select: { id: true, isActive: true },
      });
      sendSuccess(res, updated, `Customer ${updated.isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      next(err);
    }
  },

  // Categories
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: { children: { where: { isActive: true } }, _count: { select: { products: true } } },
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      });
      sendSuccess(res, categories, 'Categories retrieved');
    } catch (err) {
      next(err);
    }
  },

  async createCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
        description: z.string().optional(),
        image: z.string().optional(),
        sortOrder: z.number().int().default(0),
      }).parse(req.body);

      const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
      if (existing) throw new BadRequestError('A category with this slug already exists');

      const category = await prisma.category.create({ data });
      sendSuccess(res, category, 'Category created', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = z.object({
        name: z.string().min(1).optional(),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }).parse(req.body);

      const category = await prisma.category.findUnique({ where: { id: req.params.id } });
      if (!category) throw new NotFoundError('Category not found');

      if (data.slug && data.slug !== category.slug) {
        const conflict = await prisma.category.findUnique({ where: { slug: data.slug } });
        if (conflict) throw new BadRequestError('Slug already in use');
      }

      const updated = await prisma.category.update({ where: { id: req.params.id }, data });
      sendSuccess(res, updated, 'Category updated');
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { products: true } } },
      });
      if (!category) throw new NotFoundError('Category not found');
      if ((category as any)._count.products > 0) {
        // Soft delete only — has products
        await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
        sendSuccess(res, null, 'Category deactivated (has products)');
      } else {
        await prisma.category.delete({ where: { id: req.params.id } });
        sendSuccess(res, null, 'Category deleted');
      }
    } catch (err) {
      next(err);
    }
  },

  // Clothing Types (stored in a JSON config file + derived from existing products)
  async getClothingTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const configPath = path.join(process.cwd(), 'clothing-types.json');
      let saved: string[] = [];
      if (fs.existsSync(configPath)) {
        saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      // Merge with DB-derived values
      const dbTypes = await prisma.product.findMany({
        where: { clothingType: { not: null } },
        select: { clothingType: true },
        distinct: ['clothingType'],
      });
      const dbList = dbTypes.map((p) => p.clothingType as string).filter(Boolean);
      const merged = Array.from(new Set([...saved, ...dbList])).sort();
      sendSuccess(res, merged, 'Clothing types retrieved');
    } catch (err) {
      next(err);
    }
  },

  async saveClothingTypes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { types } = z.object({ types: z.array(z.string().min(1)) }).parse(req.body);
      const configPath = path.join(process.cwd(), 'clothing-types.json');
      fs.writeFileSync(configPath, JSON.stringify(types, null, 2));
      sendSuccess(res, types, 'Clothing types saved');
    } catch (err) {
      next(err);
    }
  },

  // Wishlist
  async getWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const wishlist = await prisma.wishlist.findUnique({
        where: { userId: req.user!.userId },
        include: {
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 }, variants: { select: { size: true, color: true, stock: true } } },
              },
            },
          },
        },
      });
      sendSuccess(res, wishlist, 'Wishlist retrieved');
    } catch (err) {
      next(err);
    }
  },

  async addToWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.body;
      let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.userId } });
      if (!wishlist) {
        wishlist = await prisma.wishlist.create({ data: { userId: req.user!.userId } });
      }
      await prisma.wishlistItem.upsert({
        where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
        create: { wishlistId: wishlist.id, productId },
        update: {},
      });
      sendSuccess(res, null, 'Added to wishlist');
    } catch (err) {
      next(err);
    }
  },

  async removeFromWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.userId } });
      if (wishlist) {
        await prisma.wishlistItem.deleteMany({
          where: { wishlistId: wishlist.id, productId: req.params.productId },
        });
      }
      sendSuccess(res, null, 'Removed from wishlist');
    } catch (err) {
      next(err);
    }
  },

  // Coupon validation
  async validateCoupon(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code, subtotal } = req.body;
      const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (!coupon || !coupon.isActive) throw new NotFoundError('Invalid coupon code');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('Coupon has expired');
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached');
      if (subtotal < Number(coupon.minOrderAmount)) {
        throw new Error(`Minimum order amount is ₹${coupon.minOrderAmount}`);
      }

      const discount = coupon.discountType === 'PERCENTAGE'
        ? (subtotal * Number(coupon.discountValue)) / 100
        : Number(coupon.discountValue);

      sendSuccess(res, { discount, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } }, 'Coupon applied');
    } catch (err) {
      next(err);
    }
  },

  // Site Content (CMS)
  async getSiteContent(req: Request, res: Response, next: NextFunction) {
    try {
      const contentPath = path.join(process.cwd(), 'site-content.json');
      const defaults = {
        hero: [
          { id: 'men', title: "The Men's Edit", subtitle: 'Elevated essentials for the modern wardrobe', href: '/shop?category=men', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&q=80', cta: 'Shop Men' },
          { id: 'women', title: "The Women's Edit", subtitle: 'Timeless pieces, thoughtfully crafted', href: '/shop?category=women', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80', cta: 'Shop Women' },
        ],
        brandStatement: {
          tagline: 'Wear the Difference',
          heading: 'Fashion designed for the way you live, the way you move, the way you feel.',
          perks: [
            { label: 'Premium Fabrics', desc: 'Carefully sourced materials' },
            { label: 'Ethical Production', desc: 'Responsibly made' },
            { label: 'Free Returns', desc: '30-day return policy' },
          ],
        },
        categoryTiles: [
          { name: 'Ethnic Wear', href: '/shop?category=ethnic', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80' },
          { name: 'Activewear', href: '/shop?category=activewear', image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80' },
          { name: 'Accessories', href: '/shop?category=accessories', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
          { name: 'Kids', href: '/shop?category=kids', image: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80' },
        ],
        banner: {
          tag: 'Limited Time',
          title: 'Sale — Up to 40% Off',
          subtitle: 'Selected styles across all categories. Curated, not clearance.',
          cta: 'Shop the Sale',
          ctaHref: '/shop?sortBy=price_asc',
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=70',
        },
        perks: [
          { icon: '🚚', title: 'Free Delivery', sub: 'On orders above ₹999' },
          { icon: '↩️', title: 'Easy Returns', sub: '30-day return policy' },
          { icon: '🔒', title: 'Secure Payment', sub: 'Powered by Razorpay' },
          { icon: '💬', title: '24/7 Support', sub: "We're here to help" },
        ],
      };
      if (fs.existsSync(contentPath)) {
        const saved = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
        sendSuccess(res, { ...defaults, ...saved }, 'Site content retrieved');
      } else {
        sendSuccess(res, defaults, 'Site content retrieved');
      }
    } catch (err) {
      next(err);
    }
  },

  async saveSiteContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contentPath = path.join(process.cwd(), 'site-content.json');
      fs.writeFileSync(contentPath, JSON.stringify(req.body, null, 2));
      sendSuccess(res, req.body, 'Site content saved');
    } catch (err) {
      next(err);
    }
  },
};

