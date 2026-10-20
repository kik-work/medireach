"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardData, type DashUser } from "@/components/dashboard/data-provider";
import { selectClass } from "@/components/dashboard/shared";
import { addDays, addPrescription, today } from "@/lib/dashboard-store";
import type { PrescriptionItem } from "@/lib/types";

const SLOTS = 3;
const VALID_DAYS = 30;

type Props =
  | { mode: "issue"; doctorId: string; patients: DashUser[]; onDone: () => void }
  | { mode: "upload"; patientId: string; onDone: () => void };

/** Doctor: issue a prescription to a patient. Patient: upload a copy of a paper prescription. */
export function PrescriptionForm(props: Props) {
  const { medicines } = useDashboardData();
  const isIssue = props.mode === "issue";
  const [patientId, setPatientId] = useState(props.mode === "issue" ? (props.patients[0]?.id ?? "") : props.patientId);
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [issuedAt, setIssuedAt] = useState(today());
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(() => Array.from({ length: SLOTS }, () => ({ medicineId: "", dose: "", days: "" })));
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items: PrescriptionItem[] = rows
      .filter((r) => r.medicineId)
      .map((r) => ({ medicineId: r.medicineId, dose: r.dose.trim() || "As directed", days: Number(r.days) > 0 ? Number(r.days) : 5 }));
    if (!patientId) return setError("Choose a patient.");
    if (items.length === 0) return setError("Add at least one medicine.");
    if (!isIssue && !fileName) return setError("Attach a photo or PDF of the prescription.");

    const issued = isIssue ? today() : issuedAt;
    addPrescription({
      id: `rx-${Date.now().toString(36)}`,
      doctorId: props.mode === "issue" ? props.doctorId : "",
      patientId,
      issuedAt: issued,
      validUntil: addDays(issued, VALID_DAYS),
      diagnosis: diagnosis.trim(),
      items,
      ...(!isIssue && { uploaded: true, fileName, doctorName: doctorName.trim() || undefined }),
    });
    props.onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {props.mode === "issue" ? (
          <div className="space-y-1.5">
            <Label htmlFor="patientId">Patient</Label>
            <select id="patientId" className={selectClass} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              {props.patients.map((p) => <option key={p.id} value={p.id}>{p.name}{p.city ? ` — ${p.city}` : ""}</option>)}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="doctorName">Prescribing doctor (optional)</Label>
            <Input id="doctorName" className="h-10" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} placeholder="e.g. Dr. A. Rahman" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="diagnosis">Diagnosis{isIssue ? "" : " (optional)"}</Label>
          <Input id="diagnosis" className="h-10" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Hypertension" />
        </div>
        {!isIssue && (
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
      </div>

      <div className="space-y-2">
        <Label>Medicines</Label>
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_90px]">
            <select className={selectClass} value={r.medicineId} onChange={(e) => setRow(i, { medicineId: e.target.value })} aria-label={`Medicine ${i + 1}`}>
              <option value="">{i === 0 ? "Select medicine…" : "(optional)"}</option>
              {medicines.map((m) => <option key={m.id} value={m.id}>{m.brand} {m.strength} — {m.generic}{m.rx ? " (Rx)" : ""}</option>)}
            </select>
            <Input className="h-10" value={r.dose} onChange={(e) => setRow(i, { dose: e.target.value })} placeholder="Dose, e.g. 1 tab twice daily" aria-label={`Dose ${i + 1}`} />
            <Input className="h-10" type="number" min={1} value={r.days} onChange={(e) => setRow(i, { days: e.target.value })} placeholder="Days" aria-label={`Days ${i + 1}`} />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Valid for {VALID_DAYS} days from the prescription date. Rx-only medicines on it become purchasable for the patient.</p>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button type="submit" className="h-10">{isIssue ? "Issue prescription" : "Upload prescription"}</Button>
    </form>
  );
}
