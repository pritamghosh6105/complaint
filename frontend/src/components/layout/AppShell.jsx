import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from '../common/Footer';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  FilePlus2, 
  LayoutDashboard, 
  Building2, 
  Briefcase, 
  Flame 
} from 'lucide-react';

export default function AppShell({ 
  currentRoute, 
  setCurrentRoute, 
  children,
  onGlobalSearch
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Define mobile bottom navigation items based on role
  const getBottomNavItems = () => {
    if (!user || user.role === 'citizen') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'new-complaint', label: 'Report', icon: FilePlus2, highlight: true },
        { id: 'citizen-dashboard', label: 'My Issues', icon: LayoutDashboard },
        { id: 'departments', label: 'Depts', icon: Building2 }
      ];
    }
    if (user.role === 'officer') {
      return [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'officer-dashboard', label: 'Queue', icon: Briefcase, highlight: true },
        { id: 'departments', label: 'Depts', icon: Building2 }
      ];
    }
    // Admin
    return [
      { id: 'home', label: 'Home', icon: Home },
      { id: 'admin-dashboard', label: 'Admin', icon: LayoutDashboard, highlight: true },
      { id: 'gis-heatmap', label: 'Heatmap', icon: Flame },
      { id: 'departments', label: 'Depts', icon: Building2 }
    ];
  };

  const bottomNavItems = getBottomNavItems();

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

      {/* Main Workspace with Sticky Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Collapsible Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

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

      {/* Mobile Sticky Bottom Navigation Bar */}
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
          zIndex: 990,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
        aria-label="Mobile Navigation Bar"
      >
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentRoute(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                flex: 1,
                height: '100%',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--color-accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={item.highlight ? 22 : 19} strokeWidth={isActive ? 2.4 : 1.8} />
                {item.highlight && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-accent)'
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '0.6875rem',
                fontWeight: isActive ? 700 : 500,
                lineHeight: 1
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
