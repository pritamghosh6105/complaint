const db = require('../models/db');

class FeedbackController {
  /**
   * Citizen submits rating and comments after resolution
   */
  submitFeedback(req, res) {
    try {
      const citizenId = req.user.id;
      const { complaint_id, rating, comment } = req.body;

      if (!complaint_id || !rating) {
        return res.status(400).json({ error: 'Complaint ID and rating (1-5) are required' });
      }

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint_id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      if (complaint.citizen_id !== citizenId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You can only provide feedback on your own complaints' });
      }

      // Check if feedback already exists
      const existing = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(complaint_id);
      if (existing) {
        return res.status(400).json({ error: 'Feedback has already been submitted for this complaint' });
      }

      const info = db.prepare(`
        INSERT INTO feedback (complaint_id, citizen_id, rating, comment)
        VALUES (?, ?, ?, ?)
      `).run(complaint_id, citizenId, Math.min(5, Math.max(1, Number(rating))), comment || '');

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, 'Feedback Received', ?, 'Citizen', ?)
      `).run(complaint_id, `Citizen gave a ${rating}★ rating: "${comment || 'No comment'}"`, citizenId);

      const createdFb = db.prepare('SELECT * FROM feedback WHERE id = ?').get(info.lastInsertRowid);
      res.status(201).json({
        message: 'Thank you! Feedback recorded successfully.',
        feedback: createdFb
      });
    } catch (err) {
      console.error('Feedback submit error:', err);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  getFeedback(req, res) {
    try {
      const { id } = req.params;
      const fb = db.prepare('SELECT * FROM feedback WHERE complaint_id = ?').get(id);
      res.json({ feedback: fb || null });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  }
}

module.exports = new FeedbackController();
