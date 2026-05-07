import { NextRequest, NextResponse } from "next/server";

/**
 * Lightweight middleware — runs on Edge, so we CANNOT import the full
 * auth module (it pulls in better-sqlite3/fs which Edge doesn't support).
 *
 * Instead we do a simple cookie check. The layout (Node.js runtime) does
 * the full session validation against the database.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /bloo routes
  if (!pathname.startsWith("/bloo")) {
    return NextResponse.next();
  }

  // better-auth sets session cookies prefixed with "better-auth"
  const sessionCookie = request.cookies
    .getAll()
    .find((c) => c.name.startsWith("better-auth"));

  const isLoggedIn = !!sessionCookie;

  // Already authenticated on login page → redirect to /bloo
  if (pathname === "/bloo/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/bloo", request.url));
  }

  // Not authenticated on a protected bloo route → redirect to /bloo/login
  if (pathname !== "/bloo/login" && !isLoggedIn) {
    return NextResponse.redirect(new URL("/bloo/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/bloo/:path*"],
};
