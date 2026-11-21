import React from 'react';
import { MapPin, BrainCircuit, ArrowRight, Shield, Clock } from 'lucide-react';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';

export default function ComplaintCard({ complaint, onClick }) {
  if (!complaint) return null;

  // Format location display: District ONLY (No police station, municipality, or ward)
  const formatLocation = () => {
    if (complaint.district && complaint.district.trim()) {
      return complaint.district.trim();
    }
    if (complaint.address) {
      const match = complaint.address.match(/(North 24 Parganas|South 24 Parganas|Kolkata|Howrah|Hooghly|Nadia|Murshidabad|Malda|Uttar Dinajpur|Dakshin Dinajpur|Darjeeling|Jalpaiguri|Alipurduar|Cooch Behar|Kalimpong|Purba Bardhaman|Paschim Bardhaman|Birbhum|Bankura|Purulia|Jhargram|Purba Medinipur|Paschim Medinipur)/i);
      if (match) return match[1];
    }
    return 'West Bengal';
  };

  const locationDisplay = formatLocation();

  return (
    <div 
      className="gov-card gov-card-interactive" 
      onClick={onClick}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        boxSizing: 'border-box',
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Card Header: Priority Badge & Date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
            {complaint.created_at && (
              <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <PriorityBadge priority={complaint.priority} />
        </div>

        {/* Issue Title (Normalized 2-line height for uniform grid layout) */}
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          marginBottom: '8px',
          lineHeight: 1.35,
          minHeight: '2.7rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }} title={complaint.title || complaint.category}>
          {complaint.title || complaint.category}
        </h4>

        {/* Location: District ONLY */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '0.8125rem', 
          color: 'var(--text-secondary)',
          marginBottom: '12px'
        }}>
          <MapPin size={14} color="var(--color-accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={locationDisplay}>
            {locationDisplay}
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
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto'
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
