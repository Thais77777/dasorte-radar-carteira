import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('dasorte_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dasorte_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        localStorage.setItem('dasorte_user', JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem('dasorte_token');
        localStorage.removeItem('dasorte_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('dasorte_token', res.data.token);
    localStorage.setItem('dasorte_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dasorte_token');
    localStorage.removeItem('dasorte_user');
    setUser(null);
    window.location.href = '/login';
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
