import React from 'react';
import { CheckCircle2, AlertTriangle, UserCheck, HelpCircle } from 'lucide-react';

/**
 * Standardized Location / Evidence Verification Badge Component
 * Values: 'verified', 'partially_verified', 'citizen_provided', 'not_verified'
 */
export function VerificationBadge({ status = 'not_verified', className = '', style = {} }) {
  const normalized = String(status || '').trim().toLowerCase().replace(/[\s-]/g, '_');

  let label = 'Not Verified';
  let badgeClass = 'badge badge-verify-unverified';
  let IconComponent = HelpCircle;

  if (normalized === 'verified' || normalized === 'full' || normalized === 'fully_verified') {
    label = 'Verified';
    badgeClass = 'badge badge-verify-verified';
    IconComponent = CheckCircle2;
  } else if (normalized === 'partially_verified' || normalized === 'partial') {
    label = 'Partially Verified';
    badgeClass = 'badge badge-verify-partial';
    IconComponent = AlertTriangle;
  } else if (normalized === 'citizen_provided' || normalized === 'citizen' || normalized === 'manual') {
    label = 'Citizen Provided';
    badgeClass = 'badge badge-verify-citizen';
    IconComponent = UserCheck;
  }

  return (
    <span 
      className={`${badgeClass} ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', ...style }}
      title={`Location Verification: ${label}`}
    >
      <IconComponent size={11} strokeWidth={2.4} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export default VerificationBadge;
