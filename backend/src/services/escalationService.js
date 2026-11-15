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
      const currentLevel = c.escalation_level || 0;
      const deadlineDate = new Date(c.sla_deadline);
      const breachAgeHours = (Date.now() - deadlineDate.getTime()) / (1000 * 60 * 60);

      let targetLevel = 0;
      let levelTitle = '';

      if (currentLevel < 1) {
        targetLevel = 1;
        levelTitle = 'Department Head';
      } else if (currentLevel < 2 && breachAgeHours >= 24) {
        targetLevel = 2;
        levelTitle = 'Municipal Commissioner';
      } else if (currentLevel < 3 && breachAgeHours >= 48) {
        targetLevel = 3;
        levelTitle = 'Mayor / Vigilance';
      }

      // Only escalate if a new level target has been reached
      if (targetLevel > currentLevel) {
        updateStmt.run(c.id);

        // Inscribe escalation into chronological timeline with explicit Escalated status
        timelineStmt.run(
          c.id,
          'Escalated',
          `⚠️ SLA Violation Detected! Ticket automatically escalated to Level ${targetLevel} (${levelTitle}).`
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
