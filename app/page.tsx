import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { posts, projects } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArrowRight, ExternalLink } from "lucide-react";

type ProjectLink = { label: string; url: string };

export default async function HomePage() {
  type PostRow = typeof posts.$inferSelect;
  type ProjectRow = typeof projects.$inferSelect;
  let latestPosts: PostRow[] = [];
  let featuredProjects: ProjectRow[] = [];
  try {
    latestPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.createdAt))
      .limit(3);

    featuredProjects = await db
      .select()
      .from(projects)
      .where(and(eq(projects.featured, true), eq(projects.ownerType, "mine")))
      .orderBy(projects.sortOrder);
  } catch {
    // DB unavailable at build time — render with empty data
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16 space-y-12 sm:space-y-20">
      <div className="content-block space-y-12 sm:space-y-20">
        {/* Hero */}
        <section className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-heading">
            Hi, I&apos;m <span className="text-primary">blooshoo</span>
            <span className="blink-cursor" aria-hidden="true" />
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            I build things for the web and occasionally write about it. This is
            my little corner of the internet — projects, thoughts, and whatever
            else I find interesting.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Read the blog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              See projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Latest Posts */}
        {latestPosts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold font-heading">
                Latest posts
              </h2>
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                All posts <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-px">
              {latestPosts.map((post) => {
                const tags = JSON.parse(post.tags) as string[];
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex items-start justify-between gap-4 py-4 border-b border-border last:border-0 hover:bg-accent/30 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {post.excerpt}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {formatDate(post.createdAt)}
                    </time>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold font-heading">
                Featured projects
              </h2>
              <Link
                href="/projects"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                All projects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredProjects.map((project) => {
                const links = JSON.parse(project.links) as ProjectLink[];
                return (
                  <div
                    key={project.id}
                    className="group rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                  >
                    {project.image && (
                      <div className="relative h-36 mb-3 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={project.image}
                          alt={project.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {links.length > 0 && (
                        <a
                          href={links[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                          aria-label={`Visit ${project.title}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex gap-1 flex-wrap mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {project.category}
                      </Badge>
                      {links.slice(0, 2).map((link) => (
                        <a
                          key={link.label + link.url}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2"
                            asChild
                          >
                            <span className="inline-flex items-center gap-1">
                              <ExternalLink className="h-2.5 w-2.5" />
                              {link.label}
                            </span>
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
