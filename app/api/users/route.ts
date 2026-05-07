import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users, account } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET — list all users (admin only)
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST — create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, displayName, password, role: newRole } = body;

    if (!username || !displayName || !password || !newRole) {
      return NextResponse.json(
        { error: "username, displayName, password, and role are required" },
        { status: 400 },
      );
    }

    if (!["admin", "contributor"].includes(newRole)) {
      return NextResponse.json(
        { error: "role must be 'admin' or 'contributor'" },
        { status: 400 },
      );
    }

    // Check for duplicate username
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        displayName,
        passwordHash,
        role: newRole as "admin" | "contributor",
        email: `${username}@blooshoo.internal`, // better-auth requires valid email format
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      });

    // Create the matching account row for better-auth credentials auth
    await db.insert(account).values({
      id: `credential-${newUser.id}`,
      accountId: String(newUser.id),
      providerId: "credential",
      userId: newUser.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
