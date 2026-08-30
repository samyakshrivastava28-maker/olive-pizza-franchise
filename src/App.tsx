import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useFranchiseStore } from './store/franchiseStore';
import { FranchiseLayout } from './components/layout/FranchiseLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BranchesPage } from './pages/BranchesPage';
import { POSTerminalsPage } from './pages/POSTerminalsPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPricingPage } from './pages/MenuPricingPage';
import { DeliveryManagementPage } from './pages/DeliveryManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

export function App() {
  const { session, setSession } = useFranchiseStore();

  useEffect(() => {
    const storedFraId = localStorage.getItem('franchise_id');
    if (storedFraId && !session) {
      setSession({
        uid: 'fra_usr_01',
        email: 'franchise.rjn@olivepizza.in',
        franchiseId: storedFraId,
        franchiseName: 'Olive Pizza — Rajnandgaon Franchise',
        role: 'franchise_owner',
        branchIds: ['main_branch', 'durg_branch']
      });
    }
  }, [session, setSession]);

  return (
    <BrowserRouter>
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
          <Route path="/pos-terminals" element={<POSTerminalsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu-pricing" element={<MenuPricingPage />} />
          <Route path="/delivery-zones" element={<DeliveryManagementPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;