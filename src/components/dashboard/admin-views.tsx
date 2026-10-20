"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronRight, Package, Pencil, Pill, Sparkles, Store, Trash2, Users, Wallet, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RxBadge, StatusBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, Notice, OrdersTable, selectClass, useFeedback } from "@/components/dashboard/shared";
import { Welcome } from "@/components/dashboard/welcome";
import { CITIES, formatBDT } from "@/lib/constants";
import type { Medicine, Pharmacy, VerificationStatus } from "@/lib/types";

function Decision({ onDecide }: { onDecide: (s: VerificationStatus) => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" onClick={() => onDecide("verified")}>Approve</Button>
      <Button size="sm" variant="destructive" onClick={() => onDecide("rejected")}>Reject</Button>
    </div>
  );
}

function SuspendToggle({ status, onDecide }: { status: VerificationStatus; onDecide: (s: VerificationStatus) => void }) {
  if (status === "verified") return <Button size="sm" variant="destructive" onClick={() => onDecide("suspended")}>Suspend</Button>;
  if (status === "suspended") return <Button size="sm" variant="outline" onClick={() => onDecide("verified")}>Reinstate</Button>;
  if (status === "rejected") return <Button size="sm" variant="outline" onClick={() => onDecide("verified")}>Approve</Button>;
  return null;
}

export function AdminOverview() {
  const d = useDashboardData();
  const pendingPeople = d.users.filter((u) => u.role !== "patient" && u.status === "pending").length;
  const pendingPharmacies = d.pharmacies.filter((p) => p.status === "pending").length;
  const pending = pendingPeople + pendingPharmacies;
  const live = d.orders.filter((o) => o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <Welcome blurb="Verify doctors and pharmacies, manage the medicine database and keep orders in check." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Medicines" value={d.medicines.length} icon={Pill} hint={`${d.medicines.filter((m) => m.rare).length} rare`} />
        <StatCard label="Verified pharmacies" value={d.pharmacies.filter((p) => p.status === "verified").length} icon={Store} />
        <StatCard label="Verified doctors" value={d.users.filter((u) => u.role === "doctor" && u.status === "verified").length} icon={Users} />
        <StatCard label="Patients" value={d.users.filter((u) => u.role === "patient").length} icon={Users} />
        <StatCard label="Orders" value={d.orders.length} icon={Package} />
        <StatCard label="Order value" value={formatBDT(live.reduce((s, o) => s + o.total, 0))} icon={Wallet} hint="excludes cancelled" />
        <StatCard label="Pending verifications" value={pending} icon={BadgeCheck} />
        <StatCard label="Caution rules" value={`${d.interactionCount} pairs`} icon={Sparkles} hint="interaction table" />
      </div>

      <Card>
        <CardHeader><CardTitle>Needs attention</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p>
            {pending === 0
              ? "Nothing is waiting for review."
              : `${pendingPeople} doctor / pharmacist and ${pendingPharmacies} pharmacy registration${pending === 1 ? " is" : "s are"} waiting for review.`}
          </p>
          <Link href="/admin/verifications" className={buttonVariants({ size: "sm" })}>Review</Link>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Latest orders</h2>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">All orders</Link>
        </div>
        <OrdersTable orders={d.orders.slice(0, 4)} show={{ patient: true, pharmacy: true }} />
      </section>
    </div>
  );
}

