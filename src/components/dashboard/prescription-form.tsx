"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardData, type DashUser } from "@/components/dashboard/data-provider";
import { Notice, selectClass } from "@/components/dashboard/shared";
import { today, VALID_DAYS } from "@/lib/rules";
import type { Prescription } from "@/lib/types";

const MAX_ROWS = 10;

type Row = { medicineId: string; dose: string; days: string };
const blank = (): Row => ({ medicineId: "", dose: "", days: "" });

type Props =
  | { mode: "issue"; patients: DashUser[]; onDone: () => void }
  | { mode: "edit"; rx: Prescription; onDone: () => void; onCancel: () => void }
  | { mode: "upload"; onDone: () => void };

/**
 * Doctor: issue a new prescription, or edit one they issued.
 * Patient: upload a copy of a paper prescription. All three save through the server API.
 */
export function PrescriptionForm(props: Props) {
  const { medicines, run } = useDashboardData();
  const isUpload = props.mode === "upload";
  const isEdit = props.mode === "edit";
  const rx = props.mode === "edit" ? props.rx : null;

  const [patientId, setPatientId] = useState(props.mode === "issue" ? (props.patients[0]?.id ?? "") : "");
  const [diagnosis, setDiagnosis] = useState(rx?.diagnosis ?? "");
  const [doctorName, setDoctorName] = useState("");
  const [issuedAt, setIssuedAt] = useState(today());
  const [validUntil, setValidUntil] = useState(rx?.validUntil ?? "");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Row[]>(() =>
    rx ? rx.items.map((i) => ({ medicineId: i.medicineId, dose: i.dose, days: String(i.days) })) : [blank(), blank()],
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const chosen = new Set(rows.map((r) => r.medicineId).filter(Boolean));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = rows
      .filter((r) => r.medicineId)
      .map((r) => ({ medicineId: r.medicineId, dose: r.dose.trim() || "As directed", days: Number(r.days) > 0 ? Number(r.days) : 5 }));
    if (props.mode === "issue" && !patientId) return setError("Choose a patient.");
    if (items.length === 0) return setError("Add at least one medicine.");
    if (isUpload && !fileName) return setError("Attach a photo or PDF of the prescription.");

    setError(null);
    setBusy(true);
    const result = rx
      ? await run("PATCH", `/api/prescriptions/${rx.id}`, { diagnosis, items, validUntil })
      : await run("POST", "/api/prescriptions", isUpload ? { diagnosis, items, issuedAt, fileName, doctorName } : { patientId, diagnosis, items });
    setBusy(false);
    if (!result.ok) return setError(result.error);
    props.onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {props.mode === "issue" && (
          <div className="space-y-1.5">
            <Label htmlFor="patientId">Patient</Label>
            <select id="patientId" className={selectClass} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {props.patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` — ${p.city}` : ""}</option>)}
            </select>
          </div>
        )}
        {isUpload && (
          <div className="space-y-1.5">
            <Label htmlFor="doctorName">Prescribing doctor (optional)</Label>
            <Input id="doctorName" className="h-10" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="e.g. Dr. A. Rahman" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="diagnosis">Diagnosis{isUpload ? " (optional)" : ""}</Label>
          <Input id="diagnosis" className="h-10" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Hypertension" />
        </div>
        {isUpload && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="issuedAt">Date on prescription</Label>
              <Input id="issuedAt" type="date" className="h-10" max={today()} value={issuedAt} onChange={(e) => setIssuedAt(e.target.value || today())} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="file">Photo or PDF</Label>
              <Input id="file" type="file" accept="image/*,application/pdf" className="h-10 pt-1.5" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            </div>
          </>
        )}
        {isEdit && (
          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" type="date" className="h-10" min={rx?.issuedAt} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Medicines</Label>
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_90px_auto]">
            <select className={selectClass} value={r.medicineId} onChange={(e) => setRow(i, { medicineId: e.target.value })} aria-label={`Medicine ${i + 1}`}>
              <option value="">{i === 0 ? "Select medicine…" : "(optional)"}</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id} disabled={chosen.has(m.id) && r.medicineId !== m.id}>
                  {m.brand} {m.strength} — {m.generic}{m.rx ? " (Rx)" : ""}
                </option>
              ))}
            </select>
            <Input className="h-10" value={r.dose} onChange={(e) => setRow(i, { dose: e.target.value })} placeholder="Dose, e.g. 1 tab twice daily" aria-label={`Dose ${i + 1}`} />
            <Input className="h-10" type="number" min={1} value={r.days} onChange={(e) => setRow(i, { days: e.target.value })} placeholder="Days" aria-label={`Days ${i + 1}`} />
            <Button type="button" variant="ghost" size="icon" className="h-10" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove medicine ${i + 1}`}><X /></Button>
          </div>
        ))}
        {rows.length < MAX_ROWS && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, blank()])}><Plus /> Add medicine</Button>
        )}
      </div>

      {!isEdit && <p className="text-xs text-muted-foreground">Valid for {VALID_DAYS} days from the prescription date. Rx-only medicines on it become purchasable for the patient.</p>}
      {error && <Notice kind="err">{error}</Notice>}
      <div className="flex gap-2">
        <Button type="submit" className="h-10" disabled={busy}>
          {busy ? "Saving…" : isEdit ? "Save changes" : isUpload ? "Upload prescription" : "Issue prescription"}
        </Button>
        {props.mode === "edit" && <Button type="button" variant="outline" className="h-10" onClick={props.onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
