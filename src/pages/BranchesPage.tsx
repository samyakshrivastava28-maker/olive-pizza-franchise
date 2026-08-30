import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Phone, 
  User, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Clock, 
  Plus, 
  RefreshCw,
  Search,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { useFranchiseStore } from '../store/franchiseStore';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

export const BranchesPage: React.FC = () => {
  const { session, branches, setBranches } = useFranchiseStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/restaurants`);
      if (res && res.restaurants && res.restaurants.length > 0) {
        setBranches(res.restaurants.map((r: any) => ({
          id: r.id || r.restaurantSlug,
          name: r.name,
          address: r.address || 'Dongargaon Rd, Rajnandgaon, CG',
          phone: r.phone || '+91 91799 44445',
          managerName: r.managerName || 'Assigned Manager',
          managerEmail: r.managerEmail || 'manager@olivepizza.in',
          isOpen: r.isOpen !== false,
          activeOrdersCount: r.activeOrdersCount || 3,
          todaySales: r.todaySales || 18450,
          deliveryRadiusKm: r.deliveryRadiusKm || 5,
          openingTime: r.openingTime || '10:00 AM',
          closingTime: r.closingTime || '11:00 PM'
        })));
      }
    } catch (err) {
      console.warn('[BranchesPage] Error loading branches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [session?.franchiseId]);

  const toggleBranchStatus = async (branchId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      const res = await fetchApi(`/api/franchises/${session?.franchiseId || 'fra_rajnandgaon'}/restaurants/${branchId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ isOpen: nextStatus })
      });

      setBranches(branches.map(b => b.id === branchId ? { ...b, isOpen: nextStatus } : b));
      toast.success(`Branch is now ${nextStatus ? 'OPEN' : 'CLOSED'}`);
    } catch (err: any) {
      toast.error('Failed to update branch status');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase()) ||
    (b.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-2xl text-white">Branches & Restaurant Outlets</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage physical restaurant locations, store operating hours, managers, and delivery parameters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search branches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={loadBranches}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBranches.map(b => (
          <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{b.name}</h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {b.id}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {b.address}
                </p>
              </div>

              <button
                onClick={() => toggleBranchStatus(b.id, b.isOpen !== false)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer ${
                  b.isOpen !== false
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                {b.isOpen !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                <span>{b.isOpen !== false ? 'OPEN' : 'CLOSED'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Store Manager</span>
                <span className="font-semibold text-slate-200 block truncate">{b.managerName || 'Sunil Verma'}</span>
                <span className="text-[10px] text-slate-500 block truncate font-mono">{b.managerEmail || 'manager@olivepizza.in'}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Operating Hours</span>
                <span className="font-semibold text-slate-200 block">{b.openingTime || '10:00 AM'} - {b.closingTime || '11:00 PM'}</span>
                <span className="text-[10px] text-amber-400 font-mono block">Radius: {b.deliveryRadiusKm || 5} km</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{b.phone}</span>
              </div>

              <div className="font-mono text-xs">
                <span className="text-slate-500 mr-1.5">Today's Sales:</span>
                <span className="text-amber-400 font-bold">₹{(b.todaySales || 18450).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
