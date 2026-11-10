const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function backendRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Backend request failed (${response.status})`);
  }
  return payload as T;
}
