"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Package, Pill, Sparkles, Store, Users, Wallet } from "lucide-react";
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
import { EmptyState, OrdersTable, selectClass } from "@/components/dashboard/shared";
import { Welcome } from "@/components/dashboard/welcome";
import { formatBDT } from "@/lib/constants";
import { addMedicine, setOrderStatus, setPharmacyStatus, setUserStatus } from "@/lib/dashboard-store";
import type { Medicine, VerificationStatus } from "@/lib/types";

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
        <StatCard label="Caution rules" value="8 pairs" icon={Sparkles} hint="interaction table" />
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
  const people = d.users.filter((u) => u.role !== "patient");
  const pharmacies = d.pharmacies.filter((p) => p.status !== "verified");

  return (
    <>
      <PageHeader title="Verifications" description="In production these map to BMDC, Pharmacy Council and DGDA checks. Only approved doctors can issue prescriptions." />
      <div className="space-y-8">
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
                          ? <Decision onDecide={(s) => setUserStatus(u.id, s)} />
                          : <div className="flex justify-end"><SuspendToggle status={u.status} onDecide={(s) => setUserStatus(u.id, s)} /></div>}
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
                        <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.area}, {p.city}</div></TableCell>
                        <TableCell>{p.licenseNo}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell>{p.status === "pending" ? <Decision onDecide={(s) => setPharmacyStatus(p.id, s)} /> : null}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </>
  );
}

export function AdminPharmacies() {
  const d = useDashboardData();
  return (
    <>
      <PageHeader title="Pharmacies" description="Suspend bad actors or reinstate them. Suspended pharmacies are removed from availability." />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Pharmacy</TableHead><TableHead>City</TableHead><TableHead>Listings</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {d.pharmacies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.licenseNo}</div></TableCell>
                  <TableCell>{p.city}</TableCell>
                  <TableCell>{d.stock.filter((s) => s.pharmacyId === p.id).length}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell><div className="flex justify-end"><SuspendToggle status={p.status} onDecide={(s) => setPharmacyStatus(p.id, s)} /></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

const lines = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((s) => s.trim()).filter(Boolean);

export function AdminMedicines() {
  const d = useDashboardData();
  const [formKey, setFormKey] = useState(0);
  const [added, setAdded] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const brand = String(f.get("brand")).trim();
    const strength = String(f.get("strength")).trim();
    const generic = String(f.get("generic")).trim();
    const medicine: Medicine = {
      id: `m${String(d.medicines.length + 1).padStart(2, "0")}`,
      slug: `${brand}-${strength}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      brand,
      generic,
      ingredients: [generic.toLowerCase()],
      strength,
      form: String(f.get("form")) as Medicine["form"],
      manufacturer: String(f.get("manufacturer")).trim(),
      category: String(f.get("category")).trim(),
      rx: f.get("rx") === "on",
      rare: f.get("rare") === "on",
      price: Number(f.get("price")) || 0,
      description: String(f.get("description")).trim(),
      uses: lines(f.get("uses")),
      cautions: lines(f.get("cautions")),
      sideEffects: [],
    };
    addMedicine(medicine);
    setAdded(`${brand} ${strength}`);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <PageHeader title="Medicine database" description="The curated source the AI caution layer retrieves from." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Brand</TableHead><TableHead>Generic</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {d.medicines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.brand} {m.strength}</TableCell>
                    <TableCell>{m.generic}</TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell className="space-x-1"><RxBadge rx={m.rx} />{m.rare && <Badge variant="outline">Rare</Badge>}</TableCell>
                    <TableCell>{formatBDT(m.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Add medicine</CardTitle></CardHeader>
          <CardContent>
            {added && <p className="mb-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">Added {added}.</p>}
            <form key={formKey} onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="brand">Brand</Label><Input id="brand" name="brand" required /></div>
                <div className="space-y-1.5"><Label htmlFor="generic">Generic</Label><Input id="generic" name="generic" required /></div>
                <div className="space-y-1.5"><Label htmlFor="strength">Strength</Label><Input id="strength" name="strength" placeholder="500 mg" required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="form">Form</Label>
                  <select id="form" name="form" className={selectClass}>{["Tablet", "Capsule", "Syrup", "Injection"].map((f) => <option key={f}>{f}</option>)}</select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" name="manufacturer" required /></div>
                <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" name="category" required /></div>
                <div className="space-y-1.5"><Label htmlFor="price">Price (৳)</Label><Input id="price" name="price" type="number" min={0} required /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" required /></div>
              <div className="space-y-1.5"><Label htmlFor="uses">Uses (one per line)</Label><Textarea id="uses" name="uses" /></div>
              <div className="space-y-1.5"><Label htmlFor="cautions">Cautions (one per line)</Label><Textarea id="cautions" name="cautions" /></div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5"><input type="checkbox" name="rx" /> Rx only</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="rare" /> Rare</label>
              </div>
              <Button type="submit" className="w-full">Add to database</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function AdminOrders() {
  const d = useDashboardData();
  return (
    <>
      <PageHeader title="Orders" description="All orders across pharmacies. Admin can cancel suspicious orders." />
      <OrdersTable
        orders={d.orders}
        show={{ patient: true, pharmacy: true }}
        actions={(o) =>
          ["delivered", "cancelled"].includes(o.status) ? null : (
            <Button size="sm" variant="destructive" onClick={() => setOrderStatus(o.id, "cancelled")}>Cancel</Button>
          )
        }
      />
    </>
  );
}
