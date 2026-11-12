"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { authService, clearSessionCookie, type MockSession } from "@/lib/api";

const DEVELOPER_RESTRICTED_PREFIXES = [
  "/admin/dashboard",
  "/admin/organizations",
  "/admin/users",
  "/admin/students",
  "/admin/teachers",
  "/admin/classes",
  "/admin/sections",
  "/admin/allocations",
  "/admin/invitations",
  "/admin/assignments",
  "/admin/reports",
  "/admin/audit-logs",
  "/admin/search",
];

interface SessionContextValue {
  session: MockSession;
  signOut: () => Promise<void>;
}

const SessionContext = React.createContext<SessionContextValue | undefined>(undefined);

function SessionLoading() {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-4">
      <div className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl shadow-lg">
        <span className="text-lg font-bold">L</span>
      </div>
      <p className="text-muted-foreground text-sm">Opening the workspace…</p>
    </div>
  );
}

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = React.useState<MockSession | null | undefined>(undefined);

  React.useEffect(() => {
    const current = authService.getSession();
    if (!current || current.role === "STUDENT") {
      // The mock cookie can outlive localStorage (for example after clearing site data),
      // so remove it before returning to the login screen to avoid a redirect loop.
      clearSessionCookie();
      setSession(null);
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (current.role === "TEACHER" && pathname.startsWith("/admin")) {
      router.replace("/teacher/dashboard");
      return;
    }
    if (
      current.role === "PLATFORM_DEVELOPER" &&
      (pathname.startsWith("/teacher") ||
        DEVELOPER_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
    ) {
      router.replace("/admin/courses");
      return;
    }
    setSession(current);
  }, [pathname, router]);

  const signOut = React.useCallback(async () => {
    await authService.logout();
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = React.useMemo<SessionContextValue | null>(
    () => (session ? { session, signOut } : null),
    [session, signOut],
  );

  if (!value) return <SessionLoading />;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useOptionalSession(): SessionContextValue | undefined {
  return React.useContext(SessionContext);
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside AdminSessionProvider");
  }
  return context;
}
