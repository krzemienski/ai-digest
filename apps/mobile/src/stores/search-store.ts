import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/services/api-endpoints";
import type { DigestItem } from "@ai-digest/shared";

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT = 10;

interface SearchState {
  query: string;
  results: DigestItem[];
  recentSearches: string[];
  isLoading: boolean;
  error: string | null;

  setQuery: (query: string) => void;
  search: (query: string) => Promise<void>;
  loadRecentSearches: () => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  recentSearches: [],
  isLoading: false,
  error: null,

  setQuery: (query) => set({ query }),

  search: async (query) => {
    if (!query.trim()) {
      set({ results: [], error: null });
      return;
    }
    set({ isLoading: true, error: null, query });
    try {
      const res = await api.search(query);
      if (res.success && res.data) {
        set({ results: res.data, isLoading: false });
        const recent = get().recentSearches.filter((s) => s !== query);
        const updated = [query, ...recent].slice(0, MAX_RECENT);
        set({ recentSearches: updated });
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } else {
        set({ error: res.error ?? "Search failed", isLoading: false });
      }
    } catch {
      set({ error: "Network error. Please check your connection.", isLoading: false });
    }
  },

  loadRecentSearches: async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ recentSearches: parsed as string[] });
        }
      }
    } catch {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  },

  clearRecentSearches: async () => {
    set({ recentSearches: [] });
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  },

  clearResults: () => set({ results: [], query: "", error: null }),
}));
