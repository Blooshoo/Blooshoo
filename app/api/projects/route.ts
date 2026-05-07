import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";

interface ProjectLink {
  label: string;
  url: string;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const role = (session?.user as Record<string, unknown>)?.role as
      | string
      | null;
    const userId = session ? Number(session.user.id) : null;

    let results;

    if (role === "admin") {
      // Admins see all projects
      results = await db
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
        .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
    } else if (role === "contributor" && userId !== null) {
      // Contributors only see their own projects
      results = await db
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
        .where(eq(projects.ownerId, userId))
        .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
    } else {
      // Unauthenticated: return all projects
      results = await db
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
        .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
    }

    // Parse links JSON strings back to arrays
    const parsed = results.map((r) => ({
      ...r,
      links: JSON.parse(r.links) as ProjectLink[],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;

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

    if (!title || !category || !ownerType) {
      return NextResponse.json(
        { error: "Title, category, and ownerType are required" },
        { status: 400 },
      );
    }

    // Only admins can set featured
    const safeFeatured = role === "admin" ? (featured ?? false) : false;

    const now = new Date();
    const ownerId = Number(session.user.id);
    const [project] = await db
      .insert(projects)
      .values({
        title,
        description: description ?? "",
        category,
        links: JSON.stringify(Array.isArray(links) ? links : []),
        image: image ?? null,
        ownerType,
        ownerName: ownerName ?? null,
        ownerId,
        featured: safeFeatured,
        sortOrder: sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Parse links back for the response
    const result = {
      ...project,
      links: JSON.parse(project.links) as ProjectLink[],
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
