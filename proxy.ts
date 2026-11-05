import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, cookieName } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  const isAPI = request.nextUrl.pathname.startsWith("/api/");
  const isGETAllowed =
    request.method === "GET" &&
    request.nextUrl.searchParams.get("scope") !== "admin";
  const isPOSTAllowed =
    request.method === "POST" &&
    (request.nextUrl.pathname === "/api/papers/upload" ||
      /^\/api\/papers\/[^/]+\/vote$/.test(request.nextUrl.pathname));

  if (isAPI && (isGETAllowed || isPOSTAllowed)) return NextResponse.next();

  if (await verifyAdminToken(request.cookies.get(cookieName)?.value)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/boards/:path*", "/api/papers/:path*"],
};
