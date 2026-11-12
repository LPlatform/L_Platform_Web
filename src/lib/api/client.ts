import { API_BASE as API_BASE_URL } from "@/lib/api/base";
const API_BASE = API_BASE_URL;

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Backend request failed (${response.status})`);
  }
  return payload as T;
}
