import React from 'react';
import { ShieldCheck, Heart, Cpu, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 25, 0.95)',
      padding: '30px 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
            CivicPulse AI — Intelligent Civic Issue Resolution Portal
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Powered by Scikit-Learn NLP, Random Forest Priority Classifier, Geospatial Haversine Engine & SLA Automation.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Cpu size={14} color="var(--accent-cyan)" /> 4 ML Micro-Models Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" /> SLA Multi-Tier Escalation
          </span>
        </div>
      </div>
    </footer>
  );
}
