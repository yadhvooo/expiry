import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState(null);

  useEffect(() => {
    loadUser();
    loadDemoAccounts();
  }, []);

  async function loadUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoAccounts() {
    try {
      const data = await api.getDemoAccounts();
      setDemoAccounts(data);
    } catch (err) {
      console.error('Failed to load demo accounts', err);
    }
  }

  async function login(email, password) {
    const res = await api.login({ email, password });
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }

  async function registerCustomer(data) {
    const res = await api.registerCustomer(data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }

  async function registerProvider(data) {
    const res = await api.registerProvider(data);
    localStorage.setItem('token', res.token);
    setUser(res.user);
    return res.user;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  async function switchDemoRole(role) {
    if (!demoAccounts || !demoAccounts[role]) {
      // Fallback manual credentials
      const creds = {
        customer: { email: 'customer@example.com', password: 'password123' },
        provider: { email: 'provider@example.com', password: 'password123' },
        admin: { email: 'admin@example.com', password: 'admin123' }
      };
      return login(creds[role].email, creds[role].password);
    }

    const account = demoAccounts[role];
    localStorage.setItem('token', account.token);
    // Reload full user profile
    await loadUser();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerCustomer,
        registerProvider,
        logout,
        switchDemoRole,
        demoAccounts,
        isAuthenticated: !!user,
        isCustomer: user?.role === 'customer',
        isProvider: user?.role === 'provider',
        isAdmin: user?.role === 'admin'
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
