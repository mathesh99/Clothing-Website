import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Minus, Plus, Tag, ShoppingBag, ArrowRight } from 'lucide-react';
import { cartService, couponService } from '../services';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function CartPage() {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ discount: number; code: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const cart = data?.data?.data;
  const items = cart?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update'),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => cartService.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: () => toast.error('Failed to remove item'),
  });

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponService.validate(couponCode, subtotal);
      setAppliedCoupon({ discount: res.data.data.discount, code: couponCode.toUpperCase() });
      toast.success('Coupon applied!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const subtotal = items.reduce((sum: number, item: any) => {
    const price = item.variant.product.salePrice || item.variant.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const discount = appliedCoupon?.discount || 0;
  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = ((subtotal - discount) * 0.18);
  const total = subtotal - discount + shipping + tax;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <ShoppingBag size={60} className="text-velour-light-grey mb-6" />
        <h1 className="font-display text-3xl font-normal mb-3">Your bag is empty</h1>
        <p className="text-velour-grey mb-8">Add something beautiful to get started.</p>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl font-normal text-velour-black mb-8">Shopping Bag ({items.length})</h1>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-0 divide-y divide-velour-ivory">
          {items.map((item: any) => {
            const price = item.variant.product.salePrice || item.variant.product.basePrice;
            return (
              <div key={item.id} className="flex gap-4 py-6">
                {/* Image */}
                <Link to={`/shop/${item.variant.product.slug}`} className="flex-shrink-0">
                  <div className="w-20 sm:w-24 aspect-[3/4] bg-velour-ivory overflow-hidden">
                    {item.variant.product.images?.[0]?.url ? (
                      <img
                        src={item.variant.product.images[0].url}
                        alt={item.variant.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-velour-light-grey" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link to={`/shop/${item.variant.product.slug}`} className="text-sm font-medium text-velour-black hover:text-velour-gold transition-colors line-clamp-2">
                        {item.variant.product.name}
                      </Link>
                      <div className="text-xs text-velour-grey mt-1 space-x-2">
                        <span>Size: {item.variant.size}</span>
                        <span>·</span>
                        <span>Colour: {item.variant.color}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium">₹{(price * item.quantity).toLocaleString('en-IN')}</p>
                      {item.variant.product.salePrice && (
                        <p className="text-xs text-velour-grey line-through">₹{(item.variant.product.basePrice * item.quantity).toLocaleString('en-IN')}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity */}
                    <div className="flex items-center border border-velour-light-grey">
                      <button
                        onClick={() => item.quantity > 1 && updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        className="w-8 h-8 flex items-center justify-center hover:bg-velour-off-white"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        className="w-8 h-8 flex items-center justify-center hover:bg-velour-off-white"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="text-velour-grey hover:text-velour-error transition-colors p-1"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-velour-off-white p-6 sticky top-24">
            <h2 className="text-sm font-medium tracking-wider uppercase mb-5">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-velour-grey" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="form-input pl-9 py-2.5 text-sm"
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {appliedCoupon && (
                <p className="text-xs text-velour-success mt-2 font-medium">
                  ✓ {appliedCoupon.code} applied — saving ₹{appliedCoupon.discount.toLocaleString('en-IN')}
                </p>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-velour-grey">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-velour-success">
                  <span>Discount</span>
                  <span>−₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-velour-grey">Shipping</span>
                <span className={shipping === 0 ? 'text-velour-success' : ''}>
                  {shipping === 0 ? 'Free' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velour-grey">GST (18%)</span>
                <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-medium text-base pt-3 border-t border-velour-light-grey">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {isAuthenticated ? (
              <Link to="/checkout" className="btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2">
                Proceed to Checkout <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/auth/login?redirect=/checkout" className="btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2">
                Sign In to Checkout <ArrowRight size={16} />
              </Link>
            )}

            <p className="text-xs text-center text-velour-grey mt-4">
              🔒 Secure checkout · Powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
