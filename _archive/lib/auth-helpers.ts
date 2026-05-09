import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Redirects to /bloo/login if the user is not authenticated.
 * Call this at the top of any /bloo server component or layout.
 */
export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/bloo/login");
  }

  return {
    id: session.user.id,
    displayName: session.user.name,
    role: (session.user as Record<string, unknown>).role as
      | "admin"
      | "contributor",
  };
}

/**
 * Redirects to /bloo if the user is authenticated but not an admin.
 * Call this after requireAuth() on admin-only pages.
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    redirect("/bloo");
  }
  return user;
}
