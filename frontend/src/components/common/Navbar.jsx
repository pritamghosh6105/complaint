import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  ShieldAlert, 
  MapPin, 
  Home,
  FilePlus2, 
  LayoutDashboard, 
  BrainCircuit, 
  Flame, 
  LogOut, 
  LogIn, 
  UserCircle,
  Briefcase,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ currentRoute, setCurrentRoute }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [currentRoute]);

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={15} /> },
    { id: 'departments', label: '30 Departments', icon: <Building2 size={15} /> }
  ];

  if (user && user.role === 'citizen') {
    navItems.push(
      { id: 'new-complaint', label: 'Report Issue', icon: <FilePlus2 size={15} /> },
      { id: 'citizen-dashboard', label: 'My Complaints', icon: <LayoutDashboard size={15} /> }
    );
  }

  if (user && user.role === 'officer') {
    navItems.push(
      { id: 'officer-dashboard', label: 'Taskforce Queue', icon: <Briefcase size={15} /> }
    );
  }

  if (user && user.role === 'admin') {
    navItems.push(
      { id: 'admin-dashboard', label: 'Admin Portal', icon: <LayoutDashboard size={15} /> },
      { id: 'new-complaint', label: 'Report Issue', icon: <FilePlus2 size={15} /> },
      { id: 'gis-heatmap', label: 'GIS Heatmap', icon: <Flame size={15} /> },
      { id: 'ml-inspector', label: 'ML Inspector', icon: <BrainCircuit size={15} /> }
    );
  }

  const dropdownSpring = {
    type: 'spring',
    stiffness: 420,
    damping: 30,
    mass: 0.8
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(24px) saturate(190%)',
      WebkitBackdropFilter: 'blur(24px) saturate(190%)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '10px 0',
      transition: 'var(--transition)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        {/* Brand Logo with Tactile Micro-interaction */}
        <motion.div 
          onClick={() => setCurrentRoute('home')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} color="#fff" />
          </div>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '1.2rem', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              letterSpacing: '-0.03em',
              whiteSpace: 'nowrap'
            }}>
              Civic<span style={{ color: 'var(--accent-cyan)' }}>Pulse</span>{' '}
              <span style={{ 
                fontSize: '0.68rem', 
                padding: '2px 6px', 
                background: 'rgba(6,182,212,0.15)', 
                color: 'var(--accent-cyan)', 
                borderRadius: '6px', 
                border: '1px solid rgba(6,182,212,0.3)', 
                verticalAlign: 'middle',
                fontWeight: 700
              }}>
                AI
              </span>
            </div>
          </div>
        </motion.div>

        {/* Center Nav Items (Desktop only with Apple Pill Design) */}
        <div className="desktop-only" style={{ alignItems: 'center', gap: '6px' }}>
          {navItems.map(item => {
            const isActive = currentRoute === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentRoute(item.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                className="btn btn-sm"
                style={{
                  background: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '0 2px 10px rgba(59, 130, 246, 0.35)' : 'none'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Right Utility: Notifications, Theme Switcher, User Menu & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Light / Dark Mode Toggle */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.92 }}
            className="btn btn-sm btn-secondary"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            style={{ 
              padding: '7px 9px', 
              borderRadius: 'var(--radius-sm)', 
              color: 'var(--text-primary)' 
            }}
          >
            {isDark ? <Sun size={15} color="var(--accent-amber)" /> : <Moon size={15} color="var(--accent-purple)" />}
            <span className="desktop-only" style={{ fontSize: '0.8rem' }}>{isDark ? 'Light' : 'Dark'}</span>
          </motion.button>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              whileTap={{ scale: 0.92 }}
              className="btn btn-sm btn-secondary"
              style={{ padding: '7px 9px', position: 'relative' }}
              title="Civic Notifications"
            >
              <Bell size={15} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: 'var(--status-critical)',
                borderRadius: '50%',
                border: '2px solid var(--bg-main)'
              }} />
            </motion.button>

            {/* Notification Drawer with Apple Spring */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  className="apple-surface"
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={dropdownSpring}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '40px',
                    width: 'min(300px, 85vw)',
                    zIndex: 1100,
                    padding: '14px',
                    borderRadius: 'var(--radius-lg, 14px)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-subtle-hover)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>Civic Updates & SLA Alerts</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Live System</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={15} color="var(--status-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Emergency PWD Dispatch</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Station Road pothole repair initiated under 24h SLA.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <CheckCircle2 size={15} color="var(--status-low)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Waste Bin Cleared</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ward 8 commercial hub resolved by SWM team.</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileTap={{ scale: 0.96 }}
                className="btn btn-sm btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  borderColor: 'var(--border-subtle)' 
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {user.name.charAt(0)}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </motion.button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="apple-surface"
                    initial={{ opacity: 0, scale: 0.94, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={dropdownSpring}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '40px',
                      width: '210px',
                      zIndex: 1100,
                      padding: '12px',
                      borderRadius: 'var(--radius-lg, 14px)',
                      boxShadow: 'var(--shadow-xl)'
                    }}
                  >
                    <div style={{ marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>{user.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        setCurrentRoute('home');
                      }}
                      className="btn btn-sm btn-danger"
                      style={{ width: '100%', fontSize: '0.8rem' }}
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button 
              className="desktop-only btn btn-sm btn-primary"
              whileTap={{ scale: 0.96 }}
              onClick={() => setCurrentRoute('login')}
            >
              <LogIn size={15} /> Sign In
            </motion.button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <motion.button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.92 }}
            className="mobile-only btn btn-sm btn-secondary"
            style={{ padding: '7px 10px' }}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Animated Navigation Drawer with Apple Fluid Transition */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-nav-drawer apple-surface"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{ overflow: 'hidden' }}
          >
            {navItems.map(item => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentRoute(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: isActive ? 700 : 500,
                    width: '100%',
                    justifyContent: 'flex-start'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />

            {/* User Account Section in Mobile Drawer */}
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 600 }}>{user.role}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    setCurrentRoute('home');
                  }}
                  className="btn btn-sm btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCurrentRoute('login');
                }}
              >
                <LogIn size={16} /> Sign In / Register
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
