import React, { useState } from 'react';
import { Bot, Sparkles, X, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Users, MapPin } from 'lucide-react';

export default function AIComplaintAssistant({ isOpen, onClose, onApplyGeneratedComplaint }) {
  const [step, setStep] = useState(1);
  const [issueText, setIssueText] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [isHazardous, setIsHazardous] = useState('No');
  const [hazardDetails, setHazardDetails] = useState('');
  const [affectedEstimate, setAffectedEstimate] = useState(50);
  const [locationType, setLocationType] = useState('Residential');

  const [generatedDraft, setGeneratedDraft] = useState(null);

  const resetForm = () => {
    setStep(1);
    setIssueText('');
    setLocationDetail('');
    setIsHazardous('No');
    setHazardDetails('');
    setAffectedEstimate(50);
    setLocationType('Residential');
    setGeneratedDraft(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const generateComplaintWithAI = () => {
    const isCritical = isHazardous === 'Yes' || /water entering|danger|fire|shock|spark|trapped|hospital|school/i.test(issueText + ' ' + hazardDetails);

    // AI Synthesized Title
    let title = 'Civic Infrastructure Incident';
    if (/flood|waterlog|drain/i.test(issueText)) {
      title = `Severe Waterlogging & Drainage Obstruction at ${locationDetail || 'Municipal Area'}`;
    } else if (/pothole|road/i.test(issueText)) {
      title = `Hazardous Road Damage & Crater at ${locationDetail || 'Local Carriageway'}`;
    } else if (/garbage|waste/i.test(issueText)) {
      title = `Overflowing Solid Waste Accumulation near ${locationDetail || 'Public Spot'}`;
    } else if (/light|dark/i.test(issueText)) {
      title = `Streetlight Outage & Dark Corridor at ${locationDetail || 'Neighbourhood'}`;
    } else if (/wire|electric|spark/i.test(issueText)) {
      title = `Electrical Hazard & Exposed Conductor at ${locationDetail || 'Public Way'}`;
    } else {
      title = `Reported Civic Grievance: ${issueText.slice(0, 45)}...`;
    }

    // AI Synthesized Description
    const description = `${issueText.trim()}.
Incident Location Context: ${locationDetail ? locationDetail.trim() : 'Locality premises'}.
Life Safety / Hazard Assessment: ${isHazardous === 'Yes' ? `CRITICAL - Immediate risk noted: ${hazardDetails || 'Hazard present requiring prompt intervention'}.` : 'Standard civic impact without immediate bodily peril.'}
Estimated Affected Population: Approximately ${affectedEstimate} citizens directly impacted.`;

    const draft = {
      title,
      description,
      is_emergency: isCritical,
      priority: isCritical ? 'CRITICAL' : (affectedEstimate >= 200 ? 'HIGH' : 'MEDIUM'),
      affected_count: affectedEstimate,
      location_type: locationType
    };

    setGeneratedDraft(draft);
    setStep(4);
  };

  if (!isOpen) return null;

  return (
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
        maxWidth: '560px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: '26px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                AI Complaint Assistant
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Guided interactive triage assistant
              </span>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step >= s ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'var(--border-subtle)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Step 1: What Happened? */}
        {step === 1 && (
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              Step 1: What issue are you experiencing?
            </label>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Describe what happened in plain words (e.g. "Water is overflowing from drain into street" or "Streetlight not working").
            </p>
            <textarea
              rows={4}
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="e.g. Heavy waterlogging on main road. Two-wheelers are slipping and dirty water is stagnant."
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                marginBottom: '16px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!issueText.trim()}
                className="btn btn-primary btn-sm"
              >
                Next: Location Details <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Affected Population */}
        {step === 2 && (
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              Step 2: Where did this occur & who is affected?
            </label>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Landmark or Specific Spot:
              </span>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                placeholder="e.g. Outside Amdanga Girls High School, near bus stop"
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Location Venue Type:
                </span>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Residential">Residential</option>
                  <option value="School">School / College</option>
                  <option value="Hospital">Hospital / Clinic</option>
                  <option value="Market">Market / Commercial</option>
                  <option value="Highway">Main Road / Highway</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                  Affected Citizens ({affectedEstimate}):
                </span>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="10"
                  value={affectedEstimate}
                  onChange={(e) => setAffectedEstimate(Number(e.target.value))}
                  style={{ width: '100%', marginTop: '6px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary btn-sm">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn btn-primary btn-sm">
                Next: Safety Risk <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Immediate Hazard & Water Ingress */}
        {step === 3 && (
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              Step 3: Is there any immediate danger or water entering homes?
            </label>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              If water is entering residential homes, electrical sparks exist, or life is in danger, AI will elevate priority to CRITICAL.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setIsHazardous('Yes')}
                className={`btn btn-sm ${isHazardous === 'Yes' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '12px', fontWeight: 700 }}
              >
                ⚠️ Yes, Hazard Present
              </button>
              <button
                type="button"
                onClick={() => setIsHazardous('No')}
                className={`btn btn-sm ${isHazardous === 'No' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '12px', fontWeight: 700 }}
              >
                ✓ No Immediate Danger
              </button>
            </div>

            {isHazardous === 'Yes' && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
                  Specify the danger (e.g. "Water entered living room", "Live wire fallen in water"):
                </span>
                <input
                  type="text"
                  value={hazardDetails}
                  onChange={(e) => setHazardDetails(e.target.value)}
                  placeholder="e.g. Water is entering houses and elderly people are stranded"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid #ef4444',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(2)} className="btn btn-secondary btn-sm">
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={generateComplaintWithAI}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontWeight: 700 }}
              >
                <Sparkles size={16} /> Generate Complaint
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review AI Generated Complaint */}
        {step === 4 && generatedDraft && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '8px'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                ✓ AI Synthesized Complaint Draft
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: generatedDraft.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                color: generatedDraft.priority === 'CRITICAL' ? '#ef4444' : 'var(--accent-primary)'
              }}>
                {generatedDraft.priority} Priority {generatedDraft.is_emergency ? '• Emergency' : ''}
              </span>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                Synthesized Title:
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                {generatedDraft.title}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                Structured Incident Description:
              </div>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', whiteSpace: 'pre-line', lineHeight: 1.5, maxHeight: '130px', overflowY: 'auto' }}>
                {generatedDraft.description}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(3)} className="btn btn-secondary btn-sm">
                <ArrowLeft size={16} /> Edit Answers
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyGeneratedComplaint(generatedDraft);
                  handleClose();
                }}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <CheckCircle2 size={16} /> Apply to Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
