import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('civic_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('civic_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('civic_token', jwtToken);
    localStorage.setItem('civic_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, phone, role = 'citizen', ward = 'Ward 1', department_id = null) => {
    const res = await api.post('/auth/register', { name, email, password, phone, role, ward, department_id });
    const { token: jwtToken, user: userData } = res.data;
    localStorage.setItem('civic_token', jwtToken);
    localStorage.setItem('civic_user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const quickDemoLogin = async (roleType) => {
    let email = 'citizen@demo.com';
    if (roleType === 'officer') email = 'officer.pwd@demo.com';
    else if (roleType === 'admin') email = 'admin@demo.com';
    return await login(email, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
