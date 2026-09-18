import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Grid3X3, List, X, ChevronDown } from 'lucide-react';
import { productService } from '../services';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/common/Skeleton';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];
const COLORS = ['Black', 'White', 'Navy', 'Beige', 'Red', 'Pink', 'Green', 'Grey', 'Brown'];
const CLOTHING_TYPES = [
  'T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Dresses', 'Skirts',
  'Jackets', 'Hoodies', 'Sweatshirts', 'Shorts', 'Sarees', 'Kurtas',
  'Activewear', 'Accessories', 'Bags', 'Belts',
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popularity', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

function FilterAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-velour-ivory">
      <button
        className="w-full flex items-center justify-between py-4 text-sm font-medium tracking-wider uppercase text-velour-black"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [searchParams]);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const category = searchParams.get('category') || undefined;
  const isNewArrival = searchParams.get('isNewArrival') === 'true' ? true : undefined;
  const isFeatured = searchParams.get('isFeatured') === 'true' ? true : undefined;
  const search = searchParams.get('search') || undefined;
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'newest');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { category, isNewArrival, isFeatured, search, sortBy, selectedSizes, selectedColors, selectedType, minPrice, maxPrice, inStockOnly, page }],
    queryFn: () => productService.getProducts({
      category,
      isNewArrival,
      isFeatured,
      search,
      sortBy,
      sizes: selectedSizes.join(',') || undefined,
      colors: selectedColors.join(',') || undefined,
      clothingType: selectedType || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      inStock: inStockOnly || undefined,
      page,
      limit: 20,
    }),
    placeholderData: (prev) => prev,
  });

  const products = data?.data?.data || [];
  const meta = data?.data?.meta;

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
    setPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedType('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setPage(1);
  };

  const hasFilters = selectedSizes.length > 0 || selectedColors.length > 0 || selectedType || minPrice || maxPrice || inStockOnly;

  const pageTitle = search ? `Search: "${search}"`
    : isNewArrival ? 'New Arrivals'
    : isFeatured ? 'Featured Picks'
    : category ? category.charAt(0).toUpperCase() + category.slice(1) + "'s Collection"
    : 'All Products';

  const FilterPanel = () => (
    <div className="space-y-0">
      {/* Category/Type */}
      <FilterAccordion title="Type">
        <div className="space-y-2">
          {CLOTHING_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="type"
                checked={selectedType === type}
                onChange={() => { setSelectedType(selectedType === type ? '' : type); setPage(1); }}
                className="w-3.5 h-3.5 accent-velour-black"
              />
              <span className="text-sm text-velour-charcoal group-hover:text-velour-black">{type}</span>
            </label>
          ))}
        </div>
      </FilterAccordion>

      {/* Size */}
      <FilterAccordion title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                selectedSizes.includes(size)
                  ? 'border-velour-black bg-velour-black text-white'
                  : 'border-velour-light-grey text-velour-charcoal hover:border-velour-black'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterAccordion>

      {/* Color */}
      <FilterAccordion title="Colour">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                selectedColors.includes(color)
                  ? 'border-velour-black bg-velour-black text-white'
                  : 'border-velour-light-grey text-velour-charcoal hover:border-velour-black'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </FilterAccordion>

      {/* Price */}
      <FilterAccordion title="Price (₹)">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            className="form-input text-sm py-2"
          />
          <span className="text-velour-grey">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            className="form-input text-sm py-2"
          />
        </div>
      </FilterAccordion>

      {/* Availability */}
      <FilterAccordion title="Availability">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => { setInStockOnly(e.target.checked); setPage(1); }}
            className="w-3.5 h-3.5 accent-velour-black"
          />
          <span className="text-sm">In Stock Only</span>
        </label>
      </FilterAccordion>
    </div>
  );

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-display text-3xl lg:text-4xl font-normal text-velour-black mb-2">
          {pageTitle}
        </h1>
        {meta && (
          <p className="text-sm text-velour-grey">
            {meta.total} {meta.total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium tracking-widest uppercase">Filters</h2>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-velour-gold hover:underline">
                Clear all
              </button>
            )}
          </div>
          <FilterPanel />
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-velour-ivory">
            {/* Mobile filter toggle */}
            <button
              className="lg:hidden flex items-center gap-2 text-sm font-medium"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-velour-gold rounded-full" />}
            </button>

            {/* Active filter pills */}
            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              {selectedSizes.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-velour-black text-white text-xs">
                  {s} <button onClick={() => toggleSize(s)}><X size={10} /></button>
                </span>
              ))}
              {selectedColors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 bg-velour-black text-white text-xs">
                  {c} <button onClick={() => toggleColor(c)}><X size={10} /></button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-velour-light-grey focus:outline-none focus:border-velour-black bg-white cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-velour-grey" />
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex items-center border border-velour-light-grey">
                <button
                  className={`p-2 ${viewMode === 'grid' ? 'bg-velour-black text-white' : 'text-velour-grey hover:text-velour-black'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  className={`p-2 ${viewMode === 'list' ? 'bg-velour-black text-white' : 'text-velour-grey hover:text-velour-black'}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 20 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-2xl font-display mb-4">No products found</p>
              <p className="text-velour-grey mb-6">Try adjusting your filters or search term.</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'
                : 'space-y-4'
            }>
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} showCategory />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="btn-secondary px-4 py-2 text-xs disabled:opacity-30"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-sm flex items-center justify-center transition-colors ${
                        p === page
                          ? 'bg-velour-black text-white'
                          : 'text-velour-charcoal hover:bg-velour-off-white'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === meta.totalPages}
                className="btn-secondary px-4 py-2 text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-velour-ivory">
              <h2 className="font-medium text-sm tracking-wider uppercase">Filters</h2>
              <div className="flex items-center gap-4">
                {hasFilters && <button onClick={clearFilters} className="text-xs text-velour-gold">Clear</button>}
                <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <FilterPanel />
            </div>
            <div className="p-4 border-t border-velour-ivory">
              <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full">
                See Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
