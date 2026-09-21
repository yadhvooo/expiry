import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.user?.role !== 'admin') {
        console.warn('Unauthorized role for admin app');
        localStorage.removeItem('token');
        setUser(null);
      } else {
        setUser(res.user);
      }
    } catch (err) {
      console.warn('Session expired or invalid admin token:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.login({ email, password });
    if (res.user.role !== 'admin') {
      throw new Error('Access denied. This console requires an Administrator account.');
    }
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  async function fillDemoAdmin() {
    try {
      const accounts = await api.getDemoAccounts();
      if (accounts?.admin) {
        localStorage.setItem('token', accounts.admin.token);
        await loadUser();
        return;
      }
    } catch (e) {
      console.warn('Demo accounts API fallback', e);
    }
    return login('admin@example.com', 'admin123');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fillDemoAdmin,
        isAuthenticated: !!user && user.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
