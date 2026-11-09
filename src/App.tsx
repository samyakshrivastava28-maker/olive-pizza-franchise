import { AlertTriangle, RefreshCw } from 'lucide-react';
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useFranchiseStore } from './store/franchiseStore';
import { FranchiseLayout } from './components/layout/FranchiseLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BranchesPage } from './pages/BranchesPage';
import { POSTerminalsPage } from './pages/POSTerminalsPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPricingPage } from './pages/MenuPricingPage';
import { DeliveryManagementPage } from './pages/DeliveryManagementPage';
import { RestaurantManagementPage } from './pages/RestaurantManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AppRestrictedScreen } from './components/common/AppRestrictedScreen';
import FranchisePushNotificationManager from './services/FranchisePushNotificationManager';

export function App() {
  const { session, isAuthChecking, isDatabaseUnavailable, user, restrictedReason, restrictedEmail, authStatus, clearRestricted, logout, initAuth } = useFranchiseStore();

  useEffect(() => {
    const unsub = initAuth();
    return () => unsub();
  }, []);

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#070A10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Verifying Franchise Session...</p>
        </div>
      </div>
    );
  }

  if (isDatabaseUnavailable && (user || session)) {
    return (
      <div className="h-screen w-screen bg-[#070A10] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 animate-pulse">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Authoritative Database Temporarily Unavailable (HTTP 503)</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Your authenticated franchise session is securely retained. The platform is waiting for the database service to resume.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  if (restrictedReason) {
    return (
      <AppRestrictedScreen
        appName="Olive Pizza Franchise Management"
        userEmail={restrictedEmail || undefined}
        reason={restrictedReason}
        status={authStatus}
        onRetry={() => {
          clearRestricted();
          initAuth();
        }}
        onSignOut={async () => {
          clearRestricted();
          await logout();
        }}
      />
    );
  }

  return (
    <HashRouter>
      <FranchisePushNotificationManager />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0E1524',
            color: '#fff',
            border: '1px solid #1E293B',
            fontSize: '12px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#F59E0B',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      <Routes>
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        
        <Route element={<FranchiseLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/restaurant-management" element={<RestaurantManagementPage />} />
          <Route path="/pos-terminals" element={<POSTerminalsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu-pricing" element={<MenuPricingPage />} />
          <Route path="/delivery-zones" element={<DeliveryManagementPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;