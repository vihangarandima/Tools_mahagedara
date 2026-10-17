import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Star,
  Sparkles,
  Zap,
  BatteryCharging,
  ShieldCheck,
  Tag,
  Grid,
  List,
  RotateCcw,
  Check,
  Percent,
  ChevronRight,
  Filter,
  ShoppingCart,
  MessageSquare,
  Eye,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { CATEGORIES, STORE_CONTACT } from '../data/mockProducts';
import { useCart } from '../context/CartContext';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  onOpenQuickView: (product: Product) => void;
}

const BRANDS = ['all', 'DeWALT', 'BOSCH', 'MAKITA', 'DongCheng'] as const;
const PRICE_MIN_DEFAULT = 5000;
const PRICE_MAX_DEFAULT = 60000;
const ITEMS_PER_PAGE = 9;

type SortOption = 'DEFAULT' | 'PRICE_LOW' | 'PRICE_HIGH' | 'POPULAR' | 'DISCOUNT' | 'NAME';
type PowerSourceFilter = 'all' | 'cordless' | 'corded';

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onOpenQuickView
}) => {
  const { addToCart } = useCart();

  // Primary filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [priceMin, setPriceMin] = useState<number>(PRICE_MIN_DEFAULT);
  const [priceCap, setPriceCap] = useState<number>(PRICE_MAX_DEFAULT);
  const [powerType, setPowerType] = useState<PowerSourceFilter>('all');
  const [heavyDutyOnly, setHeavyDutyOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountOnly, setDiscountOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');

  // UI display states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Brand product counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    BRANDS.forEach(b => {
      if (b !== 'all') {
        counts[b] = products.filter(p => p.brand.toLowerCase() === b.toLowerCase()).length;
      }
    });
    return counts;
  }, [products]);

  // Category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    CATEGORIES.forEach(c => {
      counts[c.id] = products.filter(p => p.category === c.id).length;
    });
    return counts;
  }, [products]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim() !== '') count++;
    if (selectedBrand !== 'all') count++;
    if (selectedCategory !== 'all') count++;
    if (priceCap < PRICE_MAX_DEFAULT || priceMin > PRICE_MIN_DEFAULT) count++;
    if (powerType !== 'all') count++;
    if (heavyDutyOnly) count++;
    if (inStockOnly) count++;
    if (discountOnly) count++;
    if (minRating > 0) count++;
    return count;
  }, [
    searchQuery,
    selectedBrand,
    selectedCategory,
    priceCap,
    priceMin,
    powerType,
    heavyDutyOnly,
    inStockOnly,
    discountOnly,
    minRating
  ]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Search filter (name, brand, sku, category, description, and specs)
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const specsMatch = Object.entries(p.specs || {}).some(
            ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
          );
          const match =
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            specsMatch;
          if (!match) return false;
        }

        // Brand filter
        if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category !== selectedCategory) {
          return false;
        }

        // Price range
        if (p.price < priceMin || p.price > priceCap) {
          return false;
        }

        // Power type filter
        if (powerType === 'cordless' && !p.isCordless) return false;
        if (powerType === 'corded' && p.isCordless) return false;

        // Heavy Duty filter
        if (heavyDutyOnly && !p.isHeavyDuty) return false;

        // In Stock filter
        if (inStockOnly && !p.inStock) return false;

        // Discount filter
        if (discountOnly && (!p.discountPercentage || p.discountPercentage <= 0)) return false;

        // Rating filter
        if (minRating > 0 && p.rating < minRating) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_LOW') return a.price - b.price;
        if (sortBy === 'PRICE_HIGH') return b.price - a.price;
        if (sortBy === 'POPULAR') return b.rating - a.rating;
        if (sortBy === 'DISCOUNT') return (b.discountPercentage || 0) - (a.discountPercentage || 0);
        if (sortBy === 'NAME') return a.name.localeCompare(b.name);
        return 0; // DEFAULT
      });
  }, [
    products,
    searchQuery,
    selectedBrand,
    selectedCategory,
    priceMin,
    priceCap,
    powerType,
    heavyDutyOnly,
    inStockOnly,
    discountOnly,
    minRating,
    sortBy
  ]);

  // Featured Workhorses for the sidebar (exact design from the before version)
  const featuredSidebarItems = useMemo(() => {
    const p1 = products.find(p => p.id === 'prod-001') || products[0];
    const p2 = products.find(p => p.id === 'prod-010') || products[9] || products[1];
    const p3 = products.find(p => p.id === 'prod-011') || products[10] || products[2];

    return [p1, p2, p3].filter(Boolean) as Product[];
  }, [products]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrand('all');
    setPriceMin(PRICE_MIN_DEFAULT);
    setPriceCap(PRICE_MAX_DEFAULT);
    setPowerType('all');
    setHeavyDutyOnly(false);
    setInStockOnly(false);
    setDiscountOnly(false);
    setMinRating(0);
    setSortBy('DEFAULT');
    onSelectCategory('all');
    setCurrentPage(1);
  };

  const selectCategory = (catId: string) => {
    onSelectCategory(catId);
    setCurrentPage(1);
  };

  const selectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setCurrentPage(1);
  };

  const setQuickPrice = (max: number, min = PRICE_MIN_DEFAULT) => {
    setPriceMin(min);
    setPriceCap(max);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWhatsAppOrder = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = encodeURIComponent(
      `Hello Tools Mahagedara,\n\nI want to order:\n*${product.name}*\n• SKU: ${product.sku}\n• Price: Rs. ${product.price.toLocaleString()}\n• Warranty: ${product.warranty}\n\nPlease confirm availability and delivery to Kalutara / Island-wide.`
    );
    window.open(`https://wa.me/${STORE_CONTACT.whatsapp.replace('+', '')}?text=${msg}`, '_blank');
  };

  // Reusable Pill styling for top categories
  const pillClass = (selected: boolean) =>
    `px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 font-display border ${
      selected
        ? 'bg-zinc-950 text-amber-400 border-zinc-950 shadow-sm font-bold'
        : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
    }`;

  // Filter Controls Content component (shared between desktop sidebar and mobile drawer)
  const FilterControls = () => (
    <div className="space-y-6">
      {/* 1. Search Box */}
      <div className="space-y-2">
        <label htmlFor="catalog-search-input" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-500" />
            Search Catalog
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </label>
        <div className="relative">
          <input
            id="catalog-search-input"
            type="search"
            placeholder="Search model, drill, saw, SKU..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-3.5 pr-10 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:bg-white transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* 2. CATEGORIES TREE (Restored from before version) */}
      <div className="space-y-3 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Categories
          </h3>
          <span className="text-[11px] font-mono font-bold text-zinc-400">
            {CATEGORIES.length} DEPARTMENTS
          </span>
        </div>

        <ul className="space-y-1 text-xs">
          <li>
            <button
              type="button"
              onClick={() => selectCategory('all')}
              className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                selectedCategory === 'all'
                  ? 'bg-zinc-950 text-amber-400 font-bold shadow-xs'
                  : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'all' ? 'bg-amber-400' : 'bg-zinc-400'}`} />
                All Tool Categories
              </span>
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${selectedCategory === 'all' ? 'bg-zinc-800 text-amber-300' : 'bg-zinc-100 text-zinc-500'}`}>
                {products.length}
              </span>
            </button>
          </li>
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => selectCategory(cat.id)}
                  className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-zinc-950 text-amber-400 font-bold shadow-xs'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-amber-400' : 'bg-zinc-300'}`} />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-2 ${isSelected ? 'bg-zinc-800 text-amber-300' : 'bg-zinc-100 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3. BRAND SELECTION WITH LOGO / ORIGIN BADGES */}
      <div className="space-y-3 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            Brands & Origin
          </h3>
          {selectedBrand !== 'all' && (
            <button
              type="button"
              onClick={() => selectBrand('all')}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              All brands
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {BRANDS.map(b => {
            const isSelected = selectedBrand === b;
            const count = brandCounts[b] || 0;
            const origin =
              b === 'DeWALT' ? 'USA' :
              b === 'BOSCH' ? 'Germany' :
              b === 'MAKITA' ? 'Japan' :
              b === 'DongCheng' ? 'Pro' : '';

            return (
              <button
                key={b}
                type="button"
                onClick={() => selectBrand(b)}
                aria-pressed={isSelected}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-400 border-amber-500 text-zinc-950 shadow-xs'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs truncate">
                    {b === 'all' ? 'All Brands' : b}
                  </span>
                  {origin && (
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                      isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-zinc-200 text-zinc-600'
                    }`}>
                      {origin}
                    </span>
                  )}
                </div>
                <div className="text-[10px] opacity-75 font-mono mt-1">
                  {count} {count === 1 ? 'item' : 'items'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. FILTER BY PRICE (Sliders + Quick Preset Buttons) */}
      <div className="space-y-3.5 pt-4 border-t border-zinc-200">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
            Contractor Price Tier
          </h3>
          <span className="text-xs font-bold text-zinc-950 font-mono">
            {priceCap >= PRICE_MAX_DEFAULT && priceMin <= PRICE_MIN_DEFAULT
              ? 'Any price'
              : `Rs. ${priceMin.toLocaleString()} – ${priceCap.toLocaleString()}`}
          </span>
        </div>

        {/* Quick Price Preset Buttons */}
        <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
          {[
            { label: '< 20K', max: 20000, min: PRICE_MIN_DEFAULT },
            { label: '20K-35K', max: 35000, min: 20000 },
            { label: '35K-50K', max: 50000, min: 35000 },
            { label: 'Any', max: PRICE_MAX_DEFAULT, min: PRICE_MIN_DEFAULT }
          ].map(p => {
            const isMatch = priceCap === p.max && priceMin === p.min;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => setQuickPrice(p.max, p.min)}
                className={`py-1.5 px-1 rounded-lg border text-center transition-colors cursor-pointer text-xs ${
                  isMatch
                    ? 'bg-amber-400 border-amber-500 text-zinc-950 font-black'
                    : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Price Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Max Price Cap</span>
            <span className="font-bold text-zinc-900 font-sans">
              Up to Rs. {priceCap.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={PRICE_MIN_DEFAULT}
            max={PRICE_MAX_DEFAULT}
            step={1000}
            value={priceCap}
            onChange={e => {
              setPriceCap(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="custom-price-slider cursor-pointer"
            aria-label="Filter by maximum price"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
            <span>Rs. 5,000</span>
            <span>Rs. 35,000</span>
            <span>Rs. 60,000+</span>
          </div>
        </div>
      </div>

      {/* 5. POWER SOURCE & TECHNICAL SPECS (Powerful New Facet) */}
      <div className="space-y-3 pt-4 border-t border-zinc-200">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
          Power Source & Specs
        </h3>

        {/* 3-way toggle for Cordless vs Corded */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All' },
            { id: 'cordless', label: 'Cordless 20V', icon: BatteryCharging },
            { id: 'corded', label: 'Corded 230V', icon: Zap }
          ].map(item => {
            const isSelected = powerType === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setPowerType(item.id as PowerSourceFilter);
                  setCurrentPage(1);
                }}
                className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-center ${
                  isSelected
                    ? 'bg-zinc-950 text-amber-400 font-bold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {Icon && <Icon className="w-3 h-3 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Checkbox Toggles */}
        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2.5 text-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={heavyDutyOnly}
              onChange={e => {
                setHeavyDutyOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
            />
            <span className="font-semibold">Heavy Duty / Industrial only</span>
          </label>

          <label className="flex items-center gap-2.5 text-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
            />
            <span className="font-semibold">In-Stock ready for dispatch</span>
          </label>

          <label className="flex items-center gap-2.5 text-zinc-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={discountOnly}
              onChange={e => {
                setDiscountOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500 cursor-pointer accent-amber-500"
            />
            <span className="font-semibold flex items-center gap-1">
              <span>On-Sale / Promotional Deals</span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded">
                % SALE
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* 6. MINIMUM RATING FILTER */}
      <div className="space-y-2.5 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
            Customer Rating
          </h3>
          {minRating > 0 && (
            <button
              type="button"
              onClick={() => setMinRating(0)}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMinRating(minRating === 4 ? 0 : 4);
              setCurrentPage(1);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              minRating === 4
                ? 'bg-amber-400 border-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <Star className="w-3.5 h-3.5 fill-amber-500" />
            </div>
            <span>4.0+ Stars</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMinRating(0);
              setCurrentPage(1);
            }}
            className={`py-1.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
              minRating === 0
                ? 'bg-zinc-950 border-zinc-950 text-white'
                : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* 7. FEATURED WORKHORSES (Restored from the before version) */}
      <div className="space-y-3 pt-4 border-t border-zinc-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Featured Workhorses
          </h3>
          <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
            Top Picks
          </span>
        </div>

        <div className="space-y-2.5 divide-y divide-zinc-100">
          {featuredSidebarItems.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onOpenQuickView(prod)}
              className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 cursor-pointer group"
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenQuickView(prod);
                }
              }}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 font-mono">
                  {prod.brand}
                </span>
                <h4 className="text-xs font-bold text-zinc-900 group-hover:text-amber-600 transition-colors truncate font-display leading-tight">
                  {prod.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs font-bold font-sans">
                  {prod.originalPrice && (
                    <span className="text-zinc-400 line-through text-[10px] font-mono">
                      Rs. {prod.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-red-600">
                    Rs. {prod.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-2.5 h-2.5 ${
                        s <= Math.round(prod.rating)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-zinc-300 fill-zinc-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <img
                src={prod.image}
                alt={prod.name}
                className="w-14 h-14 object-contain bg-white border border-zinc-200 rounded-xl p-1 shrink-0 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section id="catalog-section" className="scroll-mt-24 py-16 bg-catalog text-zinc-900">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">

        {/* Section Header with live inventory counter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE INVENTORY · {products.length} AUTHENTIC POWER TOOLS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-zinc-950 font-display tracking-tight">
              Hardware & Tool Catalog
            </h2>
            <p className="text-sm text-zinc-600 mt-1 max-w-xl">
              Contractor-grade machinery, drills, grinders & cordless platforms. Direct warehouse dispatch from Katukurunda, Kalutara.
            </p>
          </div>

          {/* Top Brand Pills + Mobile Filter Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-xs cursor-pointer font-display"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters & Specs</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-zinc-950 text-white text-[10px] flex items-center justify-center font-mono">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Brand Pills */}
            <div className="hidden sm:flex flex-wrap items-center gap-1.5" role="group" aria-label="Brand">
              {BRANDS.map(b => (
                <button
                  key={b}
                  onClick={() => selectBrand(b)}
                  aria-pressed={selectedBrand === b}
                  className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer font-display border ${
                    selectedBrand === b
                      ? 'bg-amber-400 text-zinc-950 border-amber-500 shadow-xs font-bold'
                      : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                  }`}
                >
                  <span>{b === 'all' ? 'All brands' : b}</span>
                  <span className="text-[11px] opacity-75 font-mono ml-1">
                    ({brandCounts[b] || 0})
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Category Filter Track */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar scroll-smooth" role="group" aria-label="Category">
          <button
            onClick={() => selectCategory('all')}
            aria-pressed={selectedCategory === 'all'}
            className={pillClass(selectedCategory === 'all')}
          >
            <span>All Categories</span>
            <span className="text-xs opacity-75 font-mono">({products.length})</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                aria-pressed={selectedCategory === cat.id}
                className={pillClass(selectedCategory === cat.id)}
              >
                <span>{cat.name}</span>
                <span className="text-xs opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Catalog Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* Desktop Left Sidebar: Organized Modules */}
          <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
                  Filter Tools
                </span>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({activeFilterCount})</span>
                </button>
              )}
            </div>

            <FilterControls />
          </aside>

          {/* Mobile Slide-Over Filter Drawer */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-zinc-950 font-display text-base">
                      Filter & Specifications
                    </h3>
                    {activeFilterCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-bold font-mono">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <FilterControls />
                </div>

                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="py-3 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 font-bold text-xs uppercase tracking-wider text-zinc-700 transition-colors cursor-pointer"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 font-black text-xs uppercase tracking-wider text-zinc-950 transition-colors cursor-pointer font-display text-center"
                  >
                    Show {totalItems} {totalItems === 1 ? 'Tool' : 'Tools'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Active Chips, Sort Bar, and Product Grid */}
          <div className="lg:col-span-9 space-y-6">

            {/* Top Control Bar: Results count, Sort Dropdown & View Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-300">
              <div className="flex items-center gap-3 text-sm text-zinc-600" aria-live="polite">
                <span>
                  Showing <strong className="text-zinc-950 font-bold">{totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}</strong> of <strong className="text-zinc-950 font-bold">{totalItems}</strong> tools
                </span>
                {totalItems !== products.length && (
                  <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-mono font-bold">
                    Filtered
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Switcher (Grid vs List) */}
                <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2 transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-zinc-950 text-amber-400'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2 transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-zinc-950 text-amber-400'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2 text-sm">
                  <label htmlFor="catalog-sort" className="text-zinc-600 hidden sm:inline">
                    Sort by:
                  </label>
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-zinc-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                  >
                    <option value="DEFAULT">Featured / Recommended</option>
                    <option value="POPULAR">Highest Customer Rating</option>
                    <option value="PRICE_LOW">Price: Low to High</option>
                    <option value="PRICE_HIGH">Price: High to Low</option>
                    <option value="DISCOUNT">Biggest Discount (%)</option>
                    <option value="NAME">Tool Name: A to Z</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTIVE FILTERS CHIP BAR (Organized & Dismissible) */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-zinc-200 rounded-2xl">
                <span className="text-xs font-bold text-zinc-500 font-mono uppercase tracking-wider mr-1">
                  Active Filters:
                </span>

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Category: {CATEGORIES.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                    <button
                      type="button"
                      onClick={() => selectCategory('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedBrand !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Brand: {selectedBrand}</span>
                    <button
                      type="button"
                      onClick={() => selectBrand('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(priceCap < PRICE_MAX_DEFAULT || priceMin > PRICE_MIN_DEFAULT) && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Price: Rs. {priceMin.toLocaleString()} – {priceCap.toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceMin(PRICE_MIN_DEFAULT);
                        setPriceCap(PRICE_MAX_DEFAULT);
                      }}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {powerType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>{powerType === 'cordless' ? 'Cordless 20V Only' : 'Corded 230V Only'}</span>
                    <button
                      type="button"
                      onClick={() => setPowerType('all')}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {heavyDutyOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Heavy Duty</span>
                    <button
                      type="button"
                      onClick={() => setHeavyDutyOnly(false)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {inStockOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>In Stock Only</span>
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {discountOnly && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Promotional Deals</span>
                    <button
                      type="button"
                      onClick={() => setDiscountOnly(false)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl">
                    <span>Rated 4.0★+</span>
                    <button
                      type="button"
                      onClick={() => setMinRating(0)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto text-xs font-bold text-red-600 hover:text-red-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}

            {/* Empty State when no tools match */}
            {totalItems === 0 && (
              <div className="text-center py-20 px-4 bg-white border border-dashed border-zinc-300 rounded-2xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                  <Filter className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 font-display">
                  No tools match these filter criteria
                </h3>
                <p className="text-sm text-zinc-600 max-w-md mx-auto">
                  Try broadening your price range, searching for shorter terms, or clearing specific brand / power source restrictions.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm uppercase tracking-wider transition-all cursor-pointer rounded-xl font-display shadow-xs inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset all filters</span>
                  </button>
                </div>
              </div>
            )}

            {/* PRODUCT GRID VIEW (3x3 Responsive) */}
            {totalItems > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {currentProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenQuickView={onOpenQuickView}
                  />
                ))}
              </div>
            )}

            {/* PRODUCT LIST VIEW (Contractor Technical Detail List) */}
            {totalItems > 0 && viewMode === 'list' && (
              <div className="space-y-4">
                {currentProducts.map(product => {
                  const specEntries = Object.entries(product.specs || {}).slice(0, 3);
                  return (
                    <div
                      key={product.id}
                      onClick={() => onOpenQuickView(product)}
                      className="group bg-white border border-zinc-200 hover:border-zinc-400 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white border border-zinc-200 rounded-xl p-2 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          {product.discountPercentage && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded">
                              −{product.discountPercentage}%
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded font-mono">
                              {product.brand}
                            </span>
                            <span className="text-zinc-500 font-mono text-[11px]">
                              {product.sku}
                            </span>
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {product.warranty}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-zinc-950 font-display group-hover:text-amber-600 transition-colors line-clamp-1">
                            {product.name}
                          </h3>

                          {specEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {specEntries.map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[11px] bg-zinc-50 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md font-mono"
                                >
                                  {k}: <strong className="text-zinc-900">{v}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-xs text-amber-500 pt-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span className="font-bold text-zinc-900">{product.rating}</span>
                            <span className="text-zinc-400 font-mono">({product.reviewsCount} contractor reviews)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200 shrink-0">
                        <div className="text-left md:text-right">
                          <div className="text-xl font-black text-zinc-950 font-display">
                            Rs. {product.price.toLocaleString()}
                          </div>
                          {product.originalPrice && (
                            <div className="text-xs text-zinc-400 line-through font-mono">
                              Rs. {product.originalPrice.toLocaleString()}
                            </div>
                          )}
                          <div className="text-[11px] text-emerald-700 font-semibold font-mono">
                            {product.inStock ? 'Ready for Dispatch' : 'Out of Stock'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product, 1);
                            }}
                            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-display"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleWhatsAppOrder(product, e)}
                            className="w-9 h-9 flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white transition-colors rounded-xl cursor-pointer"
                            title="Order via WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenQuickView(product);
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white transition-colors rounded-xl cursor-pointer"
                            title="Quick view"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="pt-8 flex items-center justify-between border-t border-zinc-300" aria-label="Pages">
                <span className="text-xs sm:text-sm text-zinc-600 font-mono">
                  PAGE <strong className="text-zinc-950 font-bold">{currentPage}</strong> OF {totalPages}
                </span>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      aria-label={`Page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 text-sm font-bold rounded-xl flex items-center justify-center transition-colors cursor-pointer font-display border ${
                        currentPage === pageNum
                          ? 'bg-amber-400 text-zinc-950 border-amber-500 font-black shadow-xs'
                          : 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {currentPage < totalPages && (
                    <button
                      onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
                      className="px-4 h-10 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-white transition-colors cursor-pointer font-display ml-1"
                    >
                      Next →
                    </button>
                  )}
                </div>
              </nav>
            )}

          </div>

        </div>
      </div>
    </section>
  );
};
