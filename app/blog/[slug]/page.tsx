import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { db } from "@/lib/db";
import { posts, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const published = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"));

  return published.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!post) return { title: "Post not found" };

  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: post.coverImage
      ? { images: [{ url: post.coverImage }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const [row] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      status: posts.status,
      tags: posts.tags,
      authorId: posts.authorId,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorDisplayName: users.displayName,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (!row) notFound();

  const tags = JSON.parse(row.tags) as string[];

  const cleanContent = sanitizeHtml(row.content, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "strong", "b", "em", "i", "s", "u",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "class", "target", "rel"],
      img: ["src", "alt", "class"],
      span: ["style", "class"],
      "*": ["class"],
    },
    allowedStyles: {
      span: {
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/, /^rgba\(/],
      },
    },
    // Force noopener on external links
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer" },
      }),
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="content-block">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-10"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All posts
        </Link>

        {/* Header */}
        <header className="space-y-4 mb-10">
          <div className="flex items-center gap-2 flex-wrap">
            <time className="text-sm text-muted-foreground">
              {formatDate(row.createdAt)}
            </time>
            {row.authorDisplayName && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-sm text-muted-foreground">
                  By: {row.authorDisplayName}
                </span>
              </>
            )}
            {tags.length > 0 && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <div className="flex gap-1 flex-wrap">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight font-heading">
            {row.title}
          </h1>
          {row.excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {row.excerpt}
            </p>
          )}
        </header>

        {/* Cover image */}
        {row.coverImage && (
          <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-muted mb-10">
            <Image
              src={row.coverImage}
              alt={row.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose-bloo"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      </div>
      {/* Footer */}
      <div className="mt-8 pt-8 border-t border-border">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to all posts
        </Link>
      </div>
    </div>
  );
}
