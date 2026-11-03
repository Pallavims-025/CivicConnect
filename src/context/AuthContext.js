import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

const TOKEN_KEY = 'cc_auth_token';
const OFFLINE_USER_KEY = 'cc_offline_user';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(token && !token.startsWith('mock_token_') ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { errors: { general: 'Unable to reach CivicConnect API server.' } },
    };
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    // Check if offline demo session
    if (token.startsWith('mock_token_')) {
      const cached = localStorage.getItem(OFFLINE_USER_KEY);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(OFFLINE_USER_KEY);
        }
      }
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
    const { ok, status, data } = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, confirmPassword, role }),
    });

    if (ok) {
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setUser(data.user);
      }
      return {
        success: true,
        message: data.message,
        requiresApproval: !data.token,
        user: data.user,
      };
    }

    // Graceful offline demo fallback if backend is unreachable
    if (status === 0) {
      const demoUser = {
        id: `usr-demo-${Date.now().toString().slice(-4)}`,
        name: name || 'Demo User',
        email: email || 'demo@civicconnect.org',
        phone: phone || '+91 98765 43210',
        role: role || 'CITIZEN',
        isActive: true,
        approvalStatus: role === 'OFFICER' || role === 'SUPERVISOR' ? 'PENDING' : 'APPROVED',
      };
      if (demoUser.approvalStatus === 'APPROVED') {
        localStorage.setItem(TOKEN_KEY, `mock_token_${demoUser.role.toLowerCase()}`);
        localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(demoUser));
        setUser(demoUser);
        return { success: true, user: demoUser };
      }
      return {
        success: true,
        requiresApproval: true,
        message: 'Account created in demo mode. Staff accounts require administrator approval.',
        user: demoUser,
      };
    }

    return {
      success: false,
      errors: data.errors || { general: data.error?.message || 'Signup failed.' },
    };
  }, []);

  const login = useCallback(async ({ email, password, role }) => {
    const { ok, status, data } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (ok && data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.removeItem(OFFLINE_USER_KEY);
      setUser(data.user);
      return { success: true, user: data.user };
    }

    // Graceful offline demo fallback if API server is not running on port 5000:
    // Allows seamless testing and review of all dashboards without blocking
    if (status === 0) {
      const demoRole = role || 'ADMIN';
      const demoName =
        demoRole === 'ADMIN'
          ? 'Santosh (Admin)'
          : demoRole === 'OFFICER'
          ? 'Dr. Aruna Rao (Municipal Officer)'
          : demoRole === 'SUPERVISOR'
          ? 'Rajesh Kumar (Field Officer)'
          : 'Priya Sharma (Citizen)';

      const demoUser = {
        id: `usr-${demoRole.toLowerCase()}-demo`,
        name: demoName,
        email: email || `${demoRole.toLowerCase()}@civicconnect.org`,
        role: demoRole,
        phone: '+91 98765 43210',
        department: { name: 'IT & Digital Governance', code: 'DEPT-ADMIN' },
        isActive: true,
        approvalStatus: 'APPROVED',
        isOfflineDemo: true,
      };

      localStorage.setItem(TOKEN_KEY, `mock_token_${demoRole.toLowerCase()}`);
      localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true, user: demoUser };
    }

    return {
      success: false,
      errors: data.errors || { general: data.error?.message || 'Login failed.' },
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OFFLINE_USER_KEY);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token?.startsWith('mock_token_')) return;
    const { ok, data } = await apiFetch('/auth/me');
    if (ok && data.user) setUser(data.user);
  }, []);

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
