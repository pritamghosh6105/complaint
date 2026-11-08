import React from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 'clamp(8px, 2.5vw, 20px)'
    }}>
      <div 
        className="glass-panel" 
        style={{
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: 'min(92vh, 92dvh)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          animation: 'fadeIn 0.2s ease-out',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{
          padding: 'clamp(12px, 3vw, 18px) clamp(14px, 4vw, 24px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <h3 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word' }}>{title}</h3>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 8px', borderRadius: '8px', flexShrink: 0 }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 'clamp(14px, 4vw, 24px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
