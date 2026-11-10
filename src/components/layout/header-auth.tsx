"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { ROLE_HOME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Login state in the public header. Known after the first /api/auth/me answer. */
export function HeaderAuth() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <span className="h-8 w-20" aria-hidden />;
  if (!user) {
    return (
      <>
        {/* Below sm "Log in" moves into the mobile menu (MobileAuthLinks) so the header fits 320px. */}
        <Link href="/login" className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "max-sm:hidden")}>Log in</Link>
        <Link href="/signup" className={buttonVariants({ size: "sm" })}>Sign up</Link>
      </>
    );
  }
  return (
    <>
      <Link href={ROLE_HOME[user.role]} className={cn(buttonVariants({ size: "sm" }), "max-sm:px-2")}>
        <span className="lg:hidden">Dashboard</span>
        <span className="max-lg:hidden">{user.name.split(" ")[0]}&apos;s dashboard</span>
      </Link>
      <Button size="sm" variant="ghost" onClick={logout} className="max-sm:hidden">Log out</Button>
    </>
  );
}

/** Auth actions hidden from the header below sm, shown inside the mobile menu instead. */
export function MobileAuthLinks() {
  const { user, ready, logout } = useAuth();
  if (!ready) return null;
  const cls = "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted";
  return (
    <div className="mt-1 border-t pt-1 sm:hidden">
      {user ? (
        <button type="button" onClick={logout} className={cls}>Log out</button>
      ) : (
        <Link href="/login" className={cls}>Log in</Link>
      )}
    </div>
  );
}
