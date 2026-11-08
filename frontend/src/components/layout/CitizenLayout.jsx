import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from '../common/Footer';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, 
  FilePlus2, 
  LayoutDashboard, 
  Building2 
} from 'lucide-react';

export default function CitizenLayout({ 
  currentRoute, 
  setCurrentRoute, 
  children,
  onGlobalSearch 
}) {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Citizen Navigation (includes Report)
  const citizenBottomNavItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'new-complaint', label: 'Report', icon: FilePlus2, highlight: true },
    { id: 'citizen-dashboard', label: 'My Issues', icon: LayoutDashboard },
    { id: 'departments', label: 'Depts', icon: Building2 }
  ];

  const handleNavClick = (id) => {
    if (!user && (id === 'new-complaint' || id === 'citizen-dashboard')) {
      setCurrentRoute('login');
      return;
    }
    setCurrentRoute(id);
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

      {/* Main Workspace with Citizen Sidebar */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Sidebar
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

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

      {/* Mobile Sticky Bottom Navigation Bar (Citizen) */}
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
        aria-label="Citizen mobile navigation"
      >
        {citizenBottomNavItems.map((item) => {
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
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={item.highlight ? 22 : 19} color={isActive ? (item.highlight ? '#10b981' : 'var(--nav-item-active, #38bdf8)') : undefined} />
                {item.highlight && !isActive && (
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                )}
              </div>
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

