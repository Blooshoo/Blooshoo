import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "./components/admin-sidebar";
import { AdminHeader } from "./components/admin-header";

export default async function BlooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If not logged in, only allow the login page through.
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
