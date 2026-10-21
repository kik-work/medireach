"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Paperclip, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ModeLabel } from "@/components/consult/parts";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { api } from "@/lib/api";
import { formatDay, type RoomData } from "@/lib/consult";
import type { Appointment, MedicalReport } from "@/lib/types";

/** What the doctor needs while writing a prescription from a consultation: who, why, test reports, earlier prescriptions. */
export function VisitSummary({ appointment }: { appointment: Appointment }) {
  const { users, prescriptions, medicines } = useDashboardData();
  const [reports, setReports] = useState<MedicalReport[] | null>(null);

  useEffect(() => {
    let live = true;
    void api<RoomData>("GET", `/api/appointments/${appointment.id}`).then((r) => {
      if (live && r.ok) setReports(r.data.reports);
    });
    return () => { live = false; };
  }, [appointment.id]);

  const patient = users.find((u) => u.id === appointment.patientId);
  const earlier = prescriptions.filter((r) => r.patientId === appointment.patientId && r.appointmentId !== appointment.id).slice(0, 3);
  const brand = (id: string) => medicines.find((m) => m.id === id)?.brand ?? "Removed medicine";

  return (
    <Card className="h-fit xl:sticky xl:top-24">
      <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-primary" /> Patient and visit</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-semibold">{patient?.name ?? "Patient"}</p>
          <p className="text-muted-foreground">{patient?.city}</p>
        </div>
        <div className="space-y-1">
          <p className="font-medium">{formatDay(appointment.date)} at {appointment.time} · <span className="font-normal text-muted-foreground"><ModeLabel mode={appointment.mode} /></span></p>
          <p className="text-muted-foreground">Reason: {appointment.reason}</p>
        </div>

        <div className="space-y-1.5">
          <p className="font-medium">Test reports</p>
          {reports === null ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : reports.length === 0 ? (
            <p className="text-muted-foreground">The patient has not attached any report.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {reports.map((r) => (
                <li key={r.id} className="flex items-center gap-2 p-2">
                  <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{r.fileName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.uploadedAt}{r.note ? ` · ${r.note}` : ""}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="font-medium">Your earlier prescriptions</p>
          {earlier.length === 0 ? (
            <p className="text-muted-foreground">None for this patient.</p>
          ) : (
            <ul className="space-y-2">
              {earlier.map((r) => (
                <li key={r.id} className="rounded-lg border p-2">
                  <p className="font-medium">{r.diagnosis || r.id} <span className="text-xs font-normal text-muted-foreground">· {r.issuedAt}</span></p>
                  <p className="text-muted-foreground">{r.items.map((i) => brand(i.medicineId)).join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link href={`/doctor/appointments/${appointment.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>Open consultation room</Link>
      </CardContent>
    </Card>
  );
}
