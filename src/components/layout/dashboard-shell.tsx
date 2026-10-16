import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants";
import { logout } from "@/lib/actions/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  roleLabel: string;
  userName?: string;
  nav: NavItem[];
  /** Shows a "Logout" button (not used by the localhost-only admin panel). */
  showLogout?: boolean;
  children: React.ReactNode;
}

/** Shared sidebar layout for all role dashboards and the admin panel. */
export function DashboardShell({ roleLabel, userName, nav, showLogout = true, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Pill className="size-4" /></span>
          {APP_NAME}
          <Badge variant="outline" className="ml-auto">{roleLabel}</Badge>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent">
              <Icon className="size-4 text-muted-foreground" /> {label}
            </Link>
          ))}
        </nav>
        <div className="hidden space-y-2 border-t p-3 text-sm md:absolute md:inset-x-0 md:bottom-0 md:block">
          {userName && <p className="truncate px-1 text-muted-foreground">{userName}</p>}
          <Link href="/" className="block px-1 text-muted-foreground hover:text-foreground">← Public site</Link>
          {showLogout && <form action={logout}><Button size="sm" variant="outline" className="w-full">Log out</Button></form>}
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
