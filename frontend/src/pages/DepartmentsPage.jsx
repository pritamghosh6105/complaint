import React from 'react';
import { useAuth } from '../context/AuthContext';
import DepartmentDirectory from '../components/home/DepartmentDirectory';
import { ArrowLeft, ShieldCheck, Sparkles, Building2, PhoneCall, AlertCircle } from 'lucide-react';

export default function DepartmentsPage({ setCurrentRoute }) {
  const { user } = useAuth();

  const handleSelectDepartment = (dept) => {
    if (user) {
      setCurrentRoute('new-complaint');
    } else {
      setCurrentRoute('login');
    }
  };

  return (
    <div style={{ minHeight: '88vh', padding: '28px 0 60px' }}>
      <div className="container">
        {/* Navigation Breadcrumb Bar */}
        <div className="dept-page-topbar">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentRoute('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '10px',
              fontSize: '0.84rem',
              fontWeight: 700,
              background: 'rgba(30, 41, 59, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowLeft size={15} /> Back to City Map & Heatmap
          </button>

          {/* Quick Notice Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 700
            }}>
              <Building2 size={13} /> 30 Government Portals
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f87171',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 700
            }}>
              <PhoneCall size={13} /> Emergency: Dial 112
            </span>
          </div>
        </div>

        {/* 30 Departments Full Directory */}
        <DepartmentDirectory onSelectDepartment={handleSelectDepartment} />
      </div>
    </div>
  );
}
