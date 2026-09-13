import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Clock,
  X,
  Lock,
  Mail
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

export interface PosAccount {
  id: string;
  name: string;
  email: string;
  franchiseId: string;
  status: 'PENDING_OWNER_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'REVOKED';
  createdAt: string;
  approvedBy?: string;
  pinConfigured?: boolean;
}

export const POSTerminalsPage: React.FC = () => {
  const { session } = useFranchiseStore();
  const [posAccounts, setPosAccounts] = useState<PosAccount[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [terminalName, setTerminalName] = useState('');
  const [posEmail, setPosEmail] = useState('');
  const [posPassword, setPosPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/pos-accounts`);
      if (res && res.accounts) {
        setPosAccounts(res.accounts);
      }
    } catch (err: any) {
      console.warn('[POSTerminalsPage] Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [session?.franchiseId]);

  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalName.trim() || !posEmail.trim() || !posPassword.trim()) {
      toast.error('All fields are required.');
      return;
    }

    if (posPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Creating POS account...');
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/pos-accounts`, {
        method: 'POST',
        body: JSON.stringify({
          name: terminalName.trim(),
          email: posEmail.trim(),
          password: posPassword.trim()
        })
      });

      if (res && res.success) {
        toast.success('POS account created! Status: PENDING OWNER APPROVAL ⏳', { id: toastId, duration: 6000 });
        setIsRegisterOpen(false);
        setTerminalName('');
        setPosEmail('');
        setPosPassword('');
        fetchAccounts();
      } else {
        toast.error(res.error || 'Failed to create POS account', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const hasExistingAccount = posAccounts.some(
    acc => acc.status === 'PENDING_OWNER_APPROVAL' || acc.status === 'APPROVED' || acc.status === 'ACTIVE'
  );

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-black text-xl sm:text-2xl text-white">POS Terminal Account Management</h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Strict 1 POS Limit per Franchise
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Franchise Manager creates the POS login credentials. Accounts start as <strong>PENDING OWNER APPROVAL</strong> and require Store Owner verification before activation.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {!hasExistingAccount && (
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>+ Add POS Account</span>
            </button>
          )}
          <button
            onClick={fetchAccounts}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center justify-center transition min-h-[44px] min-w-[44px] cursor-pointer shrink-0"
            aria-label="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* POS Accounts Display */}
      {posAccounts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <Monitor className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-white">No POS Account Configured</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your franchise does not currently have a POS terminal account configured. You can provision exactly 1 POS account for in-store billing.
          </p>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            + Provision POS Account Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posAccounts.map((account) => (
            <div key={account.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-amber-400 shrink-0" />
                    <h4 className="font-bold text-white text-base truncate">{account.name}</h4>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{account.email}</span>
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider self-start shrink-0 ${
                  account.status === 'APPROVED' || account.status === 'ACTIVE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : account.status === 'PENDING_OWNER_APPROVAL'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {account.status === 'PENDING_OWNER_APPROVAL' ? 'Pending Owner Approval' : account.status}
                </span>
              </div>

              {account.status === 'PENDING_OWNER_APPROVAL' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-300">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Awaiting Verification:</strong>
                    <span>Your store owner has been notified to verify and approve this POS account in the Owner Dashboard before login is permitted.</span>
                  </div>
                </div>
              )}

              {(account.status === 'APPROVED' || account.status === 'ACTIVE') && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Owner Approved & Active:</strong>
                    <span>This terminal account is authorized to log in to the Olive Pizza POS App. Operator will set a 4-digit PIN on first launch.</span>
                  </div>
                </div>
              )}

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Franchise ID:</span>
                  <span className="font-mono text-slate-200">{account.franchiseId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Requested On:</span>
                  <span className="text-slate-200">{account.createdAt ? new Date(account.createdAt).toLocaleString() : '—'}</span>
                </div>
                {account.approvedBy && (
                  <div className="flex justify-between text-slate-400">
                    <span>Approved By:</span>
                    <span className="font-mono text-emerald-400">{account.approvedBy}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provisioning Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base">Create POS Terminal Account</h3>
                <p className="text-xs text-slate-400">Only 1 POS account is permitted per franchise</p>
              </div>
              <button 
                onClick={() => setIsRegisterOpen(false)} 
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAccount} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Terminal Counter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Billing Counter #1"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-base sm:text-xs min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Login Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. pos.rajnandgaon@olivepizza.in"
                  value={posEmail}
                  onChange={(e) => setPosEmail(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-base sm:text-xs min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Temporary Password (min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={posPassword}
                  onChange={(e) => setPosPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-base sm:text-xs min-h-[44px]"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                <strong>Important:</strong> Upon submission, this account will be set to <strong>PENDING OWNER APPROVAL</strong>. The Store Owner will review and approve before login is granted.
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer min-h-[44px] transition"
                >
                  {submitting ? 'Submitting...' : 'Submit for Owner Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
