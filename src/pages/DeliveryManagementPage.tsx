import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Phone,
  Mail,
  Plus,
  Trash2,
  Power
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
  isActive: boolean;
  vehicleNumber?: string;
  phoneVerified?: boolean;
  branchId?: string;
  branchName?: string;
  totalDeliveries?: number;
  rating?: number;
}

export const DeliveryManagementPage: React.FC = () => {
  const { session } = useFranchiseStore();
  const franchiseId = session?.franchiseId || 'fra_rajnandgaon';

  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Add Rider Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/riders`);
      if (res && res.riders) {
        setRiders(res.riders);
      }
    } catch {
      toast.error('Failed to load delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [franchiseId]);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Registering delivery partner...');

    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/riders`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          vehicleNumber: vehicleNumber.trim() || undefined
        })
      });

      if (res && res.success) {
        toast.success('Delivery partner registered successfully!', { id: toastId });
        setIsAddOpen(false);
        setName('');
        setPhone('');
        setEmail('');
        setVehicleNumber('');
        fetchRiders();
      } else {
        toast.error(res?.error || 'Registration failed', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error registering partner', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (riderId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const toastId = toast.loading(`${nextStatus ? 'Activating' : 'Deactivating'} rider...`);

    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/riders/${riderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus })
      });

      if (res && res.success) {
        toast.success(`Rider ${nextStatus ? 'activated' : 'deactivated'}`, { id: toastId });
        fetchRiders();
      } else {
        toast.error(res?.error || 'Failed to update status', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating status', { id: toastId });
    }
  };

  const handleDeleteRider = async (riderId: string, riderName: string) => {
    if (!confirm(`Are you sure you want to remove rider ${riderName}?`)) return;

    const toastId = toast.loading('Removing rider...');
    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/riders/${riderId}`, {
        method: 'DELETE'
      });

      if (res && res.success) {
        toast.success('Rider removed successfully', { id: toastId });
        fetchRiders();
      } else {
        toast.error(res?.error || 'Failed to delete rider', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error deleting rider', { id: toastId });
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-black text-xl sm:text-2xl text-white">Delivery Fleet Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Franchise-scoped delivery riders. Verification and fleet controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRiders}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition"
          >
            <Plus size={16} />
            <span>Add Delivery Partner</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading fleet data...</p>
        </div>
      ) : riders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Bike size={32} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-white text-base">No Delivery Partners Registered</h3>
            <p className="text-xs text-slate-400">
              Your franchise has no active delivery partners yet. Register riders to begin dispatching deliveries.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 transition"
          >
            <Plus size={16} />
            <span>Register First Delivery Partner</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(r => (
            <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-base truncate">{r.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{r.phone}</span>
                  </p>
                  {r.email && (
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{r.email}</span>
                    </p>
                  )}
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                  r.isActive !== false
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {r.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="text-slate-200 font-mono font-semibold">{r.vehicleNumber || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Verification:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Deliveries:</span>
                  <span className="text-amber-400 font-mono font-bold">{r.totalDeliveries || 0}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleToggleStatus(r.id, r.isActive !== false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    r.isActive !== false
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <Power size={13} />
                  <span>{r.isActive !== false ? 'Deactivate' : 'Activate'}</span>
                </button>

                <button
                  onClick={() => handleDeleteRider(r.id, r.name)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  title="Remove Rider"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rider Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-black text-white text-lg">Add Delivery Partner</h3>
                <p className="text-xs text-slate-400">Registers rider under this franchise</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRider} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Mobile Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 91799 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="rider@olivepizza.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Vehicle Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. CG-08-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 uppercase font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition"
                >
                  {submitting ? 'Registering...' : 'Add Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagementPage;
