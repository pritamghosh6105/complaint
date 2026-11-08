import React, { useState } from 'react';
import Header from './Header';
import Footer from '../common/Footer';
import { useAuth } from '../../context/AuthContext';
import { 
  Briefcase, 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  Building2, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  User,
  Sliders,
  AlertTriangle,
  X,
  PhoneCall
} from 'lucide-react';

export default function FieldOfficerLayout({ 
  currentRoute, 
  setCurrentRoute, 
  children,
  onGlobalSearch 
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Field Officer specific navigation - STRICTLY ZERO CITIZEN REPORTING BUTTONS
  const officerNavItems = [
    { id: 'officer-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'departments', label: '30 Departments', icon: Building2 }
  ];

  // Mobile Bottom Navigation - STRICTLY FOR FIELD OFFICERS
  const mobileNavItems = [
    { id: 'officer-dashboard', label: 'Dashboard', icon: LayoutDashboard, highlight: currentRoute === 'officer-dashboard' },
    { id: 'departments', label: 'Departments', icon: Building2 }
  ];

  const handleNavClick = (id) => {
    setCurrentRoute(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Top Application Header */}
      <Header
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        onGlobalSearch={onGlobalSearch}
      />

      {/* Main Field Officer Workspace */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Mobile Backdrop */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="sidebar-mobile-backdrop mobile-only"
          />
        )}

        {/* Dedicated Field Officer Sidebar */}
        <aside
          className={mobileSidebarOpen ? 'sidebar-mobile-drawer open' : 'sidebar-desktop'}
          style={{
            width: sidebarCollapsed ? '68px' : '250px',
            minWidth: sidebarCollapsed ? '68px' : '250px',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'sticky',
            top: '64px',
            height: 'calc(100vh - 64px)',
            zIndex: 999
          }}
        >
          <div>
            {/* Officer Portal Identity Header */}
            <div style={{
              padding: sidebarCollapsed ? '16px 8px' : '16px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              {!sidebarCollapsed ? (
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    marginBottom: '4px'
                  }}>
                    <ShieldAlert size={11} />
                    Field Officer Portal
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.department_name || 'Operational Taskforce'}
                  </div>
                </div>
              ) : (
                <div style={{ margin: '0 auto', color: '#38bdf8' }} title="Field Officer Portal">
                  <ShieldAlert size={20} />
                </div>
              )}

              {/* Desktop Collapse Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="desktop-only btn-ghost"
                style={{
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="mobile-only btn-ghost"
                style={{
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Officer Navigation Links */}
            <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {officerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                      background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: isActive ? '#38bdf8' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s'
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <Icon size={17} style={{ flexShrink: 0, color: isActive ? '#38bdf8' : 'currentColor' }} />
                      {!sidebarCollapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38bdf8'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Officer Profile & SLA Banner at bottom */}
          {!sidebarCollapsed && (
            <div style={{
              padding: '14px 16px',
              margin: '8px',
              borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Clock size={13} color="#0284c7" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  Operational Mode
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Logged in as Field Officer. Citizen reporting disabled.
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main 
          className="app-main-content"
          style={{ 
            flex: 1, 
            minWidth: 0,
            display: 'flex', 
            flexDirection: 'column'
          }}
        >
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (OFFICER ONLY - ZERO REPORT BUTTON) */}
      <nav 
        className="mobile-only mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
          padding: '0 8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
        aria-label="Field officer mobile navigation"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--nav-item-active, #38bdf8)' : 'var(--text-muted)',
                cursor: 'pointer',
                flex: 1,
                padding: '6px 0',
                minWidth: 0
              }}
            >
              <Icon size={19} color={isActive ? 'var(--nav-item-active, #38bdf8)' : undefined} />
              <span style={{ 
                fontSize: '0.68rem', 
                fontWeight: isActive ? 700 : 500, 
                whiteSpace: 'nowrap',
                color: isActive ? 'var(--nav-item-active, #38bdf8)' : 'var(--text-muted)'
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

