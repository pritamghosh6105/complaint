import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  Eye, 
  BrainCircuit, 
  Sliders, 
  Info, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Check, 
  Copy,
  ExternalLink
} from 'lucide-react';

export default function AIImageAnalysisCard({ 
  analysis, 
  loading = false, 
  previewUrl = null,
  fusedPriority = null,
  onReanalyze = null,
  onAdoptDescription = null
}) {
  const { isDark } = useTheme();
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [copiedDesc, setCopiedDesc] = useState(false);

  // 1. Loading State
  if (loading) {
    return (
      <div 
        className="glass-card" 
        style={{ 
          padding: '24px', 
          borderRadius: '12px',
          border: '1px solid rgba(14, 165, 233, 0.4)',
          background: isDark ? 'var(--bg-surface-elevated, #1e293b)' : '#ffffff',
          boxShadow: '0 4px 18px rgba(14, 165, 233, 0.08)',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div className="spin-animation">
            <BrainCircuit size={28} color="var(--accent-cyan, #00f0ff)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', fontSize: '1.02rem' }}>
              Gemini Vision AI Analyzing Evidence...
            </div>
            <div style={{ fontSize: '0.80rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              Detecting civic incident, department classification & localizing blue bounding boxes
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  try {
    // 2. Normalize Structured Schema (Section 6 + Legacy Fallbacks)
    const incidentData = analysis.incident || {};
    const detectedIncident = incidentData.detected_incident || 
      analysis.category_prediction?.category || 
      analysis.detected_incident || 
      'Civic Problem Identified';

    const visualDept = incidentData.visual_category || 
      analysis.category_prediction?.department || 
      analysis.predicted_category || 
      'UNKNOWN';

    const visualSubcat = incidentData.visual_subcategory || 
      analysis.category_prediction?.subcategory || 
      analysis.predicted_subcategory || 
      'General';

    const rawConf = incidentData.category_confidence ?? 
      analysis.category_prediction?.confidence ?? 
      analysis.model_confidence ?? 
      0.92;
    const confidencePct = `${Math.round(rawConf * 100)}%`;

    const classificationStatus = incidentData.classification_status || 
      (visualDept !== 'UNKNOWN' && visualDept !== 'INSUFFICIENT_VISUAL_EVIDENCE' ? 'CLASSIFIED' : 'UNCERTAIN');

    // Scene & Evidence
    const sceneData = analysis.scene || {};
    const sceneDescription = sceneData.description || 
      analysis.scene_analysis?.scene_description || 
      analysis.image_overview?.description || 
      'Photographic evidence captured for municipal verification.';

    const sceneType = sceneData.scene_type || 
      analysis.scene_analysis?.scene_type || 
      'Civic Infrastructure';

    const evidenceData = analysis.evidence || {};
    const rawDirectObs = evidenceData.direct_observations || 
      (Array.isArray(analysis.visual_findings) ? analysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : []);
    const directObservations = rawDirectObs.slice(0, 5);

    const possibleInterpretations = evidenceData.possible_interpretations || 
      (Array.isArray(analysis.possible_interpretations) ? analysis.possible_interpretations.map(p => typeof p === 'object' ? p.interpretation : p) : []);

    // Suggested Description
    const suggestedDescription = analysis.suggested_description || 
      `A civic condition regarding ${detectedIncident} is observable in the photographic evidence. Kindly inspect the site and arrange for necessary municipal repair and maintenance.`;

    // Quality & Severity
    const qualityData = analysis.image_quality || {};
    const qualityLevel = (qualityData.level || qualityData.rating || 'GOOD').toUpperCase();
    const blurLevel = (qualityData.blur || 'LOW').toUpperCase();
    const lightingLevel = (qualityData.lighting || 'GOOD').toUpperCase();
    const occlusionLevel = (qualityData.occlusion || 'LOW').toUpperCase();

    const severityData = analysis.visual_severity || {};
    const severityLevel = (severityData.level || 'MEDIUM').toUpperCase();
    const severityReason = severityData.reason || severityData.explanation || 'Severity evaluation based strictly on observable physical indicators.';

    // Review Notice
    const reviewData = analysis.review || {};
    const needsReview = reviewData.human_review_required ?? 
      (analysis.review_status !== 'AUTO_CLEARED' || visualDept === 'UNKNOWN');
    const reviewReasons = reviewData.review_reasons || [];

    // 3. Filter and Validate Bounding Boxes (Incident-Only Focus)
    const rawDetections = Array.isArray(analysis.object_detections) && analysis.object_detections.length > 0
      ? analysis.object_detections
      : (Array.isArray(analysis.visible_objects) ? analysis.visible_objects : []);

    const validBoxes = rawDetections.map(item => {
      if (!item || typeof item !== 'object') return null;

      // Extract box coordinates
      let coords = null;
      if (item.bbox && typeof item.bbox === 'object') {
        const { x_min, y_min, x_max, y_max } = item.bbox;
        coords = [Number(x_min), Number(y_min), Number(x_max), Number(y_max)];
      } else if (Array.isArray(item.box_pct) && item.box_pct.length === 4) {
        coords = item.box_pct.map(Number);
      } else if (Array.isArray(item.box_2d) && item.box_2d.length === 4) {
        const scale = item.box_2d.some(c => Number(c) > 1.0) ? 1000.0 : 1.0;
        const [ymin, xmin, ymax, xmax] = item.box_2d.map(c => Number(c) / scale);
        coords = [xmin, ymin, xmax, ymax];
      }

      if (!coords || coords.some(c => isNaN(c))) return null;

      let [xmin, ymin, xmax, ymax] = coords;
      if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
      if (ymin > ymax) [ymin, ymax] = [ymax, ymin];

      // Enforce valid coordinate boundaries
      xmin = Math.max(0.0, Math.min(1.0, xmin));
      ymin = Math.max(0.0, Math.min(1.0, ymin));
      xmax = Math.max(0.0, Math.min(1.0, xmax));
      ymax = Math.max(0.0, Math.min(1.0, ymax));

      if ((xmax - xmin) < 0.02 || (ymax - ymin) < 0.02) return null;

      const label = item.label || item.display_name || detectedIncident;
      const conf = item.confidence ? Math.round(Number(item.confidence) * 100) : Math.round(rawConf * 100);

      return {
        label,
        conf: `${conf}%`,
        x_min: xmin,
        y_min: ymin,
        x_max: xmax,
        y_max: ymax
      };
    }).filter(Boolean);

    // Visual Palette
    const cardBg = isDark ? '#0f172a' : '#ffffff';
    const subCardBg = isDark ? 'rgba(30, 41, 59, 0.65)' : '#f8fafc';
    const textPrimary = isDark ? '#f8fafc' : '#0f172a';
    const textSecondary = isDark ? '#cbd5e1' : '#334155';
    const textMuted = isDark ? '#94a3b8' : '#64748b';
    const borderSubtle = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';

    const activeImageUrl = previewUrl || analysis.preview_url || analysis.image_url || null;

    const handleCopyOrAdopt = () => {
      if (onAdoptDescription) {
        onAdoptDescription(suggestedDescription);
      }
      navigator.clipboard?.writeText(suggestedDescription);
      setCopiedDesc(true);
      setTimeout(() => setCopiedDesc(false), 2500);
    };

    return (
      <div 
        className="visual-evidence-panel"
        style={{
          borderRadius: '12px',
          border: `1px solid ${borderSubtle}`,
          background: cardBg,
          boxShadow: isDark ? '0 4px 20px -2px rgba(0, 0, 0, 0.45)' : '0 4px 18px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          marginBottom: '20px'
        }}
      >
        {/* Top Gradient Bar */}
        <div style={{
          height: '3px',
          background: 'linear-gradient(90deg, #00f0ff, #0284c7, #10b981)'
        }} />
        


        {/* 1. HEADER */}
        <div className="ai-vision-header" style={{
          borderBottom: `1px solid ${borderSubtle}`
        }}>
          <div className="ai-vision-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Eye size={19} color="#00f0ff" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 className="ai-vision-header-title" style={{
                  margin: 0,
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  color: textPrimary,
                  lineHeight: 1.25,
                  wordBreak: 'break-word'
                }}>
                  Visual AI Image Analysis
                </h4>
                <div style={{
                  fontSize: '0.74rem',
                  color: textMuted,
                  marginTop: '2px',
                  lineHeight: 1.25,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  Objective Vision-Language Evidence Evaluation
                </div>
              </div>
            </div>

            {/* Status Badge - Fixed No Wrap */}
            <span className="ai-vision-status-badge" style={{
              fontSize: '0.70rem',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '5px',
              background: classificationStatus === 'CLASSIFIED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: classificationStatus === 'CLASSIFIED' ? '#10b981' : '#f59e0b',
              border: `1px solid ${classificationStatus === 'CLASSIFIED' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {classificationStatus}
            </span>
          </div>

          {/* Model Badge & Controls Toolbar */}
          <div className="ai-vision-controls-bar" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            width: '100%',
            paddingTop: '8px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)'
          }}>
            <span className="ai-vision-model-pill" style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 9px',
              borderRadius: '6px',
              background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
              color: isDark ? '#38bdf8' : '#0284c7',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #bae6fd',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <BrainCircuit size={12} />
              <span>{analysis.model || 'Gemini 3.5 Flash'}</span>
            </span>

            {validBoxes.length > 0 && (
              <button
                type="button"
                className="ai-vision-ctrl-btn"
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                style={{
                  background: showBoundingBoxes ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  border: `1px solid ${showBoundingBoxes ? '#00f0ff' : borderSubtle}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: showBoundingBoxes ? '#00f0ff' : textSecondary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={13} />
                <span>{showBoundingBoxes ? 'Hide Boxes' : 'Show Boxes'}</span>
              </button>
            )}

            {onReanalyze && (
              <button
                type="button"
                className="ai-vision-ctrl-btn"
                onClick={onReanalyze}
                title="Re-run Gemini Vision Analysis"
                style={{
                  background: 'transparent',
                  border: `1px solid ${borderSubtle}`,
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  color: textSecondary,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap'
                }}
              >
                <RefreshCw size={12} />
                <span>Re-analyze</span>
              </button>
            )}
          </div>
        </div>

        <div className="ai-vision-card-container">
          {/* 2. UPLOADED EVIDENCE & BLUE BOUNDING BOXES */}
          {activeImageUrl && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Uploaded Photographic Evidence
                </span>
                {validBoxes.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#00f0ff', fontWeight: 600 }}>
                    • {validBoxes.length} {validBoxes.length === 1 ? 'incident object localized' : 'incident objects localized'}
                  </span>
                )}
              </div>

              <div style={{
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#090d16',
                border: `1px solid ${borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}>
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  maxWidth: '100%',
                  lineHeight: 0
                }}>
                  <img
                    src={activeImageUrl}
                    alt="Civic evidence"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '380px',
                      display: 'block',
                      borderRadius: '6px',
                      objectFit: 'contain'
                    }}
                  />

                  {/* Standardized Blue Bounding Box Overlays */}
                  {showBoundingBoxes && validBoxes.map((box, idx) => {
                    const leftPct = Math.max(0, Math.min(100, box.x_min * 100));
                    const topPct = Math.max(0, Math.min(100, box.y_min * 100));
                    const widthPct = Math.max(4, Math.min(100 - leftPct, (box.x_max - box.x_min) * 100));
                    const heightPct = Math.max(4, Math.min(100 - topPct, (box.y_max - box.y_min) * 100));

                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          border: '2px solid #00f0ff',
                          background: 'rgba(0, 240, 255, 0.12)',
                          boxShadow: '0 0 14px rgba(0, 240, 255, 0.55), inset 0 0 8px rgba(0, 240, 255, 0.20)',
                          borderRadius: '4px',
                          pointerEvents: 'none',
                          zIndex: 10,
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* High-contrast Pill Label */}
                        <div style={{
                          position: 'absolute',
                          top: topPct > 8 ? '-24px' : '3px',
                          left: '0',
                          maxWidth: 'calc(100% - 4px)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: 'rgba(15, 23, 42, 0.94)',
                          color: '#00f0ff',
                          border: '1px solid #00f0ff',
                          padding: '2px 8px',
                          fontSize: 'clamp(0.62rem, 2vw, 0.72rem)',
                          fontWeight: 700,
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.7)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          lineHeight: 1.2
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#00f0ff',
                            flexShrink: 0
                          }} />
                          <span>{box.label} · {box.conf}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Honest location limitation notice if no boxes could be localized */}
              {validBoxes.length === 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                  border: `1px solid ${borderSubtle}`,
                  fontSize: '0.76rem',
                  color: textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Info size={14} color="#0284c7" />
                  <span>Incident identified, but its exact physical coordinates could not be localized reliably on the image.</span>
                </div>
              )}
            </div>
          )}

          {/* 3. INCIDENT SUMMARY (4-CARD GRID) */}
          <div className="ai-vision-grid-4">
            {/* Detected Incident */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div className="ai-vision-subcard-title" style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Detected Incident
              </div>
              <div className="ai-vision-subcard-value" style={{ fontSize: '0.90rem', fontWeight: 700, color: textPrimary, marginTop: '4px', wordBreak: 'break-word' }}>
                {detectedIncident}
              </div>
            </div>

            {/* Department */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div className="ai-vision-subcard-title" style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Department
              </div>
              <div className="ai-vision-subcard-value" style={{ fontSize: '0.90rem', fontWeight: 700, color: '#0284c7', marginTop: '4px', wordBreak: 'break-word' }}>
                {visualDept}
              </div>
            </div>

            {/* Subcategory */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div className="ai-vision-subcard-title" style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Subcategory
              </div>
              <div className="ai-vision-subcard-value" style={{ fontSize: '0.86rem', fontWeight: 600, color: textSecondary, marginTop: '4px', wordBreak: 'break-word' }}>
                {visualSubcat}
              </div>
            </div>

            {/* AI Confidence Estimate */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div className="ai-vision-subcard-title" style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Confidence
              </div>
              <div className="ai-vision-subcard-value" style={{ fontSize: '0.90rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>
                {confidencePct}
              </div>
            </div>
          </div>

          {/* 4. SCENE DESCRIPTION & DIRECT VISUAL OBSERVATIONS */}
          <div style={{
            background: subCardBg,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            border: `1px solid ${borderSubtle}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--accent-primary, #0284c7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                Scene Description
              </span>
              <div className="ai-vision-scene-type-tag" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                color: textMuted,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '6px',
                border: `1px solid ${borderSubtle}`,
                whiteSpace: 'nowrap'
              }}>
                <span>Scene Type:</span>
                <strong style={{ color: textSecondary }}>{String(sceneType)}</strong>
              </div>
            </div>

            <p className="ai-vision-scene-desc" style={{ margin: '0 0 12px 0', fontSize: '0.88rem', color: textPrimary, lineHeight: 1.5, fontWeight: 500 }}>
              {sceneDescription}
            </p>

            {/* Direct Observations (3-5 Concise Bullets) */}
            {directObservations.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${borderSubtle}` }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                  Direct Visual Observations:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {directObservations.map((obs, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: textSecondary, lineHeight: 1.4 }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. SUGGESTED COMPLAINT PETITION (SECTION 10) */}
          {suggestedDescription && (
            <div style={{
              background: isDark ? 'rgba(2, 132, 199, 0.08)' : '#f0f9ff',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
              border: isDark ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid #bae6fd'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#0284c7" />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Suggested Complaint Description
                  </span>
                </div>
                <button
                  type="button"
                  className="ai-vision-adopt-btn"
                  onClick={handleCopyOrAdopt}
                  style={{
                    background: copiedDesc ? '#10b981' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {copiedDesc ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedDesc ? 'Applied to Form!' : 'Adopt AI Description'}</span>
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: textPrimary, lineHeight: 1.5, fontStyle: 'italic' }}>
                "{suggestedDescription}"
              </p>
            </div>
          )}

          {/* 6. IMAGE QUALITY & VISUAL SEVERITY */}
          <div className="ai-vision-grid-2">
            {/* Image Quality */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="ai-vision-subcard-title" style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase' }}>
                  Image Quality
                </span>
                <span style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: qualityLevel === 'GOOD' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: qualityLevel === 'GOOD' ? '#10b981' : '#f59e0b'
                }}>
                  {qualityLevel}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: textSecondary, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span>Blur: <strong>{blurLevel}</strong></span>
                <span>•</span>
                <span>Lighting: <strong>{lightingLevel}</strong></span>
                <span>•</span>
                <span>Occlusion: <strong>{occlusionLevel}</strong></span>
              </div>
            </div>

            {/* Visual Severity */}
            <div className="ai-vision-subcard" style={{
              background: subCardBg,
              borderRadius: '8px',
              padding: '12px 14px',
              border: `1px solid ${borderSubtle}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.70rem', fontWeight: 700, color: textMuted, textTransform: 'uppercase' }}>
                  Visual Severity
                </span>
                <span style={{
                  fontSize: '0.70rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: severityLevel === 'CRITICAL' || severityLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  color: severityLevel === 'CRITICAL' || severityLevel === 'HIGH' ? '#ef4444' : '#0284c7'
                }}>
                  {severityLevel}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: textSecondary }}>
                {severityReason}
              </div>
            </div>
          </div>

          {/* 7. HUMAN REVIEW WARNING (ONLY WHEN REQUIRED) */}
          {needsReview && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem', color: isDark ? '#fbbf24' : '#b45309', lineHeight: 1.4 }}>
                <strong>Field Inspection Required:</strong> {reviewReasons.length > 0 ? reviewReasons.join('; ') : 'Visual inspection suggests on-site officer review to substantiate conditions.'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error rendering AIImageAnalysisCard:', err);
    return null;
  }
}
