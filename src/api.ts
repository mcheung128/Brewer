import type { AppState, User } from "./types";

const TOKEN_KEY = "brewer-auth-token";

type AuthResponse = {
  token: string;
  user: User;
};

type RequestOptions = {
  body?: unknown;
  method?: "GET" | "POST" | "PUT";
  token?: string;
};

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return (await response.json()) as T;
};

export const getStoredToken = () => window.localStorage.getItem(TOKEN_KEY);

export const storeToken = (token: string) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = () => {
  window.localStorage.removeItem(TOKEN_KEY);
};

export const registerUser = async (name: string, email: string, password: string) =>
  request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { name, email, password },
  });

export const loginUser = async (email: string, password: string) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const logoutUser = async (token: string) => {
  await request<{ ok: true }>("/api/auth/logout", {
    method: "POST",
    token,
  });
};

export const fetchCurrentUser = async (token: string) =>
  request<{ user: User }>("/api/auth/me", {
    token,
  });

export const fetchRemoteState = async (token: string) =>
  request<{ state: AppState }>("/api/state", {
    token,
  });

export const saveRemoteState = async (token: string, state: AppState) => {
  await request<{ ok: true }>("/api/state", {
    method: "PUT",
    token,
    body: { state },
  });
};
