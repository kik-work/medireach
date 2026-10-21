"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Package, Pause, Pill, Play, Repeat, Search, ShieldCheck, ShoppingCart, Sparkles, Stethoscope, Trash2, Upload, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCart } from "@/components/cart/cart-provider";
import { useDashboardData, type DashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, OrderTracker, OrdersTable, PrescriptionList, selectClass, useFeedback } from "@/components/dashboard/shared";
import { PrescriptionForm } from "@/components/dashboard/prescription-form";
import { Welcome } from "@/components/dashboard/welcome";
import { formatBDT } from "@/lib/constants";
import { formatDay, isLive } from "@/lib/consult";
import { addDays, isPrescriptionValid, today } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { Prescription } from "@/lib/types";

const IN_PROGRESS = ["placed", "confirmed", "packed", "pre-order"];

const actions = [
  { href: "/patient/doctors", label: "Find a doctor", text: "Describe your problem, then book a video or chat visit.", icon: Stethoscope },
  { href: "/medicines", label: "Find a medicine", text: "Search by brand, generic or condition and see who stocks it.", icon: Search },
  { href: "/medicines?rare=1", label: "Rare medicines", text: "Hard-to-find medicines listed nationwide.", icon: Sparkles },
  { href: "/patient/prescriptions", label: "Upload prescription", text: "Add a paper prescription to unlock Rx-only medicines.", icon: Upload },
  { href: "/cart", label: "My cart", text: "Review items and AI cautions, then order.", icon: ShoppingCart },
];

