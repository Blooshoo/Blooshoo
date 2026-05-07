import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Star, ExternalLink } from "lucide-react";
import { ProjectRowActions } from "./project-row-actions";

interface ProjectLink {
  label: string;
  url: string;
}

interface ProjectRow {
  id: number;
  title: string;
  description: string;
  category: "website" | "game" | "mod" | "other";
  links: string;
  image: string | null;
  ownerType: "mine" | "friend";
  ownerName: string | null;
  ownerId: number | null;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  authorDisplayName: string | null;
}

const selectColumns = {
  id: projects.id,
  title: projects.title,
  description: projects.description,
  category: projects.category,
  links: projects.links,
  image: projects.image,
  ownerType: projects.ownerType,
  ownerName: projects.ownerName,
  ownerId: projects.ownerId,
  featured: projects.featured,
  sortOrder: projects.sortOrder,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  authorDisplayName: users.displayName,
};

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const role = (session?.user as Record<string, unknown>)?.role as
    | string
    | null;
  const userId = session ? Number(session.user.id) : null;

  let allProjects: ProjectRow[];

  if (role === "admin") {
    allProjects = (await db
      .select(selectColumns)
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .orderBy(
        asc(projects.sortOrder),
        asc(projects.createdAt),
      )) as ProjectRow[];
  } else if (role === "contributor" && userId !== null) {
    allProjects = (await db
      .select(selectColumns)
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .where(eq(projects.ownerId, userId))
      .orderBy(
        asc(projects.sortOrder),
        asc(projects.createdAt),
      )) as ProjectRow[];
  } else {
    allProjects = [];
  }

  const parsed = allProjects.map((p) => ({
    ...p,
    links: JSON.parse(p.links) as ProjectLink[],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {parsed.length} project{parsed.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/bloo/projects/new">
            <Plus className="size-4" />
            New Project
          </Link>
        </Button>
      </div>

      {parsed.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-border rounded-lg">
          <p className="text-lg font-medium">No projects yet</p>
          <p className="text-sm mt-1">Create your first project.</p>
          <Button className="mt-4" asChild>
            <Link href="/bloo/projects/new">
              <Plus className="size-4" />
              New Project
            </Link>
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="w-25">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{project.title}</span>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {project.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {project.ownerType === "friend"
                        ? (project.ownerName ?? "Friend")
                        : "Mine"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {project.featured ? (
                      <Star className="size-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {(project.links as ProjectLink[]).map(
                        (link: ProjectLink, i: number) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {link.label}
                          </a>
                        ),
                      )}
                      {(project.links as ProjectLink[]).length === 0 && (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProjectRowActions projectId={project.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
