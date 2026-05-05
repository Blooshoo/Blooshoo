"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to change password.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link
          href="/bloo"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground font-heading">
          Change Password
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update your login password.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            Set a new password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-primary font-medium">
                  Password changed successfully.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use your new password next time you log in.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/bloo")}
                className="w-full"
              >
                Back to dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newpw">New password</Label>
                <Input
                  id="newpw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Same as above"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin size-4" />
                    Changing…
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Change password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
