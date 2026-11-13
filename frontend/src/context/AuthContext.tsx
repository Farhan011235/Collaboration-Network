"use client";

import { createContext, useCallback, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { TOKEN_KEY } from "@/lib/axios";
import * as authService from "@/services/auth.service";
import type { AuthPayload, LoginData, RegisterData, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  // Re-reads the signed-in user from the API. Call after editing profile
  // fields so the navbar and dashboard don't show stale details.
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On first load, restore the session if a token is stored.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    authService
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback((payload: AuthPayload) => {
    localStorage.setItem(TOKEN_KEY, payload.token);
    setUser(payload.user);
  }, []);

  const login = useCallback(
    async (data: LoginData) => {
      persist(await authService.loginUser(data));
      router.push("/dashboard");
    },
    [persist, router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      persist(await authService.registerUser(data));
      router.push("/dashboard");
    },
    [persist, router]
  );

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authService.fetchCurrentUser());
    } catch {
      // A failed refresh leaves the existing user in place.
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
