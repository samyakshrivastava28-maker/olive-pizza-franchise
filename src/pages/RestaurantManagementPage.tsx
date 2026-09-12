import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Mail, 
  Phone, 
  Building2, 
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Store
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

interface RestaurantManagerAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'PENDING_OWNER_APPROVAL' | 'APPROVED' | 'REJECTED';
  branchId: string;
  branchName?: string;
  isActive: boolean;
  hasPin: boolean;
  createdAt: string;
}

export const RestaurantManagementPage: React.FC = () => {
  const { session, branches } = useFranchiseStore();
  const franchiseId = session?.franchiseId || 'fra_rajnandgaon';

  const [managers, setManagers] = useState<RestaurantManagerAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProvisionOpen, setIsProvisionOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'main_branch');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // PIN Rotation State
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/managers`);
      if (res && res.managers) {
        setManagers(res.managers);
      }
    } catch {
      toast.error('Failed to load restaurant managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [franchiseId]);

  const activeManager = managers.find(m => m.isActive !== false);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!/^\d{4}$/.test(pin.trim())) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting Restaurant Manager for Owner Approval...');

    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/managers`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          branchId: branchId || 'main_branch',
          pin: pin.trim()
        })
      });

      if (res && res.success) {
        toast.success('Restaurant Manager created! Status: Pending Owner Approval', { id: toastId });
        setIsProvisionOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        setPin('');
        setConfirmPin('');
        fetchManagers();
      } else {
        toast.error(res?.error || 'Provisioning failed', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit manager', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedManagerId) return;

    if (!/^\d{4}$/.test(newPin.trim())) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      toast.error('PINs do not match');
      return;
    }

    setPinSubmitting(true);
    const toastId = toast.loading('Updating Manager PIN...');

    try {
      const res = await fetchApi(`/api/franchises/${franchiseId}/managers/${selectedManagerId}/set-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin: newPin.trim() })
      });

      if (res && res.success) {
        toast.success('PIN updated successfully!', { id: toastId });
        setIsPinModalOpen(false);
        setNewPin('');
        setConfirmNewPin('');
        setSelectedManagerId(null);
        fetchManagers();
      } else {
        toast.error(res?.error || 'Failed to update PIN', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error setting PIN', { id: toastId });
    } finally {
      setPinSubmitting(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-5 max-w-6xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xl sm:text-2xl text-white tracking-tight">Restaurant Management</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Max 1 Account
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Provision the operational Restaurant Manager account. Requires Owner approval before first login.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchManagers}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {!activeManager && (
            <button
              onClick={() => setIsProvisionOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition"
            >
              <Plus size={16} />
              <span>Provision Manager</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Limit Info Banner */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <p className="font-bold text-white">Hierarchical Operational Boundary</p>
          <p className="text-slate-400 leading-relaxed">
            Each franchise is strictly allocated <strong className="text-white">exactly one</strong> Restaurant Management account. 
            The Franchise Manager provisions the manager credentials and assigns a 4-digit PIN. The Platform Owner must approve the account before the Restaurant Manager can access the operational dashboard.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading manager details...</p>
        </div>
      ) : activeManager ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
                {activeManager.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">{activeManager.name}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <Mail size={13} className="text-slate-500" />
                  <span>{activeManager.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeManager.status === 'APPROVED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={14} />
                  Approved by Owner
                </span>
              ) : activeManager.status === 'PENDING_OWNER_APPROVAL' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                  <Clock size={14} />
                  Pending Owner Approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <XCircle size={14} />
                  Rejected by Owner
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Store size={14} className="text-amber-400" /> Assigned Branch
              </span>
              <p className="font-bold text-slate-200 text-sm">{activeManager.branchName || 'Rajnandgaon HQ'}</p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Phone size={14} className="text-emerald-400" /> Phone Contact
              </span>
              <p className="font-bold text-slate-200 text-sm">{activeManager.phone || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Key size={14} className="text-amber-400" /> 4-Digit Security PIN
              </span>
              <p className="font-mono font-black text-amber-400 text-sm tracking-widest">•••• (Configured)</p>
            </div>
          </div>

          {activeManager.status === 'PENDING_OWNER_APPROVAL' && (
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <p>
                This account has been successfully provisioned and queued for Owner approval. The restaurant manager will be unable to log in until the Platform Owner clicks <strong>Approve</strong> in the Owner Console.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSelectedManagerId(activeManager.id);
                setIsPinModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Key size={14} className="text-amber-400" />
              <span>Rotate 4-Digit PIN</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
            <Users size={32} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-bold text-white text-base">No Restaurant Manager Account Configured</h3>
            <p className="text-xs text-slate-400">
              Your franchise currently has zero restaurant managers. Provision your 1 authorized manager account below.
            </p>
          </div>
          <button
            onClick={() => setIsProvisionOpen(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-2 shadow-lg shadow-amber-500/10 transition"
          >
            <Plus size={16} />
            <span>Provision Restaurant Manager</span>
          </button>
        </div>
      )}

      {/* Provision Modal */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-black text-white text-lg">Provision Restaurant Manager</h3>
                <p className="text-xs text-slate-400">Creates credentials and queues for Owner approval</p>
              </div>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleProvision} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Official Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. manager.rjn@olivepizza.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 91799 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">4-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center font-mono font-black text-amber-400 text-lg tracking-[0.2em] focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Confirm PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center font-mono font-black text-amber-400 text-lg tracking-[0.2em] focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-1">
                <p className="font-bold">Important Notice:</p>
                <p className="text-slate-400">
                  This account will require Owner approval. After approval, the manager can log in using their email and this 4-digit PIN. Weak PINs (e.g. 1234, 0000) are automatically rejected.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/10 transition"
                >
                  {submitting ? 'Provisioning...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rotate PIN Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-black text-white text-base">Rotate 4-Digit PIN</h3>
                <p className="text-xs text-slate-400">Updates bcrypt security hash</p>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePin} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center font-mono font-black text-amber-400 text-lg tracking-[0.2em] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center font-mono font-black text-amber-400 text-lg tracking-[0.2em] focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pinSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition"
                >
                  {pinSubmitting ? 'Updating...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantManagementPage;
