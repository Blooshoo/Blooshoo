import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Redirects to /bloo/login if the user is not authenticated.
 * Call this at the top of any /bloo server component or layout.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/bloo/login");
  }
  return session;
}

/**
 * Redirects to /bloo if the user is authenticated but not an admin.
 * Call this after requireAuth() on admin-only pages.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/bloo");
  }
  return session;
}
