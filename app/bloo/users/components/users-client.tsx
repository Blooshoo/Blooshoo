"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";
import { DeleteUserButton } from "./delete-user-button";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface UsersClientProps {
  userId: string;
  username: string | null;
  isCurrentUser: boolean;
}

/**
 * Client boundary for per-row actions and the "Create User" button.
 *
 * This is rendered once per table row, but the "Create User" dialog state
 * is hoisted to the first instance via a module-level approach with a
 * callback pattern. To keep it simple, we use a separate wrapper for the
 * global "Create User" button and just render per-row actions here.
 */
export function UsersClient({ userId, username, isCurrentUser }: UsersClientProps) {
  const router = useRouter();

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      {!isCurrentUser && (
        <DeleteUserButton
          userId={userId}
          username={username}
          onDeleted={handleRefresh}
        />
      )}
      <ResetPasswordDialog userId={userId} username={username} />
    </>
  );
}

/**
 * The "Create User" button + dialog, exported separately so the server
 * component can render it once in the header area.
 */
export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCreated = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        Create User
      </Button>
      <CreateUserDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={handleCreated}
      />
    </>
  );
}
