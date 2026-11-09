import { getDb } from "../mock/db";
import {
  clearSession,
  clearSessionCookie,
  readSession,
  setSessionCookie,
  writeSession,
  type MockSession,
} from "../mock/session";
import { mockRequest } from "./delay";
import { ApiError, ERROR_CODES } from "./errors";

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  description: string;
}

// Development-only credentials. They are constants in the mock adapter and are never stored
// in the mock database. Real authentication is owned by the private backend.
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: "admin@lplatform.dev",
    password: "Admin@123",
    label: "Platform administrator",
    description: "Full access to organizations, users, courses and platform settings.",
  },
  {
    email: "priya.sharma@riverside.edu",
    password: "OrgAdmin@123",
    label: "Organization administrator",
    description: "Access simulated for Riverside Public School administration.",
  },
];

function matchesDemoAccount(email: string, password: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find(
    (account) =>
      account.email.toLowerCase() === email.toLowerCase() && account.password === password,
  );
}

export const authService = {
  async login(email: string, password: string): Promise<MockSession> {
    return mockRequest("signing in", () => {
      const account = matchesDemoAccount(email, password);
      if (!account) {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, "Invalid email address or password.", {
          status: 401,
        });
      }
      const db = getDb();
      const user = db.users.find(
        (item) => item.email?.toLowerCase() === account.email.toLowerCase(),
      );
      if (!user || user.status !== "ACTIVE") {
        throw new ApiError(ERROR_CODES.UNAUTHORIZED, "This account is not active.", {
          status: 401,
        });
      }
      const session: MockSession = {
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email ?? account.email,
        role: user.role,
        organizationId: user.organizationId,
        issuedAt: new Date().toISOString(),
      };
      writeSession(session);
      setSessionCookie();
      return session;
    });
  },

  async logout(): Promise<void> {
    await mockRequest("signing out", () => undefined);
    clearSession();
    clearSessionCookie();
  },

  getSession(): MockSession | null {
    const session = readSession();
    if (!session) return null;
    const user = getDb().users.find((item) => item.id === session.userId);
    if (!user || user.status !== "ACTIVE") {
      clearSession();
      clearSessionCookie();
      return null;
    }
    return {
      ...session,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email ?? session.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  },
};
