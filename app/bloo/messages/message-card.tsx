"use client";

import { useTransition } from "react";
import { markAsReplied, deleteMessage } from "./actions";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Message } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function MessageCard({ msg }: { msg: Message }) {
  const [isPending, startTransition] = useTransition();

  const handleMarkReplied = () => {
    startTransition(async () => {
      try {
        await markAsReplied(msg.id);
        toast.success("Message marked as replied");
      } catch {
        toast.error("Failed to update message");
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    startTransition(async () => {
      try {
        await deleteMessage(msg.id);
        toast.success("Message deleted");
      } catch {
        toast.error("Failed to delete message");
      }
    });
  };

  const isReplied = msg.status === "replied";

  return (
    <div
      className={cn(
        "p-4 sm:p-6 transition-colors",
        isReplied ? "bg-muted/50 opacity-70" : "hover:bg-accent/50"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
        <div>
          <h3 className="font-medium text-foreground">{msg.name}</h3>
          <a
            href={`mailto:${msg.email}`}
            className="text-sm text-primary hover:underline"
          >
            {msg.email}
          </a>
        </div>

        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {msg.createdAt.toLocaleDateString()} at{" "}
              {msg.createdAt.toLocaleTimeString()}
            </span>
            {msg.status === "unread" && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium border border-blue-500/20">
                New
              </span>
            )}
            {isReplied && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                Replied
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            {!isReplied && (
              <button
                onClick={handleMarkReplied}
                disabled={isPending}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                title="Mark as Replied"
              >
                <Check className="size-3.5" />
                <span className="hidden sm:inline">Mark Replied</span>
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
              title="Delete Message"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "mt-4 text-sm whitespace-pre-wrap p-4 rounded-md border",
          isReplied
            ? "text-muted-foreground bg-muted/50 border-border/30"
            : "text-foreground/90 bg-background border-border/50"
        )}
      >
        {msg.message}
      </div>
    </div>
  );
}
