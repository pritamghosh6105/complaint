import React from 'react';
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

/**
 * Standardized Priority Badge Component
 * Standard priorities: LOW, MEDIUM, HIGH, CRITICAL
 */
export function PriorityBadge({ priority, className = '', style = {}, showIcon = true }) {
  if (!priority) return null;

  const normalized = String(priority).trim().toUpperCase();

  let label = priority;
  let badgeClass = 'badge ';
  let IconComponent = ArrowDown;

  switch (normalized) {
    case 'CRITICAL':
      label = 'CRITICAL';
      badgeClass += 'badge-priority-critical';
      IconComponent = AlertCircle;
      break;

    case 'HIGH':
      label = 'HIGH';
      badgeClass += 'badge-priority-high';
      IconComponent = AlertTriangle;
      break;

    case 'MEDIUM':
      label = 'MEDIUM';
      badgeClass += 'badge-priority-medium';
      IconComponent = ArrowUp;
      break;

    case 'LOW':
    default:
      label = 'LOW';
      badgeClass += 'badge-priority-low';
      IconComponent = ArrowDown;
      break;
  }

  return (
    <span 
      className={`${badgeClass} ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}
      aria-label={`Priority: ${label}`}
    >
      {showIcon && <IconComponent size={11} strokeWidth={2.6} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}

export default PriorityBadge;
