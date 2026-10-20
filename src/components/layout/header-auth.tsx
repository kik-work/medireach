"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { ROLE_HOME } from "@/lib/constants";

/** Login state in the public header. Known after the first /api/auth/me answer. */
export function HeaderAuth() {
  const { user, ready, logout } = useAuth();
  if (!ready) return <span className="h-8 w-20" aria-hidden />;
  if (!user) {
    return (
      <>
        <Link href="/login" className={buttonVariants({ size: "sm", variant: "ghost" })}>Log in</Link>
        <Link href="/signup" className={buttonVariants({ size: "sm" })}>Sign up</Link>
      </>
    );
  }
  return (
    <>
      <Link href={ROLE_HOME[user.role]} className={buttonVariants({ size: "sm" })}>{user.name.split(" ")[0]}&apos;s dashboard</Link>
      <Button size="sm" variant="ghost" onClick={logout}>Log out</Button>
    </>
  );
}
