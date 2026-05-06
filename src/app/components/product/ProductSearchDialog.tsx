import React, { useState, useEffect } from 'react';
import { Search, X, Tag, Package, TrendingUp, History, Plus, Minus, ShoppingCart, Trash2, ChevronDown, Barcode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { Product } from '../../api/mock/products';
import type { Category } from '../../api/mock/categories';
import type { BillPromotion } from '../../api/mock/promotions';
import type { BrandPromotion } from '../../api/mock/brandPromotions';
import { searchProducts as apiSearchProducts, type ApiProduct } from '../../../services/productsApi';

// Map API product to the mock Product shape consumed by this dialog's UI
function apiToMockProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    sku: p.sku,
    barcode: p.barcode,
    name: p.name,
    price: p.standardPrice,
    prices: { P5: p.standardPrice },
    unit: p.unit,
    tax: 'V',
    attr: [],
    image: p.image ?? '',
    stock: Math.max(0, p.stockOffline - p.reservedOffline),
    variant: '',
    category: p.category ?? '',
    brand: p.brand ?? '-',
  } as Product;
}

// Live API-backed search that matches the old signature
async function searchProducts(query: string, _category?: string): Promise<Product[]> {
  const products = await apiSearchProducts(query);
  return products.map(apiToMockProduct);
}

// Lightweight price-tier helper (only P5 is wired for now)
function applyPriceTier(product: Product, _priceTier: string = 'P5'): Product {
  return product;
}

// No /categories endpoint yet — return empty
async function getCategories(): Promise<Category[]> {
  return [];
}

// No brand-level promotions API yet — return empty
function getActiveBrandPromotions(): BrandPromotion[] {
  return [];
}
import { TaxBadge, AttributeBadge, PromoBadge } from '../badges/ProductBadges';
import { ProductListItem } from './ProductListItem';
import { QuantityInput } from '../cart/QuantityInput';

interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, qty: number) => void;
  customerRecentProducts?: Product[];
  customerFrequentProducts?: Product[];
  activePromotions?: BillPromotion[];
  priceTier?: string;
  /** Pre-fill the name search field and switch to the search tab */
  initialQuery?: string;
}

interface TempCartItem {
  product: Product;
  qty: number;
}

