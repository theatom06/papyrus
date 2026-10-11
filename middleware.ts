import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    request.method === "GET"
  ) {
    return NextResponse.next();
  }
  if (request.cookies.get("papyrus-admin")?.value === "authenticated") {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/boards", "/api/papers/:path*"],
};
