"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Package, PackageX, Pill, Plus, Save, Trash2, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, OrdersTable, selectClass, useFeedback } from "@/components/dashboard/shared";
import { Welcome } from "@/components/dashboard/welcome";
import { CITIES, formatBDT } from "@/lib/constants";
import { isPrescriptionValid } from "@/lib/rules";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, StockItem } from "@/lib/types";

const OPEN = ["placed", "confirmed", "packed", "pre-order"];
const LOW_STOCK = 10;

function usePharmacist() {
  const d = useDashboardData();
  const pharmacy = d.pharmacies[0];
  const verified = d.me.status === "verified" && pharmacy?.status === "verified";
  return { ...d, pharmacy, verified };
}

function StatusNotice({ verified, userStatus, pharmacyStatus }: { verified: boolean; userStatus: string; pharmacyStatus?: string }) {
  if (verified) return null;
  const text =
    userStatus !== "verified"
      ? `Your pharmacist registration is ${userStatus}. You can prepare your inventory, but you cannot fulfil orders until an admin verifies you.`
      : `Your pharmacy is ${pharmacyStatus ?? "not registered"}. It stays hidden from search and cannot receive orders until an admin verifies its licence.`;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <Clock className="mt-0.5 size-4 shrink-0" />
      <p>{text}</p>
    </div>
  );
}

