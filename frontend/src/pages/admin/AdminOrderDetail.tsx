import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronLeft, Check, Truck } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminService.getOrder(id!),
    enabled: !!id,
  });

  const order = data?.data?.data;

  const statusMutation = useMutation({
    mutationFn: () => adminService.updateOrderStatus(id!, newStatus, trackingNumber || undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] }); toast.success('Order status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-8 skeleton w-1/3"/><div className="h-40 skeleton"/></div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/orders" className="text-velour-grey hover:text-velour-black"><ChevronLeft size={20} /></Link>
        <h1 className="font-display text-2xl font-normal">Order #{order.orderNumber}</h1>
        <span className="text-xs text-velour-grey">{new Date(order.createdAt).toLocaleString('en-IN')}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Update Status */}
          <div className="bg-white border border-velour-ivory p-5">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-4">Update Status</h2>
            <div className="flex gap-3 flex-wrap">
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="form-input w-48">
                <option value="">Select new status</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <input
                type="text"
                placeholder="Tracking number (optional)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="form-input flex-1 min-w-32"
              />
              <button
                onClick={() => statusMutation.mutate()}
                disabled={!newStatus || statusMutation.isPending}
                className="btn-primary px-5"
              >
                {statusMutation.isPending ? '...' : <><Check size={15} /> Update</>}
              </button>
            </div>
            {order.trackingNumber && (
              <p className="text-xs text-velour-grey mt-3 flex items-center gap-1.5">
                <Truck size={12} /> Tracking: <span className="font-medium text-velour-black">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-velour-ivory">
            <div className="px-5 py-4 border-b border-velour-ivory">
              <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey">Items ({order.items?.length})</h2>
            </div>
            <div className="divide-y divide-velour-ivory">
              {order.items?.map((item: any) => {
                const snap = item.productSnapshot as any;
                return (
                  <div key={item.id} className="flex gap-4 p-4">
                    {snap?.image && (
                      <div className="w-12 h-16 bg-velour-ivory flex-shrink-0 overflow-hidden">
                        <img src={snap.image} alt={snap.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{snap?.name}</p>
                      <p className="text-xs text-velour-grey">{snap?.size} · {snap?.color} · SKU: {snap?.sku}</p>
                      <p className="text-xs font-medium mt-1">×{item.quantity} @ ₹{Number(item.price).toLocaleString('en-IN')}</p>
                    </div>
                    <p className="text-sm font-medium">₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white border border-velour-ivory p-5">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-velour-grey">Subtotal</span><span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−₹{Number(order.discount).toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between"><span className="text-velour-grey">Shipping</span><span>{Number(order.shipping) === 0 ? 'Free' : `₹${order.shipping}`}</span></div>
              <div className="flex justify-between"><span className="text-velour-grey">GST</span><span>₹{Number(order.tax).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between font-medium pt-2 border-t border-velour-ivory"><span>Total</span><span>₹{Number(order.total).toLocaleString('en-IN')}</span></div>
            </div>
            <div className="mt-3 pt-3 border-t border-velour-ivory text-xs">
              <div className="flex justify-between"><span className="text-velour-grey">Payment Status</span><span className={`font-medium ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>{order.paymentStatus}</span></div>
              <div className="flex justify-between mt-1"><span className="text-velour-grey">Order Status</span><span className="font-medium">{order.status.replace(/_/g, ' ')}</span></div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white border border-velour-ivory p-5">
            <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-3">Customer</h2>
            <p className="text-sm font-medium">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-xs text-velour-grey">{order.user?.email}</p>
            {order.user?.phone && <p className="text-xs text-velour-grey">{order.user.phone}</p>}
          </div>

          {/* Delivery */}
          {order.addressSnapshot && (
            <div className="bg-white border border-velour-ivory p-5">
              <h2 className="text-xs font-medium tracking-widest uppercase text-velour-grey mb-3">Delivery Address</h2>
              {(() => {
                const a = order.addressSnapshot as any;
                return (
                  <div className="text-sm">
                    <p className="font-medium">{a.firstName} {a.lastName}</p>
                    <p className="text-velour-grey">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                    <p className="text-velour-grey">{a.city}, {a.state} — {a.pincode}</p>
                    <p className="text-velour-grey">{a.phone}</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
