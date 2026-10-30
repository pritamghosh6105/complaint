import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false, 
  loading = false,
  icon = null, 
  onClick, 
  type = 'button',
  style = {},
  ...props 
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'btn-ghost',
    icon: 'btn-icon btn-ghost'
  }[variant] || 'btn-primary';

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  }[size] || '';

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      style={{
        opacity: isDisabled ? 0.65 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style
      }}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" aria-hidden="true" />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}

export function DangerButton(props) {
  return <Button variant="danger" {...props} />;
}

export function GhostButton(props) {
  return <Button variant="ghost" {...props} />;
}

export function IconButton({ icon, size = 'md', ...props }) {
  return <Button variant="icon" icon={icon} size={size} {...props} />;
}

export default Button;
