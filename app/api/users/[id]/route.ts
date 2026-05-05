import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// DELETE — delete a user (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Prevent deleting yourself
    if (String(userId) === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// PUT — reset password (admin only)
// Generates a random temp password, hashes & updates, returns plaintext temp
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const tempPassword = randomBytes(9).toString("base64url");

    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const [updated] = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
      });

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      tempPassword,
      username: updated.username,
    });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
