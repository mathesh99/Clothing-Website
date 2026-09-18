import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '../../services';
import { useWishlistStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  basePrice: number | string;
  salePrice?: number | string | null;
  rating: number | string;
  reviewCount: number;
  // flat (pre-mapped) or nested API shape
  image?: string;
  images?: { url: string; isPrimary?: boolean }[];
  colors?: { color: string; hex: string }[];
  variants?: { color: string; colorHex: string; stock: number }[];
  inStock?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  category?: { name: string; slug: string };
}

interface ProductCardProps {
  product: Product;
  showCategory?: boolean;
}

export default function ProductCard({ product, showCategory }: ProductCardProps) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleWishId = useWishlistStore((s) => s.toggleId);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // ── Normalize API shape ─────────────────────────────────────
  const image =
    product.image ||
    product.images?.find((i) => i.isPrimary)?.url ||
    product.images?.[0]?.url;

  const colors: { color: string; hex: string }[] =
    product.colors ||
    (product.variants
      ? Array.from(
          new Map(
            product.variants.map((v) => [v.color, { color: v.color, hex: v.colorHex }])
          ).values()
        )
      : []);

  const inStock =
    product.inStock !== undefined
      ? product.inStock
      : (product.variants?.some((v) => v.stock > 0) ?? true);

  const basePrice = Number(product.basePrice);
  const salePrice = product.salePrice != null ? Number(product.salePrice) : undefined;
  // ────────────────────────────────────────────────────────────

  const discount = salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0;

  const wishlistMutation = useMutation({
    mutationFn: () =>
      isWishlisted ? wishlistService.removeItem(product.id) : wishlistService.addItem(product.id),
    onMutate: () => toggleWishId(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => {
      toggleWishId(product.id); // rollback
      toast.error('Failed to update wishlist');
    },
  });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Sign in to save to wishlist');
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <Link to={`/shop/${product.slug}`} className="product-card group block">
      {/* Image container */}
      <div className="product-card-image relative">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-velour-ivory flex items-center justify-center">
            <ShoppingBag size={40} className="text-velour-light-grey" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNewArrival && <span className="badge-black">New</span>}
          {discount > 0 && <span className="badge-gold">-{discount}%</span>}
          {!inStock && <span className="badge border border-velour-grey text-velour-grey bg-white/80">Out of Stock</span>}
        </div>

        {/* Wishlist button */}
        <button
          className={`absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm shadow-sm
            transition-all duration-200 opacity-0 group-hover:opacity-100
            hover:bg-white ${isWishlisted ? 'opacity-100' : ''}`}
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            className={`transition-colors ${isWishlisted ? 'fill-velour-error text-velour-error' : 'text-velour-charcoal'}`}
          />
        </button>

        {/* Color swatches */}
        {colors.length > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {colors.slice(0, 5).map((c) => (
              <span
                key={c.color}
                className="w-4 h-4 rounded-full border border-white/60 shadow-sm"
                style={{ backgroundColor: c.hex }}
                title={c.color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="pt-3 pb-1">
        {showCategory && product.category && (
          <p className="text-2xs text-velour-grey tracking-widest uppercase mb-1">
            {product.category.name}
          </p>
        )}
        <h3 className="text-sm font-medium text-velour-charcoal leading-snug line-clamp-2 group-hover:text-velour-black transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={11}
                  className={star <= Math.round(Number(product.rating))
                    ? 'fill-velour-gold text-velour-gold'
                    : 'text-velour-light-grey fill-velour-light-grey'}
                />
              ))}
            </div>
            <span className="text-2xs text-velour-grey">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-sm font-medium ${salePrice ? 'text-velour-error' : 'text-velour-black'}`}>
            ₹{(salePrice || basePrice).toLocaleString('en-IN')}
          </span>
          {salePrice && (
            <span className="text-xs text-velour-grey line-through">
              ₹{basePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
