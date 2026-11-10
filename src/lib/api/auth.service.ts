import {
  clearSession,
  clearSessionCookie,
  readSession,
  setSessionCookie,
  writeSession,
  type MockSession,
} from "../mock/session";
import { ApiError, ERROR_CODES } from "./errors";

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  description: string;
}

// Local development accounts seeded by the Backend. Never use these credentials outside this
// local development environment.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@lplatform.dev",
    password: "Admin@123",
    label: "Platform administrator",
    description: "Local development platform administrator.",
  },
  {
    email: "priya.sharma@riverside.edu",
    password: "OrgAdmin@123",
    label: "Organization administrator",
    description: "Local development organization administrator.",
  },
  {
    email: "teacher@riverside.edu",
    password: "Teacher@123",
    label: "Teacher",
    description: "Local development teacher account.",
  },
];

export const authService = {
  async login(email: string, password: string): Promise<MockSession> {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const response = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(ERROR_CODES.UNAUTHORIZED, payload.message || "Sign in failed.", {
        status: response.status,
      });
    }
    const user = payload.user;
    const session: MockSession = {
      userId: user.id,
      name: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      issuedAt: new Date().toISOString(),
    };
    writeSession(session);
    setSessionCookie();
    return session;
  },

  async logout(): Promise<void> {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    await fetch(`${base}/api/auth/logout`, { method: "POST", credentials: "include" });
    clearSession();
    clearSessionCookie();
  },

  getSession(): MockSession | null {
    const session = readSession();
    if (!session) return null;
    return session;
  },
};
