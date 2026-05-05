import { PostForm } from "../post-form";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Post</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new blog post.
        </p>
      </div>
      <PostForm />
    </div>
  );
}
