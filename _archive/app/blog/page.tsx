import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts, articles, and notes by blooshoo",
};

export default async function BlogPage() {
  type PostRow = typeof posts.$inferSelect;
  let allPosts: PostRow[] = [];
  try {
    allPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.createdAt));
  } catch {
    // DB unavailable at build time — render empty state
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="content-block">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            Blog
          </h1>
          <p className="text-muted-foreground mt-2">
            Thoughts, articles, and notes.
          </p>
        </div>
        {allPosts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No posts yet.</p>
            <p className="text-muted-foreground text-sm mt-1">
              Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {allPosts.map((post) => {
              const tags = JSON.parse(post.tags) as string[];
              return (
                <article
                  key={post.id}
                  className="group border-b border-border last:border-0 py-8 first:pt-0"
                >
                  <Link href={`/blog/${post.slug}`} className="block space-y-3">
                    {post.coverImage && (
                      <div className="relative h-48 rounded-lg overflow-hidden bg-muted mb-4">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <time className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </time>
                      {tags.length > 0 && (
                        <>
                          <span className="text-muted-foreground text-xs">
                            ·
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read more
                      <span aria-hidden>→</span>
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
