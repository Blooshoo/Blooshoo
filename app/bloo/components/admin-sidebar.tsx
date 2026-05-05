"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Image,
  Users,
  KeyRound,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/bloo", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/bloo/posts", label: "Posts", icon: FileText, exact: false },
  { href: "/bloo/projects", label: "Projects", icon: FolderOpen, exact: false },
  { href: "/bloo/media", label: "Media", icon: Image, exact: false },
  { href: "/bloo/users", label: "Users", icon: Users, exact: false },
  { href: "/bloo/messages", label: "Messages", icon: MessageSquare, exact: false },
];

const bottomItems = [
  {
    href: "/bloo/change-password",
    label: "Change Password",
    icon: KeyRound,
    exact: false,
  },
];

export function AdminSidebar({ onNavClick }: { onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3 flex-1">
      <div className="px-3 py-2 mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Navigation
        </p>
      </div>
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}

      {/* Divider */}
      <div className="border-t border-border my-2" />

      {bottomItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
