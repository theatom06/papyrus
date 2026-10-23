import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, cookieName } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ((request.method === "GET" &&
      request.nextUrl.searchParams.get("scope") !== "admin") ||
      (request.method === "POST" && request.nextUrl.pathname === "/api/papers"))
  ) {
    return NextResponse.next();
  }

  if (await verifyAdminToken(request.cookies.get(cookieName)?.value)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/boards/:path*", "/api/papers/:path*"],
};
