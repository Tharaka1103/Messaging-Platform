'use client'
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Check for token in both localStorage and cookies
    const storedToken = localStorage.getItem('chaty-token') || Cookies.get('chaty-token');
    const storedUser = localStorage.getItem('chaty-user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to login');
      }
      
      // Save to state
      setUser(data.user);
      setToken(data.token);
      
      // Save to localStorage and cookies
      localStorage.setItem('chaty-token', data.token);
      localStorage.setItem('chaty-user', JSON.stringify(data.user));
      Cookies.set('chaty-token', data.token, { expires: 7 });
      
      toast({ 
        title: "Login successful", 
        description: `Welcome back, ${data.user.name}!`,
        status: "success" 
      });
      
      router.push('/');
      
    } catch (error) {
      toast({ 
        title: "Login failed", 
        description: error instanceof Error ? error.message : "Something went wrong",
        status: "error" 
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Registering user:", { name, email });
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      // Log response status
      console.log("Registration response status:", res.status);
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid response from server");
      }
      
      console.log("Registration response:", data);
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }
      
      // Save to state
      setUser(data.user);
      setToken(data.token);
      
      // Save to localStorage and cookies
      localStorage.setItem('chaty-token', data.token);
      localStorage.setItem('chaty-user', JSON.stringify(data.user));
      Cookies.set('chaty-token', data.token, { expires: 7 });
      
      toast({ 
        title: "Registration successful", 
        description: `Welcome to Chaty, ${data.user.name}!`,
        status: "success" 
      });
      
      router.push('/');
      
    } catch (error) {
      toast({ 
        title: "Registration failed", 
        description: error instanceof Error ? error.message : "Something went wrong",
        status: "error" 
      });
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('chaty-token');
    localStorage.removeItem('chaty-user');
    Cookies.remove('chaty-token');
    toast({ 
      title: "Logged out", 
      description: "You have been successfully logged out.",
      status: "info" 
    });
    router.push('/login');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
