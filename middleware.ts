import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "lplatform.mock.session";

// Frontend route boundary only. This cookie is not an authentication mechanism; all
// authorization will be enforced by the private backend API.
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value === "1";
  const { pathname, search } = request.nextUrl;

  if ((pathname.startsWith("/admin") || pathname.startsWith("/teacher")) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? "/admin/dashboard" : "/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/teacher/:path*"],
};
