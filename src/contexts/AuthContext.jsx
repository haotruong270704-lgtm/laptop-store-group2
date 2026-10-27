import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
  try {
    // Gọi json-server lọc user theo email và password
    const res = await axiosClient.get(`/users?email=${email}&password=${password}`);
    
    if (res.data && res.data.length > 0) {
      const userObj = res.data[0];
      setUser(userObj); // Cập nhật state
      localStorage.setItem('user', JSON.stringify(userObj)); // Lưu localStorage
      return userObj; // Trả về user object thành công
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

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);