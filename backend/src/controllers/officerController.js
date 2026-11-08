const fs = require('fs');
const db = require('../models/db');
const cloudinaryService = require('../services/cloudinaryService');
const mlClient = require('../services/mlClient');

class OfficerController {
  /**
   * Get all tasks assigned to the authenticated field officer
   */
  getMyAssignedTasks(req, res) {
    try {
      const officerId = req.user.id;
      const deptId = req.user.department_id;
      
      let tasks;
      if (deptId) {
        // Fetch all complaints assigned to this officer or to their department taskforce
        tasks = db.prepare('SELECT * FROM complaints WHERE officer_id = ? OR department_id = ?').all(officerId, deptId);
      } else {
        tasks = db.prepare('SELECT * FROM complaints WHERE officer_id = ?').all(officerId);
      }

      tasks = tasks.map(t => {
        const evidence = db.getEvidenceByComplaintId(t.id);
        const visualAnalyses = db.getVisualAnalysisByComplaintId(t.id);
        const primaryAnalysis = visualAnalyses[0] || null;

        const enrichedEvidence = evidence.map(item => {
          const analysis = visualAnalyses.find(v => v.complaint_evidence_id === item.id || v.id === item.ai_analysis_id);
          return {
            ...item,
            visual_analysis: analysis || null,
            scene_description: analysis?.scene_description || analysis?.scene?.description || item.scene_description || t.scene_description || null,
            scene_type: analysis?.scene_type || analysis?.scene?.scene_type || item.scene_type || t.scene_type || null,
            direct_observations: (analysis?.direct_observations && analysis.direct_observations.length > 0) ? analysis.direct_observations : (Array.isArray(analysis?.visual_findings) ? analysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : (item.direct_observations || t.direct_observations || []))
          };
        });

        return {
          ...t,
          evidence: enrichedEvidence,
          visual_analyses: visualAnalyses,
          scene_description: t.scene_description || primaryAnalysis?.scene_description || primaryAnalysis?.scene?.description || (enrichedEvidence[0]?.scene_description || null),
          scene_type: t.scene_type || primaryAnalysis?.scene_type || primaryAnalysis?.scene?.scene_type || (enrichedEvidence[0]?.scene_type || null),
          direct_observations: (t.direct_observations && t.direct_observations.length > 0) ? t.direct_observations : (primaryAnalysis?.direct_observations || (enrichedEvidence[0]?.direct_observations || []))
        };
      });

      res.json({ tasks });
    } catch (err) {
      console.error('Officer tasks error:', err);
      res.status(500).json({ error: 'Failed to fetch assigned tasks' });
    }
  }

