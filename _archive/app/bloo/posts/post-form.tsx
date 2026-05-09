"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { slugify } from "@/lib/utils";
import type { Post } from "@/lib/db/schema";
import { Loader2, Save, Sparkles, Tags, Wand2, X } from "lucide-react";

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor"), {
  ssr: false,
});

interface PostFormProps {
  post?: Post;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    post?.status ?? "draft",
  );
  const [tagInput, setTagInput] = useState(
    post ? JSON.parse(post.tags ?? "[]").join(", ") : "",
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEdit);

  const [saving, setSaving] = useState(false);
  const [aiExcerptLoading, setAiExcerptLoading] = useState(false);
  const [aiTagsLoading, setAiTagsLoading] = useState(false);
  const [aiImproveLoading, setAiImproveLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  // Auto-generate excerpt from first 160 chars of body text (HTML stripped)
  function autoExcerpt(): string {
    const plain = stripHtml(content).trim();
    if (plain.length <= 160) return plain;
    return plain.slice(0, 160).trimEnd() + "…";
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const tags = parseTags(tagInput);
      // Auto-generate excerpt if blank
      const finalExcerpt = excerpt || autoExcerpt();
      const body = {
        title,
        slug,
        content,
        excerpt: finalExcerpt,
        coverImage: coverImage || null,
        status,
        tags,
      };
      const url = isEdit ? `/api/posts/${post.id}` : "/api/posts";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      router.push("/bloo/posts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateExcerpt() {
    if (!title || !content) return;
    setAiExcerptLoading(true);
    try {
      const res = await fetch("/api/ai/excerpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (data.excerpt) setExcerpt(data.excerpt);
    } finally {
      setAiExcerptLoading(false);
    }
  }

  async function handleSuggestTags() {
    if (!title || !content) return;
    setAiTagsLoading(true);
    try {
      const res = await fetch("/api/ai/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (Array.isArray(data.tags)) {
        setTagInput(data.tags.join(", "));
      }
    } finally {
      setAiTagsLoading(false);
    }
  }

  async function handleImproveWriting() {
    if (!content) return;
    setAiImproveLoading(true);
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();
      if (data.result) setContent(data.result);
    } finally {
      setAiImproveLoading(false);
    }
  }

  const currentTags = parseTags(tagInput);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="text-base"
        />
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugManuallyEdited(true);
          }}
          placeholder="post-slug"
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          URL: /blog/{slug || "…"}
        </p>
      </div>

      <Separator />

      {/* Content — Rich Text Editor */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Content</Label>
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImproveWriting}
              disabled={aiImproveLoading || !content}
              className="gap-1.5 text-xs"
            >
              {aiImproveLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Wand2 className="size-3" />
              )}
              AI Improve
            </Button>
          )}
        </div>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateExcerpt}
            disabled={aiExcerptLoading || !title || !content}
            className="gap-1.5 text-xs"
          >
            {aiExcerptLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Sparkles className="size-3" />
            )}
            Generate excerpt
          </Button>
        </div>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief description of the post… (auto-generated if blank)"
          className="min-h-20 resize-y"
        />
      </div>

      {/* Cover Image */}
      <div className="space-y-1.5">
        <Label htmlFor="coverImage">Cover Image URL</Label>
        <Input
          id="coverImage"
          type="url"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://..."
        />
        {coverImage && (
          <div className="relative w-full max-w-xs mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover preview"
              className="rounded-md object-cover w-full max-h-40 border border-border"
            />
            <button
              type="button"
              onClick={() => setCoverImage("")}
              className="absolute top-1 right-1 bg-background rounded-full p-0.5 shadow border border-border"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggestTags}
            disabled={aiTagsLoading || !title || !content}
            className="gap-1.5 text-xs"
          >
            {aiTagsLoading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Tags className="size-3" />
            )}
            Suggest tags
          </Button>
        </div>
        <Input
          id="tags"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="nextjs, typescript, webdev"
        />
        {currentTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {currentTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          className="flex h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving || !title}>
          {saving ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {isEdit ? "Save changes" : "Create post"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/bloo/posts")}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
