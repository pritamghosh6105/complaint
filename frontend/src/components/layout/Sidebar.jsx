import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  LayoutDashboard, 
  FilePlus2, 
  ListFilter, 
  Building2, 
  MapPin, 
  Flame, 
  BrainCircuit, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Info,
  Layers,
  PhoneCall,
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentRoute, 
  setCurrentRoute, 
  collapsed, 
  setCollapsed,
  mobileOpen,
  setMobileOpen 
}) {
  const { user } = useAuth();

  // Role-based navigation definition
  const getNavItems = () => {
    const items = [
      { id: 'home', label: 'Civic Home', icon: Home }
    ];

    if (!user || user.role === 'citizen') {
      items.push(
        { id: 'new-complaint', label: 'Report Issue', icon: FilePlus2, badge: 'AI Assumed' },
        { id: 'citizen-dashboard', label: 'My Complaints', icon: LayoutDashboard }
      );
    }

    if (user && user.role === 'officer') {
      items.push(
        { id: 'officer-dashboard', label: 'Assigned Tasks', icon: Briefcase, badge: 'SLA Watch' }
      );
    }

    if (user && user.role === 'admin') {
      items.push(
        { id: 'admin-dashboard', label: 'Admin Command', icon: LayoutDashboard },
        { id: 'gis-heatmap', label: 'GIS Heatmap', icon: Flame },
        { id: 'ml-inspector', label: 'ML Microservice', icon: BrainCircuit, badge: '4 Models' }
      );
    }

    // Common items
    items.push(
      { id: 'departments', label: '30 Departments', icon: Building2 }
    );

    return items;
  };

  const navItems = getNavItems();

  const handleNavClick = (id) => {
    setCurrentRoute(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="sidebar-mobile-backdrop mobile-only"
        />
      )}

      <aside 
        style={{
          width: collapsed ? '68px' : '240px',
          minWidth: collapsed ? '68px' : '240px',
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
        className={mobileOpen ? 'sidebar-mobile-drawer open' : 'sidebar-desktop'}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="mobile-only" style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)'
        }}>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            CivicPulse Navigation
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px', borderRadius: 'var(--radius-xs)', border: 'none', cursor: 'pointer' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div style={{ padding: '16px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            padding: '4px 10px 10px',
            display: collapsed ? 'none' : 'block'
          }}>
            {user ? `${user.role.toUpperCase()} NAVIGATION` : 'PUBLIC DIRECTORY'}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    width: '100%',
                    padding: collapsed ? '10px 0' : '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span style={{
                      fontSize: '0.6875rem',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      border: '1px solid rgba(37, 99, 235, 0.2)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Collapse Toggle */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Emergency helpline badge */}
          {!collapsed && (
            <div style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-danger-subtle)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: 'var(--color-danger)'
            }}>
              <PhoneCall size={14} style={{ flexShrink: 0 }} />
              <div>
                <strong>Emergency Helpline: 112</strong>
              </div>
            </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="desktop-only"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.78rem',
              gap: '6px'
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={15} /> : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse Navigation</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
