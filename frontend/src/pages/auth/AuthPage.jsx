import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  MapPin, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  Clock, 
  Compass,
  Check,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ALL_30_DEPARTMENTS_DATA } from '../../components/home/DepartmentDirectory';

const ROLE_CONFIG = {
  citizen: {
    id: 'citizen',
    label: 'Citizen Portal',
    badge: 'Resident',
    color: '#10b981',
    accentClass: 'citizen',
    tag: 'CIVIC RESIDENT PORTAL',
    headline: 'Citizen Grievance Portal',
    subtext: 'File local civic complaints, track multi-stage resolution timeline, and rate completed municipal work.',
    demoEmail: 'citizen@demo.com',
    demoPassword: 'password123',
    demoUser: 'Rahul Sharma (Ward 4)'
  },
  officer: {
    id: 'officer',
    label: 'Field Officer',
    badge: 'Taskforce',
    color: '#06b6d4',
    accentClass: 'officer',
    tag: 'DEPARTMENT FIELD CREW',
    headline: 'Department Field Officer Console',
    subtext: 'Inspect assigned department work orders, update resolution progress, and upload photo proof of completion.',
    demoEmail: 'officer.pwd@demo.com',
    demoPassword: 'password123',
    demoUser: 'Sourav Roy (Roads & PWD)'
  },
  admin: {
    id: 'admin',
    label: 'Municipal Admin',
    badge: 'Executive',
    color: '#f59e0b',
    accentClass: 'admin',
    tag: 'EXECUTIVE COMMAND HQ',
    headline: 'Municipal Command & Oversight',
    subtext: 'Supervise 30 departments, monitor SLA violations, analyze GIS heatmaps & inspect ML models.',
    demoEmail: 'admin@demo.com',
    demoPassword: 'password123',
    demoUser: 'Pritam Ghosh (City Commissioner)'
  }
};

