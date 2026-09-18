'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  signUp: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem(
        LOCAL_STORAGE_KEYS.AUTH_TOKEN
      );

      if (savedToken) {
        setToken(savedToken);
        try {
          const userData = await api.auth.getUser();
          setUser(userData);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
          setToken(null);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        const response = await api.auth.signUp({
          username,
          email,
          password,
        });

        localStorage.setItem(
          LOCAL_STORAGE_KEYS.AUTH_TOKEN,
          response.token
        );
        setToken(response.token);
        setUser(response.user);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.auth.signIn({ email, password });

        localStorage.setItem(
          LOCAL_STORAGE_KEYS.AUTH_TOKEN,
          response.token
        );
        setToken(response.token);
        setUser(response.user);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
    token,
    signUp,
    signIn,
    logout,
    checkAuth: async () => {
      // Re-check authentication
      const savedToken = localStorage.getItem(
        LOCAL_STORAGE_KEYS.AUTH_TOKEN
      );
      if (savedToken) {
        try {
          const userData = await api.auth.getUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
          setToken(null);
          setUser(null);
        }
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
