import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
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
  KeyRound, 
  Info,
  Check,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ALL_30_DEPARTMENTS_DATA } from '../../components/home/DepartmentDirectory';
import DemoCredentialsModal from '../../components/auth/DemoCredentialsModal';
import { useTheme } from '../../context/ThemeContext';

const PORTAL_ROLES = [
  {
    id: 'citizen',
    title: 'Citizen',
    shortTitle: 'Citizen',
    badge: 'Resident Portal',
    description: 'Report and track civic complaints.',
    detailedContext: 'Citizen Portal — Report local civic issues, track multi-stage resolution progress, and verify completed works.',
    icon: UserCheck,
    color: '#10b981',
    identifierLabel: 'Email or Registered Login ID',
    identifierPlaceholder: 'citizen@example.com or mobile',
    identifierType: 'text',
    submitText: 'Sign In as Citizen'
  },
  {
    id: 'officer',
    title: 'Field Officer',
    shortTitle: 'Officer',
    badge: 'Department Operations',
    description: 'Manage assigned complaints and field activities.',
    detailedContext: 'Department Operations — Inspect assigned department work orders, update task status, and upload photo proof.',
    icon: Building2,
    color: '#06b6d4',
    identifierLabel: 'Officer ID or Official Email',
    identifierPlaceholder: 'DEMO-POL-001 or officer@civicpulse.gov.in',
    identifierType: 'text',
    submitText: 'Sign In as Field Officer'
  },
  {
    id: 'admin',
    title: 'Administrator',
    shortTitle: 'Admin',
    badge: 'City Command',
    description: 'Monitor departments, SLA performance and administration.',
    detailedContext: 'City Command — Supervise 30 departments, monitor SLA escalation alerts, and analyze geospatial analytics.',
    icon: ShieldCheck,
    color: '#f59e0b',
    identifierLabel: 'Administrator Email',
    identifierPlaceholder: 'admin@demo.com',
    identifierType: 'email',
    submitText: 'Sign In to City Command'
  }
];

