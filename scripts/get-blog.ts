import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { posts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";

const DB_PATH = path.join(process.cwd(), "blooshoo.db");

async function main() {
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  const [post] = await db.select().from(posts).where(eq(posts.slug, "is-it-time-for-capes-to-make-a-comeback")).limit(1);

  if (!post) {
    console.error("Post not found");
    return;
  }

  console.log("Found post:");
  console.log(post.content);
}

main().catch(console.error);
