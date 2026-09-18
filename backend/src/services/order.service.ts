import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const orderService = {
  async createOrder(userId: string, data: {
    addressId: string;
    couponCode?: string;
    shippingMethod?: string;
  }) {
    // Get user cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) throw new BadRequestError('Cart is empty');

    // Verify address
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });
    if (!address) throw new NotFoundError('Address not found');

    // Calculate totals on backend (NEVER trust frontend)
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: true },
      });
      if (!variant || !variant.product.isActive) {
        throw new BadRequestError(`Product "${item.variant.product.name}" is no longer available`);
      }
      if (variant.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for "${item.variant.product.name}" (${variant.size}/${variant.color})`);
      }

      const price = Number(variant.product.salePrice || variant.product.basePrice) + Number(variant.priceAddon);
      subtotal += price * item.quantity;

      orderItems.push({
        variantId: item.variantId,
        productId: variant.productId,
        quantity: item.quantity,
        price,
        productSnapshot: {
          name: variant.product.name,
          slug: variant.product.slug,
          image: item.variant.product.images?.[0]?.url,
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          sku: variant.sku,
        },
      });
    }

    // Coupon validation
    let discount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: data.couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) throw new BadRequestError('Invalid coupon code');
      if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestError('Coupon has expired');
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestError('Coupon usage limit reached');
      if (subtotal < Number(coupon.minOrderAmount)) {
        throw new BadRequestError(`Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
      }
      discount =
        coupon.discountType === 'PERCENTAGE'
          ? (subtotal * Number(coupon.discountValue)) / 100
          : Number(coupon.discountValue);
      couponId = coupon.id;
    }

    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = ((subtotal - discount) * 0.18); // 18% GST
    const total = subtotal - discount + shipping + tax;

    // Generate order number
    const orderNumber = `VLR${Date.now()}`;

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId: data.addressId,
          subtotal,
          discount,
          shipping,
          tax,
          total,
          couponId,
          addressSnapshot: {
            firstName: address.firstName,
            lastName: address.lastName,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
          },
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // Deduct stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryTransaction.create({
          data: {
            variantId: item.variantId,
            change: -item.quantity,
            reason: 'ORDER',
            referenceId: newOrder.id,
          },
        });
      }

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return order;
  },

  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { variant: true } },
          payment: { select: { status: true } },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            variant: true,
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
        payment: true,
        address: true,
      },
    });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  },

  // Admin
  async getAllOrders(page = 1, limit = 20, status?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          payment: { select: { status: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');
    return prisma.order.update({
      where: { id: orderId },
      data: { status: status as any, ...(trackingNumber && { trackingNumber }) },
    });
  },
};
