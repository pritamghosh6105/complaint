import React from 'react';
import AuthPage from './AuthPage';

export default function Register({ setCurrentRoute }) {
  return <AuthPage initialMode="signup" setCurrentRoute={setCurrentRoute} />;
}
