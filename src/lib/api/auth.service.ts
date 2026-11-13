import { API_BASE as API_BASE_URL } from "@/lib/api/base";
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

export const SHOW_DEMO_ACCOUNTS =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS !== "false";

// Local development accounts seeded by the Backend. Strictly excluded from production client bundles.
export const DEMO_ACCOUNTS: DemoAccount[] =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS !== "false"
    ? [
        {
          email: "admin@lplatform.dev",
          password: "Admin@123",
          label: "Platform owner",
          description: "Local development platform owner.",
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
      ]
    : [];

export const authService = {
  async login(email: string, password: string): Promise<MockSession> {
    const base = API_BASE_URL;
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
    if (user?.role === "STUDENT") {
      await fetch(`${base}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(
        () => undefined,
      );
      clearSession();
      clearSessionCookie();
      throw new ApiError(
        ERROR_CODES.FORBIDDEN,
        "Student accounts must sign in using the L_Platform Student Desktop application.",
        { status: 403 },
      );
    }
    const session: MockSession = {
      userId: user.id,
      name: user.name || `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      issuedAt: new Date().toISOString(),
    };
    writeSession(session);
    setSessionCookie(session.role);
    return session;
  },

  async logout(): Promise<void> {
    const base = API_BASE_URL;
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
