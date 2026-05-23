// Auth Context - manages user login state globally
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const getInitialAuth = () => {
    // 1. Check localStorage (Remember Me)
    const savedTokenLocal = localStorage.getItem('token');
    const savedUserLocal = localStorage.getItem('user');
    const loginTimestamp = localStorage.getItem('loginTimestamp');

    if (savedTokenLocal && savedUserLocal && loginTimestamp) {
      const ageInMs = Date.now() - parseInt(loginTimestamp);
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (ageInMs > sevenDaysInMs) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      } else {
        try {
          return { token: savedTokenLocal, user: JSON.parse(savedUserLocal) };
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('loginTimestamp');
        }
      }
    }

    // 2. Check sessionStorage
    const savedTokenSession = sessionStorage.getItem('token');
    const savedUserSession = sessionStorage.getItem('user');
    if (savedTokenSession && savedUserSession) {
      try {
        return { token: savedTokenSession, user: JSON.parse(savedUserSession) };
      } catch (e) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }

    return { token: null, user: null };
  };

  const initialAuth = getInitialAuth();
  const [user, setUser] = useState(initialAuth.user);
  const [token, setToken] = useState(initialAuth.token);

  const login = (userData, jwt, rememberMe) => {
    setUser(userData);
    setToken(jwt);
    if (rememberMe) {
      localStorage.setItem('token', jwt);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTimestamp', Date.now().toString());
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } else {
      sessionStorage.setItem('token', jwt);
      sessionStorage.setItem('user', JSON.stringify(userData));
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTimestamp');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const isAdmin = () => user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
