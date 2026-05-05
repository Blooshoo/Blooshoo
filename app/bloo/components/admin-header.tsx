"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut, KeyRound } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { useState } from "react";

export function AdminHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 shrink-0">
      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="size-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
            <SheetTitle className="text-left text-base font-semibold">
              blooshoo admin
            </SheetTitle>
          </SheetHeader>
          <AdminSidebar onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Title */}
      <span className="font-semibold text-foreground tracking-tight">
        blooshoo admin
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Change password */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-muted-foreground gap-2"
      >
        <Link href="/bloo/change-password">
          <KeyRound className="size-4" />
          <span className="hidden sm:inline">Password</span>
        </Link>
      </Button>

      {/* Sign out */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground gap-2"
        onClick={() => signOut({ callbackUrl: "/bloo/login" })}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </header>
  );
}
