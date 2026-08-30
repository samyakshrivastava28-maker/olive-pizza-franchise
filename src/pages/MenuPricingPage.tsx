import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Tag,
  DollarSign
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

export const MenuPricingPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([
    { id: 'p1', name: 'Margherita Pizza', category: 'Pizza', price: 199, isAvailable: true },
    { id: 'p2', name: 'Farm Fresh Deluxe', category: 'Pizza', price: 349, isAvailable: true },
    { id: 'p3', name: 'Paneer Makhani Special', category: 'Pizza', price: 399, isAvailable: true },
    { id: 'p4', name: 'Cheesy Garlic Breadsticks', category: 'Sides', price: 129, isAvailable: true },
    { id: 'p5', name: 'Stuffed Garlic Bread', category: 'Sides', price: 159, isAvailable: false },
    { id: 'p6', name: 'Choco Lava Cake', category: 'Desserts', price: 99, isAvailable: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const toggleAvailability = (id: string, current: boolean) => {
    setItems(items.map(it => it.id === id ? { ...it, isAvailable: !current } : it));
    toast.success(`Item stock updated!`);
  };

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || it.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-2xl text-white">Menu & Store Inventory Overrides</h1>
          <p className="text-xs text-slate-400 mt-1">
            Toggle real-time stock availability and custom branch pricing overrides
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pizza, sides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        {['ALL', 'Pizza', 'Sides', 'Desserts'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              categoryFilter === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(it => (
          <div key={it.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{it.name}</h4>
                <span className="text-[10px] text-amber-400 font-semibold">{it.category}</span>
              </div>
              <span className="font-mono font-black text-amber-400 text-base">₹{it.price}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Stock Status:</span>
              <button
                onClick={() => toggleAvailability(it.id, it.isAvailable)}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 transition cursor-pointer ${
                  it.isAvailable
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}
              >
                {it.isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{it.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
