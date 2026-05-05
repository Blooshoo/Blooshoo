import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProjectForm } from "../project-form";

interface ProjectLink {
  label: string;
  url: string;
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const { id } = await params;
  const projectId = parseInt(id, 10);
  if (isNaN(projectId)) notFound();

  const [result] = await db
    .select({
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
    })
    .from(projects)
    .leftJoin(users, eq(projects.ownerId, users.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!result) notFound();

  const project = {
    ...result,
    links: JSON.parse(result.links) as ProjectLink[],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Project</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Editing &ldquo;{project.title}&rdquo;
        </p>
      </div>

      <div className="max-w-2xl">
        <ProjectForm project={project} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
