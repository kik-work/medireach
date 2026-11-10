import Link from "next/link";
import { Menu } from "lucide-react";
import { MobileAuthLinks } from "@/components/layout/header-auth";

/** CSS-only mobile menu (details/summary) — no client JS needed. */
export function MobileNav({ links }: { links: { href: string; label: string }[] }) {
  return (
    // Not `relative`: the panel anchors to the sticky header so it stays on screen
    // whatever width the buttons beside the toggle take.
    <details className="group md:hidden">
      <summary className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg border hover:bg-muted">
        <Menu className="size-4" />
        <span className="sr-only">Menu</span>
      </summary>
      <nav className="absolute top-full right-4 mt-2 w-48 rounded-xl border bg-background p-2 shadow-lg sm:right-6">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">{l.label}</Link>
        ))}
        <MobileAuthLinks />
      </nav>
    </details>
  );
}
