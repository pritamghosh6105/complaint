import React from 'react';
import { ShieldCheck, Cpu, Building2, PhoneCall, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
      padding: '28px 0',
      marginTop: 'auto',
      transition: 'var(--transition)'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="var(--color-accent)" />
            CivicPulse AI — Smart Citizen Complaint & Issue Management Platform
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '640px' }}>
            Automated multi-tier SLA escalation, TF-IDF n-grams + Logistic Regression classification, Haversine GIS duplicate detection, and verified police jurisdiction mapping.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="var(--color-info)" /> 4 ML Micro-Models Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--color-success)" /> SLA Watchdog Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} color="var(--color-warning)" /> 256-Bit Encrypted Audit
          </span>
        </div>
      </div>
    </footer>
  );
}
