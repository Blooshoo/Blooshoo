"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";

interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectFormData {
  id: number;
  title: string;
  description: string;
  category: "website" | "game" | "mod" | "other";
  links: ProjectLink[];
  image: string | null;
  ownerType: "mine" | "friend";
  ownerName: string | null;
  featured: boolean;
  sortOrder: number;
}

interface ProjectFormProps {
  project?: ProjectFormData | null;
  isAdmin: boolean;
}

function emptyLink(): ProjectLink {
  return { label: "", url: "" };
}

export function ProjectForm({ project, isAdmin }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!project;

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [category, setCategory] = useState<string>(
    project?.category ?? "website",
  );
  const [ownerType, setOwnerType] = useState<"mine" | "friend">(
    project?.ownerType ?? "mine",
  );
  const [ownerName, setOwnerName] = useState(project?.ownerName ?? "");
  const [links, setLinks] = useState<ProjectLink[]>(
    project?.links && project.links.length > 0
      ? project.links
      : [emptyLink()],
  );
  const [image, setImage] = useState(project?.image ?? "");
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addLink() {
    setLinks((prev) => [...prev, emptyLink()]);
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLink(index: number, field: "label" | "url", value: string) {
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const cleanLinks = links.filter((l) => l.label.trim() || l.url.trim());

      const body = {
        title: title.trim(),
        description: description.trim(),
        category,
        links: cleanLinks,
        image: image.trim() || null,
        ownerType,
        ownerName: ownerType === "friend" ? ownerName.trim() || null : null,
        featured: isAdmin ? featured : false,
        sortOrder: project?.sortOrder ?? 0,
      };

      const url = isEditing
        ? `/api/projects/${project!.id}`
        : "/api/projects";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      router.push("/bloo/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Name */}
      <div className="space-y-1.5">
        <Label htmlFor="p-title">Project Name *</Label>
        <Input
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Awesome Project"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="p-description">Description</Label>
        <Textarea
          id="p-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description of the project..."
          className="min-h-[100px] resize-y"
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="p-category">Category *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="p-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="game">Game</SelectItem>
            <SelectItem value="mod">Mod</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Owner */}
      <div className="space-y-3">
        <Label>Owner *</Label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="ownerType"
              value="mine"
              checked={ownerType === "mine"}
              onChange={() => setOwnerType("mine")}
              className="accent-primary"
            />
            <span className="text-sm">Mine</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="ownerType"
              value="friend"
              checked={ownerType === "friend"}
              onChange={() => setOwnerType("friend")}
              className="accent-primary"
            />
            <span className="text-sm">Friend&apos;s Project</span>
          </label>
        </div>
        {ownerType === "friend" && (
          <div className="ml-6 space-y-1.5">
            <Label htmlFor="p-owner-name">Friend&apos;s Name</Label>
            <Input
              id="p-owner-name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Your friend's name"
            />
          </div>
        )}
      </div>

      {/* Relevant Links */}
      <div className="space-y-3">
        <Label>Relevant Links</Label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="Label (e.g. GitHub)"
                className="flex-[2]"
              />
              <Input
                value={link.url}
                onChange={(e) => updateLink(i, "url", e.target.value)}
                placeholder="URL (e.g. https://...)"
                className="flex-[3]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(i)}
                disabled={links.length <= 1}
                className="shrink-0"
              >
                <X className="size-4" />
                <span className="sr-only">Remove link</span>
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addLink}>
          <Plus className="size-3" />
          Add another link
        </Button>
      </div>

      {/* Cover Image URL */}
      <div className="space-y-1.5">
        <Label htmlFor="p-image">Cover Image URL</Label>
        <Input
          id="p-image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/image.png"
        />
        <p className="text-xs text-muted-foreground">Optional</p>
      </div>

      {/* Featured (admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-3">
          <Switch
            id="p-featured"
            checked={featured}
            onCheckedChange={setFeatured}
          />
          <Label htmlFor="p-featured" className="cursor-pointer">
            Featured
          </Label>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {saving && <Loader2 className="animate-spin size-4" />}
          {isEditing ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
