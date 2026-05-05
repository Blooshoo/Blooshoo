"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, KeyRound, Copy, Check } from "lucide-react";

interface ResetPasswordDialogProps {
  userId: number;
  username: string;
}

export function ResetPasswordDialog({
  userId,
  username,
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setTempPassword(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password");
      }

      const data = await res.json();
      setTempPassword(data.tempPassword);
      toast.success(`Password reset for "${username}"`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setTempPassword(null);
    setCopied(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-amber-400 border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-400"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Reset PW
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Generate a new temporary password for{" "}
              <span className="text-foreground font-medium">{username}</span>.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-4">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Temporary Password
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono text-primary break-all select-all">
                    {tempPassword}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0 h-8 w-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this password now — it won&apos;t be shown again. The user
                should change it after logging in.
              </p>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                "Click the button below to generate a new temporary password."
              )}
            </div>
          )}

          <DialogFooter>
            {tempPassword ? (
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button onClick={handleReset} disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
