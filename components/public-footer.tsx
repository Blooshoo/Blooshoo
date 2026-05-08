"use client";

import { usePathname } from "next/navigation";
import { ScenePicker } from "@/components/scene-picker";

export function PublicFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/bloo")) return null;

  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} bloo
          <ScenePicker />
          hoo
        </span>
      </div>
    </footer>
  );
}
