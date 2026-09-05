import React from 'react';

export function Card({ children, className = '', style = {}, onClick, interactive = false, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${interactive ? 'glass-card-interactive' : ''} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', style = {}, ...props }) {
  return (
    <div 
      className={`card-header ${className}`} 
      style={{ padding: '18px 22px 10px', borderBottom: '1px solid var(--border-subtle)', ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', style = {}, ...props }) {
  return (
    <h3 
      className={`card-title ${className}`} 
      style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', ...style }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', style = {}, ...props }) {
  return (
    <p 
      className={`card-description ${className}`} 
      style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0, ...style }}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', style = {}, ...props }) {
  return (
    <div 
      className={`card-content ${className}`} 
      style={{ padding: '18px 22px', ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', style = {}, ...props }) {
  return (
    <div 
      className={`card-footer ${className}`} 
      style={{ padding: '12px 22px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
