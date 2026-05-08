import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "./components/admin-sidebar";
import { AdminHeader } from "./components/admin-header";

export default async function BlooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  const pathname = headersList.get("x-pathname") ?? "";
  const isLoginPage = pathname === "/bloo/login";

  // Valid session on the login page → send them to the dashboard
  if (session && isLoginPage) {
    redirect("/bloo");
  }

  // No valid session on a protected page → send to login
  // (middleware handles the cookie-level check; this is the DB-level fallback)
  if (!session && !isLoginPage) {
    redirect("/bloo/login");
  }

  // Render the login page without the admin shell
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* CRT scanline overlay */}
      <div className="scanlines" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card shrink-0">
        <AdminSidebar />
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
