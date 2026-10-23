import { NextResponse } from "next/server";
import log from "@/lib/server-logger";
import adminLog from "@/lib/admin-logger";
import { allowRequest } from "@/lib/rate-limit";
import { clientAddress } from "@/lib/request-info";
import { createAdminToken, cookieName } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const address = clientAddress(request);

  if (!allowRequest(`admin-login:${address}`, 10, 15 * 60 * 1000))
    return NextResponse.json(
      { error: "Too many login attempts." },
      { status: 429 },
    );

  let body: { password?: string };

  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const rawHash = Uint8Array.fromBase64(
    process.env.ADMIN_PASSWORD_HASH as string,
  );
  const expectedHash = new TextDecoder().decode(rawHash).trim();

  if (!expectedHash) {
    log("FATAL: NO SERVER PASSWORD");
  }

  let valid = false;

  if (body.password && expectedHash) {
    try {
      valid = await bcrypt.compare(body.password, expectedHash);
    } catch (error) {
      await log("admin.login_failed", {
        reason: "invalid_password_hash",
        error: error instanceof Error ? error.message : "unsupported_hash",
      });
    }
  }

  if (!valid) {
    await Promise.all([
      log("admin.login_failed", { reason: "invalid_password" }),
      adminLog("admin.login_failed", { reason: "invalid_password" }),
    ]);
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  await Promise.all([
    log("admin.login_succeeded"),
    adminLog("admin.login_succeeded"),
  ]);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, await createAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  await Promise.all([log("admin.logout"), adminLog("admin.logout")]);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}
