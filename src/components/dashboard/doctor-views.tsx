"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, FilePlus, FileText, ShieldCheck, ShieldX, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/components/auth/auth-provider";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { EmptyState, PrescriptionList } from "@/components/dashboard/shared";
import { PrescriptionForm } from "@/components/dashboard/prescription-form";
import { Welcome } from "@/components/dashboard/welcome";

function useDoctor() {
  const { user } = useAuth();
  const data = useDashboardData();
  const me = data.users.find((u) => u.id === user?.id);
  return {
    id: user?.id ?? "",
    status: me?.status ?? "pending",
    registrationNo: me?.registrationNo ?? user?.registrationNo,
    prescriptions: data.prescriptions.filter((r) => r.doctorId === user?.id),
    // Only verified patients can receive prescriptions.
    patients: data.users.filter((u) => u.role === "patient" && u.status === "verified"),
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
  return (
    <div className="space-y-6">
      <Welcome
        blurb={verified ? "Issue digital prescriptions and review everything you have issued." : "Your account is awaiting verification."}
        actions={verified && <Link href="/doctor/prescriptions/new" className={buttonVariants({ variant: "secondary" })}>New prescription</Link>}
      />
      <VerificationNotice status={d.status} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Prescriptions issued" value={d.prescriptions.length} icon={FileText} />
        <StatCard label="Patients" value={new Set(d.prescriptions.map((r) => r.patientId)).size} icon={Users} />
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

export function DoctorNewPrescription() {
  const router = useRouter();
  const d = useDoctor();
  const verified = d.status === "verified";
  return (
    <>
      <PageHeader title="New prescription" description="Prescribed medicines become purchasable for the patient. Valid for 30 days." />
      <VerificationNotice status={d.status} />
      {verified && (
        <Card className="max-w-3xl">
          <CardContent>
            {d.patients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No patients are registered yet.</p>
            ) : (
              <PrescriptionForm mode="issue" doctorId={d.id} patients={d.patients} onDone={() => router.push("/doctor/prescriptions")} />
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function DoctorHistory() {
  const d = useDoctor();
  return (
    <>
      <PageHeader
        title="Prescription history"
        description="Every prescription you have issued."
        actions={d.status === "verified" ? <Link href="/doctor/prescriptions/new" className={buttonVariants()}><FilePlus /> New prescription</Link> : <StatusBadge status={d.status} />}
      />
      {d.prescriptions.length === 0 ? <EmptyState>Nothing issued yet.</EmptyState> : <PrescriptionList items={d.prescriptions} party="doctor" />}
    </>
  );
}
