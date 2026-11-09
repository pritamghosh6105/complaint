import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Calendar, 
  PhoneCall, 
  FileText, 
  BrainCircuit,
  Eye,
  Check,
  RefreshCw,
  Download
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import wbGovtLogo from '../../assets/wb-govt-logo.png';

export default function PrintableCaseDossier({ complaint, onClose, isOpen = true }) {
  const { user } = useAuth();
  const [fullData, setFullData] = useState(null);
  const [loading, setLoading] = useState(true);

  // If passed complaint already has full timeline and evidence, use it; otherwise fetch fresh
  useEffect(() => {
    let isMounted = true;
    if (!complaint?.id && !complaint?.tracking_id) return;

    const targetId = complaint.id || complaint.tracking_id;
    api.get(`/complaints/${targetId}`)
      .then(res => {
        if (isMounted && res.data) {
          setFullData(res.data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch full dossier data, using provided task props:', err);
        // Fallback to complaint object passed in props
        if (isMounted) {
          setFullData({
            complaint,
            timeline: complaint.timeline || [],
            feedback: complaint.feedback || null,
            evidence: complaint.evidence || []
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [complaint]);

  if (!isOpen) return null;

  const comp = fullData?.complaint || complaint || {};
  const timeline = fullData?.timeline || comp.timeline || [];
  const feedback = fullData?.feedback || comp.feedback || null;
  const rawEvidence = (fullData?.evidence && fullData.evidence.length > 0)
    ? fullData.evidence
    : (comp.evidence && comp.evidence.length > 0)
      ? comp.evidence
      : (comp.image_url ? [{ secure_url: comp.image_url, evidence_type: 'initial', original_filename: 'Citizen Photographic Evidence' }] : []);

  const initialEvidence = rawEvidence.filter(e => e.evidence_type !== 'resolution');
  const resolutionEvidence = rawEvidence.filter(e => e.evidence_type === 'resolution');
  const primaryBefore = initialEvidence[0]?.secure_url || initialEvidence[0]?.optimized_url || comp.image_url;
  const primaryAfter = resolutionEvidence[0]?.secure_url || resolutionEvidence[0]?.optimized_url || comp.resolution_image_url;

  // Dynamic Department Name Resolution
  const rawDept = comp.department_name || comp.category || user?.department_name || 'Civic Services';
  const formattedDeptName = rawDept.toLowerCase().startsWith('department of')
    ? rawDept.toUpperCase()
    : `DEPARTMENT OF ${rawDept.toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  const printDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'long',
    timeStyle: 'medium'
  });

  return (
    <div 
      className="dossier-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Dossier Preview Container */}
      <div 
        className="dossier-modal-window"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '94vh',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '12px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Top Control Bar (Screen Only - Hidden during Print) */}
        <div 
          className="no-print" 
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #3b82f6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#38bdf8" />
            <div>
              <strong style={{ fontSize: '0.96rem' }}>Official Case Dossier Preview</strong>
              <div style={{ fontSize: '0.74rem', opacity: 0.8 }}>
                Formatted for Government Archive, Field Handover & Legal Audits
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Printer size={16} /> Print Full Case File / Save PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Close Preview"
            >
              <X size={16} /> Close
            </button>
          </div>
        </div>

        {/* Printable Official Case Dossier Document */}
        <div 
          className="printable-case-dossier" 
          style={{ 
            padding: '36px 42px', 
            background: '#ffffff', 
            color: '#0f172a',
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
            lineHeight: 1.45
          }}
        >
          {/* Header: Government Seal & Official Title Strip */}
          <div style={{
            borderBottom: '3px double #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img 
                  src={wbGovtLogo} 
                  alt="Government of West Bengal" 
                  style={{
                    height: '84px',
                    width: 'auto',
                    objectFit: 'contain',
                    background: 'transparent'
                  }} 
                />
              </div>

              <div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#0369a1' }}>
                  GOVERNMENT OF WEST BENGAL • {formattedDeptName}
                </div>
                <h1 style={{ margin: '3px 0 2px', fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  {rawDept.toUpperCase()} — CASE DOSSIER
                </h1>
                <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                  Official Incident Record & Photographic Evidence Docket • #{comp.tracking_id || comp.id}
                </div>
              </div>
            </div>

            {/* Tracking ID & Barcode Area */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontWeight: 800,
                fontSize: '0.98rem',
                display: 'inline-block'
              }}>
                #{comp.tracking_id || comp.id}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                Printed: {printDate}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', marginTop: '2px' }}>
                OFFICIAL AUDIT DOCKET
              </div>
            </div>
          </div>

          {/* Section 1: Grievance Identification & Classification */}
          <div className="dossier-section" style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#f1f5f9',
              borderLeft: '4px solid #0284c7',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: '#0f172a',
              marginBottom: '10px'
            }}>
              1. GRIEVANCE IDENTIFICATION & ADMINISTRATIVE ROUTING
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', background: '#f8fafc', fontWeight: 700 }}>Tracking ID:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>#{comp.tracking_id}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', background: '#f8fafc', fontWeight: 700 }}>Current Status:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', fontWeight: 700 }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: comp.status === 'Resolved' ? '#dcfce7' : comp.status === 'In Progress' ? '#e0f2fe' : '#fef3c7',
                      color: comp.status === 'Resolved' ? '#166534' : comp.status === 'In Progress' ? '#075985' : '#854d0e',
                      border: '1px solid currentColor'
                    }}>
                      {comp.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Target Department:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 700 }}>{rawDept}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Category / Subcategory:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{comp.category} {comp.subcategory ? `— ${comp.subcategory}` : ''}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Priority Level:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 800, color: comp.priority === 'CRITICAL' ? '#b91c1c' : comp.priority === 'HIGH' ? '#c2410c' : '#0369a1' }}>
                    {comp.priority} PRIORITY
                  </td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Response SLA Window:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 600 }}>
                    {comp.priority === 'CRITICAL' ? '24 Hours (Rapid Emergency)' : comp.priority === 'HIGH' ? '48 Hours (Urgent)' : '72 Hours (Standard)'}
                    {comp.sla_deadline ? ` • Deadline: ${new Date(comp.sla_deadline).toLocaleDateString()}` : ''}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Filing Date & Time:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{new Date(comp.created_at || Date.now()).toLocaleString()}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Assigned Field Officer:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{comp.officer_name || 'Unassigned Taskforce'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Complainant Details & Geo-Location Verification */}
          <div className="dossier-section" style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#f1f5f9',
              borderLeft: '4px solid #0284c7',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: '#0f172a',
              marginBottom: '10px'
            }}>
              2. COMPLAINANT STATEMENT & GROUND JURISDICTION
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '12px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', background: '#f8fafc', fontWeight: 700 }}>Citizen Name:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%' }}>{comp.citizen_name || 'Anonymous Citizen'}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%', background: '#f8fafc', fontWeight: 700 }}>Contact Phone:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '25%' }}>{comp.citizen_phone || 'Protected Contact'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Physical Site Location:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }} colSpan={3}>
                    <strong>{comp.address || 'Kolkata, West Bengal'}</strong> {comp.ward ? `(Ward: ${comp.ward})` : ''} {comp.district ? `• District: ${comp.district}` : ''}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>Nearest Police Station:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{comp.police_station || comp.location?.policeStation || 'Local Thana Jurisdiction'}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700 }}>GPS Coordinates:</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                    {comp.latitude && comp.longitude ? `${comp.latitude}, ${comp.longitude}` : 'Geo-Tagged on Mobile App'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Citizen Statement Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Incident Subject & Full Citizen Description:
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                {comp.title}
              </div>
              <div style={{ fontSize: '0.86rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                {comp.description}
              </div>
            </div>
          </div>

          {/* Section 3: Cross-Department Transfer Provenance (If transferred) */}
          {(comp.is_transferred || comp.transferred_from_dept_id) && (
            <div className="dossier-section" style={{ marginBottom: '20px' }}>
              <div style={{
                background: '#f5f3ff',
                borderLeft: '4px solid #7c3aed',
                padding: '6px 12px',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                color: '#5b21b6',
                marginBottom: '10px'
              }}>
                3. CROSS-DEPARTMENT ROUTING & TRANSFER PROVENANCE
              </div>

              <div style={{
                background: '#faf5ff',
                border: '1px solid #ddd6fe',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <strong>Origin Department: {comp.transferred_from_dept_name || 'Initial Routing'} ➔ Reassigned To: {comp.category || comp.department_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#6b21a8' }}>
                    Transferred on: {comp.transferred_at ? new Date(comp.transferred_at).toLocaleString() : 'Recorded in Audit'}
                  </span>
                </div>
                <div style={{ color: '#4c1d95', marginBottom: '4px' }}>
                  <strong>Official Officer Justification:</strong> {comp.transfer_reason || 'Reassigned to competent department by field officer inspection.'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b21a8' }}>
                  Authorizing Officer: <strong>{comp.transferred_by_officer_name || 'Municipal Field Officer'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: AI Multimodal Scene Intelligence */}
          <div className="dossier-section" style={{ marginBottom: '20px' }}>
            <div style={{
              background: '#f1f5f9',
              borderLeft: '4px solid #0284c7',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: '#0f172a',
              marginBottom: '10px'
            }}>
              4. VISION AI EVIDENCE INTERPRETATION & SCENE RECONSTRUCTION
            </div>

            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '12px 14px',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0369a1' }}>
                  Vision-Language Model Scene Analysis:
                </span>
                <span style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                  Scene Type: <strong>{comp.scene_type || comp.evidence?.[0]?.scene_type || 'Public roadway and infrastructure'}</strong>
                </span>
              </div>

              <div style={{ fontSize: '0.86rem', color: '#1e293b', marginBottom: '10px', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{comp.scene_description || comp.evidence?.[0]?.scene_description || 'Visual evidence indicates on-site civic hazard requiring direct municipal department remediation.'}"
              </div>

              {/* Direct Observations Checklist */}
              {Array.isArray(comp.direct_observations) && comp.direct_observations.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Direct Visual Evidence Observations:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#334155' }}>
                    {comp.direct_observations.map((obs, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{obs}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Attached Photographic Evidence Docket */}
          <div className="dossier-section" style={{ marginBottom: '24px' }}>
            <div style={{
              background: '#f1f5f9',
              borderLeft: '4px solid #0284c7',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: '#0f172a',
              marginBottom: '12px'
            }}>
              5. PHOTOGRAPHIC EVIDENCE DOCKET & GROUND PROOF ({initialEvidence.length} Citizen Attachments)
            </div>

            {initialEvidence.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: initialEvidence.length > 1 ? '1fr 1fr' : '1fr',
                gap: '16px'
              }}>
                {initialEvidence.map((ev, idx) => (
                  <div 
                    key={idx}
                    className="dossier-evidence-card"
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '10px',
                      background: '#ffffff',
                      pageBreakInside: 'avoid'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Evidence Item #{idx + 1}: {ev.original_filename || 'Incident Photo'}</span>
                      <span>{ev.file_size ? `${Math.round(ev.file_size / 1024)} KB` : 'Verified Image'}</span>
                    </div>

                    <div style={{
                      height: '240px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      <img 
                        src={ev.secure_url || ev.optimized_url || ev.url} 
                        alt="Evidence" 
                        className="dossier-img"
                        style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain' }} 
                      />
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Asset ID: {ev.cloudinary_public_id || `ev-${ev.id || idx + 1}`} • Timestamp: {ev.created_at ? new Date(ev.created_at).toLocaleString() : 'Filing Time'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.84rem', color: '#64748b', textAlign: 'center' }}>
                No initial photographic files attached to this complaint record.
              </div>
            )}
          </div>

          {/* Section 6: Resolution Verification & Ground Remediation Proof (For Resolved Tickets) */}
          {comp.status === 'Resolved' && (
            <div className="dossier-section" style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
              <div style={{
                background: '#ecfdf5',
                borderLeft: '4px solid #10b981',
                padding: '6px 12px',
                fontWeight: 800,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                color: '#065f46',
                marginBottom: '12px'
              }}>
                6. FIELD REMEDIATION PROOF & COMPLETION AUDIT (BEFORE VS AFTER)
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '14px'
              }}>
                {/* Before Photo */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', marginBottom: '6px' }}>
                    [BEFORE] Citizen Incident Evidence
                  </div>
                  <div style={{ height: '220px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {primaryBefore ? (
                      <img src={primaryBefore} alt="Before" className="dossier-img" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No Before Photo</span>
                    )}
                  </div>
                </div>

                {/* After Photo */}
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#ffffff' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', marginBottom: '6px' }}>
                    [AFTER] Officer Ground Remediation Proof
                  </div>
                  <div style={{ height: '220px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {primaryAfter ? (
                      <img src={primaryAfter} alt="After" className="dossier-img" style={{ maxWidth: '100%', maxHeight: '220px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No After Photo</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Officer Remediation Statement */}
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                  Field Officer Work Completion Statement:
                </div>
                <div style={{ color: '#14532d', marginBottom: '6px' }}>
                  {comp.resolution_notes || 'On-ground remediation successfully completed in accordance with West Bengal Municipal Standards.'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#15803d' }}>
                  Resolved on: {comp.resolved_at ? new Date(comp.resolved_at).toLocaleString() : 'Recorded in Audit'} • Verified by: <strong>{comp.officer_name || 'Field Officer'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Section 7: Chronological Audit Trail & Case Timeline */}
          <div className="dossier-section" style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
            <div style={{
              background: '#f1f5f9',
              borderLeft: '4px solid #0284c7',
              padding: '6px 12px',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              color: '#0f172a',
              marginBottom: '10px'
            }}>
              7. OFFICIAL AUDIT TRAIL & STATUS PROGRESSION
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #cbd5e1', width: '22%' }}>Timestamp</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #cbd5e1', width: '18%' }}>Status Action</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Operational Notes & Directives</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #cbd5e1', width: '20%' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {timeline.length > 0 ? (
                  timeline.map((item, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}>
                        {new Date(item.created_at || item.updated_at || Date.now()).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 700 }}>
                        {item.status}
                      </td>
                      <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>
                        {item.notes || 'Status updated'}
                      </td>
                      <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}>
                        {item.updated_by_name || 'System Engine'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{new Date(comp.created_at || Date.now()).toLocaleString()}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 700 }}>{comp.status}</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>Official grievance registered in Municipal Queue</td>
                    <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>CivicPulse Dispatch Engine</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Section 8: Officer Attestation & Verification Seal Box */}
          <div className="dossier-section" style={{
            border: '1.5px solid #0f172a',
            borderRadius: '6px',
            padding: '16px 20px',
            background: '#ffffff',
            pageBreakInside: 'avoid'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a', marginBottom: '16px', textAlign: 'center', letterSpacing: '0.5px' }}>
              OFFICIAL ATTESTATION & FIELD VERIFICATION SIGNATURES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', alignItems: 'flex-end', paddingTop: '24px' }}>
              {/* Field Officer Signature */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px dashed #0f172a', marginBottom: '6px', height: '24px' }}></div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  {comp.officer_name || 'Assigned Field Officer'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Field Inspector / Investigating Officer
                </div>
              </div>

              {/* Department Head Seal Box */}
              <div style={{
                border: '2px dashed #94a3b8',
                height: '72px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: '4px 8px'
              }}>
                [ {rawDept.toUpperCase()}<br />OFFICIAL STAMP & SEAL ]
              </div>

              {/* Supervising Authority Signature */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px dashed #0f172a', marginBottom: '6px', height: '24px' }}></div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                  Executive Officer / Commissioner
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Municipal Administrative Authority
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.68rem', color: '#64748b', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              Notice: This document contains official government administrative records and verified photographic evidence. Tampering, unauthorized duplication, or disclosure outside authorized municipal jurisdiction is prohibited under the Public Records Act.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

