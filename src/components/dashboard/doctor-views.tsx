"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, FilePlus, FileText, Pencil, ShieldCheck, ShieldX, Trash2, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, PrescriptionList, useFeedback } from "@/components/dashboard/shared";
import { PrescriptionForm } from "@/components/dashboard/prescription-form";
import { VisitSummary } from "@/components/consult/visit-summary";
import { Welcome } from "@/components/dashboard/welcome";
import { today } from "@/lib/rules";

function useDoctor() {
  const data = useDashboardData();
  return {
    ...data,
    status: data.me.status,
    registrationNo: data.me.registrationNo,
    // Only verified patients can receive prescriptions (the server sends just those).
    patients: data.users.filter((u) => u.role === "patient"),
  };
}

const STATUS_NOTE: Record<string, string> = {
  pending: "Your BMDC registration is waiting for admin review. You can issue prescriptions once it is approved.",
  rejected: "Your registration was rejected by the admin team. You cannot issue prescriptions.",
  suspended: "Your account is suspended. You cannot issue prescriptions.",
};

function VerificationNotice({ status }: { status: string }) {
  if (status === "verified") return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <Clock className="mt-0.5 size-4 shrink-0" />
      <p>{STATUS_NOTE[status] ?? "Your account is not verified."}</p>
    </div>
  );
}

export function DoctorOverview() {
  const d = useDoctor();
  const verified = d.status === "verified";
  const valid = d.prescriptions.filter((r) => r.validUntil >= today()).length;
  const requests = d.appointments.filter((a) => a.status === "requested").length;
  const medicineReviews = d.pendingMedicines.length;
  return (
    <div className="space-y-6">
      <Welcome
        blurb={verified ? "Issue digital prescriptions and review everything you have issued." : "Your account is awaiting verification."}
        actions={verified && <Link href="/doctor/prescriptions/new" className={buttonVariants({ variant: "secondary" })}>New prescription</Link>}
      />
      <VerificationNotice status={d.status} />

      {requests > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>{requests} appointment request{requests > 1 ? "s" : ""} waiting for your answer.</p>
            <Link href="/doctor/appointments" className={buttonVariants({ size: "sm" })}>Review requests</Link>
          </CardContent>
        </Card>
      )}

      {verified && medicineReviews > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p>{medicineReviews} medicine{medicineReviews > 1 ? "s are" : " is"} waiting for your review before going live.</p>
            <Link href="/doctor/medicines" className={buttonVariants({ size: "sm" })}>Review medicines</Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prescriptions issued" value={d.prescriptions.length} icon={FileText} hint={`${valid} still valid`} />
        <StatCard label="Patients" value={new Set(d.prescriptions.map((r) => r.patientId)).size} icon={Users} />
        <StatCard label="Registered patients" value={d.patients.length} icon={Users} hint="you can prescribe to" />
        <StatCard
          label="Registration"
          value={verified ? "Verified" : d.status[0].toUpperCase() + d.status.slice(1)}
          icon={verified ? ShieldCheck : ShieldX}
          hint={d.registrationNo ?? "No BMDC number"}
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Latest prescription</h2>
          <Link href="/doctor/prescriptions" className="text-sm text-primary hover:underline">View history</Link>
        </div>
        {d.prescriptions[0] ? <PrescriptionList items={[d.prescriptions[0]]} party="doctor" /> : <EmptyState>You have not issued a prescription yet.</EmptyState>}
      </section>
    </div>
  );
}

export function DoctorNewPrescription({ patientId, appointmentId }: { patientId?: string; appointmentId?: string }) {
  const router = useRouter();
  const d = useDoctor();
  const verified = d.status === "verified";
  // Written from a consultation room: the prescription is linked to that appointment and patient.
  const appointment = d.appointments.find((a) => a.id === appointmentId && a.patientId === patientId);
  return (
    <>
      <PageHeader title="New prescription" description="Prescribed medicines become purchasable for the patient. Valid for 30 days." />
      <div className={appointment && verified ? "grid gap-6 xl:grid-cols-[1fr_380px]" : "space-y-4"}>
        <VerificationNotice status={d.status} />
        {verified && (
          <Card className="max-w-3xl">
            <CardContent>
              {d.patients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients are registered yet.</p>
              ) : (
                <PrescriptionForm
                  mode="issue"
                  patients={d.patients}
                  defaultPatientId={appointment?.patientId}
                  appointmentId={appointment?.id}
                  onDone={() => router.push(appointment ? `/doctor/appointments/${appointment.id}` : "/doctor/prescriptions")}
                />
              )}
            </CardContent>
          </Card>
        )}
        {verified && appointment && <VisitSummary appointment={appointment} />}
      </div>
    </>
  );
}

export function DoctorHistory() {
  const d = useDoctor();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { done, node } = useFeedback();
  const verified = d.status === "verified";

  const q = query.trim().toLowerCase();
  const patientName = (id: string) => d.users.find((u) => u.id === id)?.name ?? "";
  const shown = d.prescriptions.filter(
    (r) =>
      !q ||
      [r.id, r.diagnosis, patientName(r.patientId), ...r.items.map((i) => d.medicines.find((m) => m.id === i.medicineId)?.brand ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );

  async function revoke(id: string) {
    if (!confirmAction(`Delete prescription ${id}? The patient will no longer be able to buy Rx medicines with it.`)) return;
    await done(d.run("DELETE", `/api/prescriptions/${id}`), `Prescription ${id} deleted.`);
  }

  return (
    <>
      <PageHeader
        title="Prescription history"
        description="Every prescription you have issued. Edit or delete them while following up on a case."
        actions={verified ? <Link href="/doctor/prescriptions/new" className={buttonVariants()}><FilePlus /> New prescription</Link> : <StatusBadge status={d.status} />}
      />
      <div className="space-y-4">
        {node}
        {d.prescriptions.length > 0 && (
          <Input className="h-10 max-w-sm" placeholder="Search by patient, diagnosis or medicine…" aria-label="Search prescriptions" value={query} onChange={(e) => setQuery(e.target.value)} />
        )}
        {d.prescriptions.length === 0 ? (
          <EmptyState>Nothing issued yet.</EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState>No prescription matches “{query}”.</EmptyState>
        ) : (
          <PrescriptionList
            items={shown}
            party="doctor"
            actions={(rx) =>
              editing === rx.id ? null : (
                <>
                  <Button size="sm" variant="outline" disabled={!verified} onClick={() => { setEditing(rx.id); setTimeout(() => document.getElementById("edit-rx")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }}><Pencil /> Edit</Button>
                  <Button size="sm" variant="destructive" disabled={!verified} onClick={() => revoke(rx.id)}><Trash2 /> Delete</Button>
                </>
              )
            }
          />
        )}
        {editing && d.prescriptions.find((r) => r.id === editing) && (
          <Card id="edit-rx" className="max-w-3xl border-primary/40">
            <CardContent className="space-y-3">
              <h2 className="font-semibold">Edit {editing}</h2>
              <PrescriptionForm
                key={editing}
                mode="edit"
                rx={d.prescriptions.find((r) => r.id === editing)!}
                onDone={() => { setEditing(null); }}
                onCancel={() => setEditing(null)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
