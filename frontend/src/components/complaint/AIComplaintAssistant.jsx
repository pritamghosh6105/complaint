import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Check, 
  RotateCcw,
  Edit3,
  HelpCircle,
  FileText,
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function AIComplaintAssistant({ 
  isOpen, 
  onClose, 
  onApplyGeneratedComplaint,
  initialIssue = '',
  initialLocation = ''
}) {
  const { theme, isDark } = useTheme();
  const [view, setView] = useState('compose'); // 'compose' | 'clarify' | 'generating' | 'review'
  const [issueText, setIssueText] = useState(initialIssue || '');
  const [isHazardous, setIsHazardous] = useState(false);
  const [hazardDetails, setHazardDetails] = useState('');
  const [inputError, setInputError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Clarification state (Stage 1)
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [structuredIncident, setStructuredIncident] = useState(null);

  // Review & Edit state
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [editableDescription, setEditableDescription] = useState('');

  // AI Provider & Key
  const aiProvider = localStorage.getItem('civicpulse_ai_provider') || 'groq';
  const apiKey = localStorage.getItem('civicpulse_ai_key') || '';

  useEffect(() => {
    if (isOpen) {
      if (initialIssue && !issueText) setIssueText(initialIssue);
      setView('compose');
      setInputError('');
      setClarificationQuestions([]);
      setClarificationAnswers({});
    }
  }, [isOpen, initialIssue]);

  const handleClose = () => {
    setView('compose');
    setInputError('');
    onClose();
  };

  // Step 1: Analyze incident & formulate clarification if vague
  const handleAnalyzeAndProceed = async () => {
    if (!issueText.trim()) {
      setInputError('Please describe the civic problem in a few words.');
      return;
    }

    setInputError('');
    setIsAnalyzing(true);

    try {
      const res = await api.post('/ai/understand-incident', {
        issue: issueText.trim(),
        location: initialLocation || '',
        clientApiKey: apiKey.trim() || undefined,
        clientProvider: aiProvider
      });

      if (res.data && res.data.is_vague && Array.isArray(res.data.clarification_questions) && res.data.clarification_questions.length > 0) {
        setStructuredIncident(res.data.structured_incident);
        setClarificationQuestions(res.data.clarification_questions);
        const initialAns = {};
        res.data.clarification_questions.forEach(q => { initialAns[q] = ''; });
        setClarificationAnswers(initialAns);
        setView('clarify');
      } else {
        // Detailed enough -> proceed directly to draft synthesis
        if (res.data?.structured_incident) {
          setStructuredIncident(res.data.structured_incident);
        }
        await handleGenerate({});
      }
    } catch (err) {
      console.warn('Incident analysis fallback:', err);
      // If endpoint fails, check simple word count locally
      const words = issueText.trim().split(/\s+/);
      if (words.length < 6) {
        const fallbackQs = [
          'Where exactly is the damaged site located (street, landmark, or ward)?',
          'What specific damage or issue is visible (e.g. potholes, cracks, or collapsed section)?',
          'Is there an immediate safety danger to vehicles or pedestrians?'
        ];
        setClarificationQuestions(fallbackQs);
        const initialAns = {};
        fallbackQs.forEach(q => { initialAns[q] = ''; });
        setClarificationAnswers(initialAns);
        setView('clarify');
      } else {
        await handleGenerate({});
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate draft description with clarifications
  const handleGenerate = async (answersToUse = clarificationAnswers) => {
    setView('generating');

    try {
      const res = await api.post('/ai/draft-complaint', {
        issue: issueText.trim(),
        location: initialLocation || '',
        isHazardous: isHazardous ? 'Yes' : 'No',
        hazardDetails: hazardDetails.trim(),
        clarificationAnswers: answersToUse,
        clientApiKey: apiKey.trim() || undefined,
        clientProvider: aiProvider
      });

      if (res.data && res.data.title && res.data.description) {
        setGeneratedDraft(res.data);
        setEditableTitle(res.data.title);
        setEditableDescription(res.data.description);
        setView('review');
      } else {
        throw new Error('Invalid AI response structure');
      }
    } catch (err) {
      console.warn('Real AI generation failed, using intelligent grounded fallback:', err);
      const cleanIssue = issueText.trim();
      const isCrit = isHazardous || /fire|shock|spark|blackout|danger|urgent|12 hours|voltage|collapse/i.test(cleanIssue + ' ' + hazardDetails);

      const draftTitle = isCrit
        ? `Urgent Safety Intervention Required: ${cleanIssue.slice(0, 50)}`
        : `Civic Grievance: ${cleanIssue.slice(0, 50)}`;

      const detailLines = [];
      detailLines.push(`A civic problem has been reported regarding: ${cleanIssue}.`);
      if (initialLocation) {
        detailLines.push(`Reported Location: ${initialLocation}.`);
      }
      Object.entries(answersToUse).forEach(([q, ans]) => {
        if (ans && ans.trim()) detailLines.push(`${q}: ${ans.trim()}`);
      });
      if (isHazardous && hazardDetails) {
        detailLines.push(`Safety Consideration: ${hazardDetails}.`);
      }
      detailLines.push(`The concerned authority is requested to inspect the location and arrange necessary remedial repairs.`);

      const fallbackDesc = detailLines.join(' ');
      const fallbackObj = {
        success: true,
        source: 'CivicPulse Neural Synthesis Engine',
        title: draftTitle,
        description: fallbackDesc,
        department: /power|electric|light|wire|outage/i.test(cleanIssue) ? 'Electricity & Power' : 'Roads & Public Works',
        priority: isCrit ? 'CRITICAL' : 'HIGH',
        is_emergency: isCrit
      };

      setGeneratedDraft(fallbackObj);
      setEditableTitle(draftTitle);
      setEditableDescription(fallbackDesc);
      setView('review');
    }
  };

  const handleApply = () => {
    if (onApplyGeneratedComplaint) {
      onApplyGeneratedComplaint({
        ...generatedDraft,
        title: editableTitle.trim() || generatedDraft.title,
        description: editableDescription.trim() || generatedDraft.description,
        original_citizen_input: issueText.trim(),
        structured_incident: structuredIncident
      });
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="ai-modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div 
        className="ai-modal-card" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-modal-title"
        style={{ maxWidth: '640px', width: '92%' }}
      >
        {/* Top Header Bar */}
        <div className="ai-modal-header">
          <div className="ai-modal-header-top">
            <div className="ai-modal-branding">
              <div className="ai-modal-icon-badge">
                <Sparkles size={18} />
              </div>
              <div className="ai-modal-titles-col">
                <div className="ai-modal-title-row">
                  <h3 id="ai-assistant-modal-title" className="ai-modal-title">
                    CivicPulse AI Complaint Assistant
                  </h3>
                  <span className="ai-modal-model-badge desktop-only">
                    <span className="ai-modal-model-dot" />
                    Two-Stage Intelligence
                  </span>
                </div>
                <div className="ai-modal-subtitle-row">
                  <p className="ai-modal-subtitle">
                    {view === 'clarify' 
                      ? 'Stage 1: Incident Clarification (Missing Details)'
                      : view === 'review'
                        ? 'Citizen Review & Approval (Editable Description)'
                        : 'Understand problem & formulate factual complaint petition'}
                  </p>
                </div>
              </div>
            </div>

            <div className="ai-modal-header-actions">
              <button 
                type="button"
                onClick={handleClose}
                className="ai-modal-btn-icon"
                title="Close"
                aria-label="Close dialog"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: COMPOSE                                           */}
        {/* ========================================================= */}
        {view === 'compose' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div className="ai-modal-label-row">
                <label className="ai-modal-label">
                  <span>Describe the civic problem in your own words:</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIssueText('There is a big hole on the road near our school. Bikes are falling.');
                    setInputError('');
                  }}
                  className="ai-modal-link-example"
                >
                  Use Example
                </button>
              </div>

              <textarea
                rows={3}
                value={issueText}
                onChange={(e) => {
                  setIssueText(e.target.value);
                  if (inputError) setInputError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAnalyzeAndProceed();
                  }
                }}
                placeholder="e.g. Power cut for 12 hours, or There is a big hole on the road near school, bikes are falling..."
                className={`ai-modal-textarea ${inputError ? 'has-error' : ''}`}
                autoFocus
              />

              {inputError && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  fontSize: '0.78rem',
                  marginTop: '6px',
                  fontWeight: 600
                }}>
                  <AlertTriangle size={14} />
                  <span>{inputError}</span>
                </div>
              )}
            </div>

            {/* Safety Hazard Checkbox */}
            <div className={`ai-modal-hazard-box ${isHazardous ? 'hazardous' : ''}`}>
              <label className="ai-modal-hazard-label">
                <input
                  type="checkbox"
                  checked={isHazardous}
                  onChange={(e) => setIsHazardous(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                />
                <span className="ai-modal-hazard-text">
                  <ShieldAlert size={16} color={isHazardous ? '#ef4444' : (isDark ? '#94a3b8' : '#64748b')} style={{ flexShrink: 0 }} />
                  <span>Active Life-Safety Hazard Present? <small style={{ fontWeight: 400, opacity: 0.9 }}>(Live wire, open manhole, gas leak, etc.)</small></span>
                </span>
              </label>

              {isHazardous && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: isDark ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <input
                    type="text"
                    value={hazardDetails}
                    onChange={(e) => setHazardDetails(e.target.value)}
                    placeholder="Specific safety danger (e.g. open high-voltage cable, vehicles skidding)"
                    className="ai-modal-hazard-input"
                  />
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="ai-modal-footer ai-modal-compose-actions">
              <button
                type="button"
                onClick={handleClose}
                className="ai-modal-btn-cancel"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAnalyzeAndProceed}
                disabled={isAnalyzing || !issueText.trim()}
                className="ai-modal-btn-draft"
                style={{ opacity: isAnalyzing ? 0.8 : 1, cursor: isAnalyzing ? 'wait' : 'pointer' }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="spin-animation" />
                    <span>Analyzing Incident...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Understand & Draft with AI</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 1.5: CLARIFY (Stage 1 Vague Complaint Questions)     */}
        {/* ========================================================= */}
        {view === 'clarify' && (
          <div>
            <div style={{
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              gap: '10px'
            }}>
              <HelpCircle size={20} color={isDark ? '#60a5fa' : '#2563eb'} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                  A few details will help file a more actionable petition
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.4 }}>
                  Your complaint was brief. Answering these targeted questions helps ensure the correct department inspects the site promptly:
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
              {clarificationQuestions.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155' }}>
                    {idx + 1}. {q}
                  </label>
                  <input
                    type="text"
                    value={clarificationAnswers[q] || ''}
                    onChange={(e) => setClarificationAnswers({ ...clarificationAnswers, [q]: e.target.value })}
                    placeholder="Enter details (or leave blank if unknown)..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      background: isDark ? '#0f172a' : '#ffffff',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="ai-modal-footer ai-modal-compose-actions">
              <button
                type="button"
                onClick={() => setView('compose')}
                className="ai-modal-btn-cancel"
              >
                <ArrowLeft size={15} />
                <span>Back</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleGenerate({})}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Skip Questions
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerate(clarificationAnswers)}
                  className="ai-modal-btn-draft"
                >
                  <Sparkles size={16} />
                  <span>Synthesize Description</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: GENERATING                                        */}
        {/* ========================================================= */}
        {view === 'generating' && (
          <div style={{ textAlign: 'center', padding: 'clamp(28px, 6vw, 44px) 16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(124, 58, 237, 0.1))',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              animation: 'pulse 1.8s infinite ease-in-out'
            }}>
              <Loader2 size={32} color={isDark ? '#60a5fa' : '#2563eb'} style={{ animation: 'spin 1.2s linear infinite' }} />
            </div>

            <h4 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.28rem)', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', marginBottom: '8px' }}>
              Synthesizing Factual Grievance Description...
            </h4>
            <p style={{ fontSize: '0.86rem', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.55 }}>
              Grounding details in reported facts without hallucinating unverified places, dates, or causes.
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: REVIEW & EDIT (Citizen Approval Workflow)         */}
        {/* ========================================================= */}
        {view === 'review' && generatedDraft && (
          <div>
            {/* Status Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '10px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color={isDark ? '#10b981' : '#16a34a'} />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  Review & Approve Description
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                  color: isDark ? '#60a5fa' : '#1d4ed8',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #bfdbfe'
                }}>
                  Editable Field
                </span>
              </div>
            </div>

            {/* Editable Subject Line */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                fontSize: '0.74rem', 
                color: isDark ? '#94a3b8' : '#64748b', 
                marginBottom: '4px', 
                display: 'block',
                textTransform: 'uppercase', 
                fontWeight: 700, 
                letterSpacing: '0.04em' 
              }}>
                Grievance Title / Subject:
              </label>
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Editable Formal Description */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ 
                  fontSize: '0.74rem', 
                  color: isDark ? '#94a3b8' : '#64748b', 
                  textTransform: 'uppercase', 
                  fontWeight: 700, 
                  letterSpacing: '0.04em' 
                }}>
                  Official Complaint Description (Editable):
                </label>
                <span style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                  {editableDescription.length} characters
                </span>
              </div>
              <textarea
                rows={6}
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  lineHeight: 1.5,
                  background: isDark ? '#0f172a' : '#f8fafc',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                ✏️ You can edit, add missing facts, or refine before accepting. Your approved text becomes the official description.
              </p>
            </div>

            {/* Action Bar */}
            <div className="ai-modal-footer ai-modal-review-actions" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setView('compose')} 
                  className="ai-modal-btn-cancel"
                >
                  <ArrowLeft size={15} /> 
                  <span>Edit Raw Input</span>
                </button>

                <button 
                  type="button" 
                  onClick={() => handleGenerate(clarificationAnswers)} 
                  className="ai-modal-btn-cancel"
                  title="Regenerate description"
                >
                  <RotateCcw size={15} /> 
                  <span>Regenerate</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="ai-modal-btn-draft btn-apply-main"
              >
                <CheckCircle2 size={16} />
                <span>Accept & Apply Official Petition</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
