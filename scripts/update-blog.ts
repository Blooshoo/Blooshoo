import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { posts } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import path from "path";

const DB_PATH = path.join(process.cwd(), "blooshoo.db");

async function main() {
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);

  const slug = "is-it-time-for-capes-to-make-a-comeback";
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);

  if (!post) {
    console.error("Post not found");
    return;
  }

  const oldText = '<a target="_blank" rel="noopener noreferrer nofollow" class="text-[#00aaff] underline hover:text-[#00ffcc] transition-colors" href="http://blooshoo.com">blooshoo.com</a>/capes';
  const newText = '<a target="_blank" rel="noopener noreferrer nofollow" class="text-[#00aaff] underline hover:text-[#00ffcc] transition-colors" href="/capes">blooshoo.com/capes</a>';

  const updatedContent = post.content.replace(oldText, newText);

  await db.update(posts).set({ content: updatedContent }).where(eq(posts.slug, slug));
  
  console.log("Post updated successfully!");
}

main().catch(console.error);
