import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { posts } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const slug = "is-it-time-for-capes-to-make-a-comeback";
  const [post] = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);

  if (!post) {
    console.error("Post not found");
    await client.end();
    return;
  }

  const oldText = '<a target="_blank" rel="noopener noreferrer nofollow" class="text-[#00aaff] underline hover:text-[#00ffcc] transition-colors" href="http://blooshoo.com">blooshoo.com</a>/capes';
  const newText = '<a target="_blank" rel="noopener noreferrer nofollow" class="text-[#00aaff] underline hover:text-[#00ffcc] transition-colors" href="/capes">blooshoo.com/capes</a>';

  const updatedContent = post.content.replace(oldText, newText);

  await db.update(posts).set({ content: updatedContent }).where(eq(posts.slug, slug));
  
  console.log("Post updated successfully!");
  await client.end();
}

main().catch(console.error);
