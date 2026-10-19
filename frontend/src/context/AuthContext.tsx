import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types/auth';
import { authApi, setAccessToken, getAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: Role | Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
    }
  }, []);

  // Khởi tạo phiên làm việc ban đầu (Auto-restore session qua Refresh Token cookie)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Thử làm mới access token từ cookie HttpOnly
        const token = await authApi.refresh();
        setAccessTokenState(token);
        const meRes = await authApi.getMe();
        if (meRes.success) {
          setUser(meRes.data);
        }
      } catch {
        setUser(null);
        setAccessToken(null);
        setAccessTokenState(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        setUser(res.data.user);
        setAccessTokenState(res.data.accessToken);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAccessToken(null);
      setAccessTokenState(null);
      setIsLoading(false);
    }
  };

  const hasRole = useCallback(
    (roles: Role | Role[]): boolean => {
      if (!user) return false;
      const roleList = Array.isArray(roles) ? roles : [roles];
      return roleList.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: accessTokenState || getAccessToken(),
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
