import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "lplatform.mock.session";
const ROLE_COOKIE = "lplatform.role";

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

function homeForRole(role: string | undefined): string {
  if (role === "TEACHER") return "/teacher/dashboard";
  if (role === "PLATFORM_DEVELOPER") return "/admin/courses";
  return "/admin/dashboard";
}

// Frontend route boundary only. These cookies are not an authentication mechanism; all
// authorization is enforced by the private backend API using HttpOnly JWT + PostgreSQL RLS.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === "1";
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const { pathname, search } = request.nextUrl;

  if ((pathname.startsWith("/admin") || pathname.startsWith("/teacher")) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (
    hasSession &&
    role === "STUDENT" &&
    (pathname.startsWith("/admin") || pathname.startsWith("/teacher"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && role === "TEACHER" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  }

  if (
    hasSession &&
    role === "PLATFORM_DEVELOPER" &&
    (pathname.startsWith("/teacher") ||
      DEVELOPER_RESTRICTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)))
  ) {
    return NextResponse.redirect(new URL("/admin/courses", request.url));
  }

  if (pathname === "/login" && hasSession && role !== "STUDENT") {
    return NextResponse.redirect(new URL(homeForRole(role), request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession && role !== "STUDENT" ? homeForRole(role) : "/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*"],
};
