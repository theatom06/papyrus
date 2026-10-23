import bcrypt from "bcryptjs";
const password = prompt("Admin password:")?.trim();

if (!password) {
  throw new Error("A non-empty password is required.");
}

// Hash the password using bcrypt with a cost factor of 12
const hash = await bcrypt.hash(password, 12);

const envPath = ".env.local";
const existing = (await Bun.file(envPath).exists())
  ? await Bun.file(envPath).text()
  : "";

console.log(hash);

const hashbytes = new TextEncoder().encode(hash);
const hashToStore = hashbytes.toBase64();

// Update or append the ADMIN_PASSWORD_HASH in .env.local
const next = existing.match(/^ADMIN_PASSWORD_HASH=.*$/m)
  ? existing.replace(
      /^ADMIN_PASSWORD_HASH=.*$/m,
      `ADMIN_PASSWORD_HASH=${hashToStore}`,
    )
  : `${existing}${existing.endsWith("\n") || !existing ? "" : "\n"}ADMIN_PASSWORD_HASH=${hashToStore}\n`;

await Bun.write(envPath, next);

console.log(`Stored bcrypt hash in ${envPath}.`);
