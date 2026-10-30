import React from 'react';

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  children,
  footer,
  className = '',
  style = {},
  contentStyle = {}
}) {
  return (
    <div className={`gov-card ${className}`} style={{ overflow: 'hidden', ...style }}>
      {(title || Icon || action) && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {Icon && (
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={18} strokeWidth={2} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                {badge && <span>{badge}</span>}
              </div>
              {subtitle && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div style={{ padding: '20px', ...contentStyle }}>
        {children}
      </div>

      {footer && (
        <div style={{
          padding: '12px 20px',
          background: 'var(--bg-surface-elevated)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export default SectionCard;
