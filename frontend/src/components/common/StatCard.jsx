import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue', 
  badge,
  trend,
  className = '',
  style = {} 
}) {
  const colorMap = {
    blue: { bg: 'var(--color-accent-subtle)', border: 'rgba(37, 99, 235, 0.25)', text: 'var(--color-accent)' },
    red: { bg: 'var(--color-danger-subtle)', border: 'rgba(220, 38, 38, 0.25)', text: 'var(--color-danger)' },
    emerald: { bg: 'var(--color-success-subtle)', border: 'rgba(22, 163, 74, 0.25)', text: 'var(--color-success)' },
    amber: { bg: 'var(--color-warning-subtle)', border: 'rgba(217, 119, 6, 0.25)', text: 'var(--color-warning)' },
    purple: { bg: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.25)', text: '#a855f7' },
    cyan: { bg: 'var(--color-info-subtle)', border: 'rgba(2, 132, 199, 0.25)', text: 'var(--color-info)' }
  };

  const theme = colorMap[color] || colorMap.blue;

  return (
    <div 
      className={`gov-card ${className}`} 
      style={{ 
        padding: '20px', 
        position: 'relative', 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...style 
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            {title}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {value != null ? value : '—'}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {Icon && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-sm)',
            background: theme.bg,
            border: `1px solid ${theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.text,
            flexShrink: 0
          }}>
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
      </div>

      {(badge || trend) && (
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {badge}
          {trend && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
