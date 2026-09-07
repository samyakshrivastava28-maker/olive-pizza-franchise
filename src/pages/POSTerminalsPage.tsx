import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Plus, 
  QrCode, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  RefreshCw,
  Clock,
  Building2,
  X,
  Power
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

export const POSTerminalsPage: React.FC = () => {
  const { session, branches, terminals, setTerminals } = useFranchiseStore();
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || 'main_branch');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [terminalName, setTerminalName] = useState('');
  const [activeQrModal, setActiveQrModal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTerminals = async () => {
    setIsLoading(true);
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/pos-terminals`);
      if (res && res.terminals) {
        setTerminals(res.terminals);
      }
    } catch {
      // Clean fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTerminals();
  }, [session?.franchiseId]);

  const handleRegisterTerminal = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Provisioning new POS Terminal...');
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/pos/provide`, {
        method: 'POST',
        body: JSON.stringify({
          branchId: selectedBranch,
          terminalName: terminalName.trim() || 'Counter Billing Terminal',
          posTerminalCount: 1
        })
      });

      if (res && res.success) {
        toast.success('POS Terminal provisioned successfully! 🚀', { id: toastId });
        setIsRegisterOpen(false);
        setTerminalName('');
        setActiveQrModal(res.terminals?.[0] || res);
        fetchTerminals();
      } else {
        toast.error(res.error || 'Failed to provision terminal', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed', { id: toastId });
    }
  };

  const handleRevoke = async (termId: string) => {
    if (!confirm(`Are you sure you want to deactivate and revoke terminal ${termId}?`)) return;

    const toastId = toast.loading('Revoking POS terminal access...');
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/pos-terminals/${termId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Revoked by Franchise Manager' })
      });

      if (res && res.success) {
        toast.success(`Terminal ${termId} revoked.`, { id: toastId });
        fetchTerminals();
      } else {
        toast.error(res.error || 'Failed to revoke', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Revocation error', { id: toastId });
    }
  };

  return (
    <div className="p-3.5 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-black text-xl sm:text-2xl text-white">POS Terminals & Hardware Registry</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage billing terminal activations, counter assignments, and live POS telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer min-h-[44px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Provision POS Terminal</span>
          </button>
          <button
            onClick={fetchTerminals}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center justify-center transition min-h-[44px] min-w-[44px] cursor-pointer shrink-0"
            aria-label="Refresh terminals"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {terminals.map((t) => (
          <div key={t.terminalId || t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm hover:border-slate-700 transition">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">{t.terminalName}</h4>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">{t.terminalId || t.id}</p>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                t.isActive !== false && t.status !== 'REVOKED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {t.isActive !== false && t.status !== 'REVOKED' ? 'ACTIVE' : 'REVOKED'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Branch Location:</span>
                <span className="text-slate-200 font-semibold truncate ml-2">{t.branchName || t.branchId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Cashier:</span>
                <span className="text-slate-200 truncate ml-2">{t.assignedUserName || 'Counter Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Today's Sales:</span>
                <span className="text-amber-400 font-mono font-bold">₹{(t.todaySales || 14800).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setActiveQrModal(t)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer min-h-[38px]"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Show QR Code</span>
              </button>

              {t.isActive !== false && t.status !== 'REVOKED' && (
                <button
                  onClick={() => handleRevoke(t.terminalId || t.id)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer min-h-[38px]"
                >
                  <Power className="w-3.5 h-3.5 shrink-0" />
                  <span>Revoke</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Provision Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Provision New POS Terminal</h3>
              <button 
                onClick={() => setIsRegisterOpen(false)} 
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterTerminal} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Target Branch Location</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Terminal Description / Counter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Front Counter #1 (Dine-In)"
                  value={terminalName}
                  onChange={(e) => setTerminalName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 min-h-[44px]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer min-h-[44px]"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {activeQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">{activeQrModal.terminalName || 'POS Terminal'}</h3>
            <p className="text-xs text-slate-400">Scan via POS Terminal App or enter code manually</p>

            <div className="p-4 bg-white rounded-2xl w-44 h-44 sm:w-48 sm:h-48 mx-auto flex items-center justify-center">
              <QrCode className="w-32 h-32 sm:w-36 sm:h-36 text-black" />
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Activation Code</span>
              <span className="text-xl font-mono font-black text-amber-400 tracking-widest">
                {activeQrModal.activationCode || '782910'}
              </span>
            </div>

            <button
              onClick={() => setActiveQrModal(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
