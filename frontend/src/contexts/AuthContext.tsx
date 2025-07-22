'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for existing login on mount
    const storedUserId = localStorage.getItem('loggedInUserId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setIsLoaded(true);
  }, []);

  const login = (userId: string) => {
    setUserId(userId);
    localStorage.setItem('loggedInUserId', userId);
  };

  const logout = () => {
    setUserId(null);
    localStorage.removeItem('loggedInUserId');
  };

  const value = {
    userId,
    login,
    logout,
    isLoggedIn: !!userId,
  };

  // Don't render children until we've checked localStorage
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
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
