'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';
import { supabase } from '../lib/supabase';

// Define types locally to avoid import issues
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  profile?: {
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
  isActive?: boolean;
  createdAt?: string;
  avatarUrl?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  githubLogin: () => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateProfile: (formData: FormData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session first
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', !!session, error);

        if (session && !user) {
          console.log('Found existing session, processing auth...');
          // Process the existing session
          try {
            const response = await authAPI.supabaseAuth({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              user: session.user
            });

            console.log('Backend auth successful for existing session');
            const { token, user: authUser } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(authUser));
            setUser(authUser);
          } catch (authError) {
            console.error('Supabase auth callback error for existing session:', authError);
            // Clear invalid session
            await supabase.auth.signOut();
          }
        } else {
          // No session, check for stored token
          await checkAuth();
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        await checkAuth();
      } finally {
        // Ensure loading is set to false after initialization
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session);

      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('Supabase SIGNED_IN event, sending to backend...');
          // Send session data to backend for user creation/verification
          const response = await authAPI.supabaseAuth({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: session.user
          });

          console.log('Backend auth successful');
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          setLoading(false); // Set loading to false after successful auth
        } catch (error) {
          console.error('Supabase auth callback error:', error);
          // Don't set user if backend auth fails
          // This prevents the app from getting into an inconsistent state
          setLoading(false); // Set loading to false even on error
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('Supabase SIGNED_OUT event');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false); // Set loading to false on sign out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Found stored token, validating...');
        const response = await authAPI.getMe();
        console.log('Token validation successful, user:', response.data.user.email);
        setUser(response.data.user);
      } else {
        console.log('No stored token found');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(name, email, password);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const updateProfile = async (formData: FormData) => {
    try {
      const response = await authAPI.updateProfile(formData);
      const updatedUser = response.data.user;

      // Update local storage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed');
    }
  };

  const googleLogin = async () => {
    // This method is kept for compatibility but the actual login
    // is handled by the GoogleLoginButton component and Supabase OAuth redirect
    // The auth state changes are handled by the onAuthStateChange listener above
  };

  const githubLogin = async () => {
    // This method is kept for compatibility but the actual login
    // is handled by the GithubLoginButton component and Supabase OAuth redirect
    // The auth state changes are handled by the onAuthStateChange listener above
  };

  const logout = async () => {
    try {
      // Sign out from Supabase first
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase sign out error:', error);
    }

    // Clear local state and storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, githubLogin, logout, loading, updateProfile }}>
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
