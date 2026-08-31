import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Monitor, 
  ShoppingBag, 
  Layers, 
  Bike, 
  FileText, 
  Settings, 
  LogOut,
  Building2,
  ShieldCheck,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { useFranchiseStore } from '../../store/franchiseStore';

import { Navigate } from 'react-router-dom';

export const FranchiseLayout: React.FC = () => {
  const { session, isAuthChecking, isAuthorized, logout, setSession, setBranches, setTerminals } = useFranchiseStore();
  const navigate = useNavigate();

  const franchises = [
    { id: 'fra_primary', name: 'Olive Pizza Primary Franchise (Rajnandgaon)' },
    { id: 'fra_durg', name: 'Olive Pizza Durg Franchise' },
    { id: 'fra_bhilai', name: 'Olive Pizza Bhilai Franchise' },
    { id: 'fra_raipur', name: 'Olive Pizza Raipur Franchise' },
  ];

  const isGlobalOwner = session?.role === 'owner' || 
    session?.email === 'olivepizzarjn@gmail.com' || 
    session?.email === 'webhub2811@gmail.com';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchFranchise = (newFranchiseId: string) => {
    const f = franchises.find(fr => fr.id === newFranchiseId);
    // Clear previous scope data to prevent state leakage
    setBranches([]);
    setTerminals([]);
    setSession({
      uid: session?.uid || 'user_owner_olivepizza',
      email: session?.email || 'olivepizzarjn@gmail.com',
      role: 'owner',
      branchIds: [],
      franchiseId: newFranchiseId,
      franchiseName: f?.name || newFranchiseId,
      isAuthenticated: true
    });
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Verifying Franchise Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">
              🍕
            </div>
            <div>
              <h2 className="font-black text-sm text-white tracking-wide uppercase">OLIVE PIZZA</h2>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                FRANCHISE SUITE
              </span>
            </div>
          </div>

          {/* Franchise Context Card */}
          <div className="p-3 mx-3 my-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Building2 size={13} className="text-amber-400" />
              <span className="font-bold text-white truncate">{session?.franchiseName || 'Rajnandgaon Franchise'}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{session?.franchiseId || 'fra_primary'}</p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 text-xs font-bold">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>

            <NavLink
              to="/branches"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Store size={16} /> Branches & Stores
            </NavLink>

            <NavLink
              to="/pos-terminals"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Monitor size={16} /> POS Terminals & Activation
            </NavLink>

            <NavLink
              to="/orders"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <ShoppingBag size={16} /> Franchise Orders
            </NavLink>

            <NavLink
              to="/menu-pricing"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Layers size={16} /> Menu & Store Pricing
            </NavLink>

            <NavLink
              to="/delivery-zones"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Bike size={16} /> Delivery Zones & Riders
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <FileText size={16} /> Reports & Google Sheets
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Settings size={16} /> Franchise Settings
            </NavLink>
          </nav>
        </div>

        {/* Footer & User Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="truncate">
              <p className="font-bold text-white truncate">{session?.email || 'franchise@olivepizza.in'}</p>
              <span className="text-[10px] text-amber-400 font-mono">
                {isGlobalOwner ? 'Global Owner' : 'Franchise Manager'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Global Owner Context Switcher Header */}
        {isGlobalOwner && (
          <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-amber-500/40 rounded-xl text-xs">
                <ShieldCheck size={14} className="text-amber-400" />
                <span className="text-[11px] font-bold text-amber-400">Current Franchise:</span>
                <select
                  value={session?.franchiseId || 'fra_primary'}
                  onChange={(e) => handleSwitchFranchise(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {franchises.map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                      {f.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="text-slate-400 pointer-events-none" />
              </div>
            </div>

            <a
              href={import.meta.env.VITE_OWNER_PORTAL_URL || (import.meta.env.PROD ? 'https://owner.olivepizza.in/franchises' : 'http://localhost:5174/franchises')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to Owner Console</span>
            </a>
          </header>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
