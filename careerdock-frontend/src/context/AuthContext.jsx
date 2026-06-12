import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('cd_token');
    if (!token) return null;
    return {
      token,
      id: localStorage.getItem('cd_id'),
      name: localStorage.getItem('cd_name'),
      email: localStorage.getItem('cd_email'),
    };
  });

  const login = ({ token, id, name, email, theme, darkMode }) => {
    localStorage.setItem('cd_token', token);
    localStorage.setItem('cd_id', id);
    localStorage.setItem('cd_name', name);
    localStorage.setItem('cd_email', email);
    setUser({ token, id, name, email });
    if (theme) localStorage.setItem('cd_theme', theme);
    if (darkMode !== undefined) localStorage.setItem('cd_dark', darkMode ? '1' : '0');
  };

  const logout = () => {
    ['cd_token','cd_id','cd_name','cd_email'].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
