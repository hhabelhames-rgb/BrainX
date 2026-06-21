import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('brainx_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('brainx_access_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount / page refresh
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('brainx_access_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        setUser(data.data.user);
        localStorage.setItem('brainx_user', JSON.stringify(data.data.user));
      } catch {
        // Token invalid — try refresh
        try {
          const { data } = await authApi.refresh();
          const newToken = data.data.accessToken;
          localStorage.setItem('brainx_access_token', newToken);
          setToken(newToken);
          const meRes = await authApi.me();
          setUser(meRes.data.data.user);
          localStorage.setItem('brainx_user', JSON.stringify(meRes.data.data.user));
        } catch {
          // Both failed — clear state
          localStorage.removeItem('brainx_access_token');
          localStorage.removeItem('brainx_user');
          setUser(null);
          setToken(null);
        }
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { user: u, accessToken } = data.data;
    localStorage.setItem('brainx_access_token', accessToken);
    localStorage.setItem('brainx_user', JSON.stringify(u));
    setUser(u);
    setToken(accessToken);
    return u;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    const { user: u, accessToken } = data.data;
    localStorage.setItem('brainx_access_token', accessToken);
    localStorage.setItem('brainx_user', JSON.stringify(u));
    setUser(u);
    setToken(accessToken);
    return u;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('brainx_access_token');
    localStorage.removeItem('brainx_user');
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('brainx_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
