import { create } from "zustand";
import { api } from "@/services/api-endpoints";
import type { Digest, DigestItem } from "@ai-digest/shared";

interface DigestState {
  digests: Digest[];
  currentDigest: (Digest & { items: DigestItem[] }) | null;
  isLoading: boolean;
  isRefreshing: boolean;
  page: number;
  hasMore: boolean;
  error: string | null;

  fetchDigests: (page?: number) => Promise<void>;
  fetchDigest: (id: string) => Promise<void>;
  fetchLatestDigest: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export const useDigestStore = create<DigestState>((set, get) => ({
  digests: [],
  currentDigest: null,
  isLoading: false,
  isRefreshing: false,
  page: 1,
  hasMore: true,
  error: null,

  fetchDigests: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getDigests(page);
      if (res.success && res.data) {
        set({
          digests: page === 1 ? res.data : [...get().digests, ...res.data],
          page,
          hasMore: (res.meta?.total ?? 0) > page * 10,
          isLoading: false,
        });
      } else {
        set({ error: res.error ?? "Failed to load digests", isLoading: false });
      }
    } catch {
      set({ error: "Network error. Please check your connection.", isLoading: false });
    }
  },

  fetchDigest: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getDigest(id);
      if (res.success && res.data) {
        set({ currentDigest: res.data, isLoading: false });
      } else {
        set({ error: res.error ?? "Failed to load digest", isLoading: false });
      }
    } catch {
      set({ error: "Network error. Please check your connection.", isLoading: false });
    }
  },

  fetchLatestDigest: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getLatestDigest();
      if (res.success && res.data) {
        set({ currentDigest: res.data, isLoading: false });
      } else {
        set({ error: res.error ?? "Failed to load latest digest", isLoading: false });
      }
    } catch {
      set({ error: "Network error. Please check your connection.", isLoading: false });
    }
  },

  refresh: async () => {
    set({ isRefreshing: true });
    try {
      const res = await api.getDigests(1);
      if (res.success && res.data) {
        set({
          digests: res.data,
          page: 1,
          hasMore: (res.meta?.total ?? 0) > 10,
          isRefreshing: false,
        });
      } else {
        set({ isRefreshing: false });
      }
    } catch {
      set({ isRefreshing: false });
    }
  },

  loadMore: async () => {
    const { page, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;
    await get().fetchDigests(page + 1);
  },
}));
