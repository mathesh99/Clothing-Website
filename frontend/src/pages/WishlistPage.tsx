import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { wishlistService } from '../services';
import ProductCard from '../components/product/ProductCard';

export default function WishlistPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist(),
  });

  const items = data?.data?.data?.items || [];

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 className="font-display text-3xl font-normal text-velour-black mb-8">
        Wishlist {items.length > 0 && <span className="text-velour-grey text-xl">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={60} className="text-velour-light-grey mx-auto mb-6" />
          <h2 className="font-display text-2xl font-normal mb-3">Your wishlist is empty</h2>
          <p className="text-velour-grey mb-8">Save items you love to your wishlist.</p>
          <Link to="/shop" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item: any) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      )}
    </div>
  );
}
