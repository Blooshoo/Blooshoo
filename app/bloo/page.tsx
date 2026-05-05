import { db } from "@/lib/db";
import { posts, projects, media } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, Archive, FolderOpen, Image } from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [
    [totalPostsRow],
    [publishedPostsRow],
    [draftPostsRow],
    [totalProjectsRow],
    [totalMediaRow],
  ] = await Promise.all([
    db.select({ count: count() }).from(posts),
    db
      .select({ count: count() })
      .from(posts)
      .where(eq(posts.status, "published")),
    db.select({ count: count() }).from(posts).where(eq(posts.status, "draft")),
    db.select({ count: count() }).from(projects),
    db.select({ count: count() }).from(media),
  ]);

  return {
    totalPosts: totalPostsRow?.count ?? 0,
    publishedPosts: publishedPostsRow?.count ?? 0,
    draftPosts: draftPostsRow?.count ?? 0,
    totalProjects: totalProjectsRow?.count ?? 0,
    totalMedia: totalMediaRow?.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      href: "/bloo/posts",
      color: "text-blue-500",
    },
    {
      label: "Published",
      value: stats.publishedPosts,
      icon: Globe,
      href: "/bloo/posts?status=published",
      color: "text-green-500",
    },
    {
      label: "Drafts",
      value: stats.draftPosts,
      icon: Archive,
      href: "/bloo/posts?status=draft",
      color: "text-yellow-500",
    },
    {
      label: "Projects",
      value: stats.totalProjects,
      icon: FolderOpen,
      href: "/bloo/projects",
      color: "text-purple-500",
    },
    {
      label: "Media Files",
      value: stats.totalMedia,
      icon: Image,
      href: "/bloo/media",
      color: "text-pink-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back. Here&apos;s an overview of your content.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className={`size-5 ${color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {value}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/bloo/posts/new"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileText className="size-4" />
              Write a new post
            </Link>
            <Link
              href="/bloo/projects"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FolderOpen className="size-4" />
              Manage projects
            </Link>
            <Link
              href="/bloo/media"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Image className="size-4" />
              Upload media
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
