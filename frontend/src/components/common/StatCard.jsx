import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', badge }) {
  const colorMap = {
    blue: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' },
    red: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
    purple: { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', text: '#a78bfa' },
    cyan: { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', text: '#22d3ee' }
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            {title}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {Icon && (
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.text
          }}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {badge && (
        <div style={{ marginTop: '12px' }}>
          {badge}
        </div>
      )}
    </div>
  );
}
