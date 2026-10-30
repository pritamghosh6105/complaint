import React from 'react';
import { MapPin, BrainCircuit, ArrowRight, Shield, Clock } from 'lucide-react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

export default function ComplaintCard({ complaint, onClick }) {
  if (!complaint) return null;

  const trackingCode = complaint.tracking_id || `CP-${complaint.id}`;

  return (
    <div 
      className="gov-card gov-card-interactive" 
      onClick={onClick}
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick();
        }
      }}
    >
      <div>
        {/* Card Header: Tracking ID & Priority Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.78125rem', 
              fontWeight: 700, 
              color: 'var(--color-accent)',
              background: 'var(--color-accent-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(37, 99, 235, 0.2)'
            }}>
              #{trackingCode}
            </span>
            {complaint.created_at && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <PriorityBadge priority={complaint.priority} />
        </div>

        {/* Issue Title */}
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          marginBottom: '8px',
          lineHeight: 1.35
        }}>
          {complaint.title || complaint.category}
        </h4>

        {/* Location & Jurisdiction Details */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '0.8125rem', 
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
          <MapPin size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {complaint.district ? `${complaint.district} • ` : ''}
            {complaint.ward || complaint.police_station || 'Municipal Sector'}
          </span>
        </div>

        {/* AI Categorization Summary */}
        <div style={{ 
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: '14px',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <BrainCircuit size={13} color="var(--color-accent)" /> Department:
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
              {complaint.category}
            </strong>
          </div>
          {complaint.subcategory && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subcategory:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{complaint.subcategory}</span>
            </div>
          )}
          {complaint.is_crime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', color: 'var(--color-info)', marginTop: '4px' }}>
              <Shield size={11} /> Sensitive Jurisdiction Protected
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Status Badge & View Details Link */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <StatusBadge status={complaint.status} />

        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '0.8125rem', 
          fontWeight: 600, 
          color: 'var(--color-accent)' 
        }}>
          View Details <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}
