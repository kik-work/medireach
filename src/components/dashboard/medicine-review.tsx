"use client";

import { useState } from "react";
import { BadgeCheck, Clock, Plus, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { RxBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, Notice, selectClass, useFeedback } from "@/components/dashboard/shared";
import { formatBDT } from "@/lib/constants";
import type { Interaction, Medicine } from "@/lib/types";

type Row = { ingredient: string; with: string; severity: Interaction["severity"]; message: string };

const lines = (a: string[]) => a.join("\n");

function ReviewForm({ medicine, onDone }: { medicine: Medicine; onDone: (text: string) => void }) {
  const { medicines, run } = useDashboardData();
  const [description, setDescription] = useState(medicine.description);
  const [uses, setUses] = useState(lines(medicine.uses));
  const [cautions, setCautions] = useState(lines(medicine.cautions));
  const [sideEffects, setSideEffects] = useState(lines(medicine.sideEffects));
  const [rows, setRows] = useState<Row[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Ingredients already in the catalogue, offered while typing the other side of an interaction.
  const known = [...new Set(medicines.flatMap((m) => m.ingredients))].filter((i) => !medicine.ingredients.includes(i)).sort();
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const blank = (): Row => ({ ingredient: medicine.ingredients[0], with: "", severity: "moderate", message: "" });

  async function decide(decision: "approve" | "reject") {
    if (decision === "reject" && !confirmAction(`Reject ${medicine.brand} ${medicine.strength}? The admin sees your note and can send it again.`)) return;
    setError(null);
    setBusy(true);
    const r = await run("POST", `/api/medicines/${medicine.id}/review`, { decision, note, description, uses, cautions, sideEffects, interactions: rows });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onDone(decision === "approve" ? `${medicine.brand} ${medicine.strength} approved. It is live now.` : `${medicine.brand} ${medicine.strength} rejected.`);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void decide("approve"); }} className="space-y-4 rounded-lg border bg-muted/30 p-4" noValidate>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
        What you write here is shown to patients and used by the AI caution layer. It is retrieved as written, never changed by a model. Your name and BMDC number are recorded as the reviewer.
      </p>
      <div className="space-y-1.5"><Label htmlFor={`d-${medicine.id}`}>Description</Label><Textarea id={`d-${medicine.id}`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} /></div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor={`u-${medicine.id}`}>Uses (one per line)</Label><Textarea id={`u-${medicine.id}`} value={uses} onChange={(e) => setUses(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`c-${medicine.id}`}>Cautions (one per line)</Label><Textarea id={`c-${medicine.id}`} value={cautions} onChange={(e) => setCautions(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor={`s-${medicine.id}`}>Side effects (one per line)</Label><Textarea id={`s-${medicine.id}`} value={sideEffects} onChange={(e) => setSideEffects(e.target.value)} /></div>
      </div>

      <div className="space-y-2">
        <Label>Interactions with other medicines (optional)</Label>
        <datalist id={`ing-${medicine.id}`}>{known.map((i) => <option key={i} value={i} />)}</datalist>
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-[130px_1fr_120px_2fr_auto]">
            <select className={selectClass} value={r.ingredient} onChange={(e) => setRow(i, { ingredient: e.target.value })} aria-label={`Ingredient ${i + 1}`}>
              {medicine.ingredients.map((ing) => <option key={ing}>{ing}</option>)}
            </select>
            <Input className="h-10" list={`ing-${medicine.id}`} value={r.with} onChange={(e) => setRow(i, { with: e.target.value })} placeholder="interacts with, e.g. warfarin" aria-label={`Other ingredient ${i + 1}`} />
            <select className={selectClass} value={r.severity} onChange={(e) => setRow(i, { severity: e.target.value as Row["severity"] })} aria-label={`Severity ${i + 1}`}>
              <option value="minor">Minor</option><option value="moderate">Moderate</option><option value="major">Major</option>
            </select>
            <Input className="h-10" value={r.message} onChange={(e) => setRow(i, { message: e.target.value })} maxLength={300} placeholder="What the patient should know" aria-label={`Message ${i + 1}`} />
            <Button type="button" variant="ghost" size="icon" className="h-10" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove interaction ${i + 1}`}><X /></Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, blank()])}><Plus /> Add interaction</Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`n-${medicine.id}`}>Note to the admin (required when rejecting)</Label>
        <Input id={`n-${medicine.id}`} className="h-10" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Strength does not match the manufacturer label" />
      </div>
      {error && <Notice kind="err">{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-10" disabled={busy}><BadgeCheck /> {busy ? "Saving…" : "Approve and publish"}</Button>
        <Button type="button" variant="destructive" className="h-10" disabled={busy} onClick={() => decide("reject")}>Reject</Button>
      </div>
    </form>
  );
}

/** Doctor queue: medicines the admin added that wait for a verified doctor. */
export function DoctorMedicineReviews() {
  const d = useDashboardData();
  const { show, node } = useFeedback();
  const [open, setOpen] = useState<string | null>(null);
  const verified = d.me.status === "verified";
  const mine = d.medicines.filter((m) => m.review?.reviewedBy === d.me.id);

  return (
    <>
      <PageHeader
        title="Medicine reviews"
        description="The admin adds medicines. A medicine goes live only after a verified doctor approves it and supplies its cautions and interactions."
      />
      <div className="space-y-6">
        {!verified && (
          <p className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Clock className="mt-0.5 size-4 shrink-0" /> Only a verified doctor can review medicines. Your registration is waiting for admin review.
          </p>
        )}
        {node}
        <section className="space-y-3">
          <h2 className="font-semibold">Waiting for review ({d.pendingMedicines.length})</h2>
          {d.pendingMedicines.length === 0 && <EmptyState>No medicine is waiting for review.</EmptyState>}
          {d.pendingMedicines.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{m.brand} {m.strength}</span>
                  <span className="text-sm text-muted-foreground">{m.generic} · {m.form}</span>
                  <RxBadge rx={m.rx} />
                  {m.rare && <Badge variant="outline">Rare</Badge>}
                  <Button className="ml-auto" size="sm" disabled={!verified} variant={open === m.id ? "outline" : "default"} onClick={() => setOpen(open === m.id ? null : m.id)}>
                    {open === m.id ? "Close" : "Review"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {m.manufacturer} · {m.category} · reference {formatBDT(m.price)} · ingredients: {m.ingredients.join(", ")}
                </p>
                {m.review?.note && <p className="text-sm text-muted-foreground">Admin note: {m.review.note}</p>}
                {open === m.id && <ReviewForm key={m.id} medicine={m} onDone={(text) => { setOpen(null); show("ok", text); }} />}
              </CardContent>
            </Card>
          ))}
        </section>

        {mine.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Approved by you ({mine.length})</h2>
            <Card>
              <CardContent>
                <ul className="divide-y text-sm">
                  {mine.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span className="font-medium">{m.brand} {m.strength} <span className="font-normal text-muted-foreground">{m.generic}</span></span>
                      <span className="text-muted-foreground">approved {m.review?.reviewedAt}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}
