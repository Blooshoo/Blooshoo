/**
 * Seed the database with the initial admin user.
 *
 * TWO WAYS TO USE THIS:
 *
 * 1. PLAINTEXT PASSWORD (for local dev):
 *    Set ADMIN_USERNAME, ADMIN_DISPLAY_NAME, and ADMIN_PASSWORD in .env, then:
 *      npm run seed
 *
 * 2. PRE-HASHED PASSWORD (for sharing with a friend/host):
 *    a) Run this on YOUR machine first:
 *         npx tsx scripts/generate-password.mjs yourpassword
 *    b) Copy the hash it prints
 *    c) Give ONLY the hash to your friend — never the plaintext password
 *    d) Your friend sets these in their .env:
 *         ADMIN_USERNAME=yourusername
 *         ADMIN_DISPLAY_NAME="Your Display Name"
 *         ADMIN_PASSWORD_HASH=$2a$12$... (the hash you generated)
 *    e) Your friend runs: npm run seed
 *
 * The friend never sees your password. bcrypt is one-way — you can't
 * recover the password from the hash.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "blooshoo.db");

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const displayName = process.env.ADMIN_DISPLAY_NAME;
  const plainPassword = process.env.ADMIN_PASSWORD;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!username || !displayName) {
    console.error(
      "Missing required env vars: ADMIN_USERNAME, ADMIN_DISPLAY_NAME",
    );
    process.exit(1);
  }

  if (!plainPassword && !passwordHash) {
    console.error(
      "You must set either ADMIN_PASSWORD (plaintext, for local dev)\n" +
        "or ADMIN_PASSWORD_HASH (pre-hashed, for sharing with a host).\n\n" +
        "To generate a hash:\n" +
        "  npx tsx scripts/generate-password.mjs yourpassword",
    );
    process.exit(1);
  }

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  // Check if user already exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    console.log(`User "${username}" already exists, skipping.`);
    process.exit(0);
  }

  // Use the pre-hashed password if provided, otherwise hash the plaintext
  const hash = passwordHash ?? (await bcrypt.hash(plainPassword!, 12));

  await db.insert(users).values({
    username,
    displayName,
    passwordHash: hash,
    role: "admin",
  });

  console.log(`Admin user "${username}" created successfully.`);
  if (plainPassword && !passwordHash) {
    console.log(
      "(Password was hashed from ADMIN_PASSWORD — remove that env var now if you want)",
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
