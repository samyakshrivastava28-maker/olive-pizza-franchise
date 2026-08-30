import React, { useState } from 'react';
import { 
  Bike, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Phone
} from 'lucide-react';
import { useFranchiseStore } from '../store/franchiseStore';

export const DeliveryManagementPage: React.FC = () => {
  const { session } = useFranchiseStore();
  const [riders, setRiders] = useState([
    {
      id: 'r1',
      name: 'Rakesh Sahu',
      phone: '+91 91799 11221',
      status: 'ON_DELIVERY',
      currentOrder: 'OP-8291',
      branchName: 'Rajnandgaon HQ',
      completedToday: 8,
      rating: 4.9
    },
    {
      id: 'r2',
      name: 'Vikas Sinha',
      phone: '+91 91799 11222',
      status: 'AVAILABLE',
      branchName: 'Rajnandgaon HQ',
      completedToday: 12,
      rating: 4.8
    },
    {
      id: 'r3',
      name: 'Deepak Nishad',
      phone: '+91 91799 11223',
      status: 'AVAILABLE',
      branchName: 'Durg Branch',
      completedToday: 9,
      rating: 5.0
    }
  ]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-2xl text-white">Delivery Fleet & Zone Proximity</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time delivery partner status, active orders, and 100m geo-fenced drop confirmation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riders.map(r => (
          <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm">{r.name}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {r.phone}
                </p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                r.status === 'AVAILABLE'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {r.status === 'AVAILABLE' ? 'ONLINE / FREE' : 'ON DELIVERY'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Branch:</span>
                <span className="text-slate-200">{r.branchName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Completed Today:</span>
                <span className="text-amber-400 font-mono font-bold">{r.completedToday} orders</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rating:</span>
                <span className="text-emerald-400 font-semibold">★ {r.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
