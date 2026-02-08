import { create } from "zustand";
import { api } from "@/services/api-endpoints";
import { clearToken, getToken, onSessionExpired } from "@/services/api-client";

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for session expiry from the API client
  onSessionExpired(() => {
    set({
      isLoggedIn: false,
      isAdmin: false,
      userId: null,
      email: null,
      role: null,
    });
  });

  return {
    isLoggedIn: false,
    isAdmin: false,
    userId: null,
    email: null,
    role: null,
    isLoading: true,

    login: async (email, password) => {
      try {
        const res = await api.login(email, password);
        if (res.success && res.data) {
          set({
            isLoggedIn: true,
            isAdmin: res.data.role === "admin",
            userId: res.data.id,
            email: res.data.email,
            role: res.data.role,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    logout: async () => {
      try {
        await api.logout();
      } catch {
        // Proceed with local cleanup even if server call fails
      }
      set({
        isLoggedIn: false,
        isAdmin: false,
        userId: null,
        email: null,
        role: null,
      });
    },

    checkAuth: async () => {
      try {
        const token = await getToken();
        if (!token) {
          set({ isLoggedIn: false, isLoading: false });
          return;
        }
        const res = await api.getMe();
        if (res.success && res.data) {
          set({
            isLoggedIn: true,
            isAdmin: res.data.role === "admin",
            userId: res.data.userId,
            email: res.data.email,
            role: res.data.role,
            isLoading: false,
          });
        } else {
          await clearToken();
          set({ isLoggedIn: false, isLoading: false });
        }
      } catch {
        set({ isLoggedIn: false, isLoading: false });
      }
    },

    clearAuth: () => {
      set({
        isLoggedIn: false,
        isAdmin: false,
        userId: null,
        email: null,
        role: null,
      });
    },
  };
});
