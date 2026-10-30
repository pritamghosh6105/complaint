import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Wrench, 
  Sparkles, 
  BrainCircuit, 
  ShieldCheck, 
  UserCheck, 
  Archive,
  AlertTriangle
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

const FULL_LIFECYCLE_STEPS = [
  { id: 'submitted', label: 'Submitted', icon: Clock },
  { id: 'ai_analyzed', label: 'AI Analyzed', icon: BrainCircuit },
  { id: 'verified', label: 'Verified', icon: ShieldCheck },
  { id: 'assigned', label: 'Assigned', icon: UserCheck },
  { id: 'in_progress', label: 'In Progress', icon: Wrench },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 }
];

export default function Timeline({ history = [], currentStatus = 'Submitted' }) {
  const getStepIndex = (status) => {
    const s = String(status || '').trim().toLowerCase().replace(/[\s-]/g, '_');
    if (s === 'resolved' || s === 'closed') return 5;
    if (s === 'in_progress' || s === 'progress') return 4;
    if (s === 'assigned') return 3;
    if (s === 'verified') return 2;
    if (s === 'ai_analyzed' || s === 'under_review') return 1;
    return 0;
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Visual Stepper */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        position: 'relative', 
        marginBottom: '36px',
        padding: '0 8px'
      }}>
        {/* Connecting Progress Track Line */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '32px',
          right: '32px',
          height: '3px',
          background: 'var(--border-subtle)',
          zIndex: 1
        }}>
          <div style={{
            height: '100%',
            background: 'var(--color-accent)',
            width: `${(activeIndex / (FULL_LIFECYCLE_STEPS.length - 1)) * 100}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>

        {FULL_LIFECYCLE_STEPS.map((step, idx) => {
          const isPassed = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isPassed 
                  ? isCurrent 
                    ? 'var(--color-accent)' 
                    : 'var(--color-success)'
                  : 'var(--bg-surface-elevated)',
                border: isCurrent 
                  ? '3px solid #93c5fd' 
                  : isPassed
                    ? '2px solid var(--color-success)'
                    : '2px solid var(--border-subtle)',
                boxShadow: isCurrent ? '0 0 12px rgba(37, 99, 235, 0.4)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPassed ? '#ffffff' : 'var(--text-muted)',
                transition: 'var(--transition)'
              }}>
                {isPassed && !isCurrent ? (
                  <CheckCircle2 size={16} strokeWidth={2.6} />
                ) : (
                  <StepIcon size={16} strokeWidth={isCurrent ? 2.4 : 1.8} />
                )}
              </div>

              <div style={{
                fontSize: '0.75rem',
                fontWeight: isCurrent ? 700 : 500,
                color: isPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '65px',
                lineHeight: 1.25
              }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Action History & Audit Log */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Action History & SLA Verification Trail:
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {history.length === 0 ? (
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', padding: '12px 16px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
              Ticket submitted and registered in municipal dispatch queue.
            </div>
          ) : (
            history.map((item, index) => {
              const isEscalation = (item.notes || '').includes('SLA Violation') || (item.notes || '').includes('Escalated');

              return (
                <div 
                  key={index} 
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: isEscalation ? 'var(--color-danger-subtle)' : 'var(--bg-surface-elevated)',
                    border: '1px solid',
                    borderColor: isEscalation ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {isEscalation ? (
                      <AlertTriangle size={17} color="var(--color-danger)" />
                    ) : item.status === 'Resolved' ? (
                      <CheckCircle2 size={17} color="var(--color-success)" />
                    ) : (
                      <Clock size={17} color="var(--color-accent)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isEscalation ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {item.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0, lineHeight: 1.4 }}>
                      {item.notes}
                    </p>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Logged by: <strong style={{ color: 'var(--text-secondary)' }}>{item.updated_by_name || 'System Watchdog'}</strong>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
