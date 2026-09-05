import React from 'react';

export function Badge({ 
  children, 
  variant = 'default', 
  pulsing = false, 
  className = '', 
  style = {} 
}) {
  let badgeClass = 'badge ';
  const lower = (variant || '').toLowerCase();

  if (lower === 'critical') badgeClass += 'badge-critical';
  else if (lower === 'high') badgeClass += 'badge-high';
  else if (lower === 'medium') badgeClass += 'badge-medium';
  else if (lower === 'low') badgeClass += 'badge-low';
  else if (lower === 'resolved') badgeClass += 'badge-status badge-resolved';
  else if (lower === 'in progress') badgeClass += 'badge-status badge-inprogress';
  else if (lower === 'assigned') badgeClass += 'badge-status badge-assigned';
  else if (lower === 'submitted') badgeClass += 'badge-status badge-submitted';
  else if (lower === 'escalated') badgeClass += 'badge-status badge-escalated';
  else badgeClass += 'badge-status';

  return (
    <span className={`${badgeClass} ${className}`} style={style}>
      {pulsing && (
        <span 
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block',
            animation: 'pulseGlow 1.5s infinite ease-in-out'
          }} 
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
