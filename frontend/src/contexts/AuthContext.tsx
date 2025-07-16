
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for stored authentication
    const storedUser = localStorage.getItem('tgcloud_user');
    const storedToken = localStorage.getItem('tgcloud_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser({ ...userData, token: storedToken });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('tgcloud_user');
        localStorage.removeItem('tgcloud_token');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(username, password);
      
      const userData = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        token: response.access_token
      };
      
      setUser(userData);
      localStorage.setItem('tgcloud_user', JSON.stringify(userData));
      localStorage.setItem('tgcloud_token', response.access_token);
      
      toast({
        title: "Welcome to TgCloud!",
        description: `Successfully logged in as ${username}`,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.response?.data?.detail || "Invalid credentials",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await authAPI.register(username, password);
      
      toast({
        title: "Registration successful",
        description: "Please log in with your credentials",
      });
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.response?.data?.detail || "Registration failed",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tgcloud_user');
    localStorage.removeItem('tgcloud_token');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
