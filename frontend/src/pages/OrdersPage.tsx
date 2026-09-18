import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { orderService } from '../services';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-purple-100 text-purple-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RETURN_REQUESTED: 'bg-amber-100 text-amber-800',
  RETURNED: 'bg-gray-100 text-gray-800',
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getMyOrders(),
  });

  const orders = data?.data?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-28 skeleton" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl font-normal text-velour-black mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={60} className="text-velour-light-grey mx-auto mb-6" />
          <h2 className="font-display text-2xl font-normal mb-3">No orders yet</h2>
          <p className="text-velour-grey mb-8">Your orders will appear here once you make a purchase.</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block border border-velour-ivory hover:border-velour-black transition-colors p-5 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <span className={`badge text-2xs px-2 py-0.5 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-velour-grey">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-velour-grey mt-1">
                    {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-base font-medium">₹{Number(order.total).toLocaleString('en-IN')}</p>
                    <p className={`text-xs mt-1 ${order.paymentStatus === 'PAID' ? 'text-velour-success' : 'text-velour-grey'}`}>
                      {order.paymentStatus}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-velour-light-grey group-hover:text-velour-black transition-colors flex-shrink-0" />
                </div>
              </div>

              {/* Item previews */}
              {order.items && order.items.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-hidden">
                  {order.items.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="w-14 h-18 aspect-[3/4] bg-velour-ivory flex-shrink-0 overflow-hidden">
                      {item.variant?.product?.images?.[0]?.url ? (
                        <img src={item.variant.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={16} className="text-velour-light-grey" />
                        </div>
                      )}
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-14 aspect-[3/4] bg-velour-off-white flex items-center justify-center text-xs text-velour-grey font-medium">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
