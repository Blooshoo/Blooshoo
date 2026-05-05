import type { Metadata } from "next";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { FriendshipCircle } from "@/components/friendship-circle";

export const metadata: Metadata = {
  title: "Friendship Circle",
  description: "Blooshoo's Friendship Circle — projects from friends.",
};

export default async function ProjectsPage() {
  // ── All users (the friends) ────────────────────────────────────
  const allUsers = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
    })
    .from(users)
    .orderBy(users.createdAt);

  // ── Admin's projects (blooshoo, pre-fetched for instant display) ─
  const adminUser = allUsers.find(
    (u) => u.role === "admin" && u.username === "blooshoo",
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsedAdminProjects: any[] = [];
  if (adminUser) {
    const raw = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, adminUser.id))
      .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
    for (const p of raw) {
      parsedAdminProjects.push({
        ...p,
        links: JSON.parse(p.links),
      });
    }
  }

  return (
    <FriendshipCircle friends={allUsers} adminProjects={parsedAdminProjects} />
  );
}
