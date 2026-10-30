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
  FilePlus2,
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
  const { user, logout, quickDemoLogin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const handleDemoSwitch = async (role) => {
    setShowUserMenu(false);
    await quickDemoLogin(role);
    if (role === 'admin') setCurrentRoute('admin-dashboard');
    else if (role === 'officer') setCurrentRoute('officer-dashboard');
    else setCurrentRoute('citizen-dashboard');
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
      padding: '0 20px',
      transition: 'var(--transition)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        {/* Left: Mobile Toggle + Official Government Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="mobile-only btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            aria-label="Toggle navigation menu"
          >
            {mobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div 
            onClick={() => setCurrentRoute('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
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
              <ShieldCheck size={20} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  fontFamily: 'var(--font-heading)', 
                  fontWeight: 800, 
                  fontSize: '1.05rem', 
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em'
                }}>
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
                  textTransform: 'uppercase'
                }}>
                  Gov Portal
                </span>
              </div>
              <div className="header-subtitle-desktop" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>
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

        {/* Right Actions: Theme Toggle + Notifications + User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="var(--color-accent)" />}
          </button>

          {/* Notifications Bell */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn btn-ghost btn-sm"
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)'
              }}
              title="Notifications & SLA Updates"
              aria-label="Open notifications"
            >
              <Bell size={17} />
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
                className="gov-card" 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: 'min(90vw, 360px)',
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
                  gap: '8px',
                  padding: '5px 12px',
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
                  className="gov-card" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '260px',
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

                  {/* Quick Persona Switcher for Evaluation */}
                  <div style={{ padding: '4px 8px 8px' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      1-Click Switch Persona:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <button
                        onClick={() => handleDemoSwitch('citizen')}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: user.role === 'citizen' ? 'var(--bg-surface-elevated)' : 'transparent',
                          border: 'none',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        👤 Resident Citizen
                      </button>
                      <button
                        onClick={() => handleDemoSwitch('officer')}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: user.role === 'officer' ? 'var(--bg-surface-elevated)' : 'transparent',
                          border: 'none',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        👷 Field Officer (PWD)
                      </button>
                      <button
                        onClick={() => handleDemoSwitch('admin')}
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-xs)',
                          background: user.role === 'admin' ? 'var(--bg-surface-elevated)' : 'transparent',
                          border: 'none',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        🏛 Municipal Admin
                      </button>
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setCurrentRoute('login')}
                className="btn btn-secondary btn-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => setCurrentRoute('new-complaint')}
                className="btn btn-primary btn-sm desktop-only"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FilePlus2 size={14} /> Report Issue
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
