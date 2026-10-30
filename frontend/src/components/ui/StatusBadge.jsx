import React from 'react';
import { 
  Clock, 
  BrainCircuit, 
  Eye, 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Archive,
  AlertTriangle
} from 'lucide-react';

/**
 * Standardized Civic Status Badge
 * Supported: SUBMITTED, AI_ANALYZED, UNDER_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED, REOPENED
 */
export function StatusBadge({ status, className = '', style = {}, showIcon = true }) {
  if (!status) return null;

  const normalized = String(status).trim().toUpperCase().replace(/[\s-]/g, '_');

  let label = status;
  let badgeClass = 'badge badge-status ';
  let IconComponent = Clock;

  switch (normalized) {
    case 'SUBMITTED':
      label = 'Submitted';
      badgeClass += 'badge-status-submitted';
      IconComponent = Clock;
      break;

    case 'AI_ANALYZED':
    case 'AI_AUTO_DETECT':
      label = 'AI Analyzed';
      badgeClass += 'badge-status-ai-analyzed';
      IconComponent = BrainCircuit;
      break;

    case 'UNDER_REVIEW':
      label = 'Under Review';
      badgeClass += 'badge-status-under-review';
      IconComponent = Eye;
      break;

    case 'VERIFIED':
      label = 'Verified';
      badgeClass += 'badge-status-verified';
      IconComponent = ShieldCheck;
      break;

    case 'ASSIGNED':
      label = 'Assigned';
      badgeClass += 'badge-status-verified';
      IconComponent = ShieldCheck;
      break;

    case 'IN_PROGRESS':
    case 'PROGRESS':
      label = 'In Progress';
      badgeClass += 'badge-status-in-progress';
      IconComponent = Wrench;
      break;

    case 'RESOLVED':
      label = 'Resolved';
      badgeClass += 'badge-status-resolved';
      IconComponent = CheckCircle2;
      break;

    case 'CLOSED':
      label = 'Closed';
      badgeClass += 'badge-status-closed';
      IconComponent = Archive;
      break;

    case 'REJECTED':
      label = 'Rejected';
      badgeClass += 'badge-status-rejected';
      IconComponent = XCircle;
      break;

    case 'REOPENED':
      label = 'Reopened';
      badgeClass += 'badge-status-reopened';
      IconComponent = RotateCcw;
      break;

    case 'ESCALATED':
      label = 'Escalated';
      badgeClass += 'badge-escalated';
      IconComponent = AlertTriangle;
      break;

    default:
      label = status;
      badgeClass += 'badge-status-submitted';
      IconComponent = Clock;
      break;
  }

  return (
    <span 
      className={`${badgeClass} ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', ...style }}
      role="status"
      aria-label={`Status: ${label}`}
    >
      {showIcon && <IconComponent size={12} strokeWidth={2.4} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
