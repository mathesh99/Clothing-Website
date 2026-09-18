import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services';
import toast from 'react-hot-toast';
import { Trash2, Star, AlertCircle } from 'lucide-react';

export default function AdminReviews() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page],
    queryFn: () => adminService.getReviews({ page, limit }),
  });

  const reviews = data?.data?.data || [];
  const meta = data?.data?.meta || { total: 0, totalPages: 1 };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'reviews'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteMutation.mutate(id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-velour-gold">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < rating ? 'currentColor' : 'none'} className={i < rating ? 'text-velour-gold' : 'text-velour-light-grey'} />
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-velour-grey text-sm">Loading reviews...</div>;

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-normal">Customer Reviews</h1>
          <p className="text-sm text-velour-grey mt-1">Manage and moderate product reviews</p>
        </div>
      </div>

      <div className="bg-white border border-velour-ivory">
        {reviews.length === 0 ? (
          <div className="p-12 text-center text-velour-grey flex flex-col items-center">
            <AlertCircle size={32} className="mb-3 text-velour-light-grey" />
            <p>No reviews found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-velour-off-white border-b border-velour-ivory text-xs uppercase tracking-widest text-velour-grey">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">Rating</th>
                  <th className="px-6 py-4 font-medium">Review</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-velour-ivory">
                {reviews.map((review: any) => (
                  <tr key={review.id} className="hover:bg-velour-off-white/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-velour-black">
                          {review.user?.firstName} {review.user?.lastName}
                        </span>
                        <span className="text-xs text-velour-grey">{review.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {review.product?.images?.[0]?.url && (
                          <div className="w-8 h-10 bg-velour-ivory overflow-hidden rounded-sm flex-shrink-0">
                            <img src={review.product.images[0].url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm">{review.product?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4 max-w-[300px] truncate whitespace-normal">
                      <div className="line-clamp-2 text-sm text-velour-grey">
                        {review.title && <strong className="text-velour-black block mb-1">{review.title}</strong>}
                        {review.body}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-velour-grey text-xs">
                      {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(review.id)}
                        disabled={deleteMutation.isPending}
                        className="text-velour-error hover:text-red-700 p-2 disabled:opacity-50"
                        title="Delete Review"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-velour-ivory flex items-center justify-between text-sm">
            <span className="text-velour-grey">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, meta.total)} of {meta.total}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border border-velour-ivory disabled:opacity-50 hover:bg-velour-off-white"
              >
                Previous
              </button>
              <button
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border border-velour-ivory disabled:opacity-50 hover:bg-velour-off-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
