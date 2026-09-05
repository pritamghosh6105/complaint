import React, { useState } from 'react';
import { Copy, AlertCircle, ExternalLink, ThumbsUp, Check } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

export default function DuplicateAlert({ duplicateData, onViewExisting }) {
  const { addToast } = useToast();
  const [upvotedIds, setUpvotedIds] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  if (!duplicateData || !duplicateData.is_duplicate) return null;

  const matches = duplicateData.matches || [];

  const handleSupportExisting = async (complaintId) => {
    try {
      setLoadingId(complaintId);
      const res = await api.post(`/complaints/${complaintId}/upvote`);
      setUpvotedIds(prev => [...prev, complaintId]);
      addToast('success', 'Community Endorsement Registered!', `You supported Ticket #${complaintId}. Impact score elevated to ${res.data.impact_score}/100.`);
    } catch (err) {
      if (err.response?.data?.already_upvoted) {
        addToast('info', 'Already Supported', 'You have already endorsed this complaint.');
        setUpvotedIds(prev => [...prev, complaintId]);
      } else {
        addToast('error', 'Endorsement Error', err.response?.data?.error || 'Could not register support.');
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{
      background: 'rgba(234, 179, 8, 0.12)',
      border: '1px solid rgba(234, 179, 8, 0.35)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      margin: '16px 0',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <AlertCircle size={20} color="#facc15" />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fef08a' }}>
          Potential Duplicate Complaint Detected ({duplicateData.max_similarity}% Spatio-Textual Match)
        </h4>
      </div>

      <p style={{ fontSize: '0.825rem', color: '#fef9c3', lineHeight: 1.4, marginBottom: '12px' }}>
        Our AI Geospatial Engine detected that an identical or closely related problem has already been reported nearby.
        Instead of filing a duplicate report, you can <strong>endorse and support</strong> the existing active ticket to increase its priority and impact score!
      </p>

      {matches.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {matches.map((m, idx) => {
            const hasUpvoted = upvotedIds.includes(m.complaint_id);
            const isLoading = loadingId === m.complaint_id;

            return (
              <div 
                key={idx}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <strong style={{ color: '#fff' }}>Ticket #{m.complaint_id}</strong>
                  {m.title && <span style={{ color: '#e2e8f0', marginLeft: '6px' }}>— {m.title}</span>}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                    Distance: ~{m.distance_meters}m | Similarity: {m.combined_similarity}%
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSupportExisting(m.complaint_id)}
                    disabled={hasUpvoted || isLoading}
                    className={`btn btn-sm ${hasUpvoted ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      background: hasUpvoted ? '#10b981' : undefined,
                      borderColor: hasUpvoted ? '#10b981' : undefined
                    }}
                  >
                    {hasUpvoted ? <Check size={13} /> : <ThumbsUp size={13} />}
                    <span>{hasUpvoted ? 'Supported ✓' : '+1 Support Ticket'}</span>
                  </button>

                  {onViewExisting && (
                    <button 
                      type="button"
                      onClick={() => onViewExisting(m.complaint_id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <ExternalLink size={12} /> View Master Ticket
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