const WEST_BENGAL_DISTRICTS = [
  { 
    id: 'kolkata', 
    name: 'Kolkata', 
    zones: [
      'KMC Borough I (Wards 1–9)', 
      'KMC Borough II (Wards 10–17)', 
      'KMC Borough III (Wards 13–35)', 
      'KMC Borough IV (Wards 21–28)', 
      'KMC Borough V (Wards 36–50)', 
      'KMC Borough VI (Wards 46–62)', 
      'KMC Borough VII (Wards 56–67)', 
      'KMC Borough VIII (Wards 68–88)', 
      'KMC Borough IX (Wards 71–88)', 
      'KMC Borough X (Wards 81–100)', 
      'KMC Borough XI (Wards 103–114)', 
      'KMC Borough XII (Wards 101–110)', 
      'KMC Borough XIII (Wards 115–122)', 
      'KMC Borough XIV (Wards 128–132)', 
      'KMC Borough XV (Wards 133–141)', 
      'KMC Borough XVI (Wards 123–126)'
    ] 
  },
  { 
    id: 'north_24_parganas', 
    name: 'North 24 Parganas', 
    zones: [
      'Bidhannagar Municipal Corp (Salt Lake)', 
      'New Town / Rajarhat Zone', 
      'Barasat Municipality', 
      'Barrackpore Municipality', 
      'Kamarhati Municipality', 
      'Panihati Municipality', 
      'Madhyamgram Municipality', 
      'Dum Dum Municipality', 
      'Naihati Municipality', 
      'Bhatpara Municipality', 
      'Basirhat Municipality', 
      'Bongaon Municipality'
    ] 
  },
  { 
    id: 'south_24_parganas', 
    name: 'South 24 Parganas', 
    zones: [
      'Alipore / Jadavpur Urban Zone', 
      'Baruipur Municipality', 
      'Sonarpur / Rajpur Municipality', 
      'Maheshtala Municipality', 
      'Budge Budge Municipality', 
      'Diamond Harbour Municipality', 
      'Canning Block Zone', 
      'Kakdwip / Sundarbans Zone'
    ] 
  },
  { 
    id: 'howrah', 
    name: 'Howrah', 
    zones: [
      'Howrah Municipal Corp (North Zone)', 
      'Howrah Municipal Corp (Central Zone)', 
      'Howrah Municipal Corp (South Zone)', 
      'Bally Municipality', 
      'Uluberia Municipality', 
      'Sankrail Zone', 
      'Amta / Bagnan Zone'
    ] 
  },
  { 
    id: 'hooghly', 
    name: 'Hooghly', 
    zones: [
      'Chandannagar Municipal Corp', 
      'Chinsurah Municipality', 
      'Serampore Municipality', 
      'Uttarpara Kotrung Municipality', 
      'Bhadreswar Municipality', 
      'Baidyabati Municipality', 
      'Arambagh Municipality'
    ] 
  },
  { 
    id: 'paschim_bardhaman', 
    name: 'Paschim Bardhaman', 
    zones: [
      'Asansol Municipal Corp (Central)', 
      'Asansol Municipal Corp (Raniganj Zone)', 
      'Asansol Municipal Corp (Kulti Zone)', 
      'Durgapur Municipal Corp (City Centre)', 
      'Durgapur Municipal Corp (Steel Zone)', 
      'Andal Industrial Zone'
    ] 
  },
  { 
    id: 'purba_bardhaman', 
    name: 'Purba Bardhaman', 
    zones: [
      'Bardhaman Municipality', 
      'Kalna Municipality', 
      'Katwa Municipality', 
      'Memari Municipality', 
      'Guskara Zone', 
      'Bhatar Zone'
    ] 
  },
  { 
    id: 'nadia', 
    name: 'Nadia', 
    zones: [
      'Kalyani Municipality (AIIMS / IT Hub)', 
      'Krishnanagar Municipality', 
      'Ranaghat Municipality', 
      'Santipur Municipality', 
      'Nabadwip Municipality', 
      'Chakdaha Municipality', 
      'Tehatta Zone'
    ] 
  },
  { 
    id: 'murshidabad', 
    name: 'Murshidabad', 
    zones: [
      'Berhampore Municipality', 
      'Murshidabad Municipality', 
      'Jangipur Municipality', 
      'Dhulian Municipality', 
      'Kandi Municipality', 
      'Beldanga Municipality', 
      'Lalgola Zone'
    ] 
  },
  { 
    id: 'darjeeling', 
    name: 'Darjeeling', 
    zones: [
      'Siliguri Municipal Corp (Darjeeling Part)', 
      'Darjeeling Municipality (Mall / Ridge)', 
      'Kurseong Municipality', 
      'Mirik Municipality', 
      'Ghum / Jorebunglow Zone', 
      'Matigara / Bagdogra Zone'
    ] 
  },
  { 
    id: 'kalimpong', 
    name: 'Kalimpong', 
    zones: [
      'Kalimpong Municipality', 
      'Pedong Block Zone', 
      'Lava / Rishop Zone', 
      'Gorubathan Block Zone'
    ] 
  },
  { 
    id: 'jalpaiguri', 
    name: 'Jalpaiguri', 
    zones: [
      'Jalpaiguri Municipality', 
      'Siliguri Municipal Corp (Jalpaiguri Part)', 
      'Malbazar Municipality', 
      'Dhupguri Municipality', 
      'Mainaguri Municipality', 
      'Rajganj Zone'
    ] 
  },
  { 
    id: 'alipurduar', 
    name: 'Alipurduar', 
    zones: [
      'Alipurduar Municipality', 
      'Falakata Municipality', 
      'Jaigaon (Indo-Bhutan Border Zone)', 
      'Madarihat / Dooars Zone', 
      'Kumargram Zone'
    ] 
  },
  { 
    id: 'cooch_behar', 
    name: 'Cooch Behar', 
    zones: [
      'Cooch Behar Municipality', 
      'Dinhata Municipality', 
      'Mathabhanga Municipality', 
      'Tufanganj Municipality', 
      'Mekhliganj Municipality', 
      'Haldibari Zone'
    ] 
  },
  { 
    id: 'malda', 
    name: 'Malda', 
    zones: [
      'English Bazar Municipality', 
      'Old Malda Municipality', 
      'Chanchal Zone', 
      'Harishchandrapur Zone', 
      'Kaliachak Zone', 
      'Gazole Zone'
    ] 
  },
  { 
    id: 'uttar_dinajpur', 
    name: 'Uttar Dinajpur', 
    zones: [
      'Raiganj Municipality', 
      'Islampur Municipality', 
      'Kaliaganj Municipality', 
      'Dalkhola Municipality', 
      'Karandighi Zone'
    ] 
  },
  { 
    id: 'dakshin_dinajpur', 
    name: 'Dakshin Dinajpur', 
    zones: [
      'Balurghat Municipality', 
      'Gangarampur Municipality', 
      'Buniadpur Municipality', 
      'Harirampur Zone', 
      'Kumarganj Zone'
    ] 
  },
  { 
    id: 'birbhum', 
    name: 'Birbhum', 
    zones: [
      'Bolpur-Santiniketan Municipality', 
      'Suri Municipality', 
      'Rampurhat Municipality', 
      'Sainthia Municipality', 
      'Dubrajpur Municipality', 
      'Nalhati Zone'
    ] 
  },
  { 
    id: 'bankura', 
    name: 'Bankura', 
    zones: [
      'Bankura Municipality', 
      'Bishnupur Municipality', 
      'Sonamukhi Municipality', 
      'Khatra Zone', 
      'Barjora Industrial Zone'
    ] 
  },
  { 
    id: 'purulia', 
    name: 'Purulia', 
    zones: [
      'Purulia Municipality', 
      'Jhalda Municipality', 
      'Raghunathpur Municipality', 
      'Balarampur Zone', 
      'Manbazar Zone', 
      'Ayodhya Hills Zone'
    ] 
  },
  { 
    id: 'purba_medinipur', 
    name: 'Purba Medinipur', 
    zones: [
      'Haldia Municipality (Port & Industrial)', 
      'Tamluk Municipality', 
      'Contai Municipality', 
      'Egra Municipality', 
      'Digha-Sankarpur Coastal Zone', 
      'Panskura Municipality'
    ] 
  },
  { 
    id: 'paschim_medinipur', 
    name: 'Paschim Medinipur', 
    zones: [
      'Medinipur Municipality', 
      'Kharagpur Municipality (IIT Zone)', 
      'Ghatal Municipality', 
      'Chandrakona Municipality', 
      'Debra Zone'
    ] 
  },
  { 
    id: 'jhargram', 
    name: 'Jhargram', 
    zones: [
      'Jhargram Municipality', 
      'Belpahari Forest Zone', 
      'Gopiballavpur Zone', 
      'Nayagram Zone', 
      'Binpur Zone'
    ] 
  }
];

