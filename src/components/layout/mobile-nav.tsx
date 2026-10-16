import Link from "next/link";
import { Menu } from "lucide-react";

/** CSS-only mobile menu (details/summary) — no client JS needed. */
export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  return (
    <details className="group relative sm:hidden">
      <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg border hover:bg-muted">
        <Menu className="size-4" />
        <span className="sr-only">Menu</span>
      </summary>
      <nav className="absolute right-0 mt-2 w-48 rounded-xl border bg-background p-2 shadow-lg">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">{l.label}</Link>
        ))}
      </nav>
    </details>
  );
}