export function PharmacistOverview() {
  const d = usePharmacist();
  if (!d.pharmacy) return <EmptyState>No pharmacy is linked to your account. Contact the admin team.</EmptyState>;
  const open = d.orders.filter((o) => OPEN.includes(o.status));
  const low = d.stock.filter((s) => s.quantity > 0 && s.quantity < LOW_STOCK);
  const out = d.stock.filter((s) => s.quantity === 0);
  const revenue = d.orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0);
  const medicine = (id: string) => d.medicines.find((m) => m.id === id);

  return (
    <div className="space-y-6">
      <Welcome
        blurb={`${d.pharmacy.name} · ${d.pharmacy.address} · Lic. ${d.pharmacy.licenseNo}`}
        actions={<Link href="/pharmacist/orders" className={buttonVariants({ variant: "secondary" })}>Open orders</Link>}
      />
      <StatusNotice verified={d.verified} userStatus={d.me.status} pharmacyStatus={d.pharmacy.status} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Medicines listed" value={d.stock.length} icon={Pill} hint={`${out.length} out of stock`} />
        <StatCard label="Open orders" value={open.length} icon={Package} />
        <StatCard label="Low stock" value={low.length} icon={PackageX} hint={`under ${LOW_STOCK} units`} />
        <StatCard label="Delivered revenue" value={formatBDT(revenue)} icon={Wallet} />
      </div>

      {low.length + out.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Restock soon</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            {[...out, ...low].map((s) => (
              <Link key={s.medicineId} href="/pharmacist/inventory" className="rounded-full border px-3 py-1 hover:bg-muted">
                {medicine(s.medicineId)?.brand} <span className={cn(s.quantity === 0 ? "text-destructive" : "text-amber-600")}>{s.quantity === 0 ? "out" : `${s.quantity} left`}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Latest orders</h2>
          <Link href="/pharmacist/orders" className="text-sm text-primary hover:underline">All orders</Link>
        </div>
        <OrdersTable orders={d.orders.slice(0, 5)} show={{ patient: true }} />
      </section>
    </div>
  );
}

function StockRow({ item, name, sub, onSave, onRemove }: { item: StockItem; name: string; sub: string; onSave: (qty: number, price: number) => void; onRemove: () => void }) {
  const [qty, setQty] = useState(String(item.quantity));
  const [price, setPrice] = useState(String(item.price));
  const dirty = Number(qty) !== item.quantity || Number(price) !== item.price;
  const invalid = !(Number(qty) >= 0) || !(Number(price) >= 0) || qty === "" || price === "";
  return (
    <TableRow>
      <TableCell className="font-medium">{name}<div className="text-xs font-normal text-muted-foreground">{sub}</div></TableCell>
      <TableCell><Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="h-9 w-24" aria-label={`Quantity of ${name}`} /></TableCell>
      <TableCell><Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="h-9 w-24" aria-label={`Price of ${name}`} /></TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" disabled={!dirty || invalid} onClick={() => onSave(Number(qty), Number(price))}><Save /> Save</Button>
          <Button size="sm" variant="destructive" onClick={onRemove} aria-label={`Remove ${name}`}><Trash2 /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PharmacistInventory() {
  const d = usePharmacist();
  const { done, node } = useFeedback();
  const [query, setQuery] = useState("");
  const [medicineId, setMedicineId] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  if (!d.pharmacy) return <EmptyState>No pharmacy is linked to your account.</EmptyState>;

  const listed = new Set(d.stock.map((s) => s.medicineId));
  const unlisted = d.medicines.filter((m) => !listed.has(m.id));
  const q = query.trim().toLowerCase();
  const rows = d.stock
    .map((s) => ({ s, m: d.medicines.find((m) => m.id === s.medicineId) }))
    .filter((r): r is { s: StockItem; m: NonNullable<typeof r.m> } => Boolean(r.m))
    .filter(({ m }) => !q || `${m.brand} ${m.generic} ${m.category}`.toLowerCase().includes(q))
    .sort((a, b) => a.m.brand.localeCompare(b.m.brand));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!medicineId) return;
    const r = await done(d.run("POST", "/api/stock", { medicineId, quantity: Number(qty), price: Number(price) }), "Listing added.");
    if (r.ok) { setMedicineId(""); setQty(""); setPrice(""); }
  }

  return (
    <>
      <PageHeader title="Inventory" description="Quantity and price shown to customers. Quantity 0 hides you from availability for that medicine." />
      <div className="space-y-4">
        <StatusNotice verified={d.verified} userStatus={d.me.status} pharmacyStatus={d.pharmacy.status} />
        {node}
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            <Input className="h-10 max-w-sm" placeholder="Search your listings…" aria-label="Search inventory" value={query} onChange={(e) => setQuery(e.target.value)} />
            {rows.length === 0 ? (
              <EmptyState>{d.stock.length === 0 ? "No medicines listed yet. Add your first listing." : `No listing matches “${query}”.`}</EmptyState>
            ) : (
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Medicine</TableHead><TableHead>Quantity</TableHead><TableHead>Price (৳)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map(({ s, m }) => (
                        <StockRow
                          key={`${s.medicineId}:${s.quantity}:${s.price}`}
                          item={s}
                          name={`${m.brand} ${m.strength}`}
                          sub={`${m.generic}${m.rx ? " · Rx" : ""}${m.rare ? " · rare" : ""}`}
                          onSave={(quantity, newPrice) => done(d.run("POST", "/api/stock", { medicineId: m.id, quantity, price: newPrice }), `${m.brand} updated.`)}
                          onRemove={() => confirmAction(`Remove ${m.brand} from your inventory?`) && done(d.run("DELETE", `/api/stock/${m.id}`), `${m.brand} removed.`)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="h-fit">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-4 text-primary" /> Add listing</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={add} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="st-med">Medicine</Label>
                  <select
                    id="st-med" className={selectClass} value={medicineId}
                    onChange={(e) => { setMedicineId(e.target.value); setPrice(String(d.medicines.find((m) => m.id === e.target.value)?.price ?? "")); }}
                  >
                    <option value="">{unlisted.length ? "Select medicine…" : "Everything is already listed"}</option>
                    {unlisted.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.strength} — {m.generic}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="st-qty">Quantity</Label><Input id="st-qty" type="number" min={0} className="h-10" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label htmlFor="st-price">Price (৳)</Label><Input id="st-price" type="number" min={0} className="h-10" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                </div>
                <Button type="submit" className="h-10 w-full" disabled={!medicineId || qty === "" || price === ""}>Add to inventory</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  placed: { status: "confirmed", label: "Confirm" },
  "pre-order": { status: "confirmed", label: "Confirm" },
  confirmed: { status: "packed", label: "Mark packed" },
  packed: { status: "delivered", label: "Mark delivered" },
};

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

export function PharmacistOrders() {
  const d = usePharmacist();
  const { done, node } = useFeedback();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("open");

  const shown = d.orders.filter((o) => (filter === "all" ? true : filter === "open" ? OPEN.includes(o.status) : o.status === filter));

  /** Compliance: every Rx-only line must be covered by a valid prescription of that patient. */
  function rxCheck(o: Order) {
    const rxLines = o.lines.map((l) => d.medicines.find((m) => m.id === l.medicineId)).filter((m) => m?.rx);
    if (rxLines.length === 0) return null;
    const missing = rxLines.filter((m) => !d.prescriptions.some((r) => r.patientId === o.patientId && isPrescriptionValid(r) && r.items.some((i) => i.medicineId === m!.id)));
    return missing.length === 0 ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-3" /> Prescription verified</p>
    ) : (
      <p className="mt-1 flex items-center gap-1 text-xs text-destructive"><AlertTriangle className="size-3" /> No valid prescription: {missing.map((m) => m!.brand).join(", ")}</p>
    );
  }

  return (
    <>
      <PageHeader title="Orders" description="Receive orders, check prescriptions on Rx-only items and move each order through fulfilment." />
      <div className="space-y-4">
        <StatusNotice verified={d.verified} userStatus={d.me.status} pharmacyStatus={d.pharmacy?.status} />
        {node}
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Order filter">
          {FILTERS.map((f) => (
            <button
              key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
              className={cn("rounded-full border px-3 py-1 text-sm", filter === f.key ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              {f.label} <span className="opacity-70">{d.orders.filter((o) => (f.key === "all" ? true : f.key === "open" ? OPEN.includes(o.status) : o.status === f.key)).length}</span>
            </button>
          ))}
        </div>
        <OrdersTable
          orders={shown}
          show={{ patient: true }}
          empty="No orders in this view."
          note={rxCheck}
          actions={(o) => {
            const next = NEXT[o.status];
            if (!next) return <StatusBadge status={o.status} />;
            return (
              <>
                <Button size="sm" disabled={!d.verified} onClick={() => done(d.run("PATCH", `/api/orders/${o.id}`, { status: next.status }), `${o.id}: ${next.status}.`)}>{next.label}</Button>
                <Button size="sm" variant="destructive" disabled={!d.verified} onClick={() => confirmAction(`Reject order ${o.id}?`) && done(d.run("PATCH", `/api/orders/${o.id}`, { status: "cancelled" }), `${o.id} cancelled.`)}>Reject</Button>
              </>
            );
          }}
        />
      </div>
    </>
  );
}

export function PharmacistProfile() {
  const d = usePharmacist();
  const { done, node } = useFeedback();
  const p = d.pharmacy;
  const [form, setForm] = useState(() => ({ name: p?.name ?? "", city: p?.city ?? "Dhaka", area: p?.area ?? "", address: p?.address ?? "", phone: p?.phone ?? "" }));
  const [busy, setBusy] = useState(false);
  if (!p) return <EmptyState>No pharmacy is linked to your account.</EmptyState>;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await done(d.run("PATCH", `/api/pharmacies/${p!.id}`, form), "Pharmacy details saved.");
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="My pharmacy" description="The name, phone and location customers see when they look for medicine nearby." />
      <div className="space-y-4">
        <StatusNotice verified={d.verified} userStatus={d.me.status} pharmacyStatus={p.status} />
        <Card className="max-w-2xl">
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Licence {p.licenseNo}</span>
              <StatusBadge status={p.status} />
              {p.rating > 0 && <span>Rating {p.rating}</span>}
            </div>
            {node}
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ph-name">Pharmacy name</Label><Input id="ph-name" className="h-10" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label htmlFor="ph-city">City</Label>
                <select id="ph-city" className={selectClass} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="ph-area">Area</Label><Input id="ph-area" className="h-10" value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Dhanmondi" /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="ph-addr">Street address</Label><Input id="ph-addr" className="h-10" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
              <div className="space-y-1.5"><Label htmlFor="ph-phone">Phone</Label><Input id="ph-phone" className="h-10" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="sm:col-span-2"><Button type="submit" className="h-10" disabled={busy || !form.name.trim()}>{busy ? "Saving…" : "Save changes"}</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
