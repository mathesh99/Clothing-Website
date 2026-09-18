import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { productService } from '../services';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';

import { adminService } from '../services';

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeatured(8),
  });

  const { data: newArrivalsData, isLoading: newLoading } = useQuery({
    queryKey: ['products', 'new-arrivals'],
    queryFn: () => productService.getNewArrivals(8),
  });

  const { data: cmsData, isLoading: cmsLoading } = useQuery({
    queryKey: ['site-content'],
    queryFn: () => adminService.getSiteContent(),
  });

  const featured = featuredData?.data?.data || [];
  const newArrivals = newArrivalsData?.data?.data || [];
  const content = cmsData?.data?.data;

  if (cmsLoading || !content) {
    return <div className="min-h-screen flex items-center justify-center bg-velour-off-white">
      <div className="w-8 h-8 border-2 border-velour-black border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <div className="animate-fade-in">
      {/* ── Hero Split Section ── */}
      <section className="flex flex-col md:flex-row h-auto md:h-[85vh] min-h-[600px] border-b border-velour-ivory">
        {content.hero.map((collection: any, idx: number) => (
          <div key={collection.id || idx} className="relative w-full md:w-1/2 h-[50vh] md:h-full group overflow-hidden border-r last:border-r-0 border-velour-ivory">
            <img 
              src={collection.image} 
              alt={collection.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 p-12 md:p-16 flex flex-col justify-end text-white items-center text-center drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)]">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-4 leading-none">{collection.title}</h2>
              <p className="text-sm md:text-base font-light tracking-wide max-w-sm mb-8 opacity-95">
                {collection.subtitle}
              </p>
              <Link 
                to={collection.href}
                className="group/btn inline-flex items-center gap-4 border-b border-white pb-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-xs tracking-widest uppercase font-medium">{collection.cta}</span>
                <ArrowRight size={16} className="transform group-hover/btn:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* ── Brand Statement ── */}
      <section className="py-24 px-6 bg-velour-off-white text-center border-b border-velour-ivory">
        <div className="max-w-4xl mx-auto">
          <span className="text-[10px] tracking-[0.3em] uppercase text-velour-grey mb-8 block">
            {content.brandStatement.tagline}
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-12 text-velour-black">
            {content.brandStatement.heading}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16 pt-16 border-t border-velour-ivory/50">
            {content.brandStatement.perks.map((perk: any, i: number) => (
              <div key={i}>
                <h3 className="text-sm font-medium mb-2">{perk.label}</h3>
                <p className="text-sm text-velour-grey">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ─────────────────────────── */}
      <section className="py-12 lg:py-16 bg-velour-off-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-subtitle mb-2">Just Dropped</p>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link
              to="/shop?isNewArrival=true"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-velour-black hover:text-velour-gold transition-colors"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {newLoading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newArrivals.map((product: any) => (
                  <ProductCard key={product.id} product={product} showCategory />
                ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link to="/shop?isNewArrival=true" className="btn-secondary inline-flex">
              View All New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* ── Visual Categories ── */}
      <section className="border-b border-velour-ivory">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {content.categoryTiles.map((cat: any, i: number) => (
            <Link key={i} to={cat.href} className="group relative aspect-[3/4] overflow-hidden border-r border-velour-ivory last:border-r-0">
              <img 
                src={cat.image} 
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 p-6 flex justify-between items-end">
                <h3 className="text-white font-display text-xl">{cat.name}</h3>
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                  <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ────────────────────── */}
      <section className="py-12 lg:py-16 bg-velour-ivory">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="section-subtitle mb-2">Curated For You</p>
              <h2 className="section-title">Featured Picks</h2>
            </div>
            <Link
              to="/shop?isFeatured=true"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-velour-black hover:text-velour-gold transition-colors"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredLoading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((product: any) => (
                  <ProductCard key={product.id} product={product} showCategory />
                ))}
          </div>
        </div>
      </section>

      {/* ── Banner Section ── */}
      <section className="relative h-[60vh] min-h-[500px] border-b border-velour-ivory flex items-center">
        <div className="absolute inset-0">
          <img 
            src={content.banner.image} 
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        <div className="relative w-full max-w-7xl mx-auto px-6 text-center text-white">
          <span className="text-xs tracking-[0.2em] uppercase font-medium mb-4 block">
            {content.banner.tag}
          </span>
          <h2 className="font-display text-5xl md:text-7xl mb-6">{content.banner.title}</h2>
          <p className="text-lg font-light max-w-xl mx-auto mb-10 opacity-90">
            {content.banner.subtitle}
          </p>
          <Link to={content.banner.ctaHref} className="btn-primary bg-white text-black hover:bg-velour-off-white border-white">
            {content.banner.cta}
          </Link>
        </div>
      </section>

      {/* ── Trust Icons ── */}
      <section className="py-16 px-6 bg-velour-off-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {content.perks.map((perk: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-4">{perk.icon}</div>
              <h4 className="text-sm font-medium mb-1">{perk.title}</h4>
              <p className="text-xs text-velour-grey">{perk.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
