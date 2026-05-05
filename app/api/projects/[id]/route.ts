import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

interface ProjectLink {
  label: string;
  url: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

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

    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const parsed = {
      ...result,
      links: JSON.parse(result.links) as ProjectLink[],
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      links,
      image,
      ownerType,
      ownerName,
      featured,
      sortOrder,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (links !== undefined)
      updateData.links = JSON.stringify(Array.isArray(links) ? links : []);
    if (image !== undefined) updateData.image = image;
    if (ownerType !== undefined) updateData.ownerType = ownerType;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Only admins can set featured
    if (featured !== undefined && session.user.role === "admin") {
      updateData.featured = featured;
    }

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const result = {
      ...updated,
      links: JSON.parse(updated.links) as ProjectLink[],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
