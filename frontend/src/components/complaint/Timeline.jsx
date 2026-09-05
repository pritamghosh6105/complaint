import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, Wrench, Sparkles } from 'lucide-react';

const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

export default function Timeline({ history = [], currentStatus = 'Submitted' }) {
  const getStepIndex = (status) => {
    if (status === 'Resolved') return 4;
    if (status === 'In Progress') return 3;
    if (status === 'Assigned') return 2;
    if (status === 'Under Review' || status === 'Verified') return 1;
    return 0;
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Visual Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginBottom: '35px' }}>
        {/* Connecting Progress Line */}
        <div style={{
          position: 'absolute',
          top: '18px',
          left: '30px',
          right: '30px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            width: `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%`,
            transition: 'width 0.4s ease'
          }}></div>
        </div>

        {STATUS_STEPS.map((step, idx) => {
          const isPassed = idx <= activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: isPassed 
                  ? isCurrent ? '#3b82f6' : '#10b981'
                  : 'var(--bg-surface-elevated)',
                border: isCurrent ? '3px solid #60a5fa' : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isCurrent ? '0 0 15px rgba(59, 130, 246, 0.6)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                transition: 'all 0.3s'
              }}>
                {isPassed ? <CheckCircle2 size={18} /> : <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{idx + 1}</span>}
              </div>

              <div style={{
                fontSize: 'clamp(0.65rem, 2.2vw, 0.8rem)',
                fontWeight: isCurrent ? 700 : 500,
                color: isPassed ? '#fff' : 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '70px',
                lineHeight: 1.2
              }}>
                {step}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Audit Trail */}
      <div style={{ marginTop: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
          Detailed Action History & Audit Log:
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.length === 0 ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Initial status registered.</div>
          ) : (
            history.map((item, index) => {
              const isEscalation = (item.notes || '').includes('SLA Violation') || (item.notes || '').includes('Escalated');
              return (
                <div 
                  key={index} 
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: isEscalation ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: isEscalation ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {isEscalation ? (
                      <ShieldAlert size={18} color="var(--status-critical)" />
                    ) : item.status === 'Resolved' ? (
                      <Sparkles size={18} color="var(--accent-emerald)" />
                    ) : (
                      <Clock size={18} color="var(--accent-cyan)" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isEscalation ? '#fca5a5' : '#fff' }}>
                        {item.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {item.notes}
                    </p>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Logged by: <strong>{item.updated_by_name || 'System'}</strong>
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
