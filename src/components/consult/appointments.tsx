"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarCheck, Check, ClipboardList, DoorOpen, History, Pencil, Stethoscope, Users, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, ModeLabel } from "@/components/consult/parts";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, EmptyState, Notice, selectClass, useFeedback } from "@/components/dashboard/shared";
import { bookableDates, formatDay, freeSlots, isActive, isLive } from "@/lib/consult";
import { SPECIALTY_NAMES } from "@/lib/specialties";
import { cn } from "@/lib/utils";
import type { Appointment, DoctorProfile } from "@/lib/types";

const byWhen = (a: Appointment, b: Appointment) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

function When({ a }: { a: Appointment }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <span className="font-medium">{formatDay(a.date)} at {a.time}</span>
      <span className="text-muted-foreground"><ModeLabel mode={a.mode} /></span>
      {a.previous && <span className="text-xs text-muted-foreground">Moved from {formatDay(a.previous.date)}, {a.previous.time}</span>}
    </p>
  );
}

export function PatientAppointments() {
  const { appointments, users, doctorProfiles, run } = useDashboardData();
  const { done, node } = useFeedback();
  const open = appointments.filter(isActive).sort(byWhen);
  const past = appointments.filter((a) => !isActive(a)).sort((a, b) => byWhen(b, a));

  const doctor = (id: string) => users.find((u) => u.id === id);
  const specialty = (id: string) => doctorProfiles.find((p) => p.doctorId === id)?.specialty;
  const availableOthers = (a: Appointment) => doctorProfiles.filter((p) => p.specialty === specialty(a.doctorId) && p.accepting && p.doctorId !== a.doctorId).length;

  async function cancel(a: Appointment) {
    if (!confirmAction(`Cancel your appointment with ${doctor(a.doctorId)?.name ?? "the doctor"}?`)) return;
    await done(run("PATCH", `/api/appointments/${a.id}`, { action: "cancel" }), "Appointment cancelled.");
  }

  const card = (a: Appointment) => {
    const spec = specialty(a.doctorId);
    const others = availableOthers(a);
    return (
      <Card key={a.id}>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={doctor(a.doctorId)?.name ?? "Doctor"} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{doctor(a.doctorId)?.name ?? "Doctor"}</p>
              <p className="text-xs text-muted-foreground">{spec ?? "Doctor"}</p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <When a={a} />
          <p className="text-sm text-muted-foreground">Reason: {a.reason}</p>
          {a.doctorNote && <p className="rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2 text-sm">Doctor: {a.doctorNote}</p>}
          {a.status === "requested" && <p className="text-xs text-muted-foreground">Waiting for the doctor to approve. You can attach test reports in the meantime.</p>}
          <div className="flex flex-wrap justify-end gap-2">
            {(a.status === "declined" || a.status === "cancelled") && spec && (
              <Link href={`/patient/doctors?specialty=${encodeURIComponent(spec)}`} className={buttonVariants({ size: "sm" })}>
                <Stethoscope /> Book another {spec} doctor{others > 0 ? ` (${others} available)` : ""}
              </Link>
            )}
            {isActive(a) && <Button size="sm" variant="destructive" onClick={() => cancel(a)}><X /> Cancel</Button>}
            {a.status !== "declined" && a.status !== "cancelled" && (
              <Link href={`/patient/appointments/${a.id}`} className={buttonVariants({ size: "sm", variant: isLive(a) ? "default" : "outline" })}>
                <DoorOpen /> {isLive(a) ? "Open consultation" : a.status === "completed" ? "View consultation" : "Reports & details"}
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="My appointments"
        description="Your video and chat consultations. Open one to chat, call, share reports and see the prescription."
        actions={<Link href="/patient/doctors" className={buttonVariants()}><Stethoscope /> Find a doctor</Link>}
      />
      <div className="space-y-6">
        {node}
        <section className="space-y-3">
          <h2 className="font-semibold">Upcoming</h2>
          {open.length === 0 ? <EmptyState>No upcoming appointments. Find a doctor to book one.</EmptyState> : open.map(card)}
        </section>
        {past.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-semibold">Past</h2>
            {past.map(card)}
          </section>
        )}
      </div>
    </>
  );
}

/** Reschedule or decline form shown under an appointment. */
function ResponsePanel({ a, kind, profile, onDone }: { a: Appointment; kind: "reschedule" | "decline"; profile?: DoctorProfile; onDone: () => void }) {
  const { busy, run } = useDashboardData();
  // The appointment's own slot counts as free while it is being moved.
  const free = busy.filter((b) => !(b.date === a.date && b.time === a.time));
  const dates = profile ? bookableDates().filter((d) => freeSlots(profile, d, free).length > 0) : [];
  const [date, setDate] = useState(dates[0] ?? "");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const times = profile && date ? freeSlots(profile, date, free) : [];

  async function submit() {
    if (kind === "reschedule" && (!date || !time)) return setError("Choose the new date and time.");
    setError(null);
    setSaving(true);
    const r = await run("PATCH", `/api/appointments/${a.id}`, kind === "reschedule" ? { action: "reschedule", date, time, note } : { action: "decline", note });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    onDone();
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
      {kind === "reschedule" && (
        dates.length === 0 ? <Notice kind="err">You have no free slots in the next 2 weeks.</Notice> : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`rs-d-${a.id}`}>New date</Label>
              <select id={`rs-d-${a.id}`} className={selectClass} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }}>
                {dates.map((d) => <option key={d} value={d}>{formatDay(d)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`rs-t-${a.id}`}>New time</Label>
              <select id={`rs-t-${a.id}`} className={selectClass} value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="">Select time…</option>
                {times.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`rs-n-${a.id}`}>Message to the patient (optional)</Label>
        <Textarea id={`rs-n-${a.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={kind === "reschedule" ? "e.g. I am in surgery at that time." : "e.g. I am on leave. Please book another doctor."} />
      </div>
      {error && <Notice kind="err">{error}</Notice>}
      <div className="flex gap-2">
        <Button size="sm" variant={kind === "decline" ? "destructive" : "default"} disabled={saving || (kind === "reschedule" && dates.length === 0)} onClick={submit}>
          {kind === "reschedule" ? "Send new time" : "Decline request"}
        </Button>
        <Button size="sm" variant="outline" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function PracticeProfile({ profile, status }: { profile?: DoctorProfile; status: string }) {
  const { run } = useDashboardData();
  const { done, node } = useFeedback();
  const [editing, setEditing] = useState(!profile);
  const [form, setForm] = useState({
    specialty: profile?.specialty ?? "",
    qualifications: profile?.qualifications ?? "",
    experienceYears: String(profile?.experienceYears ?? ""),
    fee: String(profile?.fee ?? "800"),
    treats: profile?.treats.join(", ") ?? "",
    bio: profile?.bio ?? "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await done(
      run("PATCH", "/api/doctors/me", { ...form, experienceYears: Number(form.experienceYears) || 0, fee: Number(form.fee) || 0 }),
      "Profile saved.",
    );
    if (r.ok) setEditing(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Practice profile</p>
            <p className="text-sm text-muted-foreground">
              {profile ? `${profile.specialty} · ${profile.experienceYears} yrs · ৳${profile.fee}` : "Set up your profile so patients can find and book you."}
            </p>
          </div>
          {profile && (
            <>
              <Button
                variant={profile.accepting ? "outline" : "default"}
                onClick={() => done(run("PATCH", "/api/doctors/me", { accepting: !profile.accepting }), profile.accepting ? "You are not taking new appointments. Patients see other doctors." : "You are taking appointments again.")}
              >
                <span className={cn("size-2 rounded-full", profile.accepting ? "bg-emerald-500" : "bg-amber-500")} />
                {profile.accepting ? "Taking appointments" : "On leave — turn on"}
              </Button>
              {!editing && <Button variant="outline" onClick={() => setEditing(true)}><Pencil /> Edit</Button>}
            </>
          )}
        </div>
        {status !== "verified" && <Notice kind="err">Patients can book you after the admin verifies your registration.</Notice>}
        {node}
        {editing && (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="pp-spec">Specialty</Label>
              <select id="pp-spec" className={selectClass} value={form.specialty} onChange={set("specialty")}>
                <option value="">Select specialty…</option>
                {SPECIALTY_NAMES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="pp-q">Qualifications</Label><Input id="pp-q" className="h-10" value={form.qualifications} onChange={set("qualifications")} placeholder="MBBS, FCPS" /></div>
            <div className="space-y-1.5"><Label htmlFor="pp-exp">Years of experience</Label><Input id="pp-exp" type="number" min={0} className="h-10" value={form.experienceYears} onChange={set("experienceYears")} /></div>
            <div className="space-y-1.5"><Label htmlFor="pp-fee">Fee (BDT)</Label><Input id="pp-fee" type="number" min={0} className="h-10" value={form.fee} onChange={set("fee")} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pp-treats">Conditions you treat (comma separated)</Label><Input id="pp-treats" className="h-10" value={form.treats} onChange={set("treats")} placeholder="diabetes, thyroid, hypertension" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pp-bio">About you</Label><Textarea id="pp-bio" value={form.bio} onChange={set("bio")} maxLength={400} /></div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" className="h-10">Save profile</Button>
              {profile && <Button type="button" variant="outline" className="h-10" onClick={() => setEditing(false)}>Cancel</Button>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

type Tab = "requests" | "upcoming" | "history";

export function DoctorAppointments() {
  const d = useDashboardData();
  const { done, node } = useFeedback();
  const profile = d.doctorProfiles[0];
  const [tab, setTab] = useState<Tab>("requests");
  const [panel, setPanel] = useState<{ id: string; kind: "reschedule" | "decline" } | null>(null);

  const requests = d.appointments.filter((a) => a.status === "requested").sort(byWhen);
  const upcoming = d.appointments.filter(isLive).sort(byWhen);
  const history = d.appointments.filter((a) => !isActive(a)).sort((a, b) => byWhen(b, a));
  const lists: Record<Tab, Appointment[]> = { requests, upcoming, history };
  const empty: Record<Tab, string> = {
    requests: "No appointment requests waiting.",
    upcoming: "No approved appointments yet.",
    history: "Completed, declined and cancelled appointments appear here.",
  };
  const patient = (id: string) => d.users.find((u) => u.id === id)?.name ?? "Patient";

  async function respond(a: Appointment, body: object, okText: string) {
    await done(d.run("PATCH", `/api/appointments/${a.id}`, body), okText);
  }

  return (
    <>
      <PageHeader title="Appointments" description="Approve a request, suggest another time, or open the consultation room to chat and call." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Requests to answer" value={requests.length} icon={ClipboardList} />
          <StatCard label="Upcoming" value={upcoming.length} icon={CalendarCheck} />
          <StatCard label="Completed" value={d.appointments.filter((a) => a.status === "completed").length} icon={History} />
        </div>

        <PracticeProfile key={profile?.doctorId ?? "new"} profile={profile} status={d.me.status} />

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Appointment lists">
          {([["requests", "Requests", ClipboardList], ["upcoming", "Upcoming", CalendarClock], ["history", "History", History]] as const).map(([key, label, Icon]) => (
            <Button key={key} role="tab" aria-selected={tab === key} variant={tab === key ? "default" : "outline"} onClick={() => { setTab(key); setPanel(null); }}>
              <Icon /> {label} ({lists[key].length})
            </Button>
          ))}
        </div>

        {node}
        {lists[tab].length === 0 && <EmptyState>{empty[tab]}</EmptyState>}
        {lists[tab].map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar name={patient(a.patientId)} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{patient(a.patientId)}</p>
                  <When a={a} />
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="text-sm text-muted-foreground">Reason: {a.reason}</p>
              {a.doctorNote && <p className="text-sm text-muted-foreground">Your note: {a.doctorNote}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                {a.status === "requested" && (
                  <>
                    <Button size="sm" onClick={() => respond(a, { action: "approve" }, "Appointment approved. The patient can now chat or call.")}><Check /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setPanel({ id: a.id, kind: "reschedule" })}><CalendarClock /> Reschedule</Button>
                    <Button size="sm" variant="destructive" onClick={() => setPanel({ id: a.id, kind: "decline" })}><X /> Decline</Button>
                  </>
                )}
                {isLive(a) && (
                  <Button size="sm" variant="outline" onClick={() => setPanel({ id: a.id, kind: "reschedule" })}><CalendarClock /> Reschedule</Button>
                )}
                {a.status !== "declined" && a.status !== "cancelled" && (
                  <Link href={`/doctor/appointments/${a.id}`} className={buttonVariants({ size: "sm", variant: isLive(a) ? "default" : "outline" })}>
                    <Users /> {isLive(a) ? "Open consultation" : a.status === "completed" ? "View consultation" : "View reports"}
                  </Link>
                )}
              </div>

              {panel?.id === a.id && (
                <ResponsePanel key={panel.kind} a={a} kind={panel.kind} profile={profile} onDone={() => setPanel(null)} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
