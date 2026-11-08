import React from 'react';
import AuthPage from './AuthPage';

export default function Register({ setCurrentRoute, onSuccessRoute, authNotice }) {
  return (
    <AuthPage 
      initialMode="signup" 
      setCurrentRoute={setCurrentRoute} 
      onSuccessRoute={onSuccessRoute}
      authNotice={authNotice}
    />
  );
}
