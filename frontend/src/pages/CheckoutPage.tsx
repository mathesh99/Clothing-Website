import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, MapPin, Truck, CreditCard, Package } from 'lucide-react';
import { userService, orderService, paymentService, cartService } from '../services';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Address', icon: MapPin },
  { id: 2, label: 'Shipping', icon: Truck },
  { id: 3, label: 'Payment', icon: CreditCard },
  { id: 4, label: 'Confirm', icon: Package },
];

const addressSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(10, 'Valid phone required'),
  line1: z.string().min(1, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'Required'),
  state: z.string().min(1, 'Required'),
  pincode: z.string().min(6, 'Valid pincode required'),
});

type AddressForm = z.infer<typeof addressSchema>;

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');

  const { data: addressData } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userService.getAddresses(),
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const addresses = addressData?.data?.data || [];
  const cartItems = cartData?.data?.data?.items || [];

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const pincode = watch('pincode');

  useEffect(() => {
    if (pincode?.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0]?.Status === 'Success') {
            const details = data[0].PostOffice[0];
            setValue('city', details.District, { shouldValidate: true });
            setValue('state', details.State, { shouldValidate: true });
          }
        })
        .catch(() => {
          // ignore network errors silently for auto-fill
        });
    }
  }, [pincode, setValue]);

  const addAddressMutation = useMutation({
    mutationFn: (data: AddressForm) => userService.addAddress(data),
    onSuccess: (res) => {
      setSelectedAddressId(res.data.data.id);
      setStep(2);
      toast.success('Address saved');
    },
    onError: () => toast.error('Failed to save address'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => orderService.createOrder({ addressId: selectedAddressId, couponCode }),
    onSuccess: (res) => {
      const newOrderId = res.data.data.id;
      setOrderId(newOrderId);
      setStep(3);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create order'),
  });

  const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Payment gateway unavailable'); return; }

    try {
      const res = await paymentService.createRazorpayOrder(orderId);
      const { razorpayOrderId, amount, currency, keyId } = res.data.data;

      const options = {
        key: keyId,
        amount: Number(amount) * 100,
        currency,
        name: 'He & She',
        description: `Order #${orderId.slice(0, 8)}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            await paymentService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setStep(4);
            toast.success('Payment successful! 🎉');
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#0F0F0F' },
        modal: {
          ondismiss: () => toast.error('Payment cancelled'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const price = item.variant.product.salePrice || item.variant.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl font-normal text-velour-black mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-velour-black' : 'text-velour-light-grey'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                step > s.id ? 'bg-velour-black border-velour-black text-white' :
                step === s.id ? 'border-velour-black text-velour-black' :
                'border-velour-light-grey text-velour-light-grey'
              }`}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span className="hidden sm:block text-xs font-medium tracking-wider uppercase">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-4 ${step > s.id ? 'bg-velour-black' : 'bg-velour-light-grey'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Step Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-medium mb-6">Delivery Address</h2>

              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="mb-6 space-y-3">
                  <p className="text-sm text-velour-grey">Select a saved address:</p>
                  {addresses.map((addr: any) => (
                    <label key={addr.id} className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id ? 'border-velour-black bg-velour-off-white' : 'border-velour-ivory hover:border-velour-grey'
                    }`}>
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-0.5 accent-velour-black"
                      />
                      <div className="text-sm">
                        <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                        <p className="text-velour-grey">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                        <p className="text-velour-grey">{addr.city}, {addr.state} — {addr.pincode}</p>
                        <p className="text-velour-grey">{addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  {selectedAddressId && (
                    <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5 mt-4">
                      Deliver Here
                    </button>
                  )}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-velour-ivory" /></div>
                    <div className="relative text-center"><span className="bg-white px-4 text-xs text-velour-grey">or add new address</span></div>
                  </div>
                </div>
              )}

              {/* New address form */}
              <form onSubmit={handleSubmit((d) => addAddressMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input {...register('firstName')} className="form-input" />
                    {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input {...register('lastName')} className="form-input" />
                    {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input {...register('phone')} className="form-input" />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="form-label">Address Line 1</label>
                  <input {...register('line1')} className="form-input" />
                  {errors.line1 && <p className="form-error">{errors.line1.message}</p>}
                </div>
                <div>
                  <label className="form-label">Address Line 2 (optional)</label>
                  <input {...register('line2')} className="form-input" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">City</label>
                    <input {...register('city')} className="form-input" />
                    {errors.city && <p className="form-error">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">State</label>
                    <input {...register('state')} className="form-input" />
                    {errors.state && <p className="form-error">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="form-label">Pincode</label>
                    <input {...register('pincode')} className="form-input" />
                    {errors.pincode && <p className="form-error">{errors.pincode.message}</p>}
                  </div>
                </div>
                <button type="submit" disabled={addAddressMutation.isPending} className="btn-primary w-full py-3.5">
                  {addAddressMutation.isPending ? 'Saving...' : 'Save & Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-medium mb-6">Shipping Method</h2>
              <div className="space-y-3 mb-6">
                {[
                  { id: 'standard', label: 'Standard Delivery', desc: '5–7 business days', price: subtotal >= 999 ? 'Free' : '₹99' },
                  { id: 'express', label: 'Express Delivery', desc: '2–3 business days', price: '₹199' },
                  { id: 'overnight', label: 'Overnight Delivery', desc: 'Next business day', price: '₹399' },
                ].map((opt) => (
                  <label key={opt.id} className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                    shippingMethod === opt.id ? 'border-velour-black bg-velour-off-white' : 'border-velour-ivory hover:border-velour-grey'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="shipping" value={opt.id} checked={shippingMethod === opt.id} onChange={() => setShippingMethod(opt.id)} className="accent-velour-black" />
                      <div>
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-velour-grey">{opt.desc}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-velour-gold">{opt.price}</span>
                  </label>
                ))}
              </div>

              {/* Coupon */}
              <div className="mb-6">
                <label className="form-label">Coupon Code (optional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="HEANDSHE10, WELCOME20..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="form-input flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3.5">Back</button>
                <button onClick={() => createOrderMutation.mutate()} disabled={createOrderMutation.isPending} className="btn-primary flex-1 py-3.5">
                  {createOrderMutation.isPending ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-medium mb-6">Payment</h2>
              <div className="border border-velour-ivory p-6 mb-6">
                <p className="text-sm text-velour-grey mb-4">Order #{orderId.slice(0, 8).toUpperCase()} created. Complete payment to confirm.</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-5 bg-blue-600 rounded text-white text-2xs flex items-center justify-center font-bold">R</div>
                  <span className="text-sm font-medium">Razorpay</span>
                </div>
                <p className="text-xs text-velour-grey">
                  Pay securely with UPI, Cards, Net Banking, or Wallets. You will be redirected to Razorpay.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3.5">Back</button>
                <button onClick={handlePayment} className="btn-gold flex-1 py-3.5">
                  Pay ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-velour-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={36} className="text-velour-success" />
              </div>
              <h2 className="font-display text-3xl font-normal mb-3">Order Confirmed!</h2>
              <p className="text-velour-grey mb-2">Your order #{orderId.slice(0, 8).toUpperCase()} has been placed.</p>
              <p className="text-sm text-velour-grey mb-8">You'll receive a confirmation shortly. Track your order in My Orders.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={`/orders/${orderId}`} className="btn-primary px-8 py-3.5">View Order</a>
                <a href="/shop" className="btn-secondary px-8 py-3.5">Continue Shopping</a>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="bg-velour-off-white p-5 sticky top-24">
            <h3 className="text-xs font-medium tracking-wider uppercase mb-4">Order Summary</h3>
            <div className="space-y-3 mb-4">
              {cartItems.slice(0, 3).map((item: any) => {
                const price = item.variant.product.salePrice || item.variant.product.basePrice;
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-16 bg-velour-ivory flex-shrink-0 overflow-hidden">
                      {item.variant.product.images?.[0]?.url && (
                        <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">{item.variant.product.name}</p>
                      <p className="text-2xs text-velour-grey">{item.variant.size} · {item.variant.color} · ×{item.quantity}</p>
                      <p className="text-xs font-medium mt-0.5">₹{(price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
              {cartItems.length > 3 && (
                <p className="text-xs text-velour-grey">+{cartItems.length - 3} more items</p>
              )}
            </div>
            <div className="border-t border-velour-light-grey pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-velour-grey">Subtotal</span><span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between"><span className="text-velour-grey">Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
              <div className="flex justify-between"><span className="text-velour-grey">GST (18%)</span><span>₹{tax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></div>
              <div className="flex justify-between font-medium pt-2 border-t border-velour-light-grey">
                <span>Total</span><span>₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
