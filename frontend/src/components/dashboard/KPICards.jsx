import React from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Flame, 
  Star, 
  TrendingUp 
} from 'lucide-react';
import StatCard from '../common/StatCard';

export default function KPICards({ kpis }) {
  if (!kpis) return null;

  return (
    <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
      <StatCard 
        title="Total Complaints" 
        value={kpis.total || 0} 
        subtitle="All recorded municipal issues"
        icon={FileText}
        color="blue"
      />
      <StatCard 
        title="Active / In Progress" 
        value={kpis.inProgress || 0} 
        subtitle={`${kpis.pending || 0} pending initial triage`}
        icon={Clock}
        color="purple"
      />
      <StatCard 
        title="Resolved Issues" 
        value={kpis.resolved || 0} 
        subtitle={`${kpis.resolutionRate || 0}% overall resolution rate`}
        icon={CheckCircle2}
        color="emerald"
      />
      <StatCard 
        title="SLA Violations" 
        value={kpis.slaViolations || 0} 
        subtitle="Exceeded resolution deadlines"
        icon={AlertOctagon}
        color="red"
        badge={kpis.slaViolations > 0 ? (
          <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>
            {kpis.slaViolations} Breaches Escalated
          </span>
        ) : null}
      />
    </div>
  );
}
