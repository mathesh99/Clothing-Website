import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Edit2, Check } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export default function AdminInventory() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string; stock: number } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inventory', page, search],
    queryFn: () => adminService.getInventory({ page, limit: 50, search: search || undefined }),
  });

  const variants = data?.data?.data || [];
  const meta = data?.data?.meta;

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => adminService.updateStock(id, stock),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] }); setEditing(null); toast.success('Stock updated'); },
    onError: () => toast.error('Failed to update stock'),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-normal text-velour-black mb-6">Inventory</h1>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-velour-grey" />
        <input
          type="text"
          placeholder="Search product name, SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="form-input pl-10 max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-12 skeleton" />)}</div>
      ) : (
        <div className="bg-white border border-velour-ivory overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Colour</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant: any) => {
                const isLow = variant.stock <= 5;
                const isOut = variant.stock === 0;
                return (
                  <tr key={variant.id}>
                    <td>
                      <p className="text-sm font-medium">{variant.product?.name}</p>
                    </td>
                    <td className="text-xs font-mono text-velour-grey">{variant.sku}</td>
                    <td className="text-sm">{variant.size}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-velour-light-grey flex-shrink-0" style={{ backgroundColor: variant.colorHex }} />
                        <span className="text-sm">{variant.color}</span>
                      </div>
                    </td>
                    <td>
                      {editing?.id === variant.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editing.stock}
                            onChange={(e) => setEditing({ id: variant.id, stock: parseInt(e.target.value) || 0 })}
                            className="form-input py-1.5 w-20 text-sm"
                          />
                          <button
                            onClick={() => updateMutation.mutate({ id: variant.id, stock: editing.stock })}
                            className="p-1.5 bg-velour-black text-white"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${isOut ? 'text-velour-error' : isLow ? 'text-orange-600' : 'text-velour-charcoal'}`}>
                          {variant.stock} units
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`text-2xs px-2 py-0.5 font-medium ${isOut ? 'bg-red-50 text-red-700' : isLow ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                        {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      {editing?.id !== variant.id && (
                        <button
                          onClick={() => setEditing({ id: variant.id, stock: variant.stock })}
                          className="p-1.5 text-velour-grey hover:text-velour-black transition-colors"
                          title="Edit stock"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
