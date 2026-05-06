import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(process.cwd(), "blooshoo.db");

async function main() {
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  const hash = await bcrypt.hash("capesrule123!", 12);

  await db.update(users)
    .set({ passwordHash: hash })
    .where(eq(users.username, "blooshoo"));
  
  console.log("Password reset successfully");
}

main().catch(console.error);
