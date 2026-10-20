"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Package, Pill, Search, ShieldCheck, ShoppingCart, Sparkles, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useAuth } from "@/components/auth/auth-provider";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { OrdersTable, EmptyState, PrescriptionList } from "@/components/dashboard/shared";
import { PrescriptionForm } from "@/components/dashboard/prescription-form";
import { Welcome } from "@/components/dashboard/welcome";
import { isPrescriptionValid } from "@/lib/dashboard-store";
import { cn } from "@/lib/utils";

const IN_PROGRESS = ["placed", "confirmed", "packed", "pre-order"];

function useMine() {
  const { user } = useAuth();
  const data = useDashboardData();
  const id = user?.id;
  return {
    prescriptions: data.prescriptions.filter((r) => r.patientId === id),
    orders: data.orders.filter((o) => o.patientId === id),
  };
}

const actions = [
  { href: "/medicines", label: "Find a medicine", text: "Search by brand, generic or condition and see who stocks it.", icon: Search },
  { href: "/medicines?rare=1", label: "Rare medicines", text: "Hard-to-find medicines listed nationwide.", icon: Sparkles },
  { href: "/patient/prescriptions", label: "Upload prescription", text: "Add a paper prescription to unlock Rx-only medicines.", icon: Upload },
  { href: "/cart", label: "My cart", text: "Review items and AI cautions, then order.", icon: ShoppingCart },
];

export function PatientOverview() {
  const { prescriptions, orders } = useMine();
  const active = prescriptions.filter(isPrescriptionValid);
  return (
    <div className="space-y-6">
      <Welcome
        blurb="Find medicines, keep your prescriptions in one place and track every order."
        actions={<Link href="/medicines" className={cn(buttonVariants({ variant: "secondary" }))}>Find a medicine</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active prescriptions" value={active.length} icon={FileText} />
        <StatCard label="Orders" value={orders.length} icon={Package} />
        <StatCard label="In progress" value={orders.filter((o) => IN_PROGRESS.includes(o.status)).length} icon={ShieldCheck} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ href, label, text, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm">
            <span className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
            <p className="font-semibold group-hover:text-primary">{label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/patient/orders" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        <OrdersTable orders={orders.slice(0, 4)} empty="No orders yet. Find a medicine and add it to your cart." />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Latest prescription</h2>
          <Link href="/patient/prescriptions" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {prescriptions[0] ? <PrescriptionList items={[prescriptions[0]]} party="patient" /> : <EmptyState>No prescriptions yet.</EmptyState>}
      </section>
    </div>
  );
}

export function PatientPrescriptions() {
  const { user } = useAuth();
  const { prescriptions } = useMine();
  const [done, setDone] = useState(false);
  // Remount the form after a successful upload so it clears.
  const [formKey, setFormKey] = useState(0);

  return (
    <>
      <PageHeader title="My prescriptions" description="Prescriptions from verified doctors and copies you upload. Rx-only medicines in your cart are checked against these." />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <div>
          {prescriptions.length === 0 ? <EmptyState>No prescriptions yet. Ask your doctor to issue one, or upload a copy.</EmptyState> : <PrescriptionList items={prescriptions} party="patient" />}
        </div>
        <Card id="upload" className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="size-4 text-primary" /> Upload a prescription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {done && (
              <p className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <CheckCircle2 className="size-4" /> Prescription saved to your account.
              </p>
            )}
            {user && (
              <PrescriptionForm
                key={formKey}
                mode="upload"
                patientId={user.id}
                onDone={() => { setDone(true); setFormKey((k) => k + 1); }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function PatientOrders() {
  const { orders } = useMine();
  return (
    <>
      <PageHeader
        title="My orders"
        description="Track every order from placement to delivery. Payment is cash on delivery."
        actions={<Link href="/medicines" className={buttonVariants()}><Pill /> Order medicine</Link>}
      />
      <OrdersTable orders={orders} empty="You have not placed any orders yet." />
    </>
  );
}
