import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import { adminService } from '../../services';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-700 bg-yellow-50',
  CONFIRMED: 'text-blue-700 bg-blue-50',
  PROCESSING: 'text-purple-700 bg-purple-50',
  SHIPPED: 'text-cyan-700 bg-cyan-50',
  DELIVERED: 'text-green-700 bg-green-50',
  CANCELLED: 'text-red-700 bg-red-50',
  OUT_FOR_DELIVERY: 'text-orange-700 bg-orange-50',
};

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, status, search],
    queryFn: () => adminService.getOrders({ page, limit: 20, status: status || undefined, search: search || undefined }),
  });

  const orders = data?.data?.data || [];
  const meta = data?.data?.meta;

  return (
    <div>
      <h1 className="font-display text-2xl font-normal text-velour-black mb-6">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-velour-grey" />
          <input
            type="text"
            placeholder="Search order number or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-10 w-64"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="form-input w-48"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <div className="bg-white border border-velour-ivory overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-velour-grey">No orders found</td></tr>
              ) : orders.map((order: any) => (
                <tr key={order.id}>
                  <td className="font-medium text-sm">#{order.orderNumber}</td>
                  <td>
                    <p className="text-sm">{order.user?.firstName} {order.user?.lastName}</p>
                    <p className="text-xs text-velour-grey">{order.user?.email}</p>
                  </td>
                  <td className="text-sm">{order._count?.items} items</td>
                  <td className="text-sm font-medium">₹{Number(order.total).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`text-2xs font-medium px-2 py-0.5 ${order.paymentStatus === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`text-2xs font-medium px-2 py-0.5 ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-700'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-xs text-velour-grey">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} className="text-velour-grey hover:text-velour-black transition-colors">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-velour-grey">Showing {orders.length} of {meta.total} orders</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
