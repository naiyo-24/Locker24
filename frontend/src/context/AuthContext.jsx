import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Dynamically resolve API URL to support mobile network access
  const envApiUrl = import.meta.env.VITE_API_URL;
  const API_URL = envApiUrl && (envApiUrl.includes('127.0.0.1') || envApiUrl.includes('localhost')) && window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.hostname}:8018` 
    : envApiUrl || `${window.location.protocol}//${window.location.hostname}:8018`;

  useEffect(() => {
    const savedUser = sessionStorage.getItem('user');
    const savedToken = sessionStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    
    // Add a small delay for a premium app initialization experience
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_or_username: credentials.email_or_username,
          password: credentials.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      
      setUser(data.user);
      setToken(data.access_token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.access_token);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const loginWithGoogle = async (googlePayload) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googlePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Google Login failed');
      }

      const data = await response.json();
      
      setUser(data.user);
      setToken(data.access_token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('token', data.access_token);
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Google Auth failed:', error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, API_URL, isSidebarOpen, setIsSidebarOpen, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
