import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Check, Globe, AlertCircle } from 'lucide-react';

export default function VoiceInputModal({ isOpen, onClose, onApplyTranscript, defaultLanguage = 'en' }) {
  const [selectedLang, setSelectedLang] = useState(defaultLanguage === 'bn' ? 'bn-IN' : (defaultLanguage === 'hi' ? 'hi-IN' : 'en-IN'));
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  const languages = [
    { code: 'en-IN', label: 'English (India)', flag: '🇮🇳' },
    { code: 'bn-IN', label: 'বাংলা (Bengali)', flag: '🇧🇩/🇮🇳' },
    { code: 'hi-IN', label: 'हिन्दी (Hindi)', flag: '🇮🇳' }
  ];

  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setInterimText('');
      setErrorMsg('');
    }
  }, [isOpen]);

  const startListening = () => {
    setErrorMsg('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let finalTrans = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTrans += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalTrans) {
          setTranscript(prev => (prev + ' ' + finalTrans).trim());
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser settings.');
        } else if (event.error !== 'no-speech') {
          setErrorMsg(`Voice input status: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setErrorMsg('Could not start microphone. Please try again.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const handleApply = () => {
    const fullText = (transcript + ' ' + interimText).trim();
    if (fullText) {
      onApplyTranscript(fullText);
      onClose();
    }
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
        maxWidth: '540px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: '26px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
            }}>
              <Mic size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Voice Complaint Dictation
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Speak in Bengali, Hindi, or English
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Language Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={14} color="var(--accent-cyan)" /> Select Spoken Language:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {languages.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  if (isListening) stopListening();
                  setSelectedLang(lang.code);
                }}
                className={`btn btn-sm ${selectedLang === lang.code ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: selectedLang === lang.code ? 700 : 500,
                  justifyContent: 'center',
                  padding: '8px 6px'
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Microphone Button & Wave Visualization */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '18px'
        }}>
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: isListening 
                ? 'linear-gradient(135deg, #ef4444, #f97316)' 
                : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isListening 
                ? '0 0 25px rgba(239, 68, 68, 0.6)' 
                : '0 0 20px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.25s ease',
              transform: isListening ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <div style={{ marginTop: '14px', fontSize: '0.88rem', fontWeight: 600, color: isListening ? '#ef4444' : 'var(--text-secondary)' }}>
            {isListening ? '🔴 Listening... Speak clearly into your mic' : 'Click microphone to start speaking'}
          </div>

          {isListening && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '12px', alignItems: 'center' }}>
              <span className="wave-bar" style={{ width: '4px', height: '14px', background: '#3b82f6', borderRadius: '2px', animation: 'pulse 0.6s infinite alternate' }} />
              <span className="wave-bar" style={{ width: '4px', height: '24px', background: '#06b6d4', borderRadius: '2px', animation: 'pulse 0.4s infinite alternate 0.2s' }} />
              <span className="wave-bar" style={{ width: '4px', height: '32px', background: '#8b5cf6', borderRadius: '2px', animation: 'pulse 0.5s infinite alternate 0.1s' }} />
              <span className="wave-bar" style={{ width: '4px', height: '20px', background: '#10b981', borderRadius: '2px', animation: 'pulse 0.7s infinite alternate 0.3s' }} />
              <span className="wave-bar" style={{ width: '4px', height: '12px', background: '#3b82f6', borderRadius: '2px', animation: 'pulse 0.5s infinite alternate' }} />
            </div>
          )}
        </div>

        {/* Live Transcript Display Box */}
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          padding: '14px',
          minHeight: '90px',
          maxHeight: '150px',
          overflowY: 'auto',
          fontSize: '0.92rem',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
          marginBottom: '18px'
        }}>
          {transcript || interimText ? (
            <div>
              <span>{transcript}</span>
              <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> {interimText}</span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
              Example in Bengali: "আমাদের এলাকায় ড্রেন উপচে রাস্তায় জল জমেছে"<br/>
              Example in Hindi: "सड़क पर गहरा गड्ढा है जिससे दुर्घटना हो सकती है"<br/>
              Example in English: "Streetlight pole sparking near market gate"
            </span>
          )}
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.12)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '0.82rem',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript && !interimText}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            <Check size={16} /> Apply to Complaint Form
          </button>
        </div>
      </div>
    </div>
  );
}
