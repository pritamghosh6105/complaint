import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Building, 
  Clock, 
  AlertTriangle, 
  Star, 
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  RotateCcw,
  Activity,
  BrainCircuit,
  FileCheck,
  PhoneCall
} from 'lucide-react';
import api from '../../services/api';
import Timeline from '../../components/complaint/Timeline';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import { useToast } from '../../components/ui/Toast';

export default function ComplaintDetails({ complaintId, setCurrentRoute }) {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);
  const [upvoting, setUpvoting] = useState(false);

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/complaints/${complaintId}`);
      setData(res.data);
    } catch (err) {
      console.error('Fetch complaint details error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaintId) {
      fetchDetails();
    }
  }, [complaintId]);

  const handleUpvote = async () => {
    try {
      setUpvoting(true);
      const res = await api.post(`/complaints/${complaintId}/upvote`);
      addToast('success', 'Endorsement Recorded', `You supported this complaint. Impact score is now ${res.data.impact_score}/100.`);
      fetchDetails();
    } catch (err) {
      addToast('info', 'Endorsement Status', err.response?.data?.error || 'Failed to record endorsement.');
    } finally {
      setUpvoting(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      addToast('warning', 'Reason Required', 'Please provide a reason why this issue is not resolved.');
      return;
    }
    try {
      setReopening(true);
      await api.post(`/complaints/${complaintId}/reopen`, { reason: reopenReason });
      addToast('success', 'Complaint Reopened', 'The complaint has been reopened and escalated for departmental re-inspection.');
      setIsReopenOpen(false);
      setReopenReason('');
      fetchDetails();
    } catch (err) {
      addToast('error', 'Reopen Error', err.response?.data?.error || 'Failed to reopen complaint.');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          Loading complaint tracking details...
        </div>
      </div>
    );
  }

  if (!data || !data.complaint) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h3>Complaint Not Found</h3>
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setCurrentRoute('home')}>
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const { complaint, timeline, feedback } = data;

  const getPriorityBadgeClass = (priority) => {
    if (priority === 'CRITICAL') return 'badge-critical';
    if (priority === 'HIGH') return 'badge-high';
    if (priority === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Resolved') return 'badge-resolved';
    if (status === 'In Progress') return 'badge-inprogress';
    if (status === 'Assigned' || status === 'Verified') return 'badge-assigned';
    return 'badge-submitted';
  };

  return (
    <div className="page-wrapper">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Back Button & Community Upvote Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={() => setCurrentRoute('citizen-dashboard')} 
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={16} /> Back to My Complaints
          </button>

          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className="btn btn-sm btn-secondary"
            style={{
              borderColor: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ThumbsUp size={15} color="var(--accent-cyan)" />
            <span>Support This Issue (<strong>{complaint.upvote_count || 0}</strong> Endorsements)</span>
          </button>
        </div>

        {/* Main Header Card */}
        <div className="glass-card" style={{ padding: 'clamp(16px, 3vw, 28px)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                #{complaint.tracking_id}
              </span>
              <span className={`badge ${getPriorityBadgeClass(complaint.priority)}`}>
                {complaint.priority} PRIORITY
              </span>
              <span className={`badge badge-status ${getStatusBadgeClass(complaint.status)}`}>
                {complaint.status}
              </span>
              {complaint.is_escalated === 1 && (
                <span className="badge badge-critical">
                  <ShieldAlert size={12} /> Escalated Level {complaint.escalation_level}
                </span>
              )}
              {complaint.reopen_count > 0 && (
                <span className="badge badge-warning" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15' }}>
                  <RotateCcw size={12} /> Reopened ({complaint.reopen_count}x)
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={14} /> Reported: {new Date(complaint.created_at).toLocaleString()}
            </div>
          </div>

          <h1 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.65rem)', color: '#fff', marginBottom: '10px' }}>
            {complaint.title}
          </h1>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
            {complaint.description}
          </p>

          {/* Citizen Impact Score Strip */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={20} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Citizen Impact Score
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {complaint.impact_score || 50} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/ 100</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', marginLeft: '8px' }}>
                    ({complaint.impact_label || 'Moderate Public Impact'})
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              👥 <strong>{complaint.affected_count || 10}+</strong> Residents Impacted • <strong>{complaint.upvote_count || 0}</strong> Endorsements
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Category:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>{complaint.category}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Subcategory:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{complaint.subcategory || 'General'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Department:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>{complaint.department_name || complaint.category}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Field Officer:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{complaint.officer_name || 'Pending Assignment'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Location / Ward:</span>
              <div style={{ fontWeight: 700, color: '#fff' }}>{complaint.address || complaint.ward || 'West Bengal'}</div>
            </div>
          </div>
        </div>

        {/* AI Root-Cause Suggestion & Recommended Field Actions Card */}
        {(complaint.root_causes?.length > 0 || complaint.recommended_actions?.length > 0) && (
          <div className="glass-card" style={{ padding: '22px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BrainCircuit size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                AI Root-Cause & Recommended Actions
              </h3>
            </div>

            <div className="grid-cols-2" style={{ gap: '16px' }}>
              {complaint.root_causes?.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>
                    Probable Underlying Causes:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {complaint.root_causes.map((rc, idx) => (
                      <li key={idx}>{rc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {complaint.recommended_actions?.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#10b981', display: 'block', marginBottom: '8px' }}>
                    Recommended Field Actions:
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {complaint.recommended_actions.map((ra, idx) => (
                      <li key={idx}>{ra}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual Timeline Stepper */}
        <div className="glass-card" style={{ padding: 'clamp(16px, 3vw, 28px)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px' }}>
            Resolution Progress Stepper
          </h3>
          <Timeline history={timeline} currentStatus={complaint.status} />
        </div>

        {/* Photos (Before & After Resolution) */}
        {(complaint.image_url || complaint.resolution_image_url) && (
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>
              Photo Verification
            </h3>
            <div className="grid-cols-2">
              {complaint.image_url && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Citizen Incident Photo (Before):
                  </div>
                  <img 
                    src={complaint.image_url} 
                    alt="Citizen Upload" 
                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                  />
                </div>
              )}

              {complaint.resolution_image_url && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '8px' }}>
                    Officer Resolution Proof (After):
                  </div>
                  <img 
                    src={complaint.resolution_image_url} 
                    alt="Resolution Proof" 
                    style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                  />
                  {complaint.resolution_notes && (
                    <div style={{ marginTop: '8px', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <strong>Officer Notes:</strong> {complaint.resolution_notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Citizen Feedback Section */}
        {complaint.status === 'Resolved' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '4px' }}>
                  Citizen Quality Review
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {feedback ? 'Your review was submitted and recorded in municipal analytics.' : 'This complaint is resolved. Please share your satisfaction rating.'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {!feedback ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsFeedbackOpen(true)}
                  >
                    <Star size={16} /> Rate Resolution Service
                  </button>
                ) : (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', color: '#fbbf24', fontWeight: 800 }}>
                      {'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)}
                    </div>
                    {feedback.comment && (
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                        "{feedback.comment}"
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsReopenOpen(true)}
                  className="btn btn-secondary"
                  style={{ borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
                >
                  <RotateCcw size={15} /> Issue Not Resolved? Reopen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          complaint={complaint}
          onFeedbackSubmitted={fetchDetails}
        />

        {/* Complaint Reopen Modal */}
        {isReopenOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '26px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Reopen Complaint</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ticket #{complaint.tracking_id}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                If the problem was not adequately solved on-site, provide details. This will automatically return the complaint to <strong>In Progress</strong> and escalate it to priority <strong>HIGH</strong>.
              </p>

              <form onSubmit={handleReopen}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Reason for Reopening <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="e.g. The pothole was only filled with loose sand and washed away, or drain remains choked..."
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setIsReopenOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reopening}
                    className="btn btn-danger btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {reopening ? 'Reopening...' : 'Confirm Reopen Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
