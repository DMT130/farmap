import { createContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type User, type TokenResponse } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    address?: string;
    role?: string;
    pharmacy_id?: string;
  }) => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; address?: string }) => Promise<void>;
  refreshUser: (updated: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "farmamap_token";
const USER_KEY = "farmamap_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(false);

  // Persist token & user to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const handleAuthResponse = (res: TokenResponse) => {
    setToken(res.access_token);
    setUser(res.user);
  };

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      handleAuthResponse(res);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    address?: string;
    role?: string;
    pharmacy_id?: string;
  }) => {
    setLoading(true);
    try {
      const res = await authApi.register(data);
      handleAuthResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: { full_name?: string; phone?: string; address?: string }) => {
    if (!user) throw new Error("Not authenticated");
    const updated = await authApi.updateProfile(user.id, data);
    setUser(updated);
  };

  const refreshUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateProfile,
        refreshUser,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
