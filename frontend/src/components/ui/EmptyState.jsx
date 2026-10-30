import React from 'react';
import { Inbox, FilePlus2 } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no active items to display under this view.',
  actionLabel,
  onAction,
  actionIcon = <FilePlus2 size={16} />,
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
        ...style
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--color-accent-subtle)',
        color: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '6px'
      }}>
        <Icon size={28} strokeWidth={1.8} />
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        {title}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.5 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <div style={{ marginTop: '8px' }}>
          <Button variant="primary" onClick={onAction} icon={actionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
