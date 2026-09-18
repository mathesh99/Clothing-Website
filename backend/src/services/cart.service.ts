import { prisma } from '../config/database';
import { NotFoundError, BadRequestError } from '../utils/errors';

export const cartService = {
  async getCart(userId?: string, guestId?: string) {
    const where = userId ? { userId } : { guestId };
    const cart = await prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: { where: { isPrimary: true }, take: 1 } },
                },
              },
            },
          },
        },
      },
    });
    return cart;
  },

  async addItem(userId: string | undefined, guestId: string | undefined, variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!variant) throw new NotFoundError('Product variant not found');
    if (!variant.product.isActive) throw new BadRequestError('This product is no longer available');
    if (variant.stock < quantity) throw new BadRequestError(`Only ${variant.stock} items in stock`);

    let cart = await this.getCart(userId, guestId);
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, guestId },
        include: { items: { include: { variant: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } } } } },
      });
    }

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (variant.stock < newQty) throw new BadRequestError(`Only ${variant.stock} items in stock`);
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, variantId, quantity },
      });
    }

    return this.getCart(userId, guestId);
  },

  async updateItem(cartItemId: string, userId: string | undefined, guestId: string | undefined, quantity: number) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true, variant: true },
    });
    
    const isOwner = (userId && item?.cart.userId === userId) || (guestId && item?.cart.guestId === guestId);
    if (!item || !isOwner) throw new NotFoundError('Cart item not found');
    
    if (item.variant.stock < quantity) throw new BadRequestError(`Only ${item.variant.stock} items in stock`);

    await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
    return this.getCart(userId, guestId);
  },

  async removeItem(cartItemId: string, userId: string | undefined, guestId: string | undefined) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });
    
    const isOwner = (userId && item?.cart.userId === userId) || (guestId && item?.cart.guestId === guestId);
    if (!item || !isOwner) throw new NotFoundError('Cart item not found');
    
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return this.getCart(userId, guestId);
  },

  async mergeGuestCart(userId: string, guestId: string) {
    const guestCart = await prisma.cart.findUnique({
      where: { guestId },
      include: { items: true },
    });
    if (!guestCart) return;

    let userCart = await prisma.cart.findUnique({ where: { userId } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId } });
    }

    for (const item of guestCart.items) {
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: userCart.id, variantId: item.variantId, quantity: item.quantity },
        });
      }
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  },

  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  },
};
