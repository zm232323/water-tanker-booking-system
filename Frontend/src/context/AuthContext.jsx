import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists and fetch user profile
    const loadUser = async () => {
      const token = localStorage.getItem('water_tanker_token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error loading current user:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('water_tanker_token', token);
        localStorage.setItem('water_tanker_user', JSON.stringify(user));
        setUser(user);
        setLoading(false);
        return { success: true, role: user.role };
      }
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', userData);
      if (res.data.success) {
        const { token, user } = res.data;
        localStorage.setItem('water_tanker_token', token);
        localStorage.setItem('water_tanker_user', JSON.stringify(user));
        setUser(user);
        setLoading(false);
        return { success: true, role: user.role };
      }
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('water_tanker_token');
    localStorage.removeItem('water_tanker_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
