import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';

import Navbar from './components/Navbar';
import LocationModal from './components/LocationModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import QRCodeModal from './components/QRCodeModal';

import CustomerHomePage from './pages/CustomerHomePage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import { ShieldCheck, Sparkles } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [latestConfirmedOrder, setLatestConfirmedOrder] = useState(null);

  function handleOrderSuccess(order) {
    setLatestConfirmedOrder(order);
    setCurrentView('customer-orders');
  }

  function handleBuyNowDirect() {
    setIsCheckoutOpen(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Primary Customer Navigation */}
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <CustomerHomePage
            searchTerm={searchTerm}
            onBuyNow={handleBuyNowDirect}
          />
        )}
        {currentView === 'customer-orders' && <CustomerOrdersPage />}
        {currentView === 'login' && <LoginPage setView={setCurrentView} />}
        {currentView === 'register' && <RegisterPage setView={setCurrentView} />}
      </main>

      {/* Modals & Slide-overs */}
      <LocationModal />
      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
      {latestConfirmedOrder && (
        <QRCodeModal
          order={latestConfirmedOrder}
          onClose={() => setLatestConfirmedOrder(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-stone-900 text-lg">RescueBites</span>
              <span className="text-xs text-stone-400">| Surplus Food Rescue Marketplace</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-500">
              <span>Direct Store Pickup</span>
              <span>•</span>
              <span>100% Legal & Food-Safe</span>
              <span>•</span>
              <span>Zero Fruits or Vegetables Policy</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-500 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-800">Food Safety & Expiry Guarantee:</strong> All listed items are certified packaged foods, bakery goods, and dairy products approaching their best-before dates. Items that reach their expiration date are automatically locked and delisted by our backend engine to prevent unsafe distribution. Customers collect items directly from providers at designated pickup windows.
            </div>
          </div>

          <div className="text-center text-[11px] text-stone-400">
            © 2026 RescueBites Marketplace. Built with sustainability, transparency, and trust.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
