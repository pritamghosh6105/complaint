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
  PhoneCall,
  Lock,
  ShieldCheck,
  ArrowDownCircle,
  Printer
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Timeline from '../../components/complaint/Timeline';
import FeedbackModal from '../../components/complaint/FeedbackModal';
import EvidenceGallery from '../../components/complaint/EvidenceGallery';
import SceneDescriptionCard from '../../components/complaint/SceneDescriptionCard';
import PrintableCaseDossier from '../../components/complaint/PrintableCaseDossier';
import { useToast } from '../../components/ui/Toast';

export default function ComplaintDetails({ complaintId, setCurrentRoute }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [targetPriority, setTargetPriority] = useState('MEDIUM');
  const [recalibrationReason, setRecalibrationReason] = useState('');
  const [submittingTriage, setSubmittingTriage] = useState(false);

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

  const handleConfirmCriticalDetail = async () => {
    const currentTrackingId = data?.complaint?.tracking_id || complaintId;
    if (!window.confirm(`Confirm active life-safety emergency for #${currentTrackingId}? This locks the rapid 24-hour response SLA.`)) {
      return;
    }
    try {
      setSubmittingTriage(true);
      await api.patch(`/officer/tasks/${complaintId}/triage`, {
        action: 'CONFIRM_CRITICAL',
        reason: 'Officer on-ground verification: active life-safety hazard confirmed. Rapid 24-hour emergency SLA locked.'
      });
      addToast('success', 'Emergency Verified', '24-hour rapid emergency SLA protocol locked.');
      fetchDetails();
    } catch (err) {
      addToast('error', 'Triage Error', err.response?.data?.error || 'Failed to confirm emergency');
    } finally {
      setSubmittingTriage(false);
    }
  };

  const handleRecalibrateDetail = async (e) => {
    e.preventDefault();
    if (!recalibrationReason.trim() || recalibrationReason.trim().length < 5) {
      addToast('warning', 'Reason Required', 'Please provide an official audit reason (at least 5 characters).');
      return;
    }
    try {
      setSubmittingTriage(true);
      await api.patch(`/officer/tasks/${complaintId}/triage`, {
        action: 'RECALIBRATE_NORMAL',
        new_priority: targetPriority,
        reason: recalibrationReason.trim()
      });
      addToast('success', 'Priority Recalibrated', `Priority normalized to ${targetPriority}. SLA reset.`);
      setIsTriageModalOpen(false);
      setRecalibrationReason('');
      fetchDetails();
    } catch (err) {
      addToast('error', 'Recalibration Error', err.response?.data?.error || 'Failed to recalibrate priority');
    } finally {
      setSubmittingTriage(false);
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
        {/* Back Button, Print Dossier & Community Upvote Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={() => {
              if (user?.role === 'officer') setCurrentRoute('officer-dashboard');
              else if (user?.role === 'admin') setCurrentRoute('admin-dashboard');
              else setCurrentRoute('citizen-dashboard');
            }} 
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft size={16} /> {user?.role === 'officer' ? 'Back to Taskforce Queue' : user?.role === 'admin' ? 'Back to Admin Portal' : 'Back to My Complaints'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="btn btn-sm btn-secondary"
              style={{
                borderColor: 'var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600
              }}
              title="Print official case file dossier with all photographic evidence and audit history"
            >
              <Printer size={15} />
              <span>Print Case Dossier</span>
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

          <h1 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.65rem)', color: 'var(--text-primary)', marginBottom: '10px' }}>
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
                  {complaint.impact_score || 50}%
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
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Category:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{complaint.category}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Subcategory:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{complaint.subcategory || 'General'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Assigned Department:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{complaint.department_name || complaint.category}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Field Officer:</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{complaint.officer_name || 'Pending Assignment'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Location / Ward:</span>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{complaint.address || complaint.ward || 'West Bengal'}</div>
            </div>
          </div>
        </div>

        {/* AI Root-Cause Suggestion & Recommended Field Actions Card */}
        {(complaint.root_causes?.length > 0 || complaint.recommended_actions?.length > 0) && (
          <div className="glass-card" style={{ padding: '22px', marginBottom: '24px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <BrainCircuit size={20} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
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

        {/* Emergency Triage & Recalibration Transparency Banner */}
        {complaint.triage_status === 'RECALIBRATED_NORMAL' && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <ShieldCheck size={22} color="#60a5fa" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.94rem', marginBottom: '4px' }}>
                Priority Recalibrated by Assigned Department Officer
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Field Officer <strong>{complaint.triaged_by || 'Assigned Officer'}</strong> inspected this case and determined that it does not present an immediate danger to human life. The priority was recalibrated from Critical to <strong>{complaint.priority} Priority</strong>.
              </div>
              {complaint.triage_reason && (
                <div style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.22)',
                  borderRadius: '6px',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <strong>Official Finding:</strong> {complaint.triage_reason}
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Standard SLA in effect: {complaint.priority === 'HIGH' ? '48-hour' : '72-hour'} resolution window.
              </div>
            </div>
          </div>
        )}

        {complaint.triage_status === 'CONFIRMED_CRITICAL' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}>
            <ShieldAlert size={22} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.94rem', marginBottom: '4px' }}>
                Active Life-Safety Emergency Verified
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Field Officer <strong>{complaint.triaged_by || 'Assigned Officer'}</strong> verified this report as an active safety hazard. Rapid emergency dispatch protocol locked under 24-hour SLA.
              </div>
              {complaint.triage_reason && (
                <div style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(0,0,0,0.22)',
                  borderRadius: '6px',
                  borderLeft: '3px solid #ef4444'
                }}>
                  <strong>Verification Note:</strong> {complaint.triage_reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Officer Emergency Triage Control Panel (Visible to Officers/Admins for Critical Tickets) */}
        {(user?.role === 'officer' || user?.role === 'admin') && (complaint.priority === 'CRITICAL' || complaint.is_emergency === 1) && complaint.status !== 'Resolved' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="#f87171" />
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#f87171', display: 'block' }}>
                  Officer Emergency Triage Controls
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Verify whether on-ground situation is a real emergency or recalibrate to normal queue.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {complaint.triage_status !== 'CONFIRMED_CRITICAL' && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: '#dc2626', borderColor: '#ef4444', fontWeight: 700, fontSize: '0.78rem' }}
                  disabled={submittingTriage}
                  onClick={handleConfirmCriticalDetail}
                >
                  <ShieldAlert size={13} /> {submittingTriage ? 'Confirming...' : '✓ Confirm Critical (24h SLA)'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ borderColor: 'rgba(245, 158, 11, 0.45)', color: '#fbbf24', fontWeight: 600, fontSize: '0.78rem' }}
                onClick={() => {
                  setTargetPriority('MEDIUM');
                  setRecalibrationReason('');
                  setIsTriageModalOpen(true);
                }}
              >
                <ArrowDownCircle size={13} /> Recalibrate to Normal
              </button>
            </div>
          </div>
        )}

        {/* Visual Timeline Stepper */}
        <div className="glass-card" style={{ padding: 'clamp(16px, 3vw, 28px)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '20px' }}>
            Resolution Progress Stepper
          </h3>
          <Timeline history={timeline} currentStatus={complaint.status} />
        </div>

        {/* Photos & Multi-Media Evidence Gallery (Restricted to Complaint Authority & Filing Citizen) */}
        {(() => {
          const isAuthority = user && (user.role === 'officer' || user.role === 'admin');
          const isOwner = user && complaint && (String(complaint.citizen_id) === String(user.id) || complaint.is_owner);
          const canAccessEvidence = isAuthority || isOwner;
          const hasEvidence = complaint.has_evidence || (complaint.evidence && complaint.evidence.length > 0) || Boolean(complaint.image_url) || complaint.evidence_restricted;

          if (!hasEvidence) return null;

          if (!canAccessEvidence) {
            // General Public / Unauthorized View: Evidence is confidential and NEVER displayed
            return (
              <div 
                className="glass-card" 
                style={{
                  padding: '20px 24px',
                  marginBottom: '24px',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px solid rgba(59, 130, 246, 0.35)',
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.18)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)',
                    boxShadow: '0 0 14px rgba(59, 130, 246, 0.25)',
                    flexShrink: 0
                  }}>
                    <Lock size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Evidence Protected — Restricted to Complaint Authority
                      </h4>
                      <span className="badge badge-primary" style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px' }}>
                        CONFIDENTIAL • AUTHORITY ONLY
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      In compliance with citizen privacy protocols, photographic and multimedia evidence submitted with this grievance is strictly confidential and not published to the public. All documentation has been encrypted and delivered exclusively to the designated complaint authority (<strong>{complaint.category || 'Assigned Department'}</strong>) and field resolvers for on-ground verification.
                    </p>

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.78rem',
                      color: '#10b981',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <ShieldCheck size={14} color="#10b981" />
                      <span>Evidence safely received & restricted to authorized complaint resolvers</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Authorized View: Complaint Authority (Officer/Admin) or Complainant Citizen
          return (
            <div style={{ marginBottom: '24px' }}>
              {isOwner && !isAuthority && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: '#10b981'
                }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Your Uploaded Evidence:</strong> This documentation is securely submitted to the complaint authority and hidden from public view to protect your privacy.
                  </span>
                </div>
              )}

              {/* Official Vision AI Scene Description in Case Report */}
              <SceneDescriptionCard 
                sceneDescription={complaint.scene_description || complaint.evidence?.[0]?.scene_description || complaint.evidence?.[0]?.visual_analysis?.scene?.description || complaint.evidence?.[0]?.visual_analysis?.scene_description}
                sceneType={complaint.scene_type || complaint.evidence?.[0]?.scene_type || complaint.evidence?.[0]?.visual_analysis?.scene?.scene_type || complaint.evidence?.[0]?.visual_analysis?.scene_type}
                directObservations={complaint.direct_observations || complaint.evidence?.[0]?.direct_observations || complaint.evidence?.[0]?.visual_analysis?.evidence?.direct_observations || complaint.evidence?.[0]?.visual_analysis?.direct_observations}
                isOfficer={isAuthority}
                compact={false}
              />

              <EvidenceGallery 
                evidence={complaint.evidence || []}
                initialImageUrl={complaint.image_url}
                resolutionImage={complaint.resolution_image_url}
                resolutionNotes={complaint.resolution_notes}
                isCrime={complaint.is_crime || ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(complaint.category)}
                complaintId={complaint.id}
                trackingId={complaint.tracking_id}
                status={complaint.status}
                onConfirmResolution={() => setIsFeedbackOpen(true)}
                onReopenComplaint={() => setIsReopenOpen(true)}
                userRole={user?.role || 'citizen'}
                isAuthority={isAuthority}
                isOwner={isOwner}
              />
            </div>
          );
        })()}

        {/* Citizen Feedback Section (Citizens only - Never for Officers) */}
        {complaint.status === 'Resolved' && user?.role !== 'officer' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
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
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>Reopen Complaint</h3>
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
                      color: 'var(--text-primary)',
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
        {/* Priority Recalibration Modal Overlay */}
        {isTriageModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '24px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  Recalibrate Complaint Priority
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTriageModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecalibrateDetail}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  color: '#f87171'
                }}>
                  Current: <strong>{complaint.priority} Priority (24h Rapid SLA)</strong>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Select Target Priority:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setTargetPriority('MEDIUM')}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: targetPriority === 'MEDIUM' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                        background: targetPriority === 'MEDIUM' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        color: targetPriority === 'MEDIUM' ? '#60a5fa' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.84rem' }}>● Medium Priority</strong>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Standard 72h SLA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetPriority('HIGH')}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: targetPriority === 'HIGH' ? '2px solid #f97316' : '1px solid var(--border-subtle)',
                        background: targetPriority === 'HIGH' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                        color: targetPriority === 'HIGH' ? '#fb923c' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: '0.84rem' }}>● High Priority</strong>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Urgent 48h SLA</span>
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
                    Quick Presets:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      "Visual inspection shows shallow defect (<5cm depth), no live danger to traffic or life.",
                      "Site has active barricades; hazard is safely cordoned off.",
                      "Misclassified as life-safety emergency; routed to regular maintenance workflow."
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRecalibrationReason(preset)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-subtle)',
                          background: 'rgba(255,255,255,0.03)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.74rem',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>
                    Mandatory Audit Reason <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={recalibrationReason}
                    onChange={(e) => setRecalibrationReason(e.target.value)}
                    placeholder="Provide justification for adjusting the priority to normal..."
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setIsTriageModalOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTriage || !recalibrationReason.trim() || recalibrationReason.trim().length < 5}
                    className="btn btn-primary btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {submittingTriage ? 'Recalibrating...' : `Confirm Recalibration to ${targetPriority}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official Printable Case Dossier Modal */}
        {isPrintModalOpen && (
          <PrintableCaseDossier
            complaint={complaint}
            onClose={() => setIsPrintModalOpen(false)}
            isOpen={isPrintModalOpen}
          />
        )}
      </div>
    </div>
  );
}
