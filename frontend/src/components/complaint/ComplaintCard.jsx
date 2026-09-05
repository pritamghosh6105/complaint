import React from 'react';
import { MapPin, BrainCircuit, Clock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function ComplaintCard({ complaint, onClick }) {
  if (!complaint) return null;

  const isCritical = complaint.priority === 'CRITICAL';
  const isResolved = complaint.status === 'Resolved';

  return (
    <Card 
      interactive 
      onClick={onClick}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: isCritical ? '4px solid var(--status-critical)' : isResolved ? '4px solid var(--status-low)' : '1px solid var(--border-subtle)'
      }}
    >
      <div>
        {/* Card Header: Tracking ID & Priority */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: 'var(--accent-cyan)',
              background: 'rgba(6, 182, 212, 0.1)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}>
              #{complaint.tracking_id || `CMP-${complaint.id}`}
            </span>
            {complaint.created_at && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <Badge variant={complaint.priority} pulsing={isCritical}>
            {complaint.priority}
          </Badge>
        </div>

        {/* Title */}
        <h4 style={{ 
          fontSize: '1.05rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          marginBottom: '8px',
          lineHeight: 1.3
        }}>
          {complaint.title || complaint.category}
        </h4>

        {/* Location & Ward */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)',
          marginBottom: '14px'
        }}>
          <MapPin size={14} color="var(--accent-primary)" />
          <span>{complaint.ward || 'Municipal Area'}</span>
          {complaint.location_type && (
            <>
              <span style={{ color: 'var(--border-subtle)' }}>•</span>
              <span>{complaint.location_type} Zone</span>
            </>
          )}
        </div>

        {/* AI Classification & Department Badge */}
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.18)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <BrainCircuit size={13} color="var(--accent-primary)" /> AI Category:
            </span>
            <strong style={{ color: 'var(--text-primary)' }}>{complaint.category}</strong>
          </div>
          {complaint.subcategory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subcategory:</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{complaint.subcategory}</span>
            </div>
          )}
          {complaint.is_crime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px' }}>
              <span>🔒 Protected Law Enforcement Case</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Status & Link */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <Badge variant={complaint.status}>
          {complaint.status}
        </Badge>
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '0.8rem', 
          fontWeight: 600, 
          color: 'var(--accent-primary)' 
        }}>
          Audit Trail <ArrowRight size={14} />
        </span>
      </div>
    </Card>
  );
}
