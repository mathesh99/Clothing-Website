import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { adminService } from '../../services';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-yellow-700 bg-yellow-50',
  CONFIRMED: 'text-blue-700 bg-blue-50',
  DELIVERED: 'text-green-700 bg-green-50',
  CANCELLED: 'text-red-700 bg-red-50',
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboard(),
    refetchInterval: 60000,
  });

  const stats = data?.data?.data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 skeleton" />)}
      </div>
    );
  }

  const statCards = [
    { label: 'Total Revenue', value: `₹${Number(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-velour-gold' },
    { label: 'Total Orders', value: stats?.totalOrders?.toLocaleString() || '0', icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Products', value: stats?.totalProducts?.toLocaleString() || '0', icon: Package, color: 'text-purple-600' },
    { label: 'Customers', value: stats?.totalCustomers?.toLocaleString() || '0', icon: Users, color: 'text-green-600' },
    { label: 'Pending Orders', value: stats?.pendingOrders?.toLocaleString() || '0', icon: Clock, color: 'text-orange-600', alert: (stats?.pendingOrders || 0) > 10 },
    { label: 'Low Stock Items', value: stats?.lowStockVariants?.toLocaleString() || '0', icon: AlertCircle, color: 'text-red-600', alert: (stats?.lowStockVariants || 0) > 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-normal text-velour-black">Dashboard</h1>
        <span className="text-xs text-velour-grey">Live data · refreshes every minute</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, alert }) => (
          <div key={label} className={`admin-stat-card ${alert ? 'border-orange-200 bg-orange-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium tracking-wider uppercase text-velour-grey mb-1">{label}</p>
                <p className="text-2xl font-semibold text-velour-black">{value}</p>
              </div>
              <Icon size={20} className={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Manage Products', href: '/admin/products', desc: 'Add, edit, archive products' },
          { label: 'Manage Orders', href: '/admin/orders', desc: 'Update order statuses' },
          { label: 'Manage Inventory', href: '/admin/inventory', desc: 'Update stock levels' },
        ].map((link) => (
          <Link key={link.href} to={link.href} className="border border-velour-ivory p-4 hover:border-velour-black transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-velour-black">{link.label}</p>
                <p className="text-xs text-velour-grey mt-0.5">{link.desc}</p>
              </div>
              <ArrowRight size={16} className="text-velour-light-grey group-hover:text-velour-black transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-velour-ivory">
        <div className="flex items-center justify-between px-5 py-4 border-b border-velour-ivory">
          <h2 className="text-sm font-medium tracking-wider uppercase">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-velour-gold hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentOrders || []).map((order: any) => (
                <tr key={order.id}>
                  <td>
                    <Link to={`/admin/orders/${order.id}`} className="text-velour-gold hover:underline text-xs">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="text-sm">{order.user?.firstName} {order.user?.lastName}</td>
                  <td className="text-sm font-medium">₹{Number(order.total).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`text-2xs px-2 py-1 font-medium ${STATUS_COLORS[order.status] || 'text-gray-700 bg-gray-50'}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="text-xs text-velour-grey">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
