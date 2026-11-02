import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cc_auth_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { errors: { general: 'Unable to reach CivicConnect. Check that the API server is running and try again.' } } };
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // Restore session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/auth/me')
      .then(({ ok, status, data }) => {
        if (ok && data.user) {
          setUser(data.user);
        } else if (status !== 0) {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const signup = useCallback(async ({ name, email, phone, password, confirmPassword, role }) => {
    const { ok, data } = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, confirmPassword, role }),
    });

    if (!ok) {
      return { success: false, errors: data.errors || { general: data.error?.message || 'Signup failed.' } };
    }

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    }

    return {
      success: true,
      message: data.message,
      requiresApproval: !data.token, // officer pending approval
      user: data.user,
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { ok, data } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!ok) {
      return { success: false, errors: data.errors || { general: data.error?.message || 'Login failed.' } };
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    return { success: true, user: data.user };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const { ok, data } = await apiFetch('/auth/me');
    if (ok && data.user) setUser(data.user);
  }, []);

  // Convenience: get auth token for other API calls
  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    refreshUser,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
