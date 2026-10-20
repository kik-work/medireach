"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { AUTH_HOME, logout } from "@/lib/auth-store";

/** Login state in the public header. Reads localStorage, so it renders after hydration. */
export function HeaderAuth() {
  const { user, ready } = useAuth();
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
      <Link href={AUTH_HOME[user.role]} className={buttonVariants({ size: "sm" })}>{user.name.split(" ")[0]}&apos;s dashboard</Link>
      <Button size="sm" variant="ghost" onClick={logout}>Log out</Button>
    </>
  );
}
