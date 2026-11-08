import React from 'react';
import AuthPage from './AuthPage';

export default function Login({ setCurrentRoute, onSuccessRoute, authNotice }) {
  return (
    <AuthPage 
      initialMode="signin" 
      setCurrentRoute={setCurrentRoute} 
      onSuccessRoute={onSuccessRoute}
      authNotice={authNotice}
    />
  );
}