export function AdminVerifications() {
  const d = useDashboardData();
  const { done, node } = useFeedback();
  const people = d.users.filter((u) => u.role !== "patient");
  const patients = d.users.filter((u) => u.role === "patient");
  const pharmacies = d.pharmacies.filter((p) => p.status !== "verified");

  const setUser = (id: string, status: VerificationStatus, name: string) =>
    done(d.run("PATCH", `/api/users/${id}`, { status }), `${name} is now ${status}.`);
  const setPharmacy = (p: Pharmacy, status: VerificationStatus) =>
    done(d.run("PATCH", `/api/pharmacies/${p.id}`, { status }), `${p.name} is now ${status}.`);

  return (
    <>
      <PageHeader title="Verifications" description="In production these map to BMDC, Pharmacy Council and DGDA checks. Only approved doctors can issue prescriptions and only approved pharmacies can sell." />
      <div className="space-y-8">
        {node}
        <section>
          <h2 className="mb-3 font-semibold">Doctors &amp; pharmacists</h2>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Reg. no.</TableHead><TableHead>Pharmacy</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {people.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}<div className="text-xs font-normal text-muted-foreground">{u.identifier}</div></TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{u.registrationNo ?? "—"}</TableCell>
                      <TableCell>{u.pharmacyId ? d.pharmacies.find((p) => p.id === u.pharmacyId)?.name : "—"}</TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell>
                        {u.status === "pending"
                          ? <Decision onDecide={(s) => setUser(u.id, s, u.name)} />
                          : <div className="flex justify-end"><SuspendToggle status={u.status} onDecide={(s) => setUser(u.id, s, u.name)} /></div>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Pharmacy licences</h2>
          {pharmacies.length === 0 ? (
            <EmptyState>No pharmacy is waiting for review.</EmptyState>
          ) : (
            <Card>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Pharmacy</TableHead><TableHead>Licence</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacies.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.area ? `${p.area}, ` : ""}{p.city}</div></TableCell>
                        <TableCell>{p.licenseNo}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell>
                          {p.status === "pending"
                            ? <Decision onDecide={(s) => setPharmacy(p, s)} />
                            : <div className="flex justify-end"><SuspendToggle status={p.status} onDecide={(s) => setPharmacy(p, s)} /></div>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Patients</h2>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Orders</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}<div className="text-xs font-normal text-muted-foreground">{u.identifier}</div></TableCell>
                      <TableCell>{u.city}</TableCell>
                      <TableCell>{d.orders.filter((o) => o.patientId === u.id).length}</TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell><div className="flex justify-end"><SuspendToggle status={u.status} onDecide={(s) => setUser(u.id, s, u.name)} /></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

function PharmacyEditForm({ pharmacy, onDone }: { pharmacy: Pharmacy; onDone: () => void }) {
  const { run } = useDashboardData();
  const [form, setForm] = useState({ name: pharmacy.name, city: pharmacy.city, area: pharmacy.area, address: pharmacy.address, phone: pharmacy.phone, licenseNo: pharmacy.licenseNo });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await run("PATCH", `/api/pharmacies/${pharmacy.id}`, form);
    if (r.ok) onDone();
    else setError(r.error);
  }

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-3" noValidate>
      <div className="space-y-1.5"><Label>Name</Label><Input className="h-9" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>City</Label><select className={selectClass} value={form.city} onChange={(e) => set("city", e.target.value)}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div className="space-y-1.5"><Label>Area</Label><Input className="h-9" value={form.area} onChange={(e) => set("area", e.target.value)} /></div>
      <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input className="h-9" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Phone</Label><Input className="h-9" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Licence no.</Label><Input className="h-9" value={form.licenseNo} onChange={(e) => set("licenseNo", e.target.value)} /></div>
      <div className="flex items-end gap-2 sm:col-span-2">
        <Button type="submit" size="sm">Save</Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>Cancel</Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}

export function AdminPharmacies() {
  const d = useDashboardData();
  const { done, node } = useFeedback();
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Pharmacies" description="Moderate pharmacies and their listings. Suspended pharmacies are removed from availability and cannot receive orders." />
      <div className="space-y-4">
        {node}
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead /><TableHead>Pharmacy</TableHead><TableHead>City</TableHead><TableHead>Listings</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {d.pharmacies.map((p) => {
                  const listings = d.stock.filter((s) => s.pharmacyId === p.id);
                  const isOpen = open === p.id;
                  return (
                    <Fragment key={p.id}>
                      <TableRow>
                        <TableCell className="w-8">
                          <Button size="icon-sm" variant="ghost" aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} details of ${p.name}`} onClick={() => setOpen(isOpen ? null : p.id)}>
                            {isOpen ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.licenseNo}</div></TableCell>
                        <TableCell>{p.city}</TableCell>
                        <TableCell>{listings.length}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => { setOpen(p.id); setEditing(p.id); }}><Pencil /> Edit</Button>
                            {p.status === "pending" ? (
                              <Decision onDecide={(s) => done(d.run("PATCH", `/api/pharmacies/${p.id}`, { status: s }), `${p.name} is now ${s}.`)} />
                            ) : (
                              <SuspendToggle status={p.status} onDecide={(s) => done(d.run("PATCH", `/api/pharmacies/${p.id}`, { status: s }), `${p.name} is now ${s}.`)} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow>
                          <TableCell />
                          <TableCell colSpan={5} className="whitespace-normal bg-muted/30">
                            <div className="space-y-4 py-2">
                              {editing === p.id ? (
                                <PharmacyEditForm pharmacy={p} onDone={() => setEditing(null)} />
                              ) : (
                                <p className="text-sm text-muted-foreground">{p.address} · {p.phone || "no phone"}</p>
                              )}
                              <div>
                                <p className="mb-2 text-sm font-semibold">Listings ({listings.length})</p>
                                {listings.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No medicines listed.</p>
                                ) : (
                                  <ul className="flex flex-wrap gap-2">
                                    {listings.map((s) => {
                                      const m = d.medicines.find((x) => x.id === s.medicineId);
                                      return (
                                        <li key={s.medicineId} className="flex items-center gap-1.5 rounded-full border bg-background py-1 pl-3 pr-1 text-sm">
                                          {m?.brand ?? "Removed"} · {s.quantity} · {formatBDT(s.price)}
                                          <Button
                                            size="icon-xs" variant="ghost" aria-label={`Remove ${m?.brand} listing`}
                                            onClick={() => confirmAction(`Remove the ${m?.brand} listing from ${p.name}?`) && done(d.run("DELETE", `/api/stock/${s.medicineId}?pharmacyId=${p.id}`), "Listing removed.")}
                                          ><X /></Button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MedicineForm({ medicine, onDone, onCancel }: { medicine?: Medicine; onDone: (label: string) => void; onCancel?: () => void }) {
  const { run } = useDashboardData();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    const r = await run(medicine ? "PATCH" : "POST", medicine ? `/api/medicines/${medicine.id}` : "/api/medicines", {
      brand: text("brand"), generic: text("generic"), strength: text("strength"), form: text("form"),
      manufacturer: text("manufacturer"), category: text("category"), price: Number(f.get("price")),
      description: text("description"), uses: text("uses"), cautions: text("cautions"), sideEffects: text("sideEffects"),
      ingredients: text("ingredients"), rx: f.get("rx") === "on", rare: f.get("rare") === "on",
    });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setError(null);
    form.reset();
    onDone(`${text("brand")} ${text("strength")}`);
  }

  const lines = (a?: string[]) => a?.join("\n") ?? "";

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="brand">Brand</Label><Input id="brand" name="brand" defaultValue={medicine?.brand} required /></div>
        <div className="space-y-1.5"><Label htmlFor="generic">Generic</Label><Input id="generic" name="generic" defaultValue={medicine?.generic} required /></div>
        <div className="space-y-1.5"><Label htmlFor="strength">Strength</Label><Input id="strength" name="strength" placeholder="500 mg" defaultValue={medicine?.strength} required /></div>
        <div className="space-y-1.5">
          <Label htmlFor="form">Form</Label>
          <select id="form" name="form" className={selectClass} defaultValue={medicine?.form}>{["Tablet", "Capsule", "Syrup", "Injection"].map((f) => <option key={f}>{f}</option>)}</select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" name="manufacturer" defaultValue={medicine?.manufacturer} required /></div>
        <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" name="category" defaultValue={medicine?.category} required /></div>
        <div className="space-y-1.5"><Label htmlFor="price">Price (৳)</Label><Input id="price" name="price" type="number" min={0} defaultValue={medicine?.price} required /></div>
        <div className="space-y-1.5"><Label htmlFor="ingredients">Ingredients</Label><Input id="ingredients" name="ingredients" placeholder="comma or new line" defaultValue={medicine?.ingredients.join(", ")} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={medicine?.description} required /></div>
      <div className="space-y-1.5"><Label htmlFor="uses">Uses (one per line)</Label><Textarea id="uses" name="uses" defaultValue={lines(medicine?.uses)} /></div>
      <div className="space-y-1.5"><Label htmlFor="cautions">Cautions (one per line) — shown in AI caution cards</Label><Textarea id="cautions" name="cautions" defaultValue={lines(medicine?.cautions)} /></div>
      <div className="space-y-1.5"><Label htmlFor="sideEffects">Side effects (one per line)</Label><Textarea id="sideEffects" name="sideEffects" defaultValue={lines(medicine?.sideEffects)} /></div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5"><input type="checkbox" name="rx" defaultChecked={medicine?.rx} /> Rx only</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" name="rare" defaultChecked={medicine?.rare} /> Rare</label>
      </div>
      {error && <Notice kind="err">{error}</Notice>}
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={busy}>{busy ? "Saving…" : medicine ? "Save changes" : "Add to database"}</Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

export function AdminMedicines() {
  const d = useDashboardData();
  const { done, show, node } = useFeedback();
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = d.medicines.filter((m) => !q || `${m.brand} ${m.generic} ${m.category}`.toLowerCase().includes(q));

  async function remove(m: Medicine) {
    const listings = d.stock.filter((s) => s.medicineId === m.id).length;
    if (!confirmAction(`Delete ${m.brand} ${m.strength}? It will also be removed from ${listings} pharmacy listing${listings === 1 ? "" : "s"}.`)) return;
    if (editing?.id === m.id) setEditing(null);
    await done(d.run("DELETE", `/api/medicines/${m.id}`), `${m.brand} deleted.`);
  }

  return (
    <>
      <PageHeader title="Medicine database" description="The curated source the AI caution layer retrieves from. Keep cautions accurate." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {node}
          <Input className="h-10 max-w-sm" placeholder="Search medicines…" aria-label="Search medicines" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Brand</TableHead><TableHead>Generic</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((m) => (
                    <TableRow key={m.id} className={editing?.id === m.id ? "bg-muted/50" : undefined}>
                      <TableCell className="font-medium">{m.brand} {m.strength}</TableCell>
                      <TableCell>{m.generic}</TableCell>
                      <TableCell>{m.category}</TableCell>
                      <TableCell className="space-x-1"><RxBadge rx={m.rx} />{m.rare && <Badge variant="outline">Rare</Badge>}</TableCell>
                      <TableCell>{formatBDT(m.price)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(m)}><Pencil /> Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => remove(m)} aria-label={`Delete ${m.brand}`}><Trash2 /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {shown.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No medicine matches “{query}”.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit xl:sticky xl:top-20">
          <CardHeader><CardTitle>{editing ? `Edit ${editing.brand}` : "Add medicine"}</CardTitle></CardHeader>
          <CardContent>
            <MedicineForm
              key={editing?.id ?? "new"}
              medicine={editing ?? undefined}
              onCancel={editing ? () => setEditing(null) : undefined}
              onDone={(label) => { show("ok", `${label} ${editing ? "updated" : "added"}.`); setEditing(null); }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function AdminOrders() {
  const d = useDashboardData();
  const { done, node } = useFeedback();
  return (
    <>
      <PageHeader title="Orders" description="All orders across pharmacies. Admin can cancel suspicious orders." />
      <div className="space-y-4">
        {node}
        <OrdersTable
          orders={d.orders}
          show={{ patient: true, pharmacy: true }}
          actions={(o) =>
            ["delivered", "cancelled"].includes(o.status) ? null : (
              <Button size="sm" variant="destructive" onClick={() => confirmAction(`Cancel order ${o.id}?`) && done(d.run("PATCH", `/api/orders/${o.id}`, { status: "cancelled" }), `${o.id} cancelled.`)}>Cancel</Button>
            )
          }
        />
      </div>
    </>
  );
}
