"use client";

import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className} aria-label="blooshoo home">
      <span className="logo-glitch" aria-hidden="true" data-text="BLOOSHOO">
        BLOOSHOO
      </span>
    </Link>
  );
}
