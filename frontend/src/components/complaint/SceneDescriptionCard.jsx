import React from 'react';
import { CheckCircle2, Eye, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SceneDescriptionCard({
  sceneDescription,
  sceneType,
  directObservations = [],
  evidenceUrl = null,
  isOfficer = false,
  compact = false
}) {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff';
  const borderSubtle = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textSecondary = isDark ? '#cbd5e1' : '#334155';
  const textMuted = isDark ? '#94a3b8' : '#64748b';

  const obsList = Array.isArray(directObservations)
    ? directObservations.map(o => typeof o === 'object' ? (o.observation || o.label || JSON.stringify(o)) : String(o)).filter(Boolean)
    : [];

  const hasDescription = Boolean(sceneDescription && sceneDescription.trim().length > 0 && !sceneDescription.toLowerCase().includes('no visual evidence'));

  if (!hasDescription) {
    return (
      <div
        className="scene-description-card-fallback"
        style={{
          background: isDark ? 'rgba(245, 158, 11, 0.07)' : 'rgba(245, 158, 11, 0.08)',
          border: isDark ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '10px',
          padding: compact ? '10px 14px' : '14px 16px',
          marginTop: '12px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={16} color="#f59e0b" />
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#f59e0b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Officer Visual Identification Required
            </span>
          </div>
          <span style={{
            fontSize: '0.70rem',
            color: '#f59e0b',
            background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: 600,
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            Manual Identification Required
          </span>
        </div>

        <p style={{ margin: 0, fontSize: compact ? '0.82rem' : '0.86rem', color: textSecondary, lineHeight: 1.5 }}>
          Automated Vision AI scene description is not available for this case. As the assigned Field Officer, please inspect the attached photographic evidence directly to identify the on-site condition, hazard severity, and required field action.
        </p>
      </div>
    );
  }

  return (
    <div
      className="scene-description-card"
      style={{
        background: isDark ? 'rgba(15, 23, 42, 0.65)' : '#f8fafc',
        borderRadius: '10px',
        padding: compact ? '12px 14px' : '14px 16px',
        border: `1px solid ${borderSubtle}`,
        marginTop: '12px',
        marginBottom: '12px'
      }}
    >
      {/* 1. Header with SCENE DESCRIPTION & Scene Type */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={15} color="var(--accent-primary, #0284c7)" />
          <span style={{
            fontSize: '0.76rem',
            fontWeight: 800,
            color: 'var(--accent-primary, #0284c7)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Scene Description
          </span>
        </div>

        {sceneType && (
          <div style={{
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
        )}
      </div>

      {/* 2. Main Scene Description Text */}
      <p style={{
        margin: '0 0 12px 0',
        fontSize: compact ? '0.84rem' : '0.88rem',
        color: textPrimary,
        lineHeight: 1.5,
        fontWeight: 500
      }}>
        {sceneDescription}
      </p>

      {/* 3. Direct Visual Observations */}
      {obsList.length > 0 && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${borderSubtle}` }}>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '8px'
          }}>
            Direct Visual Observations:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {obsList.map((obs, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: textSecondary, lineHeight: 1.4 }}>
                <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Official Report Stamp */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: `1px solid ${borderSubtle}`,
        fontSize: '0.70rem',
        color: textMuted
      }}>
        <FileText size={12} color="var(--accent-primary, #0284c7)" />
        <span>Documented in official case report for field officer verification</span>
      </div>
    </div>
  );
}
