import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// GET — list all users publicly (no auth required)
export async function GET() {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("GET /api/friends error:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}
