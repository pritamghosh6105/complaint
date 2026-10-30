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
  RotateCcw
} from 'lucide-react';

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
  userRole = 'citizen'
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* 1. Sensitive Evidence Warning Banner (If applicable) */}
      {isCrime && (
        <div style={{
          background: 'rgba(14, 165, 233, 0.12)',
          border: '1px solid rgba(14, 165, 233, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.82rem',
          color: '#bae6fd'
        }}>
          <Lock size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Protected Evidence Protocol:</strong> Sensitive law enforcement attachments are encrypted and strictly restricted to authorized municipal officers and the registered citizen.
          </span>
        </div>
      )}

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