export function PatientOverview() {
  const { prescriptions, orders, refills, medicines, appointments, users } = useDashboardData();
  const nextVisit = appointments.filter(isLive).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  const active = prescriptions.filter(isPrescriptionValid);
  const dueSoon = refills.filter((r) => r.active && r.nextDate <= addDays(today(), 7));
  return (
    <div className="space-y-6">
      <Welcome
        blurb="Find medicines, keep your prescriptions in one place and track every order."
        actions={<Link href="/medicines" className={cn(buttonVariants({ variant: "secondary" }))}>Find a medicine</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active prescriptions" value={active.length} icon={FileText} />
        <StatCard label="Orders" value={orders.length} icon={Package} />
        <StatCard label="In progress" value={orders.filter((o) => IN_PROGRESS.includes(o.status)).length} icon={ShieldCheck} />
        <StatCard label="Active refills" value={refills.filter((r) => r.active).length} icon={Repeat} hint={dueSoon.length ? `${dueSoon.length} due this week` : undefined} />
      </div>

      {dueSoon.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>Refill due soon: {dueSoon.map((r) => medicines.find((m) => m.id === r.medicineId)?.brand).join(", ")}.</p>
            <Link href="/patient/refills" className={buttonVariants({ size: "sm" })}>Manage refills</Link>
          </CardContent>
        </Card>
      )}

      {nextVisit && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>Next consultation: {users.find((u) => u.id === nextVisit.doctorId)?.name ?? "your doctor"} · {formatDay(nextVisit.date)} at {nextVisit.time}.</p>
            <Link href={`/patient/appointments/${nextVisit.id}`} className={buttonVariants({ size: "sm" })}>Open consultation</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

/**
 * Cheapest in-stock listing in the patient's city, else the cheapest anywhere.
 * With no stock at all, falls back to a verified pharmacy in the city so the order becomes a pre-order.
 */
function pickListing(medicineId: string, d: DashboardData) {
  const city = d.me.city;
  const verified = new Map(d.pharmacies.map((p) => [p.id, p]));
  const rows = d.stock
    .filter((s) => s.medicineId === medicineId && s.quantity > 0 && verified.has(s.pharmacyId))
    .sort((a, b) => a.price - b.price);
  const hit = rows.find((s) => verified.get(s.pharmacyId)!.city === city) ?? rows[0];
  if (hit) return { pharmacy: verified.get(hit.pharmacyId)!, price: hit.price };
  const fallback = d.pharmacies.find((p) => p.city === city) ?? d.pharmacies[0];
  const medicine = d.medicines.find((m) => m.id === medicineId);
  return fallback && medicine ? { pharmacy: fallback, price: medicine.price } : null;
}

export function PatientPrescriptions() {
  const d = useDashboardData();
  const { add } = useCart();
  const router = useRouter();
  const { done, show, node } = useFeedback();
  // Remount the upload form after a successful save so it clears.
  const [formKey, setFormKey] = useState(0);

  /** One-click order: put every medicine of the prescription into the cart, then open the cart. */
  function orderAll(rx: Prescription) {
    let missing = 0;
    for (const item of rx.items) {
      const m = d.medicines.find((x) => x.id === item.medicineId);
      const listing = pickListing(item.medicineId, d);
      if (!m || !listing) { missing++; continue; }
      add({
        medicineId: m.id, pharmacyId: listing.pharmacy.id, brand: m.brand, generic: m.generic, strength: m.strength,
        pharmacyName: listing.pharmacy.name, unitPrice: listing.price, rx: m.rx,
      });
    }
    if (missing === rx.items.length) return show("err", "None of these medicines is available right now.");
    router.push("/cart");
  }

  async function remove(rx: Prescription) {
    if (!confirmAction(`Delete the uploaded prescription ${rx.id}?`)) return;
    await done(d.run("DELETE", `/api/prescriptions/${rx.id}`), "Prescription deleted.");
  }

  return (
    <>
      <PageHeader title="My prescriptions" description="Prescriptions from verified doctors and copies you upload. Rx-only medicines in your cart are checked against these." />
      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <div className="space-y-4">
          {node}
          {d.prescriptions.length === 0 ? (
            <EmptyState>No prescriptions yet. Ask your doctor to issue one, or upload a copy.</EmptyState>
          ) : (
            <PrescriptionList
              items={d.prescriptions}
              party="patient"
              actions={(rx) => (
                <>
                  {rx.uploaded && <Button size="sm" variant="destructive" onClick={() => remove(rx)}><Trash2 /> Delete</Button>}
                  <Button size="sm" disabled={!isPrescriptionValid(rx)} onClick={() => orderAll(rx)}>
                    <ShoppingCart /> {isPrescriptionValid(rx) ? "Order in one click" : "Expired"}
                  </Button>
                </>
              )}
            />
          )}
        </div>
        <Card id="upload" className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="size-4 text-primary" /> Upload a prescription</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PrescriptionForm
              key={formKey}
              mode="upload"
              onDone={() => { show("ok", "Prescription saved to your account."); setFormKey((k) => k + 1); }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function PatientOrders() {
  const { orders, medicines, pharmacies, run } = useDashboardData();
  const { done, node } = useFeedback();

  async function cancel(id: string) {
    if (!confirmAction(`Cancel order ${id}?`)) return;
    await done(run("PATCH", `/api/orders/${id}`, { status: "cancelled" }), `Order ${id} cancelled.`);
  }

  return (
    <>
      <PageHeader
        title="My orders"
        description="Track every order from placement to delivery. Payment is cash on delivery."
        actions={<Link href="/medicines" className={buttonVariants()}><Pill /> Order medicine</Link>}
      />
      <div className="space-y-4">
        {node}
        {orders.length === 0 && <EmptyState>You have not placed any orders yet.</EmptyState>}
        {orders.map((o) => {
          const pharmacy = pharmacies.find((p) => p.id === o.pharmacyId);
          return (
            <Card key={o.id}>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{o.id}</span>
                  <StatusBadge status={o.status} />
                  <span className="text-sm text-muted-foreground">{o.createdAt} · {pharmacy?.name ?? "Pharmacy"}{pharmacy ? `, ${pharmacy.city}` : ""}</span>
                  <span className="ml-auto font-semibold">{formatBDT(o.total)}</span>
                </div>
                <OrderTracker status={o.status} />
                {o.status === "pre-order" && (
                  <p className="text-xs text-muted-foreground">This pharmacy is out of stock. It will confirm once the medicine arrives.</p>
                )}
                <ul className="divide-y rounded-lg border text-sm">
                  {o.lines.map((l) => {
                    const m = medicines.find((x) => x.id === l.medicineId);
                    return (
                      <li key={l.medicineId} className="flex justify-between gap-4 p-2.5">
                        <span>{m ? `${m.brand} ${m.strength}` : "Removed medicine"} ×{l.quantity}</span>
                        <span className="text-muted-foreground">{formatBDT(l.quantity * l.unitPrice)}</span>
                      </li>
                    );
                  })}
                </ul>
                {["placed", "pre-order"].includes(o.status) && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="destructive" onClick={() => cancel(o.id)}><XCircle /> Cancel order</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function PatientRefills() {
  const { refills, medicines, pharmacies, stock, me, run } = useDashboardData();
  const router = useRouter();
  const { done, show, node } = useFeedback();
  const [medicineId, setMedicineId] = useState("");
  const [pharmacyId, setPharmacyId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [everyDays, setEveryDays] = useState("30");
  const [busy, setBusy] = useState(false);

  const med = (id: string) => medicines.find((m) => m.id === id);
  // Pharmacies that list the chosen medicine, own city first.
  const options = pharmacies
    .filter((p) => stock.some((s) => s.pharmacyId === p.id && s.medicineId === medicineId))
    .sort((a, b) => Number(b.city === me.city) - Number(a.city === me.city));

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!medicineId || !pharmacyId) return show("err", "Choose a medicine and a pharmacy.");
    setBusy(true);
    const r = await done(run("POST", "/api/refills", { medicineId, pharmacyId, quantity: Number(quantity), everyDays: Number(everyDays) }), "Subscribed. We will remind you when a refill is due.");
    setBusy(false);
    if (r.ok) { setMedicineId(""); setPharmacyId(""); setQuantity("1"); setEveryDays("30"); }
  }

  async function orderNow(id: string) {
    const r = await run<{ id: string }[]>("POST", `/api/refills/${id}/order`);
    if (r.ok) router.push("/patient/orders");
    else show("err", r.blocked?.length ? `Prescription needed for: ${r.blocked.join(", ")}.` : r.error);
  }

  return (
    <>
      <PageHeader title="Chronic-medicine refills" description="Subscribe to a regular refill so you never run out. Order when it is due, or any time." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {node}
          {refills.length === 0 && <EmptyState>No refill subscriptions yet. Add your first one on the right.</EmptyState>}
          {refills.map((r) => {
            const m = med(r.medicineId);
            const pharmacy = pharmacies.find((p) => p.id === r.pharmacyId);
            const due = r.active && r.nextDate <= today();
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{m ? `${m.brand} ${m.strength}` : "Removed medicine"}</span>
                    {m && <span className="text-sm text-muted-foreground">{m.generic}</span>}
                    {due && <Badge>Due now</Badge>}
                    {!r.active && <Badge variant="outline">Paused</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.quantity} pack{r.quantity > 1 ? "s" : ""} every {r.everyDays} days · {pharmacy?.name ?? "Pharmacy unavailable"} · next {r.active ? r.nextDate : "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Packs
                      <Input
                        key={`q${r.quantity}`} type="number" min={1} defaultValue={r.quantity} className="h-8 w-16"
                        onBlur={(e) => Number(e.target.value) !== r.quantity && done(run("PATCH", `/api/refills/${r.id}`, { quantity: Number(e.target.value) }), "Refill updated.")}
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Every (days)
                      <Input
                        key={`d${r.everyDays}`} type="number" min={1} defaultValue={r.everyDays} className="h-8 w-20"
                        onBlur={(e) => Number(e.target.value) !== r.everyDays && done(run("PATCH", `/api/refills/${r.id}`, { everyDays: Number(e.target.value) }), "Refill updated.")}
                      />
                    </label>
                    <span className="ml-auto flex gap-2">
                      <Button size="sm" onClick={() => orderNow(r.id)} disabled={!pharmacy}><ShoppingCart /> Order now</Button>
                      <Button size="sm" variant="outline" onClick={() => done(run("PATCH", `/api/refills/${r.id}`, { active: !r.active }), r.active ? "Refill paused." : "Refill resumed.")}>
                        {r.active ? <><Pause /> Pause</> : <><Play /> Resume</>}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => confirmAction("Unsubscribe from this refill?") && done(run("DELETE", `/api/refills/${r.id}`), "Unsubscribed.")}><Trash2 /></Button>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle className="flex items-center gap-2"><Repeat className="size-4 text-primary" /> New refill</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={subscribe} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="rf-med">Medicine</Label>
                <select id="rf-med" className={selectClass} value={medicineId} onChange={(e) => { setMedicineId(e.target.value); setPharmacyId(""); }}>
                  <option value="">Select medicine…</option>
                  {medicines.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.strength} — {m.generic}{m.rx ? " (Rx)" : ""}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rf-ph">Pharmacy</Label>
                <select id="rf-ph" className={selectClass} value={pharmacyId} onChange={(e) => setPharmacyId(e.target.value)} disabled={!medicineId}>
                  <option value="">{medicineId ? (options.length ? "Select pharmacy…" : "No pharmacy lists this medicine") : "Choose a medicine first"}</option>
                  {options.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="rf-qty">Packs</Label><Input id="rf-qty" type="number" min={1} className="h-10" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="rf-days">Every (days)</Label><Input id="rf-days" type="number" min={1} className="h-10" value={everyDays} onChange={(e) => setEveryDays(e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Rx-only medicines still need a valid prescription each time you order.</p>
              <Button type="submit" className="h-10 w-full" disabled={busy}>Subscribe</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Refills never order automatically. You confirm each order.</p>
    </>
  );
}
