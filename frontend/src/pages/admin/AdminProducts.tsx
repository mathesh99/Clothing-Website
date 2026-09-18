import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Package, Eye } from 'lucide-react';
import { adminService } from '../../services';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const queryClient = useQueryClient();

  // Debounce
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any)._searchTimer);
    (window as any)._searchTimer = setTimeout(() => setDebouncedSearch(v), 400);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', page, debouncedSearch],
    queryFn: () => adminService.getProducts({ page, limit: 20, search: debouncedSearch }),
  });

  const products = data?.data?.data || [];
  const meta = data?.data?.meta;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProduct(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }); toast.success('Product archived'); },
    onError: () => toast.error('Failed to archive product'),
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Archive "${name}"? It will be hidden from the store.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-normal text-velour-black">Products</h1>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-velour-grey" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="form-input pl-10 max-w-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}</div>
      ) : (
        <div className="bg-white border border-velour-ivory overflow-x-auto">
          <table className="w-full admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-velour-grey">No products found</td></tr>
              ) : products.map((product: any) => {
                const totalStock = product.variants?.reduce((s: number, v: any) => s + v.stock, 0) || 0;
                const primaryImage = product.images?.[0]?.url;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-velour-ivory flex-shrink-0 overflow-hidden">
                          {primaryImage ? (
                            <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-velour-light-grey" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-velour-black">{product.name}</p>
                          <p className="text-xs text-velour-grey">{product.clothingType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{product.category?.name}</td>
                    <td>
                      <p className="text-sm font-medium">₹{Number(product.salePrice || product.basePrice).toLocaleString('en-IN')}</p>
                      {product.salePrice && (
                        <p className="text-xs text-velour-grey line-through">₹{Number(product.basePrice).toLocaleString('en-IN')}</p>
                      )}
                    </td>
                    <td>
                      <span className={`text-sm font-medium ${totalStock === 0 ? 'text-velour-error' : totalStock <= 10 ? 'text-orange-600' : 'text-velour-success'}`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${product.isActive ? 'badge-black' : 'badge-outline'}`}>
                        {product.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/shop/${product.slug}`}
                          target="_blank"
                          className="p-1.5 text-velour-grey hover:text-velour-black transition-colors"
                          title="View on store"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="p-1.5 text-velour-grey hover:text-velour-black transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 text-velour-grey hover:text-velour-error transition-colors"
                          title="Archive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-velour-grey">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages} className="btn-secondary px-4 py-1.5 text-xs disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
