import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Shield,
  Settings,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────
   Role configuration
───────────────────────────────────────── */
const ROLES = [
  {
    id: 'CITIZEN',
    label: 'Citizen',
    sublabel: 'Report & track civic issues',
    icon: User,
    color: 'blue',
    accentBg: 'bg-blue-500/20',
    accentText: 'text-blue-400',
    borderHover: 'hover:border-blue-400/60',
    btnBg: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  },
  {
    id: 'OFFICER',
    label: 'Municipality Officer',
    sublabel: 'Manage complaints & work orders',
    icon: Shield,
    color: 'amber',
    accentBg: 'bg-amber-500/20',
    accentText: 'text-amber-400',
    borderHover: 'hover:border-amber-400/60',
    btnBg: 'bg-amber-600 hover:bg-amber-700',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
  },
  {
    id: 'SUPERVISOR',
    label: 'Field Officer',
    sublabel: 'Field operations access (admin approval required)',
    icon: Shield,
    color: 'cyan',
    accentBg: 'bg-cyan-500/20',
    accentText: 'text-cyan-300',
    borderHover: 'hover:border-cyan-400/60',
    btnBg: 'bg-cyan-700 hover:bg-cyan-800',
    badgeBg: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
  },
  {
    id: 'ADMIN',
    label: 'Administrator',
    sublabel: 'System configuration & oversight',
    icon: Settings,
    color: 'purple',
    accentBg: 'bg-purple-500/20',
    accentText: 'text-purple-400',
    borderHover: 'hover:border-purple-400/60',
    btnBg: 'bg-purple-600 hover:bg-purple-700',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  },
];

/* ─────────────────────────────────────────
   Input component
───────────────────────────────────────── */
function AuthInput({ id, label, type = 'text', value, onChange, error, placeholder, rightElement }) {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`auth-input${error ? ' auth-input-error' : ''}`}
          autoComplete={type === 'password' ? 'current-password' : undefined}
        />
        {rightElement}
      </div>
      {error && (
        <p className="auth-error-text" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main LoginPage
───────────────────────────────────────── */
export function LoginPage({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const { signup: authSignup, login: authLogin, user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [selectedRole, setSelectedRole] = useState('CITIZEN');
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Feedback
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const roleConfig = ROLES.find((r) => r.id === selectedRole) || ROLES[0];
  const isLogin = mode === 'login';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setSuccessMsg('');
    setShowPassword(false);
    setShowConfirm(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  const switchRole = (roleId) => {
    setSelectedRole(roleId);
    resetForm();
  };

  // Client-side validation
  const validate = () => {
    const errs = {};
    if (!isLogin && name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Enter a valid email address.';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (!isLogin && password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!isLogin && !/^\+?[0-9\s()-]{8,20}$/.test(phone.trim())) errs.phone = 'Enter a valid mobile number.';
    return errs;
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'CITIZEN':
        return '/citizen';
      case 'OFFICER':
        return '/officer';
      case 'SUPERVISOR':
        return '/field-officer-unavailable';
      case 'ADMIN':
        return '/admin';
      case 'SUPPLIER':
        return '/account-unavailable';
      default:
        return '/account-unavailable';
    }
  };

  useEffect(() => {
    if (!authLoading && user) navigate(getDashboardRoute(user.role), { replace: true });
  }, [authLoading, user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = await authLogin({ email: email.trim(), password });
        if (!result.success) {
          setErrors(result.errors || { general: 'Login failed.' });
          return;
        }
        // Navigate to role dashboard
        navigate(getDashboardRoute(result.user.role), { replace: true });
      } else {
        // Admin cannot self-register
        if (selectedRole === 'ADMIN') {
          setErrors({ general: 'Administrator accounts cannot be self-registered. Contact your system administrator.' });
          return;
        }
        const result = await authSignup({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
          role: selectedRole,
        });
        if (!result.success) {
          setErrors(result.errors || { general: 'Signup failed.' });
          return;
        }
        if (result.requiresApproval) {
          resetForm();
          setSuccessMsg(result.message || 'Account created. Awaiting administrator approval.');
        } else {
          navigate(getDashboardRoute(result.user.role), { replace: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const RoleIcon = roleConfig.icon;

  return (
    <div className="auth-page">
      {/* Background blobs */}
      <div className="auth-bg-blob auth-bg-blob-1" />
      <div className="auth-bg-blob auth-bg-blob-2" />

      <div className="auth-container">
        {/* ── Brand header ── */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="auth-brand-name">
              Civic<span className="text-blue-400">Connect</span>
            </span>
            <p className="auth-brand-sub">Urban Issue Resolution Portal</p>
          </div>
          <div className="auth-brand-badge">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Municipal Operations</span>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="auth-card">
          {/* Mode tabs */}
          <div className="auth-tabs">
            <button
              onClick={() => switchMode('login')}
              className={`auth-tab${isLogin ? ' auth-tab-active' : ''}`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`auth-tab${!isLogin ? ' auth-tab-active' : ''}`}
            >
              Create Account
            </button>
          </div>

          {/* Role selector */}
          <div className="auth-role-section">
            <p className="auth-role-label">
              {isLogin ? 'Sign in as' : 'Register as'}
            </p>
            <div className="auth-role-grid">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    className={`auth-role-btn${isSelected ? ' auth-role-btn-selected' : ''}`}
                    title={r.sublabel}
                    aria-pressed={isSelected}
                  >
                    <div className={`auth-role-icon ${r.accentBg} ${r.accentText}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="auth-role-btn-label">{r.label}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white/80 shrink-0 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Role description badge */}
            <div className={`auth-role-desc-badge border ${roleConfig.badgeBg}`}>
              <RoleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{roleConfig.sublabel}</span>
              {selectedRole === 'OFFICER' && !isLogin && (
                <span className="auth-approval-note">Requires admin approval</span>
              )}
              {selectedRole === 'SUPERVISOR' && !isLogin && (
                <span className="auth-approval-note">Requires admin approval</span>
              )}
              {selectedRole === 'ADMIN' && !isLogin && (
                <span className="auth-approval-note">Login only — no self-registration</span>
              )}
            </div>
          </div>

          {/* Success banner */}
          {successMsg && (
            <div className="auth-success-banner" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <p>{successMsg}</p>
            </div>
          )}

          {/* General error */}
          {errors.general && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <p>{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            {!isLogin && (
              <AuthInput
                id="auth-name"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                error={errors.name}
              />
            )}

            {!isLogin && (
              <AuthInput
                id="auth-phone"
                label="Mobile Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                error={errors.phone}
              />
            )}

            <AuthInput
              id="auth-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
            />

            <AuthInput
              id="auth-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              error={errors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-pw-toggle"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {!isLogin && (
              <AuthInput
                id="auth-confirm-password"
                label="Confirm Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                error={errors.confirmPassword}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="auth-pw-toggle"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            )}

            <button
              type="submit"
              disabled={loading || authLoading || (!isLogin && selectedRole === 'ADMIN')}
              className={`auth-submit-btn ${roleConfig.btnBg}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isLogin ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                <>
                  <span>
                    {isLogin
                      ? `Sign In as ${roleConfig.label}`
                      : selectedRole === 'ADMIN'
                      ? 'Admin Login Only — Use Sign In Tab'
                      : `Create ${roleConfig.label} Account`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode switch link */}
          <p className="auth-mode-switch">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => switchMode(isLogin ? 'signup' : 'login')}
              className="auth-mode-link"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="auth-footer">
          © 2026 CivicConnect Platform · Citizen & Municipal Grievance Redressal
        </p>
      </div>
    </div>
  );
}
