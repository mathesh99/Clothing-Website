import { prisma } from '../config/database';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../config/redis';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { uploadImage, deleteImage } from '../utils/cloudinary';

export interface ProductFilters {
  category?: string;
  clothingType?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
  rating?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating';
  page?: number;
  limit?: number;
}

export const productService = {
  async getProducts(filters: ProductFilters) {
    const cacheKey = `products:${JSON.stringify(filters)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const {
      category,
      clothingType,
      sizes,
      colors,
      minPrice,
      maxPrice,
      brand,
      inStock,
      rating,
      isFeatured,
      isNewArrival,
      search,
      sortBy = 'newest',
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    if (clothingType) where.clothingType = clothingType;
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (rating) where.rating = { gte: rating };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (sizes && sizes.length > 0) {
      where.variants = { some: { size: { in: sizes }, stock: { gt: 0 } } };
    }

    if (colors && colors.length > 0) {
      where.variants = {
        ...where.variants,
        some: { ...(where.variants?.some || {}), color: { in: colors } },
      };
    }

    if (inStock) {
      where.variants = { some: { stock: { gt: 0 } } };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };
    else if (sortBy === 'popularity') orderBy = { reviewCount: 'desc' };
    else if (sortBy === 'rating') orderBy = { rating: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          category: { select: { name: true, slug: true } },
          variants: {
            select: { size: true, color: true, colorHex: true, stock: true, priceAddon: true },
          },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const result = {
      products: products.map(formatProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await cacheSet(cacheKey, JSON.stringify(result), 300);
    return result;
  },

  async getProductBySlug(slug: string) {
    const cacheKey = `product:${slug}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        reviews: {
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) throw new NotFoundError('Product not found');

    await cacheSet(cacheKey, JSON.stringify(product), 300);
    return product;
  },

  async getFeaturedProducts(limit = 8) {
    return prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { size: true, color: true, colorHex: true, stock: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getNewArrivals(limit = 8) {
    return prisma.product.findMany({
      where: { isNewArrival: true, isActive: true },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { size: true, color: true, colorHex: true, stock: true } },
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getRelatedProducts(productId: string, categoryId: string, limit = 6) {
    return prisma.product.findMany({
      where: { categoryId, isActive: true, id: { not: productId } },
      take: limit,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        variants: { select: { size: true, color: true, colorHex: true, stock: true } },
      },
    });
  },

  // Admin operations
  async createProduct(data: any) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brand: data.brand || 'VELOUR',
        tags: data.tags || [],
        isFeatured: data.isFeatured || false,
        isNewArrival: data.isNewArrival || false,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        clothingType: data.clothingType,
        variants: {
          create: data.variants || [],
        },
        images: {
          create: data.images || [],
        },
      },
      include: { variants: true, images: true },
    });
    await cacheDelPattern('product:*');
    return product;
  },

  async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brand: data.brand,
        tags: data.tags,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        clothingType: data.clothingType,
        isActive: data.isActive,
      },
      include: { variants: true, images: true, category: true },
    });

    await cacheDel(`product:${product.slug}`);
    return updated;
  },

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    await prisma.product.update({ where: { id }, data: { isActive: false } });
    await cacheDel(`product:${product.slug}`);
  },

  async uploadProductImages(productId: string, files: Express.Multer.File[]) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');

    const existingCount = await prisma.productImage.count({ where: { productId } });
    const uploads = await Promise.all(files.map((f) => uploadImage(f.path)));

    const images = await prisma.$transaction(
      uploads.map((upload, i) =>
        prisma.productImage.create({
          data: {
            productId,
            url: upload.url,
            isPrimary: existingCount === 0 && i === 0,
            sortOrder: existingCount + i,
          },
        })
      )
    );

    await cacheDel(`product:${product.slug}`);
    return images;
  },
};

function formatProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    basePrice: p.basePrice,
    salePrice: p.salePrice,
    rating: p.rating,
    reviewCount: p._count?.reviews || p.reviewCount,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    clothingType: p.clothingType,
    category: p.category,
    image: p.images?.[0]?.url || null,
    colors: Array.from(new Map((p.variants || []).map((v: any) => [v.color, { color: v.color, hex: v.colorHex }])).values()),
    sizes: [...new Set((p.variants || []).map((v: any) => v.size))],
    inStock: (p.variants || []).some((v: any) => v.stock > 0),
  };
}
