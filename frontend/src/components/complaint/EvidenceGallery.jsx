import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  X, 
  Download, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Film, 
  Sparkles, 
  Clock, 
  ArrowRight,
  Shield,
  Star,
  RotateCcw,
  Edit3,
  Check,
  Flag,
  Zap,
  RefreshCw,
  Building2,
  Send
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Modal from '../common/Modal';
import AIImageAnalysisCard from './AIImageAnalysisCard';
import SceneDescriptionCard from './SceneDescriptionCard';

export default function EvidenceGallery({ 
  evidence = [], 
  initialImageUrl = null,
  resolutionImage = null, 
  resolutionNotes = null,
  isCrime = false,
  complaintId = null,
  trackingId = '',
  status = 'Submitted',
  departmentName = null,
  onConfirmResolution,
  onReopenComplaint,
  onStatusUpdate,
  userRole = 'citizen',
  isAuthority = false,
  isOwner = false
}) {
  const { isDark } = useTheme();

  const [selectedItem, setSelectedItem] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [verifying, setVerifying] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctedCategory, setCorrectedCategory] = useState('');
  const [correctedSubcategory, setCorrectedSubcategory] = useState('');
  const [correctedAuthority, setCorrectedAuthority] = useState('');
  const [correctedDamage, setCorrectedDamage] = useState('MODERATE');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(null);

  // Department Transfer State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [targetCategory, setTargetCategory] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);

  // Dynamic Theme Colors
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
  const elevatedBg = isDark ? 'rgba(15, 23, 42, 0.85)' : '#f8fafc';
  const borderCol = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#334155';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const mediaContainerBg = isDark ? '#0a0f1d' : '#f1f5f9';
  const thumbnailBg = isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff';

  // Group into initial evidence and resolution evidence, supporting legacy single image fallback
  const rawEvidence = (evidence && evidence.length > 0)
    ? evidence
    : (initialImageUrl ? [{
        id: 'legacy-img-1',
        secure_url: initialImageUrl,
        optimized_url: initialImageUrl,
        resource_type: 'image',
        evidence_type: 'initial',
        original_filename: 'Citizen Incident Photo'
      }] : []);

  const initialEvidence = rawEvidence.filter(e => e.evidence_type !== 'resolution');
  const resolutionEvidence = rawEvidence.filter(e => e.evidence_type === 'resolution');
  const primaryBeforeImage = initialEvidence.find(e => e.resource_type === 'image')?.optimized_url || initialEvidence[0]?.secure_url || initialImageUrl || null;
  const primaryAfterImage = resolutionEvidence[0]?.optimized_url || resolutionEvidence[0]?.secure_url || resolutionImage || null;

  const activeItem = selectedItem || initialEvidence[0] || null;

  // Load departments list for transfer workflow
  useEffect(() => {
    let isMounted = true;
    api.get('/officer/departments')
      .then(res => {
        if (isMounted && res.data?.departments?.length) {
          setDepartments(res.data.departments);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDepartments([
            { id: 1, name: 'Traffic & Road Safety' },
            { id: 2, name: 'Roads & Public Works' },
            { id: 3, name: 'Solid Waste Management' },
            { id: 4, name: 'Drainage & Sewerage' },
            { id: 5, name: 'Health & Hospitals' },
            { id: 6, name: 'Fire & Emergency Services' },
            { id: 7, name: 'Police & Law Enforcement' },
            { id: 8, name: 'Power & Electricity' },
            { id: 9, name: 'Water Supply' }
          ]);
        }
      });
    return () => { isMounted = false; };
  }, []);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleOfficerVerify = async (action) => {
    if (!activeItem || !activeItem.id) return;
    try {
      setVerifying(true);
      await api.post(`/evidence/${activeItem.id}/verify`, {
        action,
        corrected_category: correctedCategory || null,
        corrected_subcategory: correctedSubcategory || null,
        corrected_authority: correctedAuthority || null,
        corrected_damage_level: correctedDamage || null,
        notes: verificationNotes || ''
      });
      const actionText = action === 'CONFIRMED' 
        ? 'Evidence verified and accepted as authentic' 
        : action === 'REJECTED_MISLEADING' 
          ? 'Evidence flagged as misleading or unrelated' 
          : 'Corrected classification saved';
      setVerificationSuccess(`✓ ${actionText}`);
      setShowCorrectionForm(false);
      setTimeout(() => setVerificationSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit officer verification');
    } finally {
      setVerifying(false);
    }
  };

  const handleOfficerAcceptAndStartWork = async () => {
    if (!complaintId) return;
    try {
      setVerifying(true);
      // 1. Verify evidence if active
      if (activeItem?.id && activeItem.id !== 'legacy-img-1') {
        try {
          await api.post(`/evidence/${activeItem.id}/verify`, {
            action: 'CONFIRMED',
            notes: 'Field officer verified evidence authenticity upon initiating response work.'
          });
        } catch (_) {}
      }

      // 2. Mark complaint as In Progress
      await api.patch(`/officer/tasks/${complaintId}/status`, {
        status: 'In Progress',
        notes: 'Officer verified photographic evidence and commenced on-ground field remediation.'
      });

      setVerificationSuccess('✓ Evidence Accepted! Complaint status transitioned to In Progress with you assigned.');
      if (onStatusUpdate) onStatusUpdate('In Progress');
      setTimeout(() => setVerificationSuccess(null), 6000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept and start work');
    } finally {
      setVerifying(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!targetDeptId) {
      alert('Please select a target department for cross-department transfer.');
      return;
    }
    if (!transferReason.trim() || transferReason.trim().length < 5) {
      alert('Please state an official transfer justification (minimum 5 characters).');
      return;
    }
    setTransferring(true);
    try {
      const payload = {
        target_department_id: Number(targetDeptId),
        target_category: targetCategory || null,
        reason: transferReason.trim()
      };
      await api.post(`/officer/tasks/${complaintId}/transfer`, payload);
      setTransferSuccess('Complaint successfully transferred to target department!');
      setTimeout(() => {
        setTransferSuccess(null);
        setShowTransferModal(false);
        if (onStatusUpdate) onStatusUpdate('Assigned');
        window.location.reload();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer complaint to target department');
    } finally {
      setTransferring(false);
    }
  };

  const isOfficerOrAdmin = userRole === 'officer' || userRole === 'admin' || userRole === 'police_officer' || userRole === 'cyber_crime_officer' || isAuthority;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Sensitive Evidence Warning Banner */}
      <div style={{
        background: isDark ? 'var(--bg-surface-elevated)' : '#f0f9ff',
        border: isDark ? '1.5px solid rgba(14, 165, 233, 0.4)' : '1.5px solid #bae6fd',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.82rem',
        color: isDark ? 'var(--text-primary)' : '#0369a1',
        boxShadow: isDark ? 'var(--shadow-sm)' : '0 2px 8px rgba(14, 165, 233, 0.08)'
      }}>
        <Lock size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: isDark ? 'var(--accent-cyan)' : '#0284c7' }}>Protected Evidence Protocol:</strong> Sensitive grievance attachments are encrypted and strictly restricted to authorized municipal officers and the registered complainant.
        </span>
      </div>

      {/* 2. Before & After Resolution Evidence Chain (For Resolved Tickets) */}
      {status === 'Resolved' && primaryBeforeImage && primaryAfterImage && (
        <div style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: isDark ? '1px solid rgba(16, 185, 129, 0.45)' : '1.5px solid #a7f3d0',
          background: isDark 
            ? 'linear-gradient(145deg, rgba(6, 78, 59, 0.25), rgba(15, 23, 42, 0.85))' 
            : 'linear-gradient(145deg, #ecfdf5, #f0fdf4)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(16, 185, 129, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={22} color="var(--accent-emerald)" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: textPrimary, fontWeight: 700 }}>
                  Field Resolution Verification Chain
                </h4>
                <span style={{ fontSize: '0.78rem', color: textMuted }}>
                  Cloudinary Verified Comparison (Incident vs Ground Proof)
                </span>
              </div>
            </div>

            <span className="badge badge-resolved" style={{ fontSize: '0.75rem' }}>
              ✓ Proof Verified
            </span>
          </div>

          {/* Before & After Dual Preview Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '18px',
            marginBottom: '16px'
          }}>
            {/* Before Photo */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: textSecondary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>BEFORE</span>
                <span>Citizen Incident Evidence</span>
              </div>
              <div 
                style={{
                  height: '220px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: `1px solid ${borderCol}`,
                  background: mediaContainerBg,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setFullscreenMedia({ url: primaryBeforeImage, type: 'image', label: 'Incident Evidence (Before)' })}
              >
                <img 
                  src={primaryBeforeImage} 
                  alt="Before" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#fff'
                }}>
                  <Maximize2 size={12} /> Fullscreen
                </div>
              </div>
            </div>

            {/* After Photo */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>AFTER</span>
                <span>Officer Resolution Proof</span>
              </div>
              <div 
                style={{
                  height: '220px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: mediaContainerBg,
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setFullscreenMedia({ url: primaryAfterImage, type: 'image', label: 'Officer Ground Proof (After)' })}
              >
                <img 
                  src={primaryAfterImage} 
                  alt="After" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.7rem',
                  color: '#fff'
                }}>
                  <Maximize2 size={12} /> Fullscreen
                </div>
              </div>
            </div>
          </div>

          {/* Officer Field Notes */}
          {resolutionNotes && (
            <div style={{
              background: isDark ? 'rgba(0, 0, 0, 0.3)' : '#f8fafc',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              color: textSecondary,
              marginBottom: '16px',
              borderLeft: '3px solid var(--accent-emerald)'
            }}>
              <strong style={{ color: textPrimary }}>Field Officer Notes:</strong> {resolutionNotes}
            </div>
          )}

          {/* Citizen Confirmation Actions */}
          {userRole === 'citizen' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '12px',
              borderTop: `1px solid ${borderCol}`
            }}>
              <div style={{ fontSize: '0.85rem', color: textSecondary }}>
                Does this photo evidence verify that your issue has been properly resolved on the ground?
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onConfirmResolution}
                  style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', color: '#fff' }}
                >
                  <CheckCircle2 size={16} /> Yes, Issue Resolved
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onReopenComplaint}
                  style={{ borderColor: 'var(--accent-rose)', color: '#fca5a5' }}
                >
                  <RotateCcw size={16} /> Still Not Resolved (Reopen)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Main Multi-Evidence Gallery Grid & Viewer */}
      {initialEvidence.length > 0 ? (
        <div style={{
          padding: '22px',
          background: cardBg,
          border: `1px solid ${borderCol}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.37)' : '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: textPrimary, fontWeight: 700 }}>
              Attached Incident Evidence ({initialEvidence.length} {initialEvidence.length === 1 ? 'file' : 'files'})
            </h4>
            <span style={{ fontSize: '0.75rem', color: textMuted }}>
              Hosted on Cloudinary • CDN Accelerated
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {initialEvidence.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setSelectedItem(item)}
                style={{
                  border: activeItem?.id === item.id 
                    ? '2px solid var(--accent-cyan)' 
                    : `1px solid ${borderCol}`,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: thumbnailBg,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeItem?.id === item.id ? 'scale(1.02)' : 'none',
                  boxShadow: activeItem?.id === item.id ? '0 4px 12px rgba(14, 165, 233, 0.2)' : 'none'
                }}
              >
                <div style={{ height: '120px', background: mediaContainerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.resource_type === 'video' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                      <Film size={32} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>MP4 Video</span>
                    </div>
                  ) : (
                    <img 
                      src={item.thumbnail_url || item.secure_url} 
                      alt={item.original_filename} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  )}

                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    color: '#fff',
                    fontWeight: 700
                  }}>
                    #{idx + 1}
                  </div>
                </div>

                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.original_filename || `Evidence ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: textMuted }}>
                    {formatFileSize(item.file_size)} • {item.format?.toUpperCase() || 'JPG'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Evidence Full Detail View */}
          {activeItem && (
            <div style={{
              background: elevatedBg,
              border: `1px solid ${borderCol}`,
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: textPrimary }}>
                    {activeItem.original_filename}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: textMuted }}>
                    Uploaded: {new Date(activeItem.created_at || Date.now()).toLocaleString()} • Size: {formatFileSize(activeItem.file_size)} {activeItem.width ? `• ${activeItem.width}x${activeItem.height}px` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setFullscreenMedia({
                      url: activeItem.optimized_url || activeItem.secure_url,
                      type: activeItem.resource_type,
                      label: activeItem.original_filename
                    })}
                  >
                    <Maximize2 size={14} /> Fullscreen Zoom
                  </button>

                  <a
                    href={activeItem.secure_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    download
                  >
                    <Download size={14} /> Open Original
                  </a>
                </div>
              </div>

              {/* Large Media Preview Box */}
              <div style={{
                maxHeight: '400px',
                borderRadius: '8px',
                overflow: 'hidden',
                background: mediaContainerBg,
                border: `1px solid ${borderCol}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px'
              }}>
                {activeItem.resource_type === 'video' ? (
                  <video 
                    src={activeItem.secure_url} 
                    controls 
                    style={{ maxWidth: '100%', maxHeight: '380px' }} 
                  />
                ) : (
                  <img 
                    src={activeItem.optimized_url || activeItem.secure_url} 
                    alt={activeItem.original_filename} 
                    style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '4px' }} 
                  />
                )}
              </div>

              {/* AI Visual Evidence Analysis Card or Scene Description Directive */}
              {activeItem.visual_analysis ? (
                <div style={{ marginTop: '14px' }}>
                  <AIImageAnalysisCard 
                    analysis={activeItem.visual_analysis} 
                    previewUrl={activeItem.secure_url || activeItem.optimized_url || activeItem.url}
                  />
                </div>
              ) : (
                <div style={{ marginTop: '14px' }}>
                  <SceneDescriptionCard 
                    sceneDescription={activeItem.scene_description}
                    sceneType={activeItem.scene_type}
                    directObservations={activeItem.direct_observations}
                    isOfficer={isOfficerOrAdmin}
                    compact={false}
                  />
                </div>
              )}

              {/* Officer Verification & Workflow Action Bar */}
              {isOfficerOrAdmin && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1.5px solid #bfdbfe',
                  borderRadius: '10px',
                  boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 16px rgba(59, 130, 246, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--accent-cyan)" />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: isDark ? '#ffffff' : '#1e3a8a' }}>
                          Officer Human Verification & Workflow Action
                        </strong>
                        <div style={{ fontSize: '0.74rem', color: textMuted }}>
                          Verify evidence authenticity, commence field response, or reassign misclassified departments.
                        </div>
                      </div>
                    </div>
                    {verificationSuccess && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: isDark ? '#6ee7b7' : '#047857', 
                        background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
                        border: '1px solid #10b981',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 600 
                      }}>
                        {verificationSuccess}
                      </span>
                    )}
                  </div>

                  {/* Primary Officer Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {/* 1. Accept Evidence */}
                    <button
                      type="button"
                      onClick={() => handleOfficerVerify('CONFIRMED')}
                      disabled={verifying}
                      className="btn btn-sm"
                      style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
                        border: '1px solid #10b981',
                        color: isDark ? '#6ee7b7' : '#065f46',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={15} /> Accept Evidence
                    </button>

                    {/* 2. Accept & Start Work (Only if not already resolved) */}
                    {status !== 'Resolved' && status !== 'In Progress' && (
                      <button
                        type="button"
                        onClick={handleOfficerAcceptAndStartWork}
                        disabled={verifying}
                        className="btn btn-sm"
                        style={{
                          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                          border: '1px solid #059669',
                          color: '#ffffff',
                          padding: '7px 15px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                        }}
                      >
                        <Zap size={15} /> Accept & Start Work
                      </button>
                    )}

                    {/* 3. Transfer Department */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferModal(true);
                        setTargetCategory(departmentName || '');
                      }}
                      className="btn btn-sm"
                      style={{
                        background: isDark ? 'rgba(139, 92, 246, 0.2)' : '#f5f3ff',
                        border: '1px solid #8b5cf6',
                        color: isDark ? '#c4b5fd' : '#6d28d9',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <RefreshCw size={14} /> Transfer Department
                    </button>

                    {/* 4. Correct Finding / Category */}
                    <button
                      type="button"
                      onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                      className="btn btn-sm"
                      style={{
                        background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                        border: '1px solid #3b82f6',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} /> {showCorrectionForm ? 'Hide Correction Form' : 'Correct Finding'}
                    </button>

                    {/* 5. Flag Misleading */}
                    <button
                      type="button"
                      onClick={() => handleOfficerVerify('REJECTED_MISLEADING')}
                      disabled={verifying}
                      className="btn btn-sm"
                      style={{
                        background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fff1f2',
                        border: '1px solid #ef4444',
                        color: isDark ? '#fca5a5' : '#b91c1c',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Flag size={14} /> Flag Misleading
                    </button>
                  </div>

                  {/* Correction Form Expansion */}
                  {showCorrectionForm && (
                    <div style={{
                      marginTop: '12px',
                      padding: '14px',
                      background: isDark ? 'rgba(0,0,0,0.4)' : '#f8fafc',
                      border: `1px solid ${borderCol}`,
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                            Corrected Category:
                          </label>
                          <input
                            type="text"
                            value={correctedCategory}
                            onChange={(e) => setCorrectedCategory(e.target.value)}
                            placeholder="e.g. Traffic & Road Safety"
                            className="form-control"
                            style={{ 
                              width: '100%', 
                              fontSize: '0.82rem', 
                              padding: '7px 10px',
                              background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                              color: textPrimary,
                              border: `1px solid ${borderCol}`
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                            Corrected Subcategory:
                          </label>
                          <input
                            type="text"
                            value={correctedSubcategory}
                            onChange={(e) => setCorrectedSubcategory(e.target.value)}
                            placeholder="e.g. Road Traffic Accident / Collision"
                            className="form-control"
                            style={{ 
                              width: '100%', 
                              fontSize: '0.82rem', 
                              padding: '7px 10px',
                              background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                              color: textPrimary,
                              border: `1px solid ${borderCol}`
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                            Visual Damage Severity:
                          </label>
                          <select
                            value={correctedDamage}
                            onChange={(e) => setCorrectedDamage(e.target.value)}
                            className="form-control"
                            style={{ 
                              width: '100%', 
                              fontSize: '0.82rem', 
                              padding: '7px 10px',
                              background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                              color: textPrimary,
                              border: `1px solid ${borderCol}`
                            }}
                          >
                            <option value="LOW">LOW</option>
                            <option value="MODERATE">MODERATE</option>
                            <option value="SEVERE">SEVERE</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                          Officer Review Notes / Evidence Justification:
                        </label>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Add administrative review notes and ground verification justification..."
                          rows={2}
                          className="form-control"
                          style={{ 
                            width: '100%', 
                            fontSize: '0.82rem', 
                            padding: '7px 10px',
                            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
                            color: textPrimary,
                            border: `1px solid ${borderCol}`
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleOfficerVerify('CORRECTED')}
                          disabled={verifying}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '7px 18px', fontWeight: 700 }}
                        >
                          {verifying ? 'Submitting Review...' : 'Submit Corrected Classification'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          color: textMuted, 
          background: cardBg, 
          border: `1px solid ${borderCol}`,
          borderRadius: 'var(--radius-md)' 
        }}>
          No image or video evidence attached to this complaint ticket.
        </div>
      )}

      {/* Cross-Department Transfer Modal */}
      {showTransferModal && (
        <Modal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title={`Transfer Complaint #${trackingId || complaintId} to Another Department`}
        >
          <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {transferSuccess && (
              <div style={{ 
                background: '#ecfdf5', 
                border: '1px solid #10b981', 
                color: '#065f46', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontWeight: 600,
                fontSize: '0.86rem'
              }}>
                ✓ {transferSuccess}
              </div>
            )}

            <div style={{
              background: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff',
              border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid #ddd6fe',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '0.84rem',
              color: isDark ? '#e9d5ff' : '#5b21b6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '4px' }}>
                <Building2 size={16} /> Cross-Department Incident Transfer Protocol
              </div>
              <div>
                When AI misclassifies a complaint (e.g. Highway accident routed to Solid Waste), any municipal officer can re-route the case to the competent department. The receiving department taskforce will be notified immediately.
              </div>
            </div>

            {/* Target Department Selection */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '6px' }}>
                Target Department <span style={{ color: '#ef4444' }}>*</span>:
              </label>
              <select
                value={targetDeptId}
                onChange={(e) => {
                  setTargetDeptId(e.target.value);
                  const selectedDept = departments.find(d => String(d.id) === e.target.value);
                  if (selectedDept) setTargetCategory(selectedDept.name);
                }}
                required
                className="form-control"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${borderCol}`,
                  background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                  color: textPrimary,
                  fontSize: '0.88rem'
                }}
              >
                <option value="">-- Choose Competent Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Transfer Reasons */}
            <div>
              <label style={{ fontSize: '0.78rem', color: textMuted, display: 'block', marginBottom: '6px' }}>
                Quick Preset Transfer Justifications:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  "Incident is an accident on National/State Highway — routing to Traffic & Road Safety / PWD",
                  "Misclassified as solid waste; site inspection confirms open drainage overflow — routing to Drainage & Sewerage",
                  "Active water pipeline rupture causing roadway flooding — routing to Water Supply Department",
                  "Fallen electric pole / high-voltage spark hazard — routing to Power & Electricity",
                  "Public hospital premises sanitation issue — routing to Health & Hospitals Department"
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTransferReason(preset)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${borderCol}`,
                      background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                      color: textSecondary,
                      fontSize: '0.76rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Audit Justification */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: textPrimary, display: 'block', marginBottom: '6px' }}>
                Official Transfer Justification <span style={{ color: '#ef4444' }}>*</span>:
              </label>
              <textarea
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="State the technical reason why this incident belongs to the selected department..."
                rows={3}
                required
                className="form-control"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: `1.5px solid ${borderCol}`,
                  background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                  color: textPrimary,
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTransferModal(false)}
                disabled={transferring}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: '#7c3aed',
                  borderColor: '#8b5cf6',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700
                }}
                disabled={transferring || !targetDeptId || !transferReason.trim()}
              >
                <Send size={15} />
                {transferring ? 'Transferring...' : 'Transfer Complaint'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Fullscreen Zoom Modal */}
      {fullscreenMedia && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.92)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10
          }}>
            <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600 }}>
              {fullscreenMedia.label}
            </span>
            <button
              type="button"
              onClick={() => setFullscreenMedia(null)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {fullscreenMedia.type === 'video' ? (
              <video 
                src={fullscreenMedia.url} 
                controls 
                autoPlay 
                style={{ maxWidth: '90vw', maxHeight: '85vh' }} 
              />
            ) : (
              <img 
                src={fullscreenMedia.url} 
                alt="Fullscreen View" 
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
