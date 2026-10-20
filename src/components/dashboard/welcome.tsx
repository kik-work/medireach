"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/components/auth/auth-provider";

/** Greeting banner at the top of each dashboard overview. */
export function Welcome({ blurb, actions }: { blurb: string; actions?: ReactNode }) {
  const { user } = useAuth();
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
      <CardContent className="flex flex-wrap items-center gap-5 py-7 md:py-9">
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 sm:flex"><Sparkles className="size-7" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Welcome, {user?.name}!</h1>
          <p className="mt-1 max-w-xl text-primary-foreground/85">{blurb}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}
