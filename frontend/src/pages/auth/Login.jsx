import React from 'react';
import AuthPage from './AuthPage';

export default function Login({ setCurrentRoute }) {
  return <AuthPage initialMode="signin" setCurrentRoute={setCurrentRoute} />;
}
