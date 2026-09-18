import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'customers', page, search],
    queryFn: () => adminService.getCustomers({ page, limit: 20, search: search || undefined }),
  });

  const customers = data?.data?.data || [];
  const meta = data?.data?.meta;

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleCustomerStatus(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-normal text-velour-black mb-6">Customers</h1>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-velour-grey" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input pl-10 max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <div className="bg-white border border-velour-ivory overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-velour-grey">No customers found</td></tr>
              ) : customers.map((customer: any) => (
                <tr key={customer.id}>
                  <td>
                    <p className="text-sm font-medium">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-velour-grey">{customer.email}</p>
                  </td>
                  <td className="text-sm text-velour-grey">{customer.phone || '—'}</td>
                  <td className="text-sm">{customer._count?.orders}</td>
                  <td className="text-xs text-velour-grey">
                    {new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className={`badge text-2xs ${customer.isActive ? 'badge-black' : 'badge-outline text-velour-error border-velour-error'}`}>
                      {customer.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleMutation.mutate(customer.id)}
                      className={`flex items-center gap-1 text-xs ${customer.isActive ? 'text-velour-error hover:text-red-800' : 'text-velour-success hover:text-green-800'} transition-colors`}
                      title={customer.isActive ? 'Block customer' : 'Unblock customer'}
                    >
                      {customer.isActive ? <><Ban size={14} /> Block</> : <><CheckCircle size={14} /> Unblock</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}
