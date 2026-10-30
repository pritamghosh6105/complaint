import React from 'react';

export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', className = '', style = {} }) {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton({ count = 1 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="gov-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <Skeleton width="120px" height="18px" />
            <Skeleton width="70px" height="18px" />
          </div>
          <Skeleton width="75%" height="22px" style={{ marginBottom: '10px' }} />
          <Skeleton width="95%" height="16px" style={{ marginBottom: '6px' }} />
          <Skeleton width="60%" height="16px" style={{ marginBottom: '18px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width="140px" height="16px" />
            <Skeleton width="90px" height="32px" borderRadius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="gov-card" style={{ padding: '20px', overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <Skeleton width="220px" height="36px" />
        <Skeleton width="140px" height="36px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} height="16px" width="80%" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} height="18px" width={c === 0 ? '60%' : '85%'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MapSkeleton({ height = '450px' }) {
  return (
    <div className="gov-card" style={{ height, position: 'relative', overflow: 'hidden' }}>
      <div className="skeleton" style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'var(--bg-surface)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <Skeleton width="160px" height="18px" />
        <Skeleton width="220px" height="14px" />
      </div>
    </div>
  );
}

export function AISkeleton() {
  return (
    <div className="gov-card" style={{ padding: '18px', border: '1px dashed var(--color-accent)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <Skeleton width="28px" height="28px" borderRadius="var(--radius-sm)" />
        <div>
          <Skeleton width="180px" height="16px" style={{ marginBottom: '4px' }} />
          <Skeleton width="130px" height="12px" />
        </div>
      </div>
      <Skeleton width="90%" height="14px" style={{ marginBottom: '6px' }} />
      <Skeleton width="70%" height="14px" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ marginBottom: '28px' }}>
          <Skeleton width="280px" height="34px" style={{ marginBottom: '8px' }} />
          <Skeleton width="420px" height="16px" />
        </div>
        <div className="grid-cols-4" style={{ marginBottom: '28px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gov-card" style={{ padding: '20px' }}>
              <Skeleton width="100px" height="14px" style={{ marginBottom: '10px' }} />
              <Skeleton width="60px" height="32px" style={{ marginBottom: '8px' }} />
              <Skeleton width="120px" height="12px" />
            </div>
          ))}
        </div>
        <CardSkeleton count={3} />
      </div>
    </div>
  );
}

export default Skeleton;
