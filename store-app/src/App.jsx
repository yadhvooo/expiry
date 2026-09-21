import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import StoreNavbar from './components/StoreNavbar';
import StoreDashboardPage from './pages/StoreDashboardPage';
import StoreProductsPage from './pages/StoreProductsPage';
import StoreOrdersPage from './pages/StoreOrdersPage';
import StoreLoginPage from './pages/StoreLoginPage';
import StoreRegisterPage from './pages/StoreRegisterPage';

import { Store, ShieldCheck, Sparkles } from 'lucide-react';

function StoreMainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center text-amber-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
      </div>
    );
  }

  // If unauthenticated, allow login or register views only
  const activeView = !user
    ? (currentView === 'register' ? 'register' : 'login')
    : currentView;

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 selection:bg-amber-100 selection:text-amber-900">
      {/* Store Portal Header */}
      <StoreNavbar currentView={activeView} setView={setCurrentView} />

      {/* Main Workspace */}
      <main className="flex-1">
        {activeView === 'dashboard' && <StoreDashboardPage setView={setCurrentView} />}
        {activeView === 'products' && <StoreProductsPage />}
        {activeView === 'orders' && <StoreOrdersPage />}
        {activeView === 'login' && <StoreLoginPage setView={setCurrentView} />}
        {activeView === 'register' && <StoreRegisterPage setView={setCurrentView} />}
      </main>

      {/* Store Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 mt-16 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-300">
            <Store className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-white">RescueBites Merchant Engine</span>
            <span>• Counter Pickup & Inventory Hub</span>
          </div>
          <div>
            FSSAI Compliance Verification Active • Zero Waste Initiative
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreMainApp />
    </AuthProvider>
  );
}
