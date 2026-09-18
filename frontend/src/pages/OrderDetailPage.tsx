import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Package, MapPin, CreditCard, Check } from 'lucide-react';
import { orderService } from '../services';

const ORDER_STATUSES = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED',
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOrder(id!),
    enabled: !!id,
  });

  const order = data?.data?.data;

  if (isLoading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
      <div className="h-8 skeleton w-1/3" />
      <div className="h-40 skeleton" />
      <div className="h-60 skeleton" />
    </div>
  );

  if (!order) return <div className="text-center py-20"><p>Order not found</p><Link to="/orders" className="btn-primary mt-4">Back to Orders</Link></div>;

  const currentStatusIndex = ORDER_STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Back */}
      <Link to="/orders" className="flex items-center gap-1 text-sm text-velour-grey hover:text-velour-black mb-6 transition-colors">
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-normal">Order #{order.orderNumber}</h1>
        <p className="text-xs text-velour-grey">
          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="mb-8 p-5 border border-velour-ivory">
          <h2 className="text-xs font-medium tracking-widest uppercase mb-5">Order Status</h2>
          <div className="flex items-center overflow-x-auto no-scrollbar gap-0">
            {ORDER_STATUSES.map((status, idx) => {
              const done = currentStatusIndex >= idx;
              const current = currentStatusIndex === idx;
              return (
                <div key={status} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center text-center min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      done ? 'bg-velour-black' : 'bg-velour-light-grey'
                    } ${current ? 'ring-2 ring-offset-2 ring-velour-black' : ''}`}>
                      {done && <Check size={12} className="text-white" />}
                    </div>
                    <span className={`text-2xs mt-1.5 hidden sm:block leading-tight ${done ? 'text-velour-black font-medium' : 'text-velour-light-grey'}`}>
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {idx < ORDER_STATUSES.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${currentStatusIndex > idx ? 'bg-velour-black' : 'bg-velour-light-grey'}`} />
                  )}
                </div>
              );
            })}
          </div>
          {order.trackingNumber && (
            <p className="text-xs text-velour-grey mt-4">Tracking: <span className="font-medium text-velour-black">{order.trackingNumber}</span></p>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-sm text-red-700">
          This order has been cancelled.
        </div>
      )}

      {/* Items */}
      <div className="mb-6 border border-velour-ivory">
        <div className="px-5 py-4 border-b border-velour-ivory flex items-center gap-2">
          <Package size={16} />
          <h2 className="text-sm font-medium tracking-wider uppercase">Items ({order.items?.length})</h2>
        </div>
        <div className="divide-y divide-velour-ivory">
          {order.items?.map((item: any) => {
            const snap = item.productSnapshot as any;
            return (
              <div key={item.id} className="flex gap-4 p-5">
                {snap?.image && (
                  <div className="w-16 h-20 flex-shrink-0 bg-velour-ivory overflow-hidden">
                    <img src={snap.image} alt={snap.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{snap?.name}</p>
                  <p className="text-xs text-velour-grey mt-1">{snap?.size} · {snap?.color}</p>
                  <p className="text-xs text-velour-grey">SKU: {snap?.sku}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm">×{item.quantity}</p>
                  <p className="text-sm font-medium mt-1">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <div className="border border-velour-ivory p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} />
            <h3 className="text-xs font-medium tracking-wider uppercase">Delivery Address</h3>
          </div>
          {order.addressSnapshot && (() => {
            const a = order.addressSnapshot as any;
            return (
              <div className="text-sm text-velour-charcoal space-y-0.5">
                <p className="font-medium">{a.firstName} {a.lastName}</p>
                <p>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                <p>{a.city}, {a.state} — {a.pincode}</p>
                <p>{a.phone}</p>
              </div>
            );
          })()}
        </div>

        {/* Payment Summary */}
        <div className="border border-velour-ivory p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={14} />
            <h3 className="text-xs font-medium tracking-wider uppercase">Payment</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-velour-grey">Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-velour-success"><span>Discount</span><span>−₹{Number(order.discount).toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between"><span className="text-velour-grey">Shipping</span><span>{Number(order.shipping) === 0 ? 'Free' : `₹${order.shipping}`}</span></div>
            <div className="flex justify-between"><span className="text-velour-grey">GST</span><span>₹{Number(order.tax).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-medium pt-2 border-t border-velour-ivory"><span>Total</span><span>₹{Number(order.total).toLocaleString('en-IN')}</span></div>
            <div className="flex items-center gap-2 pt-1">
              <span className={`text-xs font-medium ${order.paymentStatus === 'PAID' ? 'text-velour-success' : 'text-velour-grey'}`}>
                {order.paymentStatus === 'PAID' ? '✓ Payment received' : `Payment ${order.paymentStatus}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
