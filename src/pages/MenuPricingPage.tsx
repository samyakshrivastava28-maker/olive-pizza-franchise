import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Tag,
  DollarSign,
  Edit3,
  X,
  TrendingUp,
  AlertCircle,
  Store
} from 'lucide-react';
import { fetchApi, fetchBranchMenuManagement, fetchMasterCatalog, invalidateMenuCache, CLIENT_CACHE_TTL } from '../lib/api';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  customPrice: number;
  isAvailable: boolean;
  description?: string;
  imageUrl?: string;
}

export const MenuPricingPage: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [modalPrice, setModalPrice] = useState<number>(0);
  const [modalEnabled, setModalEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeBranchId = localStorage.getItem('active_branch_id') || 'main_branch';

  const loadMenu = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetchBranchMenuManagement(activeBranchId, force, (fresh) => {
        if (fresh?.products && fresh.products.length > 0) {
          setItems(fresh.products.map((p: any) => ({
            id: p.id,
            name: p.name || p.productName || 'Pizza Item',
            category: p.category || 'Pizzas',
            basePrice: Number(p.basePrice || p.price || 199),
            customPrice: Number(p.customPrice ?? p.price ?? p.basePrice ?? 199),
            isAvailable: p.isEnabledForBranch !== false && p.isAvailable !== false,
            description: p.description,
            imageUrl: p.imageUrl || p.image
          })));
        }
      });

      if (res?.products && res.products.length > 0) {
        setItems(res.products.map((p: any) => ({
          id: p.id,
          name: p.name || p.productName || 'Pizza Item',
          category: p.category || 'Pizzas',
          basePrice: Number(p.basePrice || p.price || 199),
          customPrice: Number(p.customPrice ?? p.price ?? p.basePrice ?? 199),
          isAvailable: p.isEnabledForBranch !== false && p.isAvailable !== false,
          description: p.description,
          imageUrl: p.imageUrl || p.image
        })));
      } else {
        const catRes = await fetchMasterCatalog(force);
        if (catRes?.products && catRes.products.length > 0) {
          setItems(catRes.products.map((p: any) => ({
            id: p.id,
            name: p.name || p.productName,
            category: p.category || 'Pizzas',
            basePrice: Number(p.basePrice || p.price || 199),
            customPrice: Number(p.basePrice || p.price || 199),
            isAvailable: p.isGlobalActive ?? true,
            description: p.description,
            imageUrl: p.imageUrl || p.image
          })));
        }
      }
    } catch (err: any) {
      console.warn('Could not load franchise menu:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [activeBranchId]);

  const toggleAvailability = async (item: MenuItem) => {
    const next = !item.isAvailable;
    // Optimistic local update
    setItems(items.map(it => it.id === item.id ? { ...it, isAvailable: next } : it));
    
    try {
      const res = await fetchApi(`/api/menu/branch/${encodeURIComponent(activeBranchId)}/customizations`, {
        method: 'PUT',
        body: JSON.stringify({
          productId: item.id,
          customPrice: item.customPrice,
          isEnabled: next
        })
      });
      if (res?.success) {
        invalidateMenuCache(activeBranchId);
        toast.success(next ? `Enabled ${item.name} for this store` : `Disabled ${item.name} for this store`);
      } else {
        // Rollback
        setItems(items.map(it => it.id === item.id ? { ...it, isAvailable: item.isAvailable } : it));
        toast.error(res?.error || 'Failed to update store availability');
      }
    } catch (err: any) {
      setItems(items.map(it => it.id === item.id ? { ...it, isAvailable: item.isAvailable } : it));
      toast.error(err.message || 'Error updating availability');
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setModalPrice(item.customPrice || item.basePrice);
    setModalEnabled(item.isAvailable);
  };

  const handleSavePrice = async () => {
    if (!editingItem) return;
    if (isNaN(modalPrice) || modalPrice <= 0) {
      toast.error('Please enter a valid price greater than ₹0');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchApi(`/api/menu/branch/${encodeURIComponent(activeBranchId)}/customizations`, {
        method: 'PUT',
        body: JSON.stringify({
          productId: editingItem.id,
          customPrice: Number(modalPrice),
          isEnabled: modalEnabled
        })
      });

      if (res && res.success !== false) {
        invalidateMenuCache(activeBranchId);
        setItems(prev => prev.map(it => 
          it.id === editingItem.id 
            ? { ...it, customPrice: Number(modalPrice), isAvailable: modalEnabled } 
            : it
        ));
        toast.success(`Updated ${editingItem.name} selling price to ₹${modalPrice}!`);
        setEditingItem(null);
      } else {
        toast.error(res?.error || 'Failed to update selling price');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating price');
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(items.map(it => it.category).filter(Boolean)))];

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase()) || 
                          it.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || it.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xl sm:text-2xl text-white tracking-tight">Franchise Menu & Pricing Overrides</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Branch Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure store-specific selling prices vs Master Catalog base prices. Changes sync atomically across PostgreSQL, Firestore, POS counters, and the customer ordering app.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => loadMenu(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer min-h-[42px]"
            title="Force refresh catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[42px]"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap min-h-[38px] cursor-pointer ${
              categoryFilter === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {loading && items.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">Loading store catalog and pricing...</div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800">
          No matching products found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredItems.map(it => {
            const hasCustomPrice = it.customPrice && it.customPrice !== it.basePrice;
            const diff = (it.customPrice || it.basePrice) - it.basePrice;

            return (
              <div 
                key={it.id} 
                className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 space-y-3.5 transition flex flex-col justify-between ${
                  it.isAvailable ? 'border-slate-800 hover:border-slate-700' : 'border-red-900/30 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm sm:text-base truncate">{it.name}</h4>
                      </div>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">{it.category}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 font-medium">Franchise Price</div>
                      <div className="font-mono font-black text-amber-400 text-lg sm:text-xl">
                        ₹{it.customPrice || it.basePrice}
                      </div>
                    </div>
                  </div>

                  {/* Price Comparison Card */}
                  <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Master Base Price</span>
                      <span className="font-mono text-slate-300 font-bold">₹{it.basePrice}</span>
                    </div>

                    <div className="text-right">
                      {hasCustomPrice ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          diff > 0 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}>
                          <TrendingUp className="w-2.5 h-2.5" />
                          {diff > 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`} vs Base
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium">Standard Price</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Selling Switch */}
                  <button
                    onClick={() => toggleAvailability(it)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer min-h-[36px] ${
                      it.isAvailable
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                    title="Toggle whether this product is sold in this branch"
                  >
                    {it.isAvailable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{it.isAvailable ? 'SELLING HERE' : 'NOT SOLD'}</span>
                  </button>

                  {/* Edit Custom Price */}
                  <button
                    onClick={() => openEditModal(it)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer min-h-[36px]"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Price</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Selling Price Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">Update Franchise Price</h3>
                  <p className="text-xs text-slate-400">{editingItem.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Master Catalog Reference */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Master Catalog Base Price</span>
                <span className="font-mono text-slate-200 font-bold text-sm">₹{editingItem.basePrice}</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Authoritative Master
              </span>
            </div>

            {/* Price Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Franchise Selling Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 font-mono font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={modalPrice}
                  onChange={(e) => setModalPrice(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white font-mono font-bold text-base focus:outline-none"
                  placeholder="e.g. 229"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Pricing Shortcuts */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Quick Pricing Presets:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setModalPrice(editingItem.basePrice)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Match Base (₹{editingItem.basePrice})
                </button>
                {[10, 20, 30, 50].map(add => (
                  <button
                    key={add}
                    type="button"
                    onClick={() => setModalPrice(editingItem.basePrice + add)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold font-mono cursor-pointer"
                  >
                    +₹{add} (₹{editingItem.basePrice + add})
                  </button>
                ))}
              </div>
            </div>

            {/* Store Availability Toggle inside Modal */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Sell in this Store</span>
                <span className="text-[10px] text-slate-400">When enabled, customers and POS can order this item</span>
              </div>
              <button
                type="button"
                onClick={() => setModalEnabled(!modalEnabled)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  modalEnabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {modalEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrice}
                disabled={isSaving}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer transition shadow-md shadow-amber-500/20"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save & Sync Price</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
