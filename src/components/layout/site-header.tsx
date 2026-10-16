import Link from "next/link";
import { Pill } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CartLink } from "@/components/cart/cart-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { APP_NAME, CONTAINER, ROLE_HOME } from "@/lib/constants";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/medicines", label: "Medicines" },
  { href: "/pharmacies", label: "Pharmacies" },
  { href: "/how-it-works", label: "How it works" },
];

export async function SiteHeader() {
  const user = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className={`${CONTAINER} flex h-16 items-center gap-6`}>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Pill className="size-4" /></span>
          {APP_NAME}
        </Link>
        <nav className="hidden gap-7 text-sm font-medium text-muted-foreground sm:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground">{l.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <MobileNav links={links} />
          <CartLink />
          {user ? (
            <>
              <Link href={ROLE_HOME[user.role]} className={buttonVariants({ size: "sm" })}>{user.name.split(" ")[0]}&apos;s dashboard</Link>
              <form action={logout}><Button size="sm" variant="ghost">Log out</Button></form>
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: "sm" })}>Log in</Link>
          )}
        </div>
      </div>
    </header>
  );
}
