import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Search, 
  X, 
  Building2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Info,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const CATEGORY_GROUPS = [
  { id: 'all', label: 'All Accounts (31)' },
  { id: 'admin', label: 'Administrator (1)' },
  { id: 'police_safety', label: 'Police & Public Safety (4)' },
  { id: 'infrastructure', label: 'Infrastructure & Municipal (8)' },
  { id: 'emergency_env', label: 'Emergency & Environment (3)' },
  { id: 'land_electricity', label: 'Land & Electricity (3)' },
  { id: 'transport', label: 'Transport (2)' },
  { id: 'public_services', label: 'Public Services (7)' },
  { id: 'rural_resources', label: 'Rural & Natural Resources (3)' }
];

export default function DemoCredentialsModal({ isOpen, onClose, onSelectAccount }) {
  // Verification State (Zero passwords exposed before backend check)
  const [accessPassword, setAccessPassword] = useState('6105');
  const [showAccessPassword, setShowAccessPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Unlocked State
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  if (!isOpen) return null;

  // Handle backend password verification
  const handleVerifyAccess = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!accessPassword.trim()) {
      setVerifyError('Please enter the administrative access password.');
      return;
    }

    setVerifying(true);
    setVerifyError('');

    try {
      const res = await api.post('/auth/demo-credentials/verify', { accessPassword });
      if (res.data?.success && Array.isArray(res.data?.accounts)) {
        setAccounts(res.data.accounts);
        setIsUnlocked(true);
      } else {
        setVerifyError('Authentication failed. Access denied.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid access password. Access denied.';
      setVerifyError(msg);
    } finally {
      setVerifying(false);
    }
  };

  // Toggle password visibility for an account
  const togglePasswordVisibility = (officerId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [officerId]: !prev[officerId]
    }));
  };

  // Toggle card expansion
  const toggleCardExpand = (officerId) => {
    setExpandedCards(prev => ({
      ...prev,
      [officerId]: !prev[officerId]
    }));
  };

  // Copy with visual confirmation
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || (
      (acc.name && acc.name.toLowerCase().includes(query)) ||
      (acc.officerId && acc.officerId.toLowerCase().includes(query)) ||
      (acc.email && acc.email.toLowerCase().includes(query)) ||
      (acc.officerName && acc.officerName.toLowerCase().includes(query)) ||
      (acc.category && acc.category.toLowerCase().includes(query)) ||
      (acc.description && acc.description.toLowerCase().includes(query))
    );

    const matchesGroup = selectedGroup === 'all' || acc.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div 
      className="demo-credentials-overlay demo-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 11, 22, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(10px, 3vw, 20px)',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div 
        className={`demo-credentials-modal-content ${isUnlocked ? 'is-unlocked' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: isUnlocked ? '920px' : '440px',
          maxHeight: 'min(90vh, 90dvh)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card, #0f172a)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          margin: 'auto',
          transition: 'max-width 0.3s ease'
        }}
      >
        {/* Header */}
        <div className="demo-modal-header" style={{
          padding: 'clamp(12px, 2.5vw, 18px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: isUnlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${isUnlocked ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {isUnlocked ? <Unlock size={17} color="#10b981" /> : <Lock size={17} color="#38bdf8" />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 className="demo-modal-title" style={{
                fontSize: 'clamp(0.96rem, 2.4vw, 1.15rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Credentials Vault
              </h2>
              <div style={{ fontSize: '0.72rem', color: isUnlocked ? 'var(--accent-emerald, #10b981)' : 'var(--text-muted)' }}>
                {isUnlocked ? 'Vault Unlocked • 31 Accounts Available' : '31 Department Accounts'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  setIsUnlocked(false);
                  setAccessPassword('6105');
                  setAccounts([]);
                }}
                className="btn btn-secondary btn-sm"
                title="Lock Vault"
                style={{ padding: '5px 8px', fontSize: '0.72rem' }}
              >
                <Lock size={12} /> Relock
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
              style={{
                width: '32px',
                height: '32px',
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close dialog"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          padding: 'clamp(12px, 2.5vw, 20px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1
        }}>
          {/* STEP 1: LOCKED VIEW */}
          {!isUnlocked && (
            <div>
              <div style={{
                textAlign: 'center',
                padding: '8px 10px 14px',
                maxWidth: '360px',
                margin: '0 auto'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: 'var(--accent-cyan)'
                }}>
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Restricted Vault
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  Enter the administrative access secret to unlock credentials for all 31 civic departments and administration.
                </p>
              </div>

              {/* Error Notice */}
              <AnimatePresence mode="wait">
                {verifyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: 'var(--radius-sm, 8px)',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      color: '#fca5a5',
                      fontSize: '0.8rem'
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{verifyError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Form */}
              <form onSubmit={handleVerifyAccess} style={{ maxWidth: '360px', margin: '0 auto' }}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Access Password:
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon-left">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showAccessPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter access password..."
                      value={accessPassword}
                      onChange={(e) => {
                        setAccessPassword(e.target.value);
                        if (verifyError) setVerifyError('');
                      }}
                      autoFocus
                      required
                      style={{ paddingRight: '38px', height: '40px', fontSize: '0.86rem' }}
                    />
                    <button
                      type="button"
                      className="input-action-right"
                      onClick={() => setShowAccessPassword(!showAccessPassword)}
                      aria-label={showAccessPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showAccessPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '40px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  disabled={verifying}
                >
                  {verifying ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Verifying Secret...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Unlock 31 Accounts
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: UNLOCKED VIEW */}
          {isUnlocked && (
            <div>
              {/* Top Banner & Info */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.08))',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 'var(--radius-sm, 10px)',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Copy login credentials below and enter them manually into the portal sign-in form.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', fontWeight: 700 }}>
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px' }}>
                    1 Admin Account
                  </span>
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px' }}>
                    30 Divisions
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="input-with-icon" style={{ width: '100%' }}>
                  <span className="input-icon-left">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by division, officer name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '0.84rem' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="input-action-right"
                      onClick={() => setSearchQuery('')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Category Group Filter Chips */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none'
                }}>
                  {CATEGORY_GROUPS.map(group => {
                    const isActive = selectedGroup === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroup(group.id)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: isActive ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                          background: isActive ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          color: isActive ? '#38bdf8' : 'var(--text-secondary)'
                        }}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accounts Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
                gap: '12px'
              }}>
                {filteredAccounts.map((acc) => {
                  const isAdmin = acc.role === 'admin';
                  const isExpanded = Boolean(expandedCards[acc.officerId]);

                  return (
                    <div
                      key={acc.officerId}
                      className="demo-account-card"
                      style={{
                        borderRadius: 'var(--radius-md, 12px)',
                        border: isAdmin 
                          ? '1px solid rgba(245, 158, 11, 0.45)' 
                          : '1px solid var(--border-subtle)',
                        background: isAdmin 
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(15, 23, 42, 0.95))' 
                          : 'var(--bg-surface-elevated, rgba(15, 23, 42, 0.75))',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <span style={{
                              fontSize: '0.64rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: isAdmin ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                              color: isAdmin ? '#f59e0b' : 'var(--accent-cyan)',
                              border: isAdmin ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(56, 189, 248, 0.3)'
                            }}>
                              {isAdmin ? 'ADMINISTRATOR' : (acc.code || 'DIVISION')}
                            </span>
                            <span style={{
                              fontSize: '0.64rem',
                              fontWeight: 700,
                              color: 'var(--accent-emerald, #10b981)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              ● {acc.accountStatus || 'Active'}
                            </span>
                          </div>
                          <h4 className="demo-card-title" style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.3
                          }}>
                            {acc.name}
                          </h4>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {acc.officerName?.replace(/\s*\(Demo\)/gi, '')}
                          </div>
                        </div>

                        {acc.description && (
                          <button
                            type="button"
                            onClick={() => toggleCardExpand(acc.officerId)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title={isExpanded ? 'Collapse responsibilities' : 'View responsibilities'}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </div>

                      {/* Expandable Description */}
                      {isExpanded && acc.description && (
                        <div style={{
                          padding: '8px 10px',
                          background: 'rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          borderLeft: isAdmin ? '3px solid #f59e0b' : '3px solid var(--accent-cyan)'
                        }}>
                          <strong>Assigned Operations:</strong> {acc.description}
                          {acc.permissions && (
                            <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Permissions: {acc.permissions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* One-Click Autofill & Login Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectAccount) {
                            onSelectAccount(acc);
                          }
                        }}
                        className="btn btn-primary btn-sm"
                        style={{
                          width: '100%',
                          marginTop: 'auto',
                          padding: '9px 14px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          borderRadius: '8px',
                          background: isAdmin 
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
                            : 'linear-gradient(135deg, #0284c7, #2563eb)',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                        }}
                        title={`Autofill ID and Password to login as ${acc.name}`}
                      >
                        <LogIn size={15} />
                        <span>Autofill & Login</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {filteredAccounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No accounts match your search query.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="demo-modal-footer" style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: '10px'
        }}>
          <div style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            <ShieldCheck size={14} style={{ flexShrink: 0, color: 'var(--accent-cyan, #38bdf8)' }} />
            <span>CivicPulse Security</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '5px 14px',
              fontSize: '0.78rem',
              height: '32px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              borderRadius: '6px'
            }}
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
}
