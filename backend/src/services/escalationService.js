const db = require('../models/db');

class EscalationService {
  /**
   * Evaluates all open complaints against their SLA deadlines and escalates overdue tickets
   */
  checkAndEscalate() {
    const now = new Date().toISOString();

    const overdueComplaints = db.prepare(`
      SELECT id, tracking_id, title, priority, status, sla_deadline, is_escalated, escalation_level, department_id, citizen_id
      FROM complaints
      WHERE status NOT IN ('Resolved', 'Rejected')
        AND sla_deadline IS NOT NULL
        AND sla_deadline < ?
    `).all(now);

    let escalatedCount = 0;

    const updateStmt = db.prepare(`
      UPDATE complaints
      SET is_escalated = 1,
          escalation_level = CASE 
            WHEN escalation_level < 3 THEN escalation_level + 1 
            ELSE 3 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const timelineStmt = db.prepare(`
      INSERT INTO complaint_timeline (complaint_id, status, notes, updated_by_name)
      VALUES (?, ?, ?, 'SLA Automated Engine')
    `);

    const notifStmt = db.prepare(`
      INSERT INTO notifications (user_id, title, message, link)
      VALUES (?, ?, ?, ?)
    `);

    for (const c of overdueComplaints) {
      if (c.escalation_level < 3) {
        updateStmt.run(c.id);
        const newLevel = c.escalation_level + 1;
        const levelTitle = newLevel === 1 ? 'Department Head' : newLevel === 2 ? 'Municipal Commissioner' : 'Mayor / Vigilance';

        timelineStmt.run(
          c.id,
          c.status,
          `⚠️ SLA Violation Detected! Ticket automatically escalated to Level ${newLevel} (${levelTitle}).`
        );

        // Notify citizen
        notifStmt.run(
          c.citizen_id,
          'Complaint Escalated',
          `Your complaint #${c.tracking_id} exceeded resolution SLA and was automatically escalated to ${levelTitle}.`,
          `/complaints/${c.id}`
        );

        escalatedCount++;
      }
    }

    return { evaluated: overdueComplaints.length, escalated: escalatedCount };
  }

  /**
   * Starts background SLA interval (runs every 60 seconds)
   */
  startScheduler(intervalMs = 60000) {
    console.log('🕒 SLA Escalation Watchdog started.');
    this.checkAndEscalate();
    setInterval(() => {
      try {
        this.checkAndEscalate();
      } catch (err) {
        console.error('Error in SLA Escalation Watchdog:', err);
      }
    }, intervalMs);
  }
}

module.exports = new EscalationService();
