import { NextResponse } from "next/server";

const cookieName = "papyrus-admin";
const issuer = "papyrus";
const audience = "papyrus-admin";

function secret() {
  const value = process.env.ADMIN_JWT_SECRET;
  if (!value) throw new Error("ADMIN_JWT_SECRET is not configured.");
  return value;
}

function encode(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;

  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decode(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sign(input: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return encode(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input)),
    ),
  );
}

export async function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encode(
    JSON.stringify({
      iss: issuer,
      aud: audience,
      sub: "admin",
      iat: now,
      exp: now + 60 * 60 * 8,
    }),
  );
  const content = `${header}.${payload}`;
  return `${content}.${await sign(content)}`;
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const expected = await sign(`${parts[0]}.${parts[1]}`);
    const actual = decode(parts[2]);
    const expectedBytes = decode(expected);
    if (actual.length !== expectedBytes.length) return false;
    let difference = 0;
    actual.forEach((byte, index) => {
      difference |= byte ^ expectedBytes[index];
    });
    if (difference !== 0) return false;
    const payload = JSON.parse(new TextDecoder().decode(decode(parts[1]))) as {
      iss?: string;
      aud?: string;
      sub?: string;
      exp?: number;
    };
    return (
      payload.iss === issuer &&
      payload.aud === audience &&
      payload.sub === "admin" &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function requireAdmin(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];
  if (await verifyAdminToken(token)) return null;
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 },
  );
}

export { cookieName };
