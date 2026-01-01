import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: string;
  ubicacion?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, role: string, ubicacion?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('role');
      const ubicacion = localStorage.getItem('ubicacion');

      if (token && role) {
        try {
          const decodedToken = jwtDecode(token) as { id: string; email: string };
          setUser({
            id: decodedToken.id,
            email: decodedToken.email,
            role,
            ubicacion: ubicacion || undefined
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al decodificar el token:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (token: string, role: string, ubicacion?: string) => {
    try {
      const decodedToken = jwtDecode(token) as { id: string; email: string };
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      if (ubicacion) {
        localStorage.setItem('ubicacion', ubicacion);
      }

      setUser({
        id: decodedToken.id,
        email: decodedToken.email,
        role,
        ubicacion
      });
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('ubicacion');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      if (userData.ubicacion) {
        localStorage.setItem('ubicacion', userData.ubicacion);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
      {!isLoading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}