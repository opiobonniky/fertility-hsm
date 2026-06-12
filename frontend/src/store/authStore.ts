import { create } from "zustand";
import { api } from "@/api/client";
import type { User, LoginRequest } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];

  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem("user") || "null"),
  isAuthenticated: !!(
    localStorage.getItem("user") && sessionStorage.getItem("accessToken")
  ),
  isLoading: false,
  permissions: JSON.parse(localStorage.getItem("permissions") || "[]"),

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ data: { user: User; accessToken: string } }>(
        "/auth/login",
        credentials,
      );
      const { user, accessToken } = response.data;

      sessionStorage.setItem("accessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });

      // Fetch permissions after login (fire-and-forget)
      get().fetchPermissions();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    }
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    set({ user: null, isAuthenticated: false, permissions: [] });
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }
    try {
      const response = await api.get<{ data: User }>("/auth/me");
      const user = response.data;
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, isAuthenticated: true });
    } catch {
      sessionStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      set({ user: null, isAuthenticated: false, permissions: [] });
    }
  },

  /**
   * Fetch the current user's role permissions from the backend.
   * Requires roleId to be set on the user object.
   */
  fetchPermissions: async () => {
    const { user } = get();
    if (!user?.roleId) return;

    try {
      const response = await api.get<{
        data: { id: string; key: string; name: string; module: string }[];
      }>(`/permissions/roles/${user.roleId}`);
      const perms = response.data.map((p) => p.key);
      localStorage.setItem("permissions", JSON.stringify(perms));
      set({ permissions: perms });
    } catch {
      // Permissions fetch failed silently — PermissionGate falls back to static map
    }
  },

  setUser: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
}));
