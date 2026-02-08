import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "auth_token";
const REQUEST_TIMEOUT_MS = 15_000;

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function notifySessionExpired(): void {
  for (const listener of sessionExpiredListeners) {
    listener();
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: Record<string, unknown>;
  requireAuth?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    requireAuth = false,
    headers: extraHeaders,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = options;

  const headers: Record<string, string> = {
    "X-Client-Type": "mobile",
    ...extraHeaders,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAuth) {
    const token = await getToken();
    if (!token) {
      return { success: false, error: "Authentication required. Please log in." };
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      await clearToken();
      notifySessionExpired();
      return { success: false, error: "Session expired. Please log in again." };
    }

    if (response.status === 429) {
      return { success: false, error: "Rate limit exceeded. Please try again later." };
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof DOMException && error.name === "AbortError") {
      return { success: false, error: "Request timed out. Please try again." };
    }

    const message = error instanceof Error ? error.message : "Network request failed";
    return { success: false, error: message };
  }
}
