import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { session } = useFranchiseStore();
  const [franchiseName, setFranchiseName] = useState(session?.franchiseName || 'Olive Pizza — Rajnandgaon Franchise');
  const [supportEmail, setSupportEmail] = useState('franchise.rjn@olivepizza.in');
  const [supportPhone, setSupportPhone] = useState('+91 91799 44445');
  const [gstin, setGstin] = useState('22AAAAA0000A1Z5');
  const [autoAccept, setAutoAccept] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Franchise configuration saved successfully!');
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      <div>
        <h1 className="font-black text-xl sm:text-2xl text-white">Franchise Profile & Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure business details, tax registration number (GSTIN), and order routing preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Franchise Entity Name</label>
            <input
              type="text"
              value={franchiseName}
              onChange={(e) => setFranchiseName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">GSTIN Tax Registration</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Support Email</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Support Phone</label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id="autoAccept"
              checked={autoAccept}
              onChange={(e) => setAutoAccept(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="autoAccept" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Auto-Accept Online Customer Orders to Kitchen
            </label>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md min-h-[44px]"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
