import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { posts } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const [post] = await db.select().from(posts).where(eq(posts.slug, "is-it-time-for-capes-to-make-a-comeback")).limit(1);

  if (!post) {
    console.error("Post not found");
    await client.end();
    return;
  }

  console.log("Found post:");
  console.log(post.content);
  await client.end();
}

main().catch(console.error);
