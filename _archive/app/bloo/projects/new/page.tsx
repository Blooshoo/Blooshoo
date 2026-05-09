import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin =
    ((session?.user as Record<string, unknown>)?.role as string) === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Project</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new project to your portfolio.
        </p>
      </div>

      <div className="max-w-2xl">
        <ProjectForm isAdmin={isAdmin} />
      </div>
    </div>
  );
}
