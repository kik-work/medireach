"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, ExternalLink, LogOut, Menu, Pill, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";
import { logout, type Session } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export interface NavItem {
  /** Omit for pages that do not exist yet: shown disabled with a "Soon" tag. */
  href?: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  roleLabel: string;
  user: Session;
  nav: NavItem[];
  children: React.ReactNode;
}

const initials = (name: string) =>
  name.replace(/^dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

/** Sidebar + header layout shared by the patient, doctor and admin dashboards. */
export function DashboardShell({ roleLabel, user, nav, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function onLogout() {
    logout();
    router.replace(user.role === "admin" ? "/admin" : "/login");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Pill className="size-4" /></span>
          <span className="text-lg font-bold">{APP_NAME}</span>
          <Button variant="ghost" size="icon-sm" className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X /></Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{roleLabel} menu</p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href !== undefined && pathname === href;
            const cls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium";
            if (!href) {
              return (
                <div key={label} aria-disabled className={cn(cls, "cursor-not-allowed text-muted-foreground/60")}>
                  <Icon className="size-4" /> {label}
                  <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">Soon</span>
                </div>
              );
            }
            return (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(cls, active ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent")}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
            <ExternalLink className="size-4" /> Public site
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button>
          <div className="relative hidden w-full max-w-sm md:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-8" placeholder="Search…" aria-label="Search" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications"><Bell /></Button>
            <div className="flex items-center gap-2.5 rounded-full border bg-background py-1 pl-1 pr-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{initials(user.name)}</span>
              <span className="hidden leading-tight sm:block">
                <span className="block max-w-36 truncate text-sm font-medium">{user.name}</span>
                <span className="block text-[11px] text-muted-foreground">{roleLabel}</span>
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}><LogOut /> <span className="hidden sm:inline">Log out</span></Button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
