import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

// GET — list projects for a specific user by owner_id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = parseInt(id, 10);
    if (isNaN(ownerId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const results = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, ownerId))
      .orderBy(asc(projects.sortOrder), asc(projects.createdAt));

    const parsed = results.map((r) => ({
      ...r,
      links: JSON.parse(r.links),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("GET /api/friends/[id]/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