export default function AuthPage({ initialMode = 'signin', setCurrentRoute, onSuccessRoute, authNotice }) {
  const { login, register, logout } = useAuth();
  const { isDark } = useTheme();
  const [mode, setMode] = useState(initialMode); // 'signin' or 'signup'
  const [selectedRole, setSelectedRole] = useState('citizen'); // 'citizen', 'officer', 'admin'

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up State
  const [signUpRole, setSignUpRole] = useState('citizen'); // 'citizen' or 'officer'
  const [name, setName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  
  // West Bengal Citizen Location Selection State
  const [selectedDistrict, setSelectedDistrict] = useState('Kolkata');

  const [departmentId, setDepartmentId] = useState(5); // Default Roads & PWD
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Mobile OTP Verification State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpMaskedPhone, setOtpMaskedPhone] = useState('');
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(4);
  const [otpLocked, setOtpLocked] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleRedirectMsg, setRoleRedirectMsg] = useState('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Active role config
  const currentRole = PORTAL_ROLES.find(r => r.id === selectedRole) || PORTAL_ROLES[0];

  // Handle switching portal role tab
  const handlePortalRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
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
      const user = await login(signInEmail, signInPassword, selectedRole);

      // Strict role-based portal login verification
      if (user.role !== selectedRole) {
        logout();
        if (selectedRole === 'citizen') {
          setError(`Access Denied: This account is registered as a ${user.role === 'admin' ? 'Administrator' : 'Field Officer'}. Field Officers cannot log in through the Citizen Portal. Please select the '${user.role === 'admin' ? 'Administrator' : 'Field Officer'}' tab above.`);
        } else if (selectedRole === 'officer') {
          setError(`Access Denied: This account is registered as a ${user.role === 'admin' ? 'Administrator' : 'Citizen'}. Citizens cannot log in through the Field Officer Portal. Please select the '${user.role === 'admin' ? 'Administrator' : 'Citizen'}' tab above.`);
        } else if (selectedRole === 'admin') {
          setError(`Access Denied: Administrative access is restricted to Administrators only. This account is registered as a ${user.role === 'officer' ? 'Field Officer' : 'Citizen'}.`);
        }
        return;
      }

      if (user.role === 'officer') {
        setCurrentRoute('officer-dashboard');
      } else if (onSuccessRoute) {
        setCurrentRoute(onSuccessRoute);
      } else if (user.role === 'citizen') {
        setCurrentRoute('citizen-dashboard');
      } else if (user.role === 'admin') {
        setCurrentRoute('admin-dashboard');
      } else {
        setCurrentRoute('home');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your login ID and password.');
    } finally {
      setLoading(false);
    }
  };

  // One-click autofill & login directly from Demo Credentials Vault
  const handleVaultAutoFill = async (acc) => {
    const loginId = acc.email || acc.officerId;
    const pass = acc.tempPassword;
    const role = acc.role === 'admin' ? 'admin' : (acc.role === 'officer' ? 'officer' : 'citizen');

    setSelectedRole(role);
    setSignInEmail(loginId);
    setSignInPassword(pass);
    setIsDemoModalOpen(false);
    setError('');

    // Instant One-Click Login
    setLoading(true);
    try {
      const user = await login(loginId, pass);
      if (user.role === 'officer') {
        setCurrentRoute('officer-dashboard');
      } else if (user.role === 'admin') {
        setCurrentRoute('admin-dashboard');
      } else if (onSuccessRoute) {
        setCurrentRoute(onSuccessRoute);
      } else {
        setCurrentRoute('citizen-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication with credentials failed.');
    } finally {
      setLoading(false);
    }
  };

  // Request 6-digit Mobile OTP
  const handleRequestOtp = async () => {
    const cleanDigits = (phone || '').replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }

    setError('');
    setOtpNotice('');
    setLoading(true);

    try {
      const res = await api.post('/auth/otp/send', { phone });
      setIsOtpStep(true);
      setOtpMaskedPhone(res.data.maskedPhone || phone);
      setOtpTimer(res.data.resendCooldownSeconds || 30);
      setOtpAttemptsRemaining(4);
      setOtpLocked(false);
      setOtpCode('');
      setOtpNotice(res.data.message || 'OTP verification code sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send verification code. Please check mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Verify entered code and complete citizen account creation
  const handleVerifyOtpAndRegister = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setOtpNotice('');
    setLoading(true);

    try {
      // 1. Verify OTP with backend (Enforces 5-min expiry & 4-guess lockout)
      const verifyRes = await api.post('/auth/otp/verify', {
        phone,
        code: otpCode.trim()
      });

      const verificationToken = verifyRes.data.verificationToken;

      // 2. Complete Account Registration with verified phone token
      const finalWard = `${selectedDistrict} District`;
      const user = await register(
        name,
        signUpEmail,
        signUpPassword,
        phone,
        'citizen',
        finalWard,
        null,
        verificationToken
      );

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onSuccessRoute) {
        setCurrentRoute(onSuccessRoute);
      } else {
        setCurrentRoute('citizen-dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.locked) {
        setOtpLocked(true);
        setOtpAttemptsRemaining(0);
        setError(data.error || 'Too many incorrect attempts. This OTP has been permanently invalidated. Please request a new code.');
      } else if (data?.attemptsRemaining !== undefined) {
        setOtpAttemptsRemaining(data.attemptsRemaining);
        setError(data.error || `Incorrect code. ${data.attemptsRemaining} attempt(s) remaining.`);
      } else {
        setError(data?.error || 'Verification failed. Please check the code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up Submit -> triggers Mobile OTP verification step
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the Citizen Charter & Terms to proceed.');
      return;
    }
    const cleanDigits = (phone || '').replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('A valid 10-digit mobile number is required for verified citizen registration.');
      return;
    }
    // Initiate OTP dispatch
    await handleRequestOtp();
  };

  return (
    <div className="auth-wrapper">
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="auth-ambient-orb-1" />
      <div className="auth-ambient-orb-2" />
      <div className="auth-ambient-orb-3" />

      <div className="auth-centered-box" style={{ maxWidth: '560px', width: '100%', margin: '0 auto', padding: '16px' }}>
        {/* Main Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="glass-card auth-main-card"
          style={{
            padding: 'clamp(20px, 4vw, 36px)',
            position: 'relative',
            borderRadius: 'var(--radius-lg, 16px)'
          }}
        >
          {/* A. Header / Authentication Tabs */}
          <div className="auth-segmented-tabs" role="tablist" aria-label="Authentication Options">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth-tab-item ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth-tab-item ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              <UserPlus size={16} />
              <span>Create Account</span>
            </button>
          </div>

          {/* B. Login Heading */}
          <div style={{ marginBottom: '20px' }}>
            <div className="civic-governance-badge">
              <ShieldCheck size={13} />
              <span>ROLE-BASED GOVERNANCE PORTAL</span>
            </div>
            <h1 style={{
              fontSize: 'clamp(1.35rem, 3.5vw, 1.7rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              lineHeight: 1.25,
              letterSpacing: '-0.3px'
            }}>
              {mode === 'signin' ? 'Welcome to CivicPulse AI' : 'Create CivicPulse Account'}
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.45
            }}>
              {mode === 'signin'
                ? 'Secure access to your dedicated civic administration workspace.'
                : 'Join the platform to submit civic issues or manage municipal field operations.'}
            </p>
          </div>

          {/* Auth Notice (e.g. Sign in required to report an issue) */}
          {authNotice && (
            <div style={{
              background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #7dd3fc',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.84rem',
              color: isDark ? '#38bdf8' : '#0369a1',
              fontWeight: 600,
              lineHeight: 1.4
            }}>
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span>{authNotice}</span>
            </div>
          )}

          {/* Error Notice */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-sm, 8px)',
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
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#93c5fd',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{roleRedirectMsg}</span>
            </div>
          )}

          {/* ================= SIGN IN MODE ================= */}
          {mode === 'signin' && (
            <div>
              {/* C. Credentials Vault — Ultra-Compact Slim Bar */}
              <div className="demo-vault-compact-bar">
                <div className="demo-vault-compact-info">
                  <div className="demo-vault-compact-badge-icon">
                    <KeyRound size={13} />
                  </div>
                  <div className="demo-vault-compact-text">
                    <span className="demo-vault-compact-title">Credentials</span>
                    <span className="demo-vault-compact-dot">•</span>
                    <span className="demo-vault-compact-counts">31 Accounts (30 Divisions + 1 Admin)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="demo-vault-compact-action"
                  title="Autofill Credential"
                >
                  <Lock size={12} />
                  <span>Autofill Credential</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* 3. Role Selection: Choose Your Portal */}
              <div style={{ marginBottom: '16px' }}>
                <label className="portal-choose-label" style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Choose Your Portal:
                </label>
                <div className="portal-role-grid" role="radiogroup" aria-label="Portal Role Selection">
                  {PORTAL_ROLES.map(role => {
                    const isSelected = selectedRole === role.id;
                    const IconComponent = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handlePortalRoleSelect(role.id)}
                        className={`portal-role-card ${role.id} ${isSelected ? 'active' : ''}`}
                      >
                        <div className="portal-role-card-header">
                          <div 
                            className="portal-role-card-icon"
                            style={{
                              background: isSelected ? `${role.color}25` : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                              color: role.color
                            }}
                          >
                            <IconComponent size={15} />
                          </div>
                          <span className="portal-role-card-title">
                            <span className="desktop-only">{role.title}</span>
                            <span className="mobile-only">{role.shortTitle || role.title}</span>
                          </span>
                        </div>
                        <span 
                          className="portal-role-card-badge"
                          style={{ color: role.color }}
                        >
                          {role.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Role-Based Login Form */}
              <form 
                id="civic-auth-form" 
                name="civic_auth_form" 
                onSubmit={handleSignInSubmit}
                autoComplete="on"
              >
                {/* Identifier Input */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="login-username" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {currentRole.identifierLabel}
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      {selectedRole === 'officer' ? <Building2 size={17} /> : <Mail size={17} />}
                    </span>
                    <input
                      id="login-username"
                      name="username"
                      type={currentRole.identifierType}
                      autoComplete="username"
                      className="form-input"
                      placeholder={currentRole.identifierPlaceholder}
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label htmlFor="login-password" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    Password
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Lock size={17} />
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type={showSignInPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="form-input"
                      placeholder="••••••••••••"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      style={{ paddingRight: '40px', fontSize: '0.88rem' }}
                    />
                    <button
                      type="button"
                      className="input-action-right"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: currentRole.color, width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>Remember my device</span>
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    TLS 1.3 End-to-End Encrypted
                  </span>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  id="sign-in-submit-btn"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: selectedRole === 'admin' 
                      ? 'linear-gradient(135deg, #d97706, #b45309)'
                      : selectedRole === 'officer'
                      ? 'linear-gradient(135deg, #0284c7, #0891b2)'
                      : 'linear-gradient(135deg, #059669, #0d9488)'
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={17} />
                      <span>{currentRole.submitText}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= SIGN UP MODE ================= */}
          {mode === 'signup' && isOtpStep && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ padding: '8px 4px' }}
            >
              {/* Security Shield Icon */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
                  border: '1px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <ShieldCheck size={32} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
                  Verify Mobile Number
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Enter the 6-digit security code sent to <strong style={{ color: 'var(--accent-cyan)' }}>{otpMaskedPhone}</strong>
                </p>
              </div>

              {/* Success / Info notice */}
              {otpNotice && (
                <div style={{
                  background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: isDark ? '#6ee7b7' : '#065f46'
                }}>
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{otpNotice}</span>
                </div>
              )}

              {/* 6-Digit Code Input */}
              <form onSubmit={handleVerifyOtpAndRegister}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="signup-otp-input" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', display: 'block' }}>
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    id="signup-otp-input"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    disabled={otpLocked || loading}
                    className="form-input"
                    style={{
                      textAlign: 'center',
                      fontSize: '1.8rem',
                      letterSpacing: '10px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: otpLocked ? '2px solid #ef4444' : '2px solid var(--accent-primary)',
                      background: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc'
                    }}
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                {/* Security Badges: 5-min expiration & attempt limits */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                  padding: '0 4px'
                }}>
                  <span>⏳ Code expires in 5 minutes</span>
                  <span style={{ color: otpAttemptsRemaining <= 2 ? '#ef4444' : 'inherit', fontWeight: 600 }}>
                    🔒 {otpAttemptsRemaining} attempt{otpAttemptsRemaining === 1 ? '' : 's'} left
                  </span>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    marginBottom: '14px',
                    background: 'linear-gradient(135deg, #059669, #0d9488)'
                  }}
                  disabled={loading || otpLocked || otpCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span>Verifying Code & Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Verify & Complete Registration</span>
                    </>
                  )}
                </button>

                {/* Staging / Demo Test Code Helper */}
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginBottom: '16px',
                  background: isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  lineHeight: 1.5
                }}>
                  🧪 <strong>Demo Environment:</strong> If telecom SMS is delayed, enter test code{' '}
                  <button
                    type="button"
                    onClick={() => setOtpCode('123456')}
                    style={{
                      background: 'rgba(2, 132, 199, 0.15)',
                      border: '1px solid var(--accent-cyan, #0284c7)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: 'var(--accent-cyan, #0284c7)',
                      cursor: 'pointer'
                    }}
                  >
                    123456
                  </button>{' '}
                  to verify and register immediately.
                </div>
              </form>

              {/* Bottom Resend and Edit Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                paddingTop: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => { setIsOtpStep(false); setError(''); setOtpNotice(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan, #0284c7)', cursor: 'pointer', padding: 0, fontWeight: 500 }}
                >
                  ← Edit Phone / Details
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpTimer > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: otpTimer > 0 ? 'var(--text-muted, #94a3b8)' : 'var(--accent-cyan, #0284c7)',
                    cursor: otpTimer > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend New OTP'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ================= SIGN UP MODE (REGISTRATION FORM) ================= */}
          {mode === 'signup' && !isOtpStep && (
            <motion.form 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onSubmit={handleSignUpSubmit}
              autoComplete="on"
            >
              {/* Citizen Portal Info Banner */}
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #a7f3d0',
                borderRadius: '8px',
                padding: '9px 12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: isDark ? '#6ee7b7' : '#065f46',
                lineHeight: 1.4
              }}>
                <Info size={15} style={{ flexShrink: 0 }} />
                <span>
                  Citizen Registration Portal • <em>Department Field Officers: please sign in via the official Field Officer portal.</em>
                </span>
              </div>

              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="signup-name" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Full Legal Name
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <User size={17} />
                  </span>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className="form-input"
                    placeholder="e.g. Subir Karmakar"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="signup-email" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Mail size={17} />
                  </span>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="form-input"
                    placeholder="citizen@wb.gov.in"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label htmlFor="signup-phone" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Mobile Phone Number
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Phone size={17} />
                  </span>
                  <input
                    id="signup-phone"
                    name="tel"
                    type="tel"
                    autoComplete="tel"
                    className="form-input"
                    placeholder="+91 98300 XXXXX"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Home District in West Bengal */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="signup-district" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Home District (West Bengal State)
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <MapPin size={17} color="var(--accent-cyan, #0284c7)" />
                  </span>
                  <select
                    id="signup-district"
                    name="district"
                    className="form-input form-select"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                  >
                    {WEST_BENGAL_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="signup-password" className="form-label" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Account Password
                </label>
                <div className="input-with-icon">
                  <span className="input-icon-left">
                    <Lock size={17} />
                  </span>
                  <input
                    id="signup-password"
                    name="password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    autoComplete="new-password"
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
                    tabIndex={-1}
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

              {/* Terms Checkbox */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '20px' }}>
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
                  style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}
                >
                  I agree to the <span style={{ color: 'var(--accent-cyan)' }}>CivicPulse Governance Charter</span> and statutory grievance handling terms.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%', 
                  height: '46px', 
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #059669, #0d9488)'
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>Sending Mobile OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    <span>Verify Mobile & Create Account</span>
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* Bottom Switch Link */}
          <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
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
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Create Account Here
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
                    fontWeight: 700,
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

      {/* Demo Credentials Vault Modal */}
      <DemoCredentialsModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectAccount={handleVaultAutoFill}
      />
    </div>
  );
}