  /**
   * Update task status (Mark In Progress or Resolve with proof photo)
   */
  async updateTaskStatus(req, res) {
    try {
      const officerId = req.user.id;
      const officerName = req.user.name || 'Field Officer';
      const { id } = req.params;
      const { status, notes } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Check authorization (assigned officer or officer in same department or admin)
      const isAssigned = complaint.officer_id === officerId;
      const isDeptOfficer = req.user.department_id && complaint.department_id === req.user.department_id;
      const isAdmin = req.user.role === 'admin';

      if (!isAssigned && !isDeptOfficer && !isAdmin) {
        return res.status(403).json({ error: 'You are not assigned to this complaint or department' });
      }

      let resolutionImageUrl = complaint.resolution_image_url;
      let resolutionEvidenceRecord = null;

      const uploadedFile = req.file || req.files?.resolution_image?.[0] || req.files?.image?.[0];

      if (uploadedFile) {
        try {
          const uploadRes = await cloudinaryService.uploadEvidence(uploadedFile.path, {
            complaintId: complaint.tracking_id || complaint.id,
            folderType: 'resolution',
            resourceType: 'image',
            originalFilename: uploadedFile.originalname,
            tags: ['resolution', complaint.category]
          });

          resolutionImageUrl = uploadRes.secure_url;

          resolutionEvidenceRecord = db.insertEvidence({
            complaint_id: complaint.id,
            uploaded_by: officerId,
            cloudinary_public_id: uploadRes.cloudinary_public_id,
            cloudinary_url: uploadRes.cloudinary_url,
            secure_url: uploadRes.secure_url,
            resource_type: uploadRes.resource_type,
            format: uploadRes.format,
            original_filename: uploadRes.original_filename || uploadedFile.originalname,
            file_size: uploadRes.file_size || uploadedFile.size,
            width: uploadRes.width,
            height: uploadRes.height,
            thumbnail_url: uploadRes.thumbnail_url,
            evidence_type: 'resolution',
            is_sensitive: Boolean(complaint.is_crime || complaint.is_sensitive)
          });

          if (resolutionEvidenceRecord) {
            db.logEvidenceAudit({
              complaint_id: complaint.id,
              evidence_id: resolutionEvidenceRecord.id,
              cloudinary_public_id: uploadRes.cloudinary_public_id,
              action: 'UPLOAD',
              user_id: officerId,
              user_role: 'officer',
              user_name: officerName,
              ip_address: req.ip || '127.0.0.1',
              details: `Officer uploaded resolution proof photo: ${uploadedFile.originalname} to Cloudinary`
            });
          }
        } catch (uploadErr) {
          console.error('Resolution photo upload error:', uploadErr);
          resolutionImageUrl = `/uploads/${uploadedFile.filename || uploadedFile.originalname || 'resolution.jpg'}`;
        }
        // Ensure temporary local upload file is deleted
        if (uploadedFile && uploadedFile.path && fs.existsSync(uploadedFile.path)) {
          try { fs.unlinkSync(uploadedFile.path); } catch (_) {}
        }
      } else if (req.body.resolution_image_url) {
        resolutionImageUrl = req.body.resolution_image_url;
      }

      if (status === 'Resolved') {
        db.prepare(`
          UPDATE complaints
          SET status = 'Resolved',
              resolution_notes = ?,
              resolution_image_url = ?,
              resolution_evidence_id = ?,
              officer_id = ?,
              resolved_at = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(notes || 'Issue successfully resolved on-site.', resolutionImageUrl, resolutionEvidenceRecord?.id || null, officerId, complaint.id);

        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(complaint.id, 'Resolved', notes || 'Work completed and verified on ground.', officerName, officerId);

        // Notify citizen to provide feedback & rating
        if (complaint.citizen_id) {
          db.prepare(`
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (?, 'Complaint Resolved! 🎉', ?, ?)
          `).run(
            complaint.citizen_id,
            `Your complaint #${complaint.tracking_id} (${complaint.category}) has been resolved. Please rate our service!`,
            `/complaints/${complaint.id}`
          );
        }
      } else if (status === 'In Progress') {
        db.prepare(`
          UPDATE complaints
          SET status = ?,
              officer_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run('In Progress', officerId, complaint.id);

        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(complaint.id, 'In Progress', notes || 'Field officer dispatched and investigation/repair in progress.', officerName, officerId);

        if (complaint.citizen_id) {
          db.prepare(`
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (?, 'Work in Progress', ?, ?)
          `).run(
            complaint.citizen_id,
            `Officer ${officerName} is actively working on your complaint #${complaint.tracking_id}.`,
            `/complaints/${complaint.id}`
          );
        }
      } else {
        db.prepare(`
          UPDATE complaints
          SET status = ?,
              officer_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(status, officerId, complaint.id);

        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(complaint.id, status, notes || `Status updated to ${status}`, officerName, officerId);
      }

      const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
      const timeline = db.prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ?').all(complaint.id);

      res.json({
        message: `Task marked as ${status}`,
        complaint: updated,
        timeline
      });
    } catch (err) {
      console.error('Update task status error:', err);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
  /**
   * Triage and Recalibrate Complaint Priority by Assigned Field Officer
   */
  async triageTask(req, res) {
    try {
      const officerId = req.user.id;
      const officerName = req.user.name || 'Field Officer';
      const { id } = req.params;
      const { action, new_priority, reason } = req.body;

      const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
      if (!complaint) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      // Check authorization (assigned officer, officer in department, or admin)
      const isAssigned = complaint.officer_id === officerId;
      const isDeptOfficer = req.user.department_id && complaint.department_id === req.user.department_id;
      const isAdmin = req.user.role === 'admin';

      if (!isAssigned && !isDeptOfficer && !isAdmin) {
        return res.status(403).json({ error: 'You are not assigned to this complaint or department' });
      }

      const now = new Date();

      if (action === 'CONFIRM_CRITICAL') {
        const triageReason = reason || 'Verified by field officer: genuine life-safety hazard detected. Rapid 24-hour response protocol locked.';
        
        let slaDeadline = complaint.sla_deadline;
        if (!slaDeadline || new Date(slaDeadline) < now) {
          slaDeadline = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
        }

        db.triageComplaint(complaint.id, {
          priority: 'CRITICAL',
          is_emergency: 1,
          triage_status: 'CONFIRMED_CRITICAL',
          triage_reason: triageReason,
          triaged_by: officerName,
          sla_deadline: slaDeadline
        });

        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          complaint.id,
          'Emergency Verified',
          `Field Officer ${officerName} verified this case as an active life-safety emergency. Rapid 24-hour SLA confirmed. ${triageReason}`,
          officerName,
          officerId
        );

        if (complaint.citizen_id) {
          db.prepare(`
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (?, 'Emergency Hazard Confirmed 🚨', ?, ?)
          `).run(
            complaint.citizen_id,
            `Field Officer ${officerName} verified your emergency complaint #${complaint.tracking_id}. Response crew deployed under 24-hour SLA.`,
            `/complaints/${complaint.id}`
          );
        }

