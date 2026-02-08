import { create } from "zustand";
import { api } from "@/services/api-endpoints";

interface PipelineRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number;
}

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

interface AdminState {
  stats: {
    totalItems: number;
    totalDigests: number;
    totalEpisodes: number;
    sources: number;
  } | null;
  pipelineStatus: {
    current: PipelineRun | null;
    recent: PipelineRun[];
  } | null;
  sources: Source[];
  isLoading: boolean;
  error: string | null;

  fetchStats: () => Promise<void>;
  fetchPipelineStatus: () => Promise<void>;
  fetchSources: () => Promise<void>;
  triggerPipeline: () => Promise<boolean>;
}

export const useAdminStore = create<AdminState>((set) => ({
  stats: null,
  pipelineStatus: null,
  sources: [],
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true });
    const res = await api.getStats();
    if (res.success && res.data) {
      set({ stats: res.data, isLoading: false });
    } else {
      set({ error: res.error ?? "Failed to load stats", isLoading: false });
    }
  },

  fetchPipelineStatus: async () => {
    const res = await api.getPipelineStatus();
    if (res.success && res.data) {
      set({ pipelineStatus: res.data });
    }
  },

  fetchSources: async () => {
    set({ isLoading: true });
    const res = await api.getSources();
    if (res.success && res.data) {
      set({ sources: res.data, isLoading: false });
    } else {
      set({ error: res.error ?? "Failed to load sources", isLoading: false });
    }
  },

  triggerPipeline: async () => {
    const res = await api.triggerPipeline();
    if (res.success) {
      // Refresh status after trigger
      const statusRes = await api.getPipelineStatus();
      if (statusRes.success && statusRes.data) {
        set({ pipelineStatus: statusRes.data });
      }
      return true;
    }
    set({ error: res.error ?? "Failed to trigger pipeline" });
    return false;
  },
}));
