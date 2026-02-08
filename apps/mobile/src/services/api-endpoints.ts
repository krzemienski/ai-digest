import { request, setToken, clearToken, getToken } from "./api-client";
import type { Digest, DigestItem, Episode, Transcript } from "@ai-digest/shared";

// Auth types (not in shared package)
interface AuthUser {
  userId: string;
  email: string;
  role: "user" | "admin";
}

interface LoginResponse {
  id: string;
  email: string;
  role: string;
  token: string;
}

interface StatsResponse {
  totalItems: number;
  totalDigests: number;
  totalEpisodes: number;
  sources: number;
}

interface PipelineRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number;
}

interface PipelineStatus {
  current: PipelineRun | null;
  recent: PipelineRun[];
}

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    if (res.success && res.data?.token) {
      await setToken(res.data.token);
    }
    return res;
  },

  register: async (email: string, password: string, name: string) =>
    request<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: { email, password, name },
    }),

  logout: async () => {
    const res = await request("/api/auth/logout", {
      method: "POST",
      requireAuth: true,
    });
    await clearToken();
    return res;
  },

  getMe: () =>
    request<AuthUser>("/api/auth/me", { requireAuth: true }),

  // Digests
  getDigests: (page = 1, limit = 10) =>
    request<Digest[]>(`/api/digests?page=${page}&limit=${limit}`),

  getDigest: (id: string) =>
    request<Digest & { items: DigestItem[] }>(`/api/digests/${id}`),

  getLatestDigest: () =>
    request<Digest & { items: DigestItem[] }>("/api/digests/latest"),

  // Episodes
  getEpisodes: (page = 1, limit = 10) =>
    request<Episode[]>(`/api/episodes?page=${page}&limit=${limit}`),

  getEpisode: (id: string) =>
    request<Episode & { transcript: Transcript }>(`/api/episodes/${id}`),

  // Search
  search: (query: string, page = 1) =>
    request<DigestItem[]>(`/api/search?q=${encodeURIComponent(query)}&page=${page}`),

  // Newsletters
  subscribe: (email: string) =>
    request("/api/newsletter/subscribe", {
      method: "POST",
      body: { email },
    }),

  unsubscribe: (email: string) =>
    request("/api/newsletter/unsubscribe", {
      method: "POST",
      body: { email },
    }),

  // Admin
  getStats: () =>
    request<StatsResponse>("/api/admin/stats", { requireAuth: true }),

  getSources: () =>
    request<Source[]>("/api/admin/sources", { requireAuth: true }),

  getPipelineStatus: () =>
    request<PipelineStatus>("/api/admin/pipeline/status", { requireAuth: true }),

  triggerPipeline: () =>
    request<{ runId: string }>("/api/admin/pipeline/trigger", {
      method: "POST",
      requireAuth: true,
      body: { triggerType: "manual" },
    }),

  // Check if token is still valid
  isAuthenticated: async () => {
    const token = await getToken();
    return token !== null;
  },
};
