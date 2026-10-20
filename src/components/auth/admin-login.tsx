"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/components/auth/auth-provider";

/** Shown by /admin when nobody is signed in. Accepts admin accounts only. */
export function AdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await login(identifier, password, "admin");
    if (!result.ok) setError(result.error);
    // On success the session store updates and RoleDashboard swaps in the dashboard.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Pill className="size-5" /></span>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME} Admin</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="size-4" /> Authorised staff only</p>
        </div>
        <Card>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="admin-id">Email or phone</Label>
                <Input id="admin-id" autoComplete="username" className="h-10" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-pw">Password</Label>
                <Input id="admin-pw" type="password" autoComplete="current-password" className="h-10" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="h-10 w-full">Log in to admin</Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground"><Link href="/" className="hover:text-foreground">← Back to site</Link></p>
      </div>
    </div>
  );
}
