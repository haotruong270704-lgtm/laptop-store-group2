import { createContext, useContext, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = async (userOrEmail, password) => {
    // Trường hợp 1: Truyền trực tiếp object user (từ LoginPage)
    if (typeof userOrEmail === 'object' && userOrEmail !== null) {
      setUser(userOrEmail);
      localStorage.setItem('user', JSON.stringify(userOrEmail));
      return userOrEmail;
    }

    // Trường hợp 2: Truyền email và password
    try {
      const res = await axiosClient.get(`/users?email=${userOrEmail}&password=${password}`);
      if (res.data && res.data.length > 0) {
        const userObj = res.data[0];
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return userObj;
      }
      return null;
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);