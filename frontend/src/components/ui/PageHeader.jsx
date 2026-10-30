import React from 'react';

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  className = '',
  style = {}
}) {
  return (
    <div 
      className={`page-header ${className}`} 
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px',
        ...style
      }}
    >
      <div>
        {breadcrumbs && (
          <nav aria-label="Breadcrumb" style={{ marginBottom: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {breadcrumbs}
          </nav>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h1>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: 0, maxWidth: '680px', lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
