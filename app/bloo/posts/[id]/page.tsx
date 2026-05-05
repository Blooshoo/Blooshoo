import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PostForm } from "../post-form";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) notFound();

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
        <p className="text-muted-foreground text-sm mt-1 line-clamp-1">
          {post.title}
        </p>
      </div>
      <PostForm post={post} />
    </div>
  );
}
