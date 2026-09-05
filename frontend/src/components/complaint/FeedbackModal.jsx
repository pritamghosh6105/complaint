import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Star, Send } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

export default function FeedbackModal({ isOpen, onClose, complaint, onFeedbackSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!complaint) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        complaint_id: complaint.id,
        rating,
        comment
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      onFeedbackSubmitted();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How was your experience?">
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Rate the quality and speed of resolution for your <strong>{complaint.category}</strong> complaint #{complaint.tracking_id}:
          </p>

          {/* Star Rating Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  transition: 'transform 0.15s'
                }}
              >
                <Star
                  size={32}
                  fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                  color={(hoverRating || rating) >= star ? '#fbbf24' : '#64748b'}
                />
              </button>
            ))}
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)' }}>
            {rating === 5 && 'Outstanding & Prompt Resolution! 🌟'}
            {rating === 4 && 'Good Resolution Quality 👍'}
            {rating === 3 && 'Average / Acceptable 😐'}
            {rating === 2 && 'Below Expectations 👎'}
            {rating === 1 && 'Unsatisfactory Resolution ⚠️'}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Feedback Comments (Optional):</label>
          <textarea
            className="form-textarea"
            placeholder="Share your thoughts about the officer's resolution speed and workmanship..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={submitting}
          style={{ width: '100%' }}
        >
          <Send size={18} /> {submitting ? 'Recording Feedback...' : 'Submit Feedback'}
        </button>
      </form>
    </Modal>
  );
}
