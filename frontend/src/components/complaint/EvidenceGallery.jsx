import React, { useState } from 'react';
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
  Flag
} from 'lucide-react';
import api from '../../services/api';
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
  onConfirmResolution,
  onReopenComplaint,
  userRole = 'citizen',
  isAuthority = false,
  isOwner = false
}) {
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
      setVerificationSuccess(`Successfully recorded decision: ${action}`);
      setShowCorrectionForm(false);
      setTimeout(() => setVerificationSuccess(null), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit officer verification');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Sensitive Evidence Warning Banner (If applicable) */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1.5px solid rgba(14, 165, 233, 0.4)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.82rem',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Lock size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--accent-cyan)' }}>Protected Evidence Protocol:</strong> Sensitive grievance attachments are encrypted and strictly restricted to authorized municipal officers and the registered complainant. Not published to the public.
        </span>
      </div>

      {/* 2. Before & After Resolution Evidence Chain (For Resolved Tickets) */}
      {status === 'Resolved' && primaryBeforeImage && primaryAfterImage && (
        <div className="glass-card" style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.45)',
          background: 'linear-gradient(145deg, rgba(6, 78, 59, 0.25), rgba(15, 23, 42, 0.85))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={22} color="var(--accent-emerald)" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Field Resolution Verification Chain
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            marginBottom: '16px'
          }}>
            {/* Before Photo */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>BEFORE</span>
                <span>Citizen Incident Evidence</span>
              </div>
              <div 
                style={{
                  height: '220px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
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
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              borderLeft: '3px solid var(--accent-emerald)'
            }}>
              <strong style={{ color: '#fff' }}>Field Officer Notes:</strong> {resolutionNotes}
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
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
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
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
              Attached Incident Evidence ({initialEvidence.length} {initialEvidence.length === 1 ? 'file' : 'files'})
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hosted on Cloudinary • CDN Accelerated
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '16px'
          }}>
            {initialEvidence.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setSelectedItem(item)}
                style={{
                  border: activeItem?.id === item.id 
                    ? '2px solid var(--accent-cyan)' 
                    : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: 'rgba(15, 23, 42, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: activeItem?.id === item.id ? 'scale(1.02)' : 'none'
                }}
              >
                <div style={{ height: '120px', background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
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
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.original_filename || `Evidence ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {formatFileSize(item.file_size)} • {item.format?.toUpperCase() || 'JPG'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Evidence Full Detail View */}
          {activeItem && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    {activeItem.original_filename}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Uploaded: {new Date(activeItem.created_at || Date.now()).toLocaleString()} • Size: {formatFileSize(activeItem.file_size)} {activeItem.width ? `• ${activeItem.width}x${activeItem.height}px` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
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

              {/* Large Media Preview */}
              <div style={{
                maxHeight: '380px',
                borderRadius: '6px',
                overflow: 'hidden',
                background: '#0a0f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
                    style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }} 
                  />
                )}
              </div>

              {/* AI Visual Evidence Analysis Card or Scene Description Directive */}
              {activeItem.visual_analysis ? (
                <div style={{ marginTop: '16px' }}>
                  <AIImageAnalysisCard 
                    analysis={activeItem.visual_analysis} 
                    previewUrl={activeItem.secure_url || activeItem.optimized_url || activeItem.url}
                  />
                </div>
              ) : (
                <div style={{ marginTop: '16px' }}>
                  <SceneDescriptionCard 
                    sceneDescription={activeItem.scene_description}
                    sceneType={activeItem.scene_type}
                    directObservations={activeItem.direct_observations}
                    isOfficer={userRole === 'officer' || userRole === 'admin'}
                    compact={false}
                  />
                </div>
              )}

              {/* Phase 13: Officer Human Verification & Feedback Controls */}
              {(userRole === 'officer' || userRole === 'admin') && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={18} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>
                        Officer Human Verification & Correction (Phase 13)
                      </strong>
                    </div>
                    {verificationSuccess && (
                      <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 600 }}>
                        ✓ {verificationSuccess}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleOfficerVerify('CONFIRMED')}
                      disabled={verifying}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#6ee7b7',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={14} /> Confirm AI Classification
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCorrectionForm(!showCorrectionForm)}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        color: '#93c5fd',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit3 size={14} /> {showCorrectionForm ? 'Hide Correction Form' : 'Correct Finding / Category'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOfficerVerify('REJECTED_MISLEADING')}
                      disabled={verifying}
                      className="btn btn-sm"
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#fca5a5',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Flag size={14} /> Flag Misleading / Unrelated
                    </button>
                  </div>

                  {showCorrectionForm && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Corrected Category:
                          </label>
                          <input
                            type="text"
                            value={correctedCategory}
                            onChange={(e) => setCorrectedCategory(e.target.value)}
                            placeholder="e.g. Roads & Public Works"
                            className="form-control"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Corrected Subcategory:
                          </label>
                          <input
                            type="text"
                            value={correctedSubcategory}
                            onChange={(e) => setCorrectedSubcategory(e.target.value)}
                            placeholder="e.g. Pothole / Surface Crater"
                            className="form-control"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            Visual Damage Severity:
                          </label>
                          <select
                            value={correctedDamage}
                            onChange={(e) => setCorrectedDamage(e.target.value)}
                            className="form-control"
                            style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                          >
                            <option value="LOW">LOW</option>
                            <option value="MODERATE">MODERATE</option>
                            <option value="SEVERE">SEVERE</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                          Officer Review Notes / Evidence Justification:
                        </label>
                        <textarea
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="Add administrative review notes and ground verification justification..."
                          rows={2}
                          className="form-control"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '6px 10px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOfficerVerify('CORRECTED')}
                          disabled={verifying}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 16px' }}
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
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No image or video evidence attached to this complaint ticket.
        </div>
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
