import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "../lib/db";
import path from "path";

migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
console.log("Migrations applied successfully.");
process.exit(0);
