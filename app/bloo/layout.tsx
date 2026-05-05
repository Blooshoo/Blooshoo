import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "./components/admin-sidebar";
import { AdminHeader } from "./components/admin-header";

export default async function BlooLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not logged in, only allow the login page through.
  // Without this check the layout would redirect /bloo/login → /bloo/login
  // in an infinite loop because the login page is nested under /bloo.
  if (!session) {
    // Middleware already blocks non-login /bloo routes, so if we reach here
    // without a session the request MUST be for /bloo/login. Just render
    // the children (the login form) without the admin chrome.
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