export function ProductSearchDialog({
  open,
  onClose,
  onSelectProduct,
  customerRecentProducts = [],
  customerFrequentProducts = [],
  activePromotions = [],
  priceTier = 'P5',
  initialQuery = '',
}: ProductSearchDialogProps) {
  // Helper: apply customer's price tier to any product
  const withTier = (p: Product) => applyPriceTier(p, priceTier);
  const [nameQuery, setNameQuery] = useState('');
  const [skuQuery, setSkuQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recent' | 'frequent'>('frequent');
  const [selectedProductQty, setSelectedProductQty] = useState<Record<string, number>>({});

  // NEW: Temp Cart & Filters
  const [tempCart, setTempCart] = useState<TempCartItem[]>([]);
  const [cartTab, setCartTab] = useState<'normal' | 'preorder'>('normal');
  const [promoOnly, setPromoOnly] = useState(false);
  const [brandPromotions, setBrandPromotions] = useState<BrandPromotion[]>([]);
  const [promoSearch, setPromoSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState<'all' | 'bill' | 'brand'>('all');

  // Load categories and brands on mount
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    loadCategories();

    // Load brand promotions
    const brandPromos = getActiveBrandPromotions();
    setBrandPromotions(brandPromos);
  }, []);

  // Reset temp cart + seed search query when dialog opens
  useEffect(() => {
    if (open) {
      setTempCart([]);
      setSelectedProductQty({});
      if (initialQuery) {
        setNameQuery(initialQuery);
        setActiveTab('search');
      }
    }
  }, [open, initialQuery]);

  // Extract unique brands from search results
  useEffect(() => {
    const performSearch = async () => {
      if (activeTab !== 'search') return;

      setLoading(true);
      try {
        const results = await searchProducts(nameQuery, selectedCategory);
        // additional client-side SKU / barcode filter
        const filtered = skuQuery.trim()
          ? results.filter(p =>
              p.sku.toLowerCase().includes(skuQuery.trim().toLowerCase()) ||
              (p.barcode ?? '').toLowerCase().includes(skuQuery.trim().toLowerCase())
            )
          : results;
        setSearchResults(filtered.map(withTier));

        // Extract unique brands from full name results (before sku filter)
        const uniqueBrands = Array.from(new Set(results.map(p => p.brand))).sort();
        setBrands(uniqueBrands);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [nameQuery, skuQuery, selectedCategory, activeTab]);

  // Apply filters
  let filteredResults = searchResults;

  // Filter by brand
  if (selectedBrand !== 'all') {
    filteredResults = filteredResults.filter(p => p.brand === selectedBrand);
  }

  // Filter by promo
  if (promoOnly) {
    filteredResults = filteredResults.filter(p => p.promo);
  }

  // Filter by promotion type
  if (promoFilter === 'bill') {
    // Show only products with item-level promotions (B2G1, etc.)
    filteredResults = filteredResults.filter(p => p.promo);
  } else if (promoFilter === 'brand') {
    // Show only products from brands that have brand promotions
    const brandNamesWithPromos = brandPromotions.map(bp => bp.brandName);
    filteredResults = filteredResults.filter(p => brandNamesWithPromos.includes(p.brand));
  }

  // Add to temp cart
  const addToTempCart = (product: Product, qty: number) => {
    setTempCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, { product, qty }];
    });
    // Auto-switch cart tab based on product type
    if (product.preorderType) {
      setCartTab('preorder');
    } else {
      setCartTab('normal');
    }
    // Reset quantity selector
    setSelectedProductQty(prev => ({ ...prev, [product.id]: 1 }));
  };

  // Remove from temp cart
  const removeFromTempCart = (productId: string) => {
    setTempCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Update temp cart quantity
  const updateTempCartQty = (productId: string, qty: number) => {
    if (qty < 1) {
      removeFromTempCart(productId);
      return;
    }
    setTempCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, qty } : item
    ));
  };

  // Calculate total
  const tempCartTotal = tempCart.reduce((sum, item) => {
    return sum + (item.product.price * item.qty);
  }, 0);

  // Confirm and add all to main cart
  const handleConfirm = () => {
    tempCart.forEach(item => {
      onSelectProduct(item.product, item.qty);
    });
    onClose();
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setPromoOnly(false);
    setNameQuery('');
    setSkuQuery('');
  };

  // Apply brand promo filter to any product list (recent / frequent tabs)
  const applyBrandPromoFilter = (products: Product[]) => {
    if (promoFilter !== 'brand') return products;
    const brandNamesWithPromos = [...new Set(brandPromotions.map(bp => bp.brandName))];
    return products.filter(p => brandNamesWithPromos.includes(p.brand));
  };

  const renderProductList = (products: Product[], showLastOrder = false, showPurchaseCount = false) => {
    if (products.length === 0) {
      return (
        <div className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">ไม่พบสินค้า</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2">
        {products.map(product => (
          <ProductListItem
            key={product.id}
            product={product}
            showQuantityControls={true}
            quantity={selectedProductQty[product.id] ?? product.medianQty ?? 1}
            onQuantityChange={(qty) => setSelectedProductQty(prev => ({ ...prev, [product.id]: qty }))}
            onAddClick={(prod, qty) => addToTempCart(prod, qty)}
            showLastOrder={showLastOrder}
            showPurchaseCount={showPurchaseCount}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200 shrink-0">
          <DialogTitle className="text-xl font-bold text-neutral-800">
            ค้นหาสินค้าเพิ่มเติม
          </DialogTitle>
          <DialogDescription className="sr-only">
            ค้นหาและเลือกสินค้าเพื่อเพิ่มลงในตะกร้า สามารถค้นหาจากประวัิื้อ สินค้าที่ซื้อบ่อย หรือสินค้าที่มีโปรโมชั่น
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar & Filters */}
        <div className="px-6 pt-3 pb-1 shrink-0">
          <div className="flex flex-wrap gap-2 items-center">

            {/* SKU / Barcode Search */}
            <div className="relative w-[180px] shrink-0">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="SKU / บาร์โค้ด..."
                value={skuQuery}
                onChange={(e) => { setSkuQuery(e.target.value); setActiveTab('search'); }}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-full"
              />
              {skuQuery && (
                <button onClick={() => setSkuQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Name Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสินค้า..."
                value={nameQuery}
                onChange={(e) => { setNameQuery(e.target.value); setActiveTab('search'); }}
                autoFocus
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 w-full"
              />
              {nameQuery && (
                <button onClick={() => setNameQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {/* Category Filter */}
            {promoFilter !== 'brand' && (
              <Popover>
                <PopoverTrigger className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm focus:outline-none transition-colors cursor-pointer whitespace-nowrap ${selectedCategory !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                  <Package className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-[13px] font-medium">
                    {selectedCategory === 'all' ? 'หมวดหมู่: ทั้งหมด' : `หมวดหมู่: ${categories.find(c => c.id === selectedCategory)?.name ?? selectedCategory}`}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[220px] p-1">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedBrand('all'); }}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            {/* Brand Filter */}
            {promoFilter !== 'brand' && brands.length > 0 && (
              <Popover>
                <PopoverTrigger className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm focus:outline-none transition-colors cursor-pointer whitespace-nowrap ${selectedBrand !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}>
                  <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-[13px] font-medium">
                    {selectedBrand === 'all' ? 'แบรนด์: ทั้งหมด' : selectedBrand}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[200px] p-1 max-h-[260px] overflow-y-auto">
                  {['all', ...brands].map(brand => (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrand(brand)}
                      className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between gap-2 ${selectedBrand === brand ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>{brand === 'all' ? 'ทั้งหมด' : brand}</span>
                      <span className="text-[11px] text-slate-400">
                        {brand === 'all' ? searchResults.length : searchResults.filter(p => p.brand === brand).length}
                      </span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            {/* Brand Promo Active Badge */}
            {promoFilter === 'brand' && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-400 rounded-xl text-blue-700 text-[13px] font-medium">
                <Tag className="w-4 h-4 shrink-0" />
                <span>แบรนด์โปรฯ: {[...new Set(brandPromotions.map(bp => bp.brandName))].join(', ')}</span>
              </div>
            )}

            {/* Promo Filter */}
            <button
              onClick={() => setPromoOnly(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap cursor-pointer ${promoOnly ? 'border-red-400 bg-red-50 text-red-600' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
            >
              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
              จัดโปรฯ
            </button>

          </div>

          {/* Result count + clear */}
          <div className="flex items-center justify-between mt-2 min-h-[20px]">
            <span className="text-[12px] text-slate-400">
              พบ {
                activeTab === 'search' ? filteredResults.length
                : activeTab === 'recent' ? applyBrandPromoFilter(customerRecentProducts).length
                : applyBrandPromoFilter(customerFrequentProducts).length
              } รายการ
              {promoFilter === 'brand' && <span className="ml-1 text-blue-600">(แบรนด์โปรฯ)</span>}
            </span>
            {(nameQuery || skuQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || promoOnly) && (
              <button onClick={clearFilters} className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-1">
            {([
              { id: 'frequent' as const, label: `ซื้อบ่อย`, count: customerFrequentProducts.length, icon: TrendingUp },
              { id: 'recent'   as const, label: `ซื้อล่าสุด`, count: customerRecentProducts.length, icon: History },
              { id: 'search'   as const, label: 'ค้นหาทั้งหมด', count: null, icon: Search },
            ]).map(({ id, label, count, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count !== null && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex-1 overflow-hidden flex gap-4 px-6 py-4">
          {/* Left: Product List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-neutral-500 text-base font-bold">กำลังค้นหาสินค้า...</p>
              </div>
            ) : (
              <>
                {activeTab === 'search' && renderProductList(filteredResults)}
                {activeTab === 'recent' && renderProductList(applyBrandPromoFilter(customerRecentProducts.map(withTier)), true)}
                {activeTab === 'frequent' && renderProductList(applyBrandPromoFilter(customerFrequentProducts.map(withTier)), false, true)}
              </>
            )}
          </div>

          {/* Middle: Temp Cart */}
          <div className="w-72 shrink-0 bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-primary" />
                <h3 className="font-bold text-neutral-900 text-sm">รายการที่เลือก</h3>
              </div>
              <span className="text-xs font-semibold text-white bg-brand-primary px-2 py-1 rounded-full">
                {tempCart.length}
              </span>
            </div>

            {/* Tabs */}
            {tempCart.some(i => i.product.preorderType) && (
              <div className="flex border-b border-neutral-200 mb-3 -mx-0">
                {[
                  { key: 'normal'   as const, label: 'ปกติ',       count: tempCart.filter(i => !i.product.preorderType).length },
                  { key: 'preorder' as const, label: 'พรีออเดอร์', count: tempCart.filter(i =>  i.product.preorderType).length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setCartTab(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 pb-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                      cartTab === tab.key
                        ? tab.key === 'preorder'
                          ? 'border-amber-500 text-amber-600'
                          : 'border-brand-primary text-brand-primary'
                        : 'border-transparent text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      cartTab === tab.key
                        ? tab.key === 'preorder' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-brand-primary'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {tempCart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center py-8">
                <div>
                  <ShoppingCart className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500">ยังไม่มีสินค้าในรายการ</p>
                </div>
              </div>
            ) : (() => {
              const normalItems   = tempCart.filter(i => !i.product.preorderType);
              const preorderItems = tempCart.filter(i =>  i.product.preorderType);
              const hasPreorder   = preorderItems.length > 0;
              const visibleItems  = hasPreorder
                ? (cartTab === 'preorder' ? preorderItems : normalItems)
                : tempCart;

              const CartItem = ({ item }: { item: TempCartItem }) => (
                <div key={item.product.id} className={`rounded-lg p-2.5 border ${item.product.preorderType ? 'bg-amber-50 border-amber-200' : 'bg-white border-neutral-200'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-neutral-900 line-clamp-2 mb-0.5">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-neutral-500">
                        ฿{item.product.price.toLocaleString()} × {item.qty}
                      </p>
                    </div>
                    <button onClick={() => removeFromTempCart(item.product.id)} className="text-red-400 hover:text-red-600 p-1 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuantityInput
                      value={item.qty}
                      onChange={(newQty) => updateTempCartQty(item.product.id, newQty)}
                      min={1}
                    />
                    <div className="flex-1 text-right">
                      <span className="font-bold text-sm text-brand-primary">
                        ฿{(item.product.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );

              return (
                <>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-3 custom-scrollbar pr-1">
                    {visibleItems.length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-center">
                        <p className="text-xs text-neutral-400">ไม่มีสินค้าในแท็บนี้</p>
                      </div>
                    ) : (
                      visibleItems.map(item => <CartItem key={item.product.id} item={item} />)
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t-2 border-neutral-300 pt-3 space-y-1">
                    {hasPreorder && normalItems.length > 0 && (
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>สินค้าปกติ ({normalItems.length} รายการ)</span>
                        <span>฿{normalItems.reduce((s, i) => s + i.product.price * i.qty, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {hasPreorder && preorderItems.length > 0 && (
                      <div className="flex justify-between text-xs text-amber-600 font-semibold">
                        <span>พรีออเดอร์ ({preorderItems.length} รายการ)</span>
                        <span>฿{preorderItems.reduce((s, i) => s + i.product.price * i.qty, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-700">ยอดรวม</span>
                      <span className="font-bold text-xl text-brand-primary">
                        ฿{tempCartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Right: Promotions */}
          <div className="w-72 shrink-0 rounded-xl p-4 flex flex-col bg-neutral-50 border-2 border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-neutral-900 text-sm">กรองโปรโมชั่น</h3>
              </div>
              <span className="text-xs font-semibold text-white bg-red-500 px-2 py-1 rounded-full">
                {activePromotions.length + brandPromotions.length}
              </span>
            </div>

            {/* Promo Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="ค้นหาโปรโมชั่น..."
                value={promoSearch}
                onChange={e => setPromoSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary/40 focus:border-brand-primary"
              />
              {promoSearch && (
                <button
                  onClick={() => setPromoSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Promotion Filter Pills - Horizontal Single Row */}
            <div className="flex gap-2 mb-4">
              {/* All Promotions */}
              <button
                onClick={() => setPromoFilter('all')}
                className={`flex-1 rounded-lg px-1 py-1 text-center font-bold text-xs transition-all ${
                  promoFilter === 'all'
                    ? 'bg-gradient-to-r from-neutral-600 to-neutral-700 text-white shadow-md'
                    : 'bg-white border-1 border-neutral-300 text-neutral-700 hover:border-neutral-400'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>ทั้งหมด ({searchResults.length}) </span>
                </div>
              </button>

              {/* Bill Promotions Filter */}
              {activePromotions.length > 0 && (
                <button
                  onClick={() => setPromoFilter('bill')}
                  className={`flex-1 rounded-lg px-1 py-1 text-center font-bold text-xs transition-all ${
                    promoFilter === 'bill'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                      : 'bg-white border-1 border-red-300 text-red-700 hover:border-red-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>บิล ({searchResults.filter(p => p.promo).length})</span>
                  </div>
                </button>
              )}

              {/* Brand Promotions Filter */}
              {brandPromotions.length > 0 && (
                <button
                  onClick={() => setPromoFilter('brand')}
                  className={`flex-1 rounded-lg px-1 py-1 text-center font-bold text-xs transition-all ${
                    promoFilter === 'brand'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'bg-white border-1 border-blue-300 text-blue-700 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span>แบรนด์  ({searchResults.filter(p => brandPromotions.map(bp => bp.brandName).includes(p.brand)).length}) </span>

                  </div>
                </button>
              )}
            </div>

            {/* Active Promotions Display */}
            {activePromotions.length === 0 && brandPromotions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center py-8">
                <div>
                  <Tag className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                  <p className="text-sm text-neutral-500">ไม่มีโปรโมชั่นในขณะนี้</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-4">
                {/* Bill Promotions Section */}
                {(promoFilter === 'all' || promoFilter === 'bill') && activePromotions.length > 0 && (() => {
                  const filtered = activePromotions.filter(p =>
                    !promoSearch || p.description.toLowerCase().includes(promoSearch.toLowerCase())
                  );
                  if (filtered.length === 0) return null;
                  return (
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wide bg-neutral-100 px-2 py-1 rounded-md w-fit">
                      โปรโมชั่นระดับบิล ({filtered.length})
                    </h4>
                    <div className="space-y-2.5">
                      {filtered.map(promo => (
                        <div
                          key={promo.id}
                          className="bg-white border-2 border-red-200 rounded-xl p-3 hover:border-red-400 transition-colors"
                        >
                          <span className="font-bold text-neutral-800 text-sm block leading-snug mb-1.5">{promo.description}</span>
                          {promo.reward.giftItem && (
                            <span className="flex items-center w-fit gap-1 text-[11px] text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-md mt-1">
                              <Tag className="w-3 h-3" />
                              แถม: {promo.reward.giftItem.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                {/* Brand Promotions Section */}
                {(promoFilter === 'all' || promoFilter === 'brand') && brandPromotions.length > 0 && (() => {
                  const filtered = brandPromotions.filter(p =>
                    !promoSearch || p.description.toLowerCase().includes(promoSearch.toLowerCase()) || p.brandName.toLowerCase().includes(promoSearch.toLowerCase())
                  );
                  if (filtered.length === 0) return null;
                  return (
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wide bg-neutral-100 px-2 py-1 rounded-md w-fit">
                      โปรโมชั่นระดับแบรนด์ ({filtered.length})
                    </h4>
                    <div className="space-y-2.5">
                      {filtered.map(promo => (
                        <div
                          key={promo.id}
                          onClick={() => {
                            setSelectedBrand(promo.brandName);
                            setActiveTab('search');
                          }}
                          className={`bg-white border-2 rounded-xl p-3 cursor-pointer transition-colors ${
                            selectedBrand === promo.brandName
                              ? 'border-blue-500 bg-blue-50/60'
                              : 'border-blue-200 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-white text-[10px] px-2 py-0.5 bg-blue-600 rounded">
                              {promo.brandName}
                            </span>
                            <span className="text-xs text-neutral-500 font-bold">
                              ซื้อครบ ฿{promo.threshold.toLocaleString()}
                            </span>
                          </div>
                          <span className="font-bold text-neutral-800 text-sm block leading-snug mb-1.5">{promo.description}</span>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {promo.reward.giftItem && (
                              <span className="flex items-center gap-1 text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                <Tag className="w-3 h-3" />
                                แถม: {promo.reward.giftItem.name}
                              </span>
                            )}
                            {promo.reward.discountPercent && (
                              <span className="flex items-center gap-1 text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                <TrendingUp className="w-3 h-3" />
                                ลด {promo.reward.discountPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-xl border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-semibold"
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={tempCart.length === 0}
              className="flex-1 h-11 rounded-xl bg-brand-primary hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              ตกลง ({tempCart.length} รายการ {tempCartTotal.toLocaleString()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
