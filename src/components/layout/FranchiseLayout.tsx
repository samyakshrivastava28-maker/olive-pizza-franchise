import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { AppLogo } from '../common/AppLogo';
import { useFranchiseStore } from '../../store/franchiseStore';

export const FranchiseLayout: React.FC = () => {
  const { session, isAuthChecking, isAuthorized, logout, setSession, setBranches, setTerminals } = useFranchiseStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer upon route change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  const isGlobalOwner = session?.role === 'owner' || 
    session?.email === 'olivepizzarjn@gmail.com' || 
    session?.email === 'webhub2811@gmail.com';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/branches', icon: Store, label: 'Branches & Stores' },
    { to: '/restaurant-management', icon: Building2, label: 'Restaurant Manager' },
    { to: '/pos-terminals', icon: Monitor, label: 'POS Terminal' },
    { to: '/orders', icon: ShoppingBag, label: 'Franchise Orders' },
    { to: '/menu-pricing', icon: Layers, label: 'Menu & Pricing' },
    { to: '/delivery-zones', icon: Bike, label: 'Delivery Fleet' },
    { to: '/reports', icon: FileText, label: 'Reports & Sheets' },
    { to: '/settings', icon: Settings, label: 'Franchise Settings' },
  ];

  const bottomNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/restaurant-management', icon: Building2, label: 'Manager' },
    { to: '/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/pos-terminals', icon: Monitor, label: 'POS' },
  ];

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
      {/* Desktop Permanent Sidebar (hidden on screens < 1024px) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0">
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-800 flex items-center">
            <AppLogo variant="full" size="md" subtitle="Franchise Management" />
          </div>

          {/* Franchise Context Card */}
          <div className="p-3 mx-3 my-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Building2 size={13} className="text-amber-400 shrink-0" />
              <span className="font-bold text-white truncate">{session?.franchiseName || 'Rajnandgaon Franchise'}</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{session?.franchiseId || 'fra_primary'}</p>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 text-xs font-bold">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                      isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Desktop Footer & User Card */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="truncate mr-2">
              <p className="font-bold text-white truncate">{session?.email || 'franchise@olivepizza.in'}</p>
              <span className="text-[10px] text-amber-400 font-mono">
                {isGlobalOwner ? 'Global Owner' : 'Franchise Manager'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile/Tablet Off-Canvas Sliding Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <aside className="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <div className="flex-1 overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <AppLogo variant="full" size="sm" subtitle="Franchise Portal" />
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Franchise Context Card */}
              <div className="p-3 mx-3 my-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Building2 size={14} className="text-amber-400 shrink-0" />
                  <span className="font-bold text-white truncate">{session?.franchiseName || 'Olive Pizza — Rajnandgaon HQ'}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{session?.franchiseId || 'fra_primary'}</p>
              </div>

              {/* Navigation Links */}
              <nav className="px-3 space-y-1 text-xs font-bold">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsDrawerOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[44px] ${
                          isActive ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon size={18} className="shrink-0" />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 shrink-0 pb-safe">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="truncate mr-2">
                  <p className="font-bold text-white truncate text-xs">{session?.email || 'franchise@olivepizza.in'}</p>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {isGlobalOwner ? 'Global Owner' : 'Franchise Manager'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
        {/* Mobile & Tablet App Bar (hidden on lg and above) */}
        <header className="lg:hidden h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 sm:px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -ml-1"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <AppLogo variant="icon" size="sm" />
              <div className="flex flex-col">
                <span className="font-bold text-white text-xs leading-none">Olive Pizza</span>
                <span className="text-[10px] text-amber-400 font-medium truncate max-w-[130px] sm:max-w-[200px]">
                  {session?.franchiseName?.replace('Olive Pizza ', '') || 'Franchise'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 pb-20 lg:pb-0">
          <Outlet />
        </main>

        {/* Mobile Native Bottom Navigation Bar (hidden on lg and above) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1 pb-safe flex items-center justify-around shadow-2xl">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] transition-all cursor-pointer ${
                    isActive 
                      ? 'text-amber-400 font-black' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                <Icon size={18} className="mb-0.5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          {/* 5th Menu Toggle Tab */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            aria-label="All franchise navigation options"
          >
            <Menu size={18} className="mb-0.5" />
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
