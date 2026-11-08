const db = require('../models/db');
const escalationService = require('../services/escalationService');

class AdminController {
  /**
   * Get all complaints with advanced administrative filtering and pagination
   */
  getAllComplaints(req, res) {
    try {
      const { 
        status, 
        category, 
        priority, 
        department_id, 
        ward, 
        district,
        municipality,
        block,
        gram_panchayat,
        police_station,
        is_escalated, 
        search, 
        clearance_tier
      } = req.query;
      let complaints = db.prepare('SELECT * FROM complaints').all();

      if (status && status !== 'all') {
        complaints = complaints.filter(c => c.status === status);
      }
      if (category && category !== 'all') {
        complaints = complaints.filter(c => c.category === category);
      }
      if (priority && priority !== 'all') {
        complaints = complaints.filter(c => c.priority === priority);
      }
      if (department_id && department_id !== 'all') {
        complaints = complaints.filter(c => c.department_id === Number(department_id));
      }
      if (ward && ward !== 'all') {
        complaints = complaints.filter(c => (c.ward || '').toLowerCase() === ward.toLowerCase());
      }
      if (district && district !== 'all') {
        complaints = complaints.filter(c => (c.district || '').toLowerCase() === district.toLowerCase());
      }
      if (municipality && municipality !== 'all') {
        complaints = complaints.filter(c => (c.municipality || '').toLowerCase().includes(municipality.toLowerCase()));
      }
      if (block && block !== 'all') {
        complaints = complaints.filter(c => (c.block || '').toLowerCase().includes(block.toLowerCase()));
      }
      if (gram_panchayat && gram_panchayat !== 'all') {
        complaints = complaints.filter(c => (c.gram_panchayat || '').toLowerCase().includes(gram_panchayat.toLowerCase()));
      }
      if (police_station && police_station !== 'all') {
        complaints = complaints.filter(c => (c.police_station || '').toLowerCase().includes(police_station.toLowerCase()));
      }
      if (is_escalated === 'true' || is_escalated === '1') {
        complaints = complaints.filter(c => c.is_escalated === 1 || c.escalation_level > 0);
      }
      if (search && search.trim()) {
        const s = search.toLowerCase().trim();
        complaints = complaints.filter(c =>
          (c.tracking_id || '').toLowerCase().includes(s) ||
          String(c.id || '') === s ||
          (c.title || '').toLowerCase().includes(s) ||
          (c.description || '').toLowerCase().includes(s) ||
          (c.district || '').toLowerCase().includes(s) ||
          (c.subdivision || '').toLowerCase().includes(s) ||
          (c.municipality || '').toLowerCase().includes(s) ||
          (c.ward || '').toLowerCase().includes(s) ||
          (c.block || '').toLowerCase().includes(s) ||
          (c.gram_panchayat || '').toLowerCase().includes(s) ||
          (c.village || '').toLowerCase().includes(s) ||
          (c.police_station || '').toLowerCase().includes(s) ||
          (c.postal_code || '').toLowerCase().includes(s) ||
          (c.category || '').toLowerCase().includes(s) ||
          (c.department_name || '').toLowerCase().includes(s) ||
          (c.address || '').toLowerCase().includes(s)
        );
      }

      complaints = complaints.map(c => {
        const evidence = db.getEvidenceByComplaintId(c.id);
        const visualAnalyses = db.getVisualAnalysisByComplaintId(c.id);
        return {
          ...c,
          evidence,
          visual_analyses: visualAnalyses
        };
      });

      if (clearance_tier && clearance_tier !== 'all') {
        complaints = complaints.filter(c => {
          const analyses = c.visual_analyses || [];
          return analyses.some(v => v.clearance_tier === clearance_tier);
        });
      }

      res.json({
        total: complaints.length,
        complaints
      });
    } catch (err) {
      console.error('Admin complaints fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  }

  /**
   * Manual override of Department
   */
  overrideDepartment(req, res) {
    try {
      const { id } = req.params;
      const { department_id, reason } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      const dept = db.prepare('SELECT * FROM departments WHERE id = ?').get(department_id);
      if (!dept) {
        return res.status(400).json({ error: 'Department does not exist' });
      }

      db.prepare(`
        UPDATE complaints
        SET department_id = ?,
            officer_id = NULL,
            status = 'Assigned',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(dept.id, complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, 'Assigned', ?, ?, ?)
      `).run(
        complaint.id,
        `Admin department override: Reassigned to ${dept.name}. Reason: ${reason || 'Administrative routing adjustment'}.`,
        req.user.name || 'Admin',
        req.user.id
      );

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
      res.json({
        message: `Department reassigned to ${dept.name}`,
        complaint: updated
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to override department' });
    }
  }

  /**
   * Manual override of Priority (e.g. following AI visual inspection)
   */
  overridePriority(req, res) {
    try {
      const { id } = req.params;
      const { priority, reason } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority level. Must be LOW, MEDIUM, HIGH, or CRITICAL.' });
      }

      const slaHours = priority === 'CRITICAL' ? 24 : (priority === 'HIGH' ? 48 : (priority === 'MEDIUM' ? 72 : 120));
      const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

      db.prepare(`
        UPDATE complaints
        SET priority = ?,
            final_priority = ?,
            admin_override = 1,
            admin_override_reason = ?,
            sla_deadline = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(priority, priority, reason || 'Manual administrative risk adjustment', slaDeadline, complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        complaint.id,
        complaint.status,
        `Admin priority override: Updated from ${complaint.priority} to ${priority}. Reason: ${reason || 'Manual administrative risk adjustment'}.`,
        req.user.name || 'Admin',
        req.user.id
      );

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
      res.json({ message: `Priority overridden to ${priority}`, complaint: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to override priority' });
    }
  }

  /**
   * Manual override of Category
   */
  overrideCategory(req, res) {
    try {
      const { id } = req.params;
      const { category, subcategory, reason } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

      db.prepare(`
        UPDATE complaints
        SET category = ?,
            final_department = ?,
            subcategory = ?,
            admin_override = 1,
            admin_override_reason = ?,
            reviewed_by = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(category, category, subcategory || null, reason || 'Manual administrative category adjustment', req.user?.name || 'Admin', complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        complaint.id,
        complaint.status,
        `Admin category override: Changed to ${category} (${subcategory || 'General'}). Reason: ${reason || 'Manual category correction'}.`,
        req.user.name || 'Admin',
        req.user.id
      );

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
      res.json({ message: `Category updated to ${category}`, complaint: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to override category' });
    }
  }

  /**
   * Assign or Reassign Field Officer
   */
  assignOfficer(req, res) {
    try {
      const { id } = req.params;
      const { officer_id } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

      const officer = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(officer_id, 'officer');
      if (!officer) return res.status(400).json({ error: 'Officer not found' });

      db.prepare(`
        UPDATE complaints
        SET officer_id = ?,
            status = 'Assigned',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(officer.id, complaint.id);

      db.prepare(`
        INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
        VALUES (?, 'Assigned', ?, ?, ?)
      `).run(
        complaint.id,
        `Assigned to Field Officer: ${officer.name}.`,
        req.user.name || 'Admin',
        req.user.id
      );

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, link)
        VALUES (?, 'New Task Assigned', ?, ?)
      `).run(
        officer.id,
        `You have been assigned to complaint #${complaint.tracking_id} (${complaint.category}).`,
        `/officer`
      );

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
      res.json({ message: `Assigned to ${officer.name}`, complaint: updated });
    } catch (err) {
      res.status(500).json({ error: 'Failed to assign officer' });
    }
  }

  /**
   * Get all departments
   */
  getDepartments(req, res) {
    try {
      const departments = db.prepare('SELECT * FROM departments').all();
      res.json({ departments });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch departments' });
    }
  }

  /**
   * Get all field officers
   */
  getOfficers(req, res) {
    try {
      const officers = db.prepare("SELECT id, name, email, role, phone, department_id, ward FROM users WHERE role IN ('officer', 'police_officer', 'cyber_crime_officer', 'field_officer', 'department_officer')").all();
      res.json({ officers });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch officers' });
    }
  }

  /**
   * Manually trigger SLA watchdog
   */
  triggerSLAEvaluation(req, res) {
    try {
      const result = escalationService.checkAndEscalate();
      res.json({
        message: 'SLA evaluation executed',
        ...result
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to trigger SLA evaluation' });
    }
  }
}

module.exports = new AdminController();