export default function AuthPage({ initialMode = 'signin', setCurrentRoute }) {
  const { login, register, quickDemoLogin } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen', 'officer', 'admin'

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('citizen@demo.com');
  const [signInPassword, setSignInPassword] = useState('password123');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpRole, setSignUpRole] = useState('citizen'); // 'citizen' or 'officer'
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [ward, setWard] = useState('Ward 4');
  const [departmentId, setDepartmentId] = useState(5); // Default PWD
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleRedirectMsg, setRoleRedirectMsg] = useState('');
  const [activeDemo, setActiveDemo] = useState(null);

  // Handle switching role in Sign-In
  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setError('');
    // Auto populate demo credentials for the chosen role
    const config = ROLE_CONFIG[role];
    setSignInEmail(config.demoEmail);
    setSignInPassword(config.demoPassword);
  };

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;
    return Math.min(score, 3);
  };

  const pwStrength = getPasswordStrength(signUpPassword);
  const strengthLabels = ['Weak', 'Fair', 'Strong'];
  const strengthColors = ['#ef4444', '#eab308', '#10b981'];

  // Handle Sign In Submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRoleRedirectMsg('');
    setLoading(true);
    try {
      const user = await login(signInEmail, signInPassword);
      
      // If user's account role differs from selected tab, inform user
      if (user.role !== selectedRole) {
        setRoleRedirectMsg(`Authenticated as ${user.role.toUpperCase()} (${user.name}). Directing to your authorized dashboard...`);
        await new Promise(r => setTimeout(r, 600));
      }

      if (user.role === 'citizen') setCurrentRoute('citizen-dashboard');
      else if (user.role === 'officer') setCurrentRoute('officer-dashboard');
      else if (user.role === 'admin') setCurrentRoute('admin-dashboard');
      else setCurrentRoute('home');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please check your credentials or click auto-fill demo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the Citizen Charter & Terms to proceed.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(
        name, 
        signUpEmail, 
        signUpPassword, 
        phone, 
        signUpRole, 
        ward, 
        signUpRole === 'officer' ? departmentId : null
      );
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (ce) {
        // Confetti fallback
      }

      if (user.role === 'officer') {
        setCurrentRoute('officer-dashboard');
      } else {
        setCurrentRoute('citizen-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 1-Click Demo Login
  const handleDemo = async (role) => {
    setActiveDemo(role);
    setSelectedRole(role);
    setLoading(true);
    setError('');
    try {
      const user = await quickDemoLogin(role);
      if (role === 'citizen') setCurrentRoute('citizen-dashboard');
      else if (role === 'officer') setCurrentRoute('officer-dashboard');
      else if (role === 'admin') setCurrentRoute('admin-dashboard');
    } catch (err) {
      setError('Demo login failed. Make sure your database server is running.');
    } finally {
      setLoading(false);
      setActiveDemo(null);
    }
  };

  const currentRoleConfig = ROLE_CONFIG[selectedRole] || ROLE_CONFIG.citizen;

  return (
    <div className="auth-wrapper">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />
      <div className="auth-ambient-orb-3" />

      <div className="auth-centered-box" style={{ maxWidth: '520px', width: '100%', margin: '0 auto', padding: '16px' }}>
        {/* Premium Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="glass-card"
          style={{
            padding: 'clamp(20px, 4vw, 36px)',
            position: 'relative',
            background: 'rgba(17, 24, 39, 0.88)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 35px rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Top Segmented Mode Switcher Tabs */}
          <div className="auth-segmented-tabs">
            <button
              type="button"
              className={`auth-tab-item ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              <LogIn size={16} /> Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-item ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              <UserPlus size={16} /> Create Account
            </button>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h2 style={{ fontSize: 'clamp(1.3rem, 3.5vw, 1.65rem)', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                {mode === 'signin' ? 'Role-Based Portal Login' : 'Register New Account'}
              </h2>
              {mode === 'signin' && (
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  color: currentRoleConfig.color, 
                  background: `${currentRoleConfig.color}15`, 
                  border: `1px solid ${currentRoleConfig.color}40`,
                  padding: '3px 8px', 
                  borderRadius: '999px',
                  letterSpacing: '0.5px'
                }}>
                  {currentRoleConfig.tag}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {mode === 'signin' 
                ? 'Select your role below to access your dedicated municipal workspace.'
                : 'Create your account to report issues or manage departmental tasks.'}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role Redirect Notice */}
          {roleRedirectMsg && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#93c5fd',
              fontSize: '0.85rem'
            }}>
              <Zap size={16} className="animate-spin" />
              <span>{roleRedirectMsg}</span>
            </div>
          )}

          {/* ================= SIGN IN MODE ================= */}
          {mode === 'signin' && (
            <div>
              {/* 1. ROLE SELECTOR TABS */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Choose Portal Role:
                </label>
                <div className="role-selector-container">
                  {/* Citizen Role Tab */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange('citizen')}
                    className={`role-tab-btn citizen ${selectedRole === 'citizen' ? 'active citizen' : ''}`}
                  >
                    <UserCheck size={18} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Citizen</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>Resident Portal</span>
                  </button>

                  {/* Field Officer Role Tab */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange('officer')}
                    className={`role-tab-btn officer ${selectedRole === 'officer' ? 'active officer' : ''}`}
                  >
                    <Building2 size={18} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Field Officer</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>Taskforce Queue</span>
                  </button>

                  {/* Municipal Admin Role Tab */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabChange('admin')}
                    className={`role-tab-btn admin ${selectedRole === 'admin' ? 'active admin' : ''}`}
                  >
                    <ShieldCheck size={18} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Administrator</span>
                    <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>City Command</span>
                  </button>
                </div>
              </div>

              {/* 2. ROLE INFO & AUTOFILL BANNER */}
              <div className={`role-info-card ${currentRoleConfig.accentClass}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    {currentRoleConfig.headline}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInEmail(currentRoleConfig.demoEmail);
                      setSignInPassword(currentRoleConfig.demoPassword);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Pre-populate sample login credentials for this role"
                  >
                    <Zap size={11} color="#facc15" /> Auto-Fill Demo
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
                  {currentRoleConfig.subtext}
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.74rem', opacity: 0.8 }}>
                  Sample Account: <strong>{currentRoleConfig.demoUser}</strong>
                </div>
              </div>

              {/* 3. SIGN IN FORM */}
              <form onSubmit={handleSignInSubmit}>
                <div className="form-group">
                  <label className="form-label">{currentRoleConfig.label} Email Address</label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Mail size={17} />
                    </span>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={currentRoleConfig.demoEmail}
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => alert('For demonstration accounts, the password is: password123')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Lock size={17} />
                    </span>
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="••••••••••••"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input-action-right"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: currentRoleConfig.color, width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    Keep me signed into {currentRoleConfig.label}
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    height: '46px', 
                    fontSize: '0.95rem',
                    background: currentRoleConfig.id === 'officer' 
                      ? 'linear-gradient(135deg, #0284c7, #06b6d4)' 
                      : currentRoleConfig.id === 'admin' 
                        ? 'linear-gradient(135deg, #d97706, #f59e0b)' 
                        : undefined
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      Authenticating {currentRoleConfig.label}...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} /> Sign In to {currentRoleConfig.label}
                    </>
                  )}
                </button>
              </form>

              {/* 4. FAST 1-CLICK PERSONA SWITCHER */}
              <div className="demo-personas-container">
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <Sparkles size={14} color="#eab308" />
                  <span>Or Instant 1-Click Demo Login:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {/* Citizen Persona */}
                  <button
                    type="button"
                    onClick={() => handleDemo('citizen')}
                    className="demo-persona-tile citizen"
                    disabled={loading}
                  >
                    <div className="demo-avatar" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                      <UserCheck size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Rahul Sharma</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                          CITIZEN
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>citizen@demo.com • Ward 4</div>
                    </div>
                  </button>

                  {/* Field Officer Persona */}
                  <button
                    type="button"
                    onClick={() => handleDemo('officer')}
                    className="demo-persona-tile officer"
                    disabled={loading}
                  >
                    <div className="demo-avatar" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
                      <Building2 size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Sourav Roy</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}>
                          PWD OFFICER
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>officer.pwd@demo.com • Taskforce</div>
                    </div>
                  </button>

                  {/* Admin Persona */}
                  <button
                    type="button"
                    onClick={() => handleDemo('admin')}
                    className="demo-persona-tile admin"
                    disabled={loading}
                  >
                    <div className="demo-avatar" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                      <ShieldCheck size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Pritam Ghosh</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                          ADMINISTRATOR
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@demo.com • Municipal Commissioner</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= SIGN UP MODE ================= */}
          {mode === 'signup' && (
            <motion.form
              key="signup-form"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSignUpSubmit}
            >
              {/* Account Role Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                  Select Account Type:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('citizen')}
                    className={`role-tab-btn citizen ${signUpRole === 'citizen' ? 'active citizen' : ''}`}
                    style={{ minHeight: '52px' }}
                  >
                    <UserCheck size={17} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Resident Citizen</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpRole('officer')}
                    className={`role-tab-btn officer ${signUpRole === 'officer' ? 'active officer' : ''}`}
                    style={{ minHeight: '52px' }}
                  >
                    <Briefcase size={17} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Department Officer</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <User size={17} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={signUpRole === 'officer' ? 'e.g. Officer Sunita Rao' : 'e.g. Rahul Sharma'}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email & Phone Grid */}
              <div className="grid-cols-2" style={{ gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">{signUpRole === 'officer' ? 'Govt / Official Email' : 'Email Address'}</label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Mail size={17} />
                    </span>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={signUpRole === 'officer' ? 'officer.name@civic.gov.in' : 'name@example.com'}
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Phone size={17} />
                    </span>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* If Officer: Department Dropdown */}
              {signUpRole === 'officer' && (
                <div className="form-group">
                  <label className="form-label">
                    Assigned Municipal Department (30 Available):
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Building2 size={17} />
                    </span>
                    <select
                      className="form-select"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                    >
                      {ALL_30_DEPARTMENTS_DATA.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.id}. {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Password & Ward Grid */}
              <div className="grid-cols-2" style={{ gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label className="form-label">Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Lock size={17} />
                    </span>
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input-action-right"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password Strength Meter */}
                  {signUpPassword && (
                    <div style={{ marginTop: '6px' }}>
                      <div className="pw-strength-bar">
                        <div className="pw-strength-segment" style={{ background: pwStrength >= 1 ? strengthColors[pwStrength - 1] : 'rgba(255,255,255,0.1)' }} />
                        <div className="pw-strength-segment" style={{ background: pwStrength >= 2 ? strengthColors[pwStrength - 1] : 'rgba(255,255,255,0.1)' }} />
                        <div className="pw-strength-segment" style={{ background: pwStrength >= 3 ? strengthColors[pwStrength - 1] : 'rgba(255,255,255,0.1)' }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: strengthColors[Math.max(0, pwStrength - 1)], marginTop: '3px', textAlign: 'right' }}>
                        {strengthLabels[Math.max(0, pwStrength - 1)]} Password
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="form-label">{signUpRole === 'officer' ? 'Jurisdiction Ward' : 'Residential Ward'}</label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <MapPin size={17} />
                    </span>
                    <select
                      className="form-select"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                    >
                      {Array.from({ length: 20 }, (_, i) => (
                        <option key={i + 1} value={`Ward ${i + 1}`}>
                          Ward {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '22px' }}>
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{
                    accentColor: 'var(--accent-primary)',
                    width: '16px',
                    height: '16px',
                    marginTop: '2px',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor="agree-terms"
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}
                >
                  I agree to the <span style={{ color: 'var(--accent-cyan)' }}>Municipal Portal Charter</span> and adhere to official issue management standards.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  fontSize: '0.95rem',
                  background: signUpRole === 'officer' 
                    ? 'linear-gradient(135deg, #0284c7, #06b6d4)' 
                    : undefined
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Create {signUpRole === 'officer' ? 'Officer' : 'Citizen'} Account
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* Bottom Switch Link */}
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {mode === 'signin' ? (
              <>
                Need a new account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Register Here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sign In to Your Role
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
