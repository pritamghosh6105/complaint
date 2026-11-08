import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldCheck, 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  ChevronDown, 
  LogOut, 
  User, 
  UserCircle,
  AlertTriangle, 
  CheckCircle2, 
  Menu, 
  X,
  Sparkles,
  Building2,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export default function Header({ 
  currentRoute, 
  setCurrentRoute, 
  sidebarCollapsed, 
  setSidebarCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  onGlobalSearch
}) {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onGlobalSearch) {
      onGlobalSearch(searchQuery);
    } else if (searchQuery.trim()) {
      if (user?.role === 'admin') setCurrentRoute('admin-dashboard');
      else if (user?.role === 'officer') setCurrentRoute('officer-dashboard');
      else setCurrentRoute('citizen-dashboard');
    }
  };


  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 clamp(8px, 2.5vw, 20px)',
      transition: 'var(--transition)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(6px, 2vw, 16px)'
      }}>
        {/* Left: Mobile Toggle + Official Government Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.8vw, 12px)', minWidth: 0, flexShrink: 0 }}>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="mobile-only btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              flexShrink: 0
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div 
            onClick={() => setCurrentRoute('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: 0, flexShrink: 0 }}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #0f2747 0%, #2563eb 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0
            }}>
              <ShieldCheck size={19} strokeWidth={2.4} />
            </div>

            <div style={{ minWidth: 0, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <span 
                  className="header-brand-title"
                  style={{ 
                    fontFamily: 'var(--font-heading)', 
                    fontWeight: 800, 
                    fontSize: 'clamp(0.92rem, 3.8vw, 1.05rem)', 
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}
                >
                  CivicPulse<span style={{ color: 'var(--color-accent)' }}>.AI</span>
                </span>
                <span className="gov-badge-desktop" style={{
                  fontSize: '0.6875rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  border: '1px solid rgba(37, 99, 235, 0.25)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  Gov Portal
                </span>
              </div>
              <div className="header-subtitle-desktop" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                Citizen Grievance & Resolution Platform
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar (Desktop) */}
        <form 
          onSubmit={handleSearchSubmit}
          className="desktop-only"
          style={{ flex: 1, maxWidth: '440px', margin: '0 20px' }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search 
              size={15} 
              style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaints, departments, tracking ID..."
              className="form-input"
              style={{
                paddingLeft: '36px',
                paddingRight: '60px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-input)'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '8px',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              pointerEvents: 'none',
              fontFamily: 'var(--font-mono)'
            }}>
              ↵
            </span>
          </div>
        </form>

        {/* Right Actions: Mobile Search + Theme Toggle + Notifications + User Menu */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="mobile-only btn btn-ghost btn-sm"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: showMobileSearch ? 'var(--color-accent)' : 'var(--text-secondary)'
            }}
            title="Search complaints or departments"
            aria-label="Toggle search"
          >
            <Search size={17} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="var(--color-accent)" />}
          </button>

          {/* Notifications Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-ghost btn-sm"
              style={{
                position: 'relative',
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
              title="Notifications & SLA Updates"
              aria-label="Open notifications"
            >
              <Bell size={16} />
              <span style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger)'
              }} />
            </button>

            {showNotifications && (
              <div 
                className="gov-card header-dropdown-menu" 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: 'min(92vw, 360px)',
                  padding: '14px',
                  zIndex: 1010
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '10px'
                }}>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    Civic Updates & Alerts
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                    Live Watchdog
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        PWD Work Order Dispatched
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Station Road surface repair assigned under 24h SLA.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <CheckCircle2 size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Solid Waste Cleared
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Ward 4 market bin emptied and disinfected.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <ShieldCheck size={16} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Police Jurisdiction Synced
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        447 Police Stations active across West Bengal districts.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Profile Menu */}
          {user ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 'clamp(4px, 1.5vw, 6px) clamp(6px, 2vw, 12px)',
                  borderRadius: 'var(--radius-sm)'
                }}
                aria-label="User account options"
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }} className="desktop-only">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.name ? user.name.split(' ')[0] : 'User'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {user.role}
                  </div>
                </div>
                <ChevronDown size={13} color="var(--text-muted)" />
              </button>

              {showUserMenu && (
                <div 
                  className="gov-card header-dropdown-menu" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: 'min(92vw, 270px)',
                    padding: '8px',
                    zIndex: 1010
                  }}
                >
                  <div style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '8px'
                  }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user.email}
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      <span style={{
                        fontSize: '0.6875rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {user.role} Portal
                      </span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        setCurrentRoute('login');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-danger)',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : currentRoute !== 'login' && currentRoute !== 'register' ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentRoute('login')}
                className="btn btn-primary header-signin-btn"
              >
                Sign In
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Search Bar Drawer */}
      {showMobileSearch && (
        <div 
          className="mobile-only"
          style={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '10px 16px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 1005
          }}
        >
          <form onSubmit={(e) => { handleSearchSubmit(e); setShowMobileSearch(false); }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search complaints, tracking ID..."
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '36px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  fontSize: '0.95rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </header>
  );
}
