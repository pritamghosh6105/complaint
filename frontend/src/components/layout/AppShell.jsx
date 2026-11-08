import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CitizenLayout from './CitizenLayout';
import FieldOfficerLayout from './FieldOfficerLayout';
import AdministratorLayout from './AdministratorLayout';
import { ShieldCheck } from 'lucide-react';

export default function AppShell({ 
  currentRoute, 
  setCurrentRoute, 
  children,
  onGlobalSearch
}) {
  const { user, loading } = useAuth();

  // Show official role-verification loading state during JWT session recovery
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        padding: '20px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #0284c7, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 25px rgba(2, 132, 199, 0.45)',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={32} color="#ffffff" className="animate-pulse" />
        </div>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          letterSpacing: '-0.3px'
        }}>
          CivicPulse AI • West Bengal
        </div>
        <div style={{
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px' }} />
          Verifying security credentials & department role...
        </div>
      </div>
    );
  }

  // 1. Dedicated Field Officer Workspace
  if (user && user.role === 'officer') {
    return (
      <FieldOfficerLayout
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onGlobalSearch={onGlobalSearch}
      >
        {children}
      </FieldOfficerLayout>
    );
  }

  // 2. Dedicated Administrator Command Center
  if (user && user.role === 'admin') {
    return (
      <AdministratorLayout
        currentRoute={currentRoute}
        setCurrentRoute={setCurrentRoute}
        onGlobalSearch={onGlobalSearch}
      >
        {children}
      </AdministratorLayout>
    );
  }

  // 3. Citizen Portal & Public Guest Experience
  return (
    <CitizenLayout
      currentRoute={currentRoute}
      setCurrentRoute={setCurrentRoute}
      onGlobalSearch={onGlobalSearch}
    >
      {children}
    </CitizenLayout>
  );
}
