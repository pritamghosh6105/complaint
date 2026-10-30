import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Gauge,
  Sun,
  Eye
} from 'lucide-react';

export default function AIImageAnalysisCard({ 
  analysis, 
  loading = false, 
  previewUrl = null,
  fusedPriority = null
}) {
  const { isDark } = useTheme();
  const [showTechnicalMetrics, setShowTechnicalMetrics] = useState(false);

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(14, 165, 233, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div className="spin-animation">
            <BrainCircuit size={22} color="var(--accent-cyan)" />
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Running Computer Vision & Laplacian Quality Pipeline...
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Computing sharpness gradient, perceived luminance matrix, and cross-referencing civic hazards.
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const {
    image_quality = 'GOOD',
    quality_note = '',
    quality_metrics = {},
    detected_issue = 'Civic Infrastructure Feature',
    confidence = 0.9,
    visual_severity = 'MEDIUM',
    visual_risk = 'Standard civic inspection required',
    evidence_consistency = 'MATCH',
    consistency_badge = '✓ MATCH',
    consistency_details = '',
    analysis_status = 'COMPLETED'
  } = analysis;

  const isPoorQuality = image_quality === 'POOR';
  const isMismatch = evidence_consistency === 'POSSIBLE MISMATCH';
  const confidencePercent = `${Math.round(confidence * 100)}%`;

  const getQualityBadgeStyle = (q) => {
    if (q === 'GOOD') return { bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7', border: '#10b981', color: isDark ? '#6ee7b7' : '#15803d', text: '✓ GOOD' };
    if (q === 'ACCEPTABLE') return { bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe', border: '#3b82f6', color: isDark ? '#93c5fd' : '#1d4ed8', text: 'ACCEPTABLE' };
    return { bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2', border: '#ef4444', color: isDark ? '#fca5a5' : '#b91c1c', text: '⚠️ POOR' };
  };

  const getSeverityBadgeClass = (s) => {
    if (s === 'CRITICAL') return 'badge-critical';
    if (s === 'HIGH') return 'badge-high';
    if (s === 'MEDIUM') return 'badge-medium';
    return 'badge-low';
  };

  const qStyle = getQualityBadgeStyle(image_quality);

  return (
    <div 
      className="glass-card" 
      style={{ 
        padding: '20px', 
        borderRadius: 'var(--radius-md)',
        border: isDark ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid rgba(59, 130, 246, 0.3)',
        background: isDark 
          ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.65))' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.35)' : 'var(--shadow-md)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={20} color="var(--accent-cyan)" />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
            🤖 VISUAL AI ANALYSIS
          </h4>
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          Model: {analysis.model_name || 'VisionEngine-v2'}
        </span>
      </div>

      {/* Structured Metric Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
        {/* Row 1: Image Quality */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Image Quality:</span>
          <span style={{
            background: qStyle.bg,
            border: `1px solid ${qStyle.border}`,
            color: qStyle.color,
            padding: '2px 10px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.78rem'
          }}>
            {qStyle.text}
          </span>
        </div>

        {/* Row 2: Detected Issue & Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Detected Issue:</span>
          <span style={{ fontWeight: 700, color: '#fff', textAlign: 'right' }}>
            {detected_issue}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Confidence:</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {confidencePercent}
          </span>
        </div>

        {/* Row 3: Visual Severity & Safety Risk */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Visual Severity:</span>
          <span className={`badge ${getSeverityBadgeClass(visual_severity)}`} style={{ fontSize: '0.75rem' }}>
            {visual_severity}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Safety Risk:</span>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, textAlign: 'right', maxWidth: '65%' }}>
            {visual_risk}
          </span>
        </div>

        {/* Row 4: Evidence Match */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Evidence Match:</span>
          <span style={{
            background: isMismatch ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: isMismatch ? '1px solid #eab308' : '1px solid #10b981',
            color: isMismatch ? '#fde047' : '#6ee7b7',
            padding: '2px 10px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '0.78rem'
          }}>
            {consistency_badge}
          </span>
        </div>

        {/* Mismatch Alert Callout */}
        {isMismatch && (
          <div style={{
            background: isDark ? 'rgba(234, 179, 8, 0.12)' : '#fef9c3',
            border: isDark ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid #facc15',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontSize: '0.78rem',
            color: isDark ? '#fef08a' : '#854d0e',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertTriangle size={16} color={isDark ? '#eab308' : '#ca8a04'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Advisory:</strong> AI detected content that may not directly match the reported description. Ticket forwarded for human officer verification.
            </div>
          </div>
        )}

        {/* Poor Quality Alert Callout */}
        {isPoorQuality && (
          <div style={{
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fca5a5',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '0.76rem',
            color: isDark ? '#fca5a5' : '#b91c1c'
          }}>
            ⚠️ {quality_note || 'Image may be too dark or blurry for reliable AI analysis. Submission is still accepted.'}
          </div>
        )}

        {/* Row 5: AI Recommendation / Multimodal Priority */}
        <div style={{
          marginTop: '6px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)',
          border: isDark ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(14, 165, 233, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: isDark ? 'var(--accent-cyan)' : '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>
              Multimodal Priority Recommendation
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Priority: <span style={{ color: fusedPriority === 'CRITICAL' ? (isDark ? '#ef4444' : '#dc2626') : (fusedPriority === 'HIGH' ? (isDark ? '#f97316' : '#ea580c') : (isDark ? '#3b82f6' : '#2563eb')) }}>
                {fusedPriority || visual_severity}
              </span>
            </div>
          </div>

          <Sparkles size={20} color={isDark ? 'var(--accent-cyan)' : '#0284c7'} />
        </div>
      </div>

      {/* Collapsible Technical CV Metrics (Blur variance, luminance, contrast) */}
      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={() => setShowTechnicalMetrics(!showTechnicalMetrics)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          {showTechnicalMetrics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          <span>{showTechnicalMetrics ? 'Hide Mathematical CV Metrics' : 'View Image Quality Diagnostics (Laplacian / Luminance)'}</span>
        </button>

        {showTechnicalMetrics && quality_metrics && (
          <div style={{
            marginTop: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)'
          }}>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Laplacian Blur:</div>
              <strong style={{ color: '#fff' }}>{quality_metrics.blur_score || 'N/A'}</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Luminance:</div>
              <strong style={{ color: '#fff' }}>{quality_metrics.brightness || 'N/A'} / 255</strong>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>Contrast Std:</div>
              <strong style={{ color: '#fff' }}>{quality_metrics.contrast || 'N/A'}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
