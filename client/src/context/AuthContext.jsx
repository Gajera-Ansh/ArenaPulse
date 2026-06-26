import React, { createContext, useState, useEffect, useContext } from 'react';
import expressApi from '../api/expressApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await expressApi.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const loginAccount = async (email, password) => {
    try {
      const res = await expressApi.post('/api/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const registerAccount = async (formData) => {
    try {
      const res = await expressApi.post('/api/auth/register', formData);
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        return true;
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const googleLogin = async (googleToken, role = 'player') => {
    try {
      const res = await expressApi.post('/api/auth/google', { token: googleToken, role });
      if (res.data.success) {
        login(res.data.data.user, res.data.data.token);
        return true;
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginAccount, registerAccount, googleLogin, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
