/**
 * Reset the admin user's password and email.
 * Reads from .env — set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD first.
 *
 * Usage: npm run reset-admin
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users, account } from "../lib/db/schema";
import { and, eq } from "drizzle-orm";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "blooshoo.db");

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const plainPassword = process.env.ADMIN_PASSWORD;

  if (!username || !email || !plainPassword) {
    console.error("Missing required env vars: ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD");
    process.exit(1);
  }

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    console.error(`User "${username}" not found. Run npm run seed instead.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(plainPassword, 12);

  // Update users table (email + password hash)
  await db
    .update(users)
    .set({ email, passwordHash: hash, emailVerified: true })
    .where(eq(users.id, user.id));

  // Update account.password — this is what better-auth validates against
  await db
    .update(account)
    .set({ password: hash })
    .where(and(eq(account.userId, user.id), eq(account.providerId, "credential")));

  console.log(`Admin "${username}" updated — email: ${email}, password: reset.`);
}

main().catch(console.error);
