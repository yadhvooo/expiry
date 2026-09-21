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
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const res = await api.login({ email, password });
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

  async function fillDemoProvider() {
    try {
      const accounts = await api.getDemoAccounts();
      if (accounts?.provider) {
        localStorage.setItem('token', accounts.provider.token);
        await loadUser();
        return;
      }
    } catch (e) {
      console.warn('Demo accounts API fallback', e);
    }
    return login('provider@example.com', 'password123');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerProvider,
        logout,
        fillDemoProvider,
        isAuthenticated: !!user,
        isProvider: user?.role === 'provider'
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
