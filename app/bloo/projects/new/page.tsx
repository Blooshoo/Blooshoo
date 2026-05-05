import { auth } from "@/auth";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

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
