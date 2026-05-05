"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border sticky top-0 z-50">
      <div className="content-panel">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo className="shrink-0" />

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-link px-3 py-1.5 text-sm font-medium",
                  pathname === href && "text-primary",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-56 p-0 flex flex-col">
              <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
                <SheetTitle className="text-left text-base font-semibold">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
