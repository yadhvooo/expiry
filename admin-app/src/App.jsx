import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminNavbar from './components/AdminNavbar';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import { ShieldAlert } from 'lucide-react';

function AdminMainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-purple-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <AdminLoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 selection:bg-purple-900 selection:text-purple-100">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminDashboardPage />
      </main>

      <footer className="bg-stone-900 border-t border-stone-800 py-6 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-500" />
            <span className="text-stone-300 font-bold">RescueBites Internal Operations Console</span>
          </div>
          <div>
            Authorized Personnel Only • Audit Log v1.0
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AdminMainApp />
    </AuthProvider>
  );
}
