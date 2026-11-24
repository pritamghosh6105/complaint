import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Modal({ isOpen, onClose, title, children, maxWidth = '600px' }) {
  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 'clamp(8px, 2.5vw, 20px)'
          }}
        >
          <motion.div 
            className="apple-surface"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.85 }}
            style={{
              width: '100%',
              maxWidth: maxWidth,
              maxHeight: 'min(92vh, 92dvh)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderRadius: 'var(--radius-xl, 18px)',
              boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              padding: 'clamp(12px, 3vw, 18px) clamp(14px, 4vw, 24px)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              position: 'relative',
              zIndex: 1
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)', 
                margin: 0, 
                wordBreak: 'break-word' 
              }}>
                {title}
              </h3>
              <button 
                onClick={onClose}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 8px', borderRadius: '8px', flexShrink: 0 }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 'clamp(14px, 4vw, 24px)', position: 'relative', zIndex: 1 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