        const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
        const timeline = db.prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ?').all(complaint.id);

        return res.json({
          message: 'Emergency confirmed. 24-hour rapid SLA locked.',
          complaint: updated,
          timeline
        });

      } else if (action === 'RECALIBRATE_NORMAL') {
        if (!reason || !reason.trim() || reason.trim().length < 5) {
          return res.status(400).json({ error: 'A valid audit reason is required to recalibrate priority from Critical.' });
        }

        const targetPriority = (new_priority === 'HIGH' || new_priority === 'LOW') ? new_priority : 'MEDIUM';
        const slaHours = targetPriority === 'HIGH' ? 48 : targetPriority === 'LOW' ? 168 : 72;
        const newSlaDeadline = new Date(now.getTime() + slaHours * 3600 * 1000).toISOString();
        const trimmedReason = reason.trim();

        db.triageComplaint(complaint.id, {
          priority: targetPriority,
          is_emergency: 0,
          triage_status: 'RECALIBRATED_NORMAL',
          triage_reason: trimmedReason,
          triaged_by: officerName,
          sla_deadline: newSlaDeadline
        });

        db.prepare(`
          INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name, updated_by_user_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          complaint.id,
          'Priority Recalibrated',
          `Assigned Officer ${officerName} recalibrated priority from CRITICAL to ${targetPriority}. Reason: "${trimmedReason}". SLA deadline adjusted to ${slaHours} hours.`,
          officerName,
          officerId
        );

        if (complaint.citizen_id) {
          db.prepare(`
            INSERT INTO notifications (user_id, title, message, link)
            VALUES (?, 'Priority Recalibrated to Normal ℹ️', ?, ?)
          `).run(
            complaint.citizen_id,
            `Officer ${officerName} evaluated #${complaint.tracking_id} and adjusted priority to ${targetPriority} (${slaHours}h SLA). Reason: ${trimmedReason}`,
            `/complaints/${complaint.id}`
          );
        }

        const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
        const timeline = db.prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ?').all(complaint.id);

        return res.json({
          message: `Priority successfully recalibrated to ${targetPriority}. SLA reset to ${slaHours} hours.`,
          complaint: updated,
          timeline
        });
      } else {
        return res.status(400).json({ error: 'Invalid triage action. Expected CONFIRM_CRITICAL or RECALIBRATE_NORMAL.' });
      }
    } catch (err) {
      console.error('Triage task error:', err);
      res.status(500).json({ error: 'Failed to triage task priority' });
    }
  }
}

module.exports = new OfficerController();
