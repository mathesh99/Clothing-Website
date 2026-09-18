import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: {
    size: string;
    color: string;
    colorHex: string;
    sku: string;
    stock: number;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      salePrice?: number;
      images: { url: string }[];
    };
  };
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setItems: (items: CartItem[]) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      setItems: (items) => set({ items }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, item) => {
          const price = item.variant.product.salePrice || item.variant.product.basePrice;
          return sum + price * item.quantity;
        }, 0),
    }),
    {
      name: 'velour-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// Wishlist store
interface WishlistState {
  productIds: Set<string>;
  setWishlistIds: (ids: string[]) => void;
  toggleId: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  productIds: new Set(),

  setWishlistIds: (ids) => set({ productIds: new Set(ids) }),

  toggleId: (productId) =>
    set((state) => {
      const next = new Set(state.productIds);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return { productIds: next };
    }),

  isWishlisted: (productId) => get().productIds.has(productId),
}));
