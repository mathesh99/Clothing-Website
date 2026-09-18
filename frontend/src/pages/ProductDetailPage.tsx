import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Truck, RotateCcw, Shield, Star, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react';
import { productService, cartService, wishlistService } from '../services';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/cartStore';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const toggleWishId = useWishlistStore((s) => s.toggleId);

  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProduct(slug!),
    enabled: !!slug,
  });

  const product = data?.data?.data;

  const { data: relatedData } = useQuery({
    queryKey: ['related', product?.id, product?.categoryId],
    queryFn: () => productService.getRelated(product!.id, product!.categoryId),
    enabled: !!product?.id,
  });

  // Compute unique colors and sizes from variants
  const colors = product ? [...new Map(product.variants.map((v: any) => [v.color, { color: v.color, hex: v.colorHex }])).values()] : [];
  const sizes = product ? [...new Set(product.variants.filter((v: any) => !selectedColor || v.color === selectedColor).map((v: any) => v.size))] : [];

  const selectedVariant = product?.variants.find(
    (v: any) => v.size === selectedSize && v.color === selectedColor
  );

  const cartMutation = useMutation({
    mutationFn: () => {
      if (!selectedSize || !selectedColor) throw new Error('Please select size and colour');
      if (!selectedVariant) throw new Error('This combination is unavailable');
      if (selectedVariant.stock < quantity) throw new Error(`Only ${selectedVariant.stock} in stock`);
      return cartService.addItem(selectedVariant.id, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success(`${product?.name} added to cart`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to add to cart');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => {
      if (!product) return Promise.reject();
      return isWishlisted(product.id)
        ? wishlistService.removeItem(product.id)
        : wishlistService.addItem(product.id);
    },
    onMutate: () => product && toggleWishId(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
    onError: () => product && toggleWishId(product.id),
  });

  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-[3/4] skeleton" />
          <div className="space-y-4 pt-4">
            <div className="h-3 skeleton w-1/4" />
            <div className="h-8 skeleton w-3/4" />
            <div className="h-6 skeleton w-1/3" />
            <div className="h-20 skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="font-display text-3xl mb-4">Product Not Found</h1>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const discount = product.salePrice
    ? Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100)
    : 0;

  const primaryImage = product.images.find((img: any) => img.isPrimary)?.url || product.images[0]?.url;
  const relatedProducts = relatedData?.data?.data || [];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-xs text-velour-grey">
          <Link to="/" className="hover:text-velour-black">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop" className="hover:text-velour-black">Shop</Link>
          <ChevronRight size={12} />
          <Link to={`/shop?category=${product.category?.slug}`} className="hover:text-velour-black">{product.category?.name}</Link>
          <ChevronRight size={12} />
          <span className="text-velour-black">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div>
            {/* Main image */}
            <div 
              className="aspect-[3/4] relative overflow-hidden bg-velour-ivory mb-3 cursor-zoom-in group"
              onClick={() => setIsLightboxOpen(true)}
            >
              {product.images.length > 0 ? (
                <img
                  src={product.images[activeImage]?.url || primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={60} className="text-velour-light-grey" />
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 badge-gold">{discount}% Off</span>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {product.images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-20 overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-velour-black' : 'border-transparent hover:border-velour-light-grey'
                    }`}
                  >
                    <img src={img.url} alt={img.altText || product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <p className="text-xs tracking-widest uppercase text-velour-grey mb-3">{product.brand}</p>
            <h1 className="font-display text-3xl font-normal text-velour-black mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} className={s <= Math.round(product.rating) ? 'fill-velour-gold text-velour-gold' : 'text-velour-light-grey fill-velour-light-grey'} />
                  ))}
                </div>
                <span className="text-sm text-velour-grey">{Number(product.rating).toFixed(1)} ({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className={`text-2xl font-medium ${product.salePrice ? 'text-velour-error' : 'text-velour-black'}`}>
                ₹{Number(product.salePrice || product.basePrice).toLocaleString('en-IN')}
              </span>
              {product.salePrice && (
                <>
                  <span className="text-lg text-velour-grey line-through">
                    ₹{Number(product.basePrice).toLocaleString('en-IN')}
                  </span>
                  <span className="text-velour-success text-sm font-medium">Save ₹{(product.basePrice - product.salePrice).toLocaleString('en-IN')}</span>
                </>
              )}
            </div>

            {/* Color selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Colour: <span className="font-normal text-velour-grey">{selectedColor || 'Select'}</span></span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(colors as any[]).map((c) => (
                  <button
                    key={c.color}
                    onClick={() => { setSelectedColor(c.color); setSelectedSize(''); }}
                    className={`flex items-center gap-2 px-3 py-1.5 border text-xs transition-all ${
                      selectedColor === c.color
                        ? 'border-velour-black bg-velour-off-white font-medium'
                        : 'border-velour-light-grey hover:border-velour-grey'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm flex-shrink-0" style={{ backgroundColor: c.hex }} />
                    {c.color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Size: <span className="font-normal text-velour-grey">{selectedSize || 'Select'}</span></span>
                <button className="text-xs text-velour-grey underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(sizes as string[]).map((size) => {
                  const variant = product.variants.find((v: any) => v.size === size && (!selectedColor || v.color === selectedColor));
                  const outOfStock = variant ? variant.stock === 0 : false;
                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && setSelectedSize(size)}
                      disabled={outOfStock}
                      className={`w-14 h-11 border text-sm transition-all relative ${
                        selectedSize === size
                          ? 'border-velour-black bg-velour-black text-white'
                          : outOfStock
                          ? 'border-velour-light-grey text-velour-light-grey cursor-not-allowed line-through'
                          : 'border-velour-light-grey hover:border-velour-black'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock status */}
            {selectedVariant && (
              <p className={`text-xs mb-4 font-medium ${selectedVariant.stock > 5 ? 'text-velour-success' : selectedVariant.stock > 0 ? 'text-velour-gold' : 'text-velour-error'}`}>
                {selectedVariant.stock > 5 ? '✓ In Stock' : selectedVariant.stock > 0 ? `⚠ Only ${selectedVariant.stock} left` : '✗ Out of Stock'}
              </p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium">Qty:</span>
              <div className="flex items-center border border-velour-light-grey">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-velour-off-white"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(selectedVariant?.stock || 10, q + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-velour-off-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <button
                onClick={() => cartMutation.mutate()}
                disabled={cartMutation.isPending}
                className="btn-primary flex-1 py-4"
              >
                {cartMutation.isPending ? 'Adding...' : 'Add to Bag'}
              </button>
              <button
                onClick={async () => {
                  try {
                    await cartMutation.mutateAsync();
                    navigate('/checkout');
                  } catch (e) {
                    // Error is handled by cartMutation's onError and toasted
                  }
                }}
                disabled={cartMutation.isPending}
                className="btn-secondary flex-1 py-4"
              >
                Buy Now
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => wishlistMutation.mutate()}
                  className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border transition-colors ${
                    product && isWishlisted(product.id)
                      ? 'border-velour-error bg-velour-error text-white'
                      : 'border-velour-light-grey hover:border-velour-black'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart size={18} className={product && isWishlisted(product.id) ? 'fill-current' : ''} />
                </button>
              )}
            </div>

            {/* Description */}
            <div className="border-t border-velour-ivory pt-5 mb-5">
              <h3 className="text-xs font-medium tracking-widest uppercase mb-3">Product Details</h3>
              <p className="text-sm text-velour-charcoal leading-relaxed">{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="badge-outline">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Perks */}
            <div className="space-y-3 border-t border-velour-ivory pt-5">
              {[
                { Icon: Truck, text: 'Free shipping on orders above ₹999' },
                { Icon: RotateCcw, text: '30-day easy returns & exchanges' },
                { Icon: Shield, text: 'Secure payment — powered by Razorpay' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-velour-charcoal">
                  <Icon size={16} className="text-velour-grey flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <section className="mt-16 pt-12 border-t border-velour-ivory">
            <h2 className="section-title mb-8">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {product.reviews.map((review: any) => (
                <div key={review.id} className="border border-velour-ivory p-5">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={12} className={s <= review.rating ? 'fill-velour-gold text-velour-gold' : 'text-velour-light-grey fill-velour-light-grey'} />
                    ))}
                  </div>
                  {review.title && <p className="text-sm font-medium mb-1">{review.title}</p>}
                  {review.body && <p className="text-sm text-velour-grey">{review.body}</p>}
                  <p className="text-xs text-velour-grey mt-3">
                    {review.user?.firstName} {review.user?.lastName?.[0]}.
                    {review.isVerified && <span className="ml-2 text-velour-success">✓ Verified</span>}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-velour-ivory">
            <h2 className="section-title mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
              {relatedProducts.slice(0, 6).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-fade-in">
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X size={32} />
          </button>
          
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img
              src={product.images[activeImage]?.url || primaryImage}
              alt={product.name}
              className="max-w-full max-h-full object-contain select-none"
            />
            
            {/* Lightbox Navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i === 0 ? product.images.length - 1 : i - 1)); }}
                  className="absolute left-0 md:left-4 p-3 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronLeft size={48} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveImage(i => (i === product.images.length - 1 ? 0 : i + 1)); }}
                  className="absolute right-0 md:right-4 p-3 text-white/50 hover:text-white transition-colors"
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
