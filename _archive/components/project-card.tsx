"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

type ProjectLink = { label: string; url: string };

export type ProjectCardData = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  links: ProjectLink[] | string;
  image: string | null;
  ownerType: string;
  ownerName: string | null;
  ownerId: string | null;
  featured: boolean | null;
  sortOrder: number;
  createdAt: Date | number | string;
  updatedAt: Date | number | string;
};

const categoryColors: Record<string, string> = {
  website: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  game: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  mod: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  other:
    "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
};

export function ProjectCard({
  project,
  links,
  showOwner,
}: {
  project: ProjectCardData;
  links: ProjectLink[];
  showOwner: boolean;
}) {
  return (
    <article className="group rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-colors">
      {project.image && (
        <div className="relative h-52 bg-muted overflow-hidden">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
            unoptimized
          />
        </div>
      )}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {project.title}
            </h3>
            {showOwner && project.ownerName && (
              <p className="text-sm text-muted-foreground">
                by{" "}
                <span className="text-foreground/80 font-medium">
                  {project.ownerName}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {project.featured && (
              <Badge
                variant="default"
                className="text-xs bg-primary/20 text-primary border-primary/30"
              >
                Featured
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`text-xs ${categoryColors[project.category] ?? categoryColors.other}`}
            >
              {project.category}
            </Badge>
          </div>
        </div>

        {project.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {project.description}
          </p>
        )}

        {links.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-1">
            {links.map((link) => (
              <Button
                key={link.label + link.url}
                asChild
                size="sm"
                variant="outline"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.label}
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
