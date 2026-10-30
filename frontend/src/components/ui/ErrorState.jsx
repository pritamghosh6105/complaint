import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this information. Please verify your connection or try again.',
  onRetry,
  retryLabel = 'Try Again',
  style = {}
}) {
  return (
    <div 
      className="gov-card" 
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        borderColor: 'var(--color-danger-subtle)',
        ...style
      }}
      role="alert"
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--color-danger-subtle)',
        color: 'var(--color-danger)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '6px'
      }}>
        <AlertTriangle size={28} strokeWidth={2} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      {onRetry && (
        <div style={{ marginTop: '8px' }}>
          <Button variant="secondary" onClick={onRetry} icon={<RefreshCw size={15} />}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;
