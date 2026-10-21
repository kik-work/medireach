"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, MapPin, MessageSquare, Search, ShieldAlert, Sparkles, Star, Stethoscope, TriangleAlert, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, useDoctorDirectory, type DoctorEntry } from "@/components/consult/parts";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { EmptyState, Notice, selectClass, useFeedback } from "@/components/dashboard/shared";
import { api } from "@/lib/api";
import { formatBDT } from "@/lib/constants";
import { bookableDates, formatDay, freeSlots, nextSlot } from "@/lib/consult";
import { SPECIALTY_NAMES } from "@/lib/specialties";
import type { TriageResult } from "@/lib/services/triage.service";
import { cn } from "@/lib/utils";
import type { Appointment, BusySlot, ConsultMode } from "@/lib/types";

const EXAMPLES = ["High blood pressure and headache", "My blood sugar is high", "Skin rash and itching", "My child has fever", "Knee pain when walking"];

/** Doctors who can be booked first, then own city, then best rated. */
const bestFirst = (city?: string) => (a: DoctorEntry, b: DoctorEntry) =>
  Number(b.profile.accepting) - Number(a.profile.accepting) ||
  Number(b.user.city === city) - Number(a.user.city === city) ||
  b.profile.rating - a.profile.rating;

function DoctorCard({
  entry, busy, selected, others, onBook,
}: { entry: DoctorEntry; busy: BusySlot[]; selected: boolean; others: number; onBook: () => void }) {
  const { profile: p, user } = entry;
  const next = nextSlot(p, busy);
  return (
    <Card className={cn("h-full", selected && "border-primary ring-1 ring-primary/40", !p.accepting && "bg-muted/40")}>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{p.qualifications}</p>
            <Badge variant="secondary" className="mt-1.5"><Stethoscope /> {p.specialty}</Badge>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium"><Star className="size-3.5 fill-amber-400 text-amber-400" />{p.rating.toFixed(1)}</span>
        </div>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{p.experienceYears} yrs experience</span>
          <span className="flex items-center gap-1"><MapPin className="size-3" />{user.city}</span>
          <span className="font-medium text-foreground">{formatBDT(p.fee)}</span>
        </p>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Treats:</span> {p.treats.slice(0, 5).join(", ")}</p>

        <div className="mt-auto space-y-2">
          {p.accepting ? (
            <p className={cn("flex items-center gap-1.5 text-xs font-medium", next ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
              <CalendarCheck className="size-3.5" />
              {next ? `Next slot: ${formatDay(next.date)}, ${next.time}` : "Fully booked for the next 2 weeks"}
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              Not taking appointments right now.{others > 0 ? ` ${others} other ${p.specialty} doctor${others > 1 ? "s are" : " is"} available.` : ""}
            </p>
          )}
          <Button className="w-full" variant={selected ? "secondary" : "default"} disabled={!next} onClick={onBook}>
            {selected ? "Selected" : "Book appointment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingPanel({ entry, defaultReason }: { entry: DoctorEntry; defaultReason: string }) {
  const { busy, run } = useDashboardData();
  const { profile, user } = entry;
  const dates = useMemo(() => bookableDates().filter((d) => freeSlots(profile, d, busy).length > 0), [profile, busy]);
  const [date, setDate] = useState(dates[0] ?? "");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<ConsultMode>("video");
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState<Appointment | null>(null);
  const times = date ? freeSlots(profile, date, busy) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return setError("Choose a date and a time.");
    if (!reason.trim()) return setError("Tell the doctor why you want to consult.");
    setError(null);
    setSaving(true);
    const r = await run<Appointment>("POST", "/api/appointments", { doctorId: profile.doctorId, date, time, mode, reason });
    setSaving(false);
    if (!r.ok) return setError(r.error);
    setSent(r.data);
  }

  if (sent) {
    return (
      <Card id="booking" className="h-fit border-emerald-300 xl:sticky xl:top-24">
        <CardContent className="space-y-3 text-sm">
          <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-5" /> Request sent</p>
          <p>{user.name} will approve your slot or suggest a new time. Attach your test reports now so the doctor can read them before the visit.</p>
          <p className="text-muted-foreground">{formatDay(sent.date)} at {sent.time}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/patient/appointments/${sent.id}`} className={buttonVariants()}>Attach reports</Link>
            <Link href="/patient/appointments" className={buttonVariants({ variant: "outline" })}>My appointments</Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="booking" className="h-fit xl:sticky xl:top-24">
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="size-4 text-primary" /> Book {user.name}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {dates.length === 0 ? (
            <Notice kind="err">No free slots in the next 2 weeks. Choose another {profile.specialty} doctor.</Notice>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="bk-date">Date</Label>
                <select id="bk-date" className={selectClass} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }}>
                  {dates.map((d) => <option key={d} value={d}>{formatDay(d)} · {freeSlots(profile, d, busy).length} slots</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Time">
                  {times.map((t) => (
                    <Button key={t} type="button" size="sm" role="radio" aria-checked={time === t} variant={time === t ? "default" : "outline"} onClick={() => setTime(t)}>{t}</Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>How do you want to consult?</Label>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Consultation type">
                  <Button type="button" role="radio" aria-checked={mode === "video"} variant={mode === "video" ? "default" : "outline"} onClick={() => setMode("video")}><Video /> Video call</Button>
                  <Button type="button" role="radio" aria-checked={mode === "chat"} variant={mode === "chat" ? "default" : "outline"} onClick={() => setMode("chat")}><MessageSquare /> Chat</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-reason">What is the problem?</Label>
                <Textarea id="bk-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Symptoms, how long, medicines you take…" />
              </div>
              <p className="flex justify-between text-sm"><span className="text-muted-foreground">Consultation fee</span><span className="font-semibold">{formatBDT(profile.fee)}</span></p>
              {error && <Notice kind="err">{error}</Notice>}
              <Button type="submit" className="h-10 w-full" disabled={saving}>{saving ? "Sending…" : "Request appointment"}</Button>
              <p className="text-xs text-muted-foreground">The doctor confirms your request. The fee is paid at the visit (demo: no payment is taken).</p>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function FinderResult({ result, directory, busy, city, selected, onBook, onShowAll, openCount }: {
  result: TriageResult; directory: DoctorEntry[]; busy: BusySlot[]; city?: string; selected: string | null;
  onBook: (id: string) => void; onShowAll: (specialty: string) => void; openCount: (specialty: string) => number;
}) {
  return (
    <div className="space-y-4">
      {result.emergency && <Notice kind="err">{result.emergency}</Notice>}
      {result.fallback && (
        <p className="text-sm text-muted-foreground">We could not match those words to a specialty. A general physician is a safe first step and can refer you.</p>
      )}
      {result.matches.map((m) => {
        const doctors = m.doctorIds.flatMap((id) => directory.filter((e) => e.profile.doctorId === id)).sort(bestFirst(city));
        return (
          <Card key={m.specialty}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Stethoscope className="size-4 text-primary" /> {m.specialty}
                <span className="text-sm font-normal text-muted-foreground">{doctors.length} doctor{doctors.length === 1 ? "" : "s"} · {openCount(m.specialty)} taking appointments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{m.blurb}{m.matched.length > 0 && <span className="text-muted-foreground"> Matched: {m.matched.join(", ")}.</span>}</p>
              <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" /> {m.caution}
              </p>
              <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Keep ready:</span> {m.reports.join(", ")}</p>
              {doctors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No verified {m.specialty} doctor is listed yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                  {doctors.map((e) => (
                    <DoctorCard key={e.profile.doctorId} entry={e} busy={busy} selected={selected === e.profile.doctorId} others={openCount(m.specialty)} onBook={() => onBook(e.profile.doctorId)} />
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => onShowAll(m.specialty)}>Show all {m.specialty} doctors below</Button>
            </CardContent>
          </Card>
        );
      })}
      <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
    </div>
  );
}

export function PatientDoctors({ initialSpecialty = "" }: { initialSpecialty?: string }) {
  const { busy, me } = useDashboardData();
  const directory = useDoctorDirectory();
  const { show, node } = useFeedback();
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [specialty, setSpecialty] = useState(SPECIALTY_NAMES.includes(initialSpecialty) ? initialSpecialty : "");
  const [selected, setSelected] = useState<string | null>(null);

  const openCount = (s: string) => directory.filter((e) => e.profile.specialty === s && e.profile.accepting).length;
  const shown = directory.filter((e) => !specialty || e.profile.specialty === specialty).sort(bestFirst(me.city));
  const picked = directory.find((e) => e.profile.doctorId === selected);

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 2) return show("err", "Describe your symptoms or condition.");
    setQuery(q);
    setLoading(true);
    const r = await api<TriageResult>("POST", "/api/doctors/suggest", { query: q });
    setLoading(false);
    if (!r.ok) return show("err", r.error);
    setResult(r.data);
    setAsked(q);
  }

  function book(id: string) {
    setSelected(id);
    setTimeout(() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function showAll(s: string) {
    setSpecialty(s);
    setTimeout(() => document.getElementById("all-doctors")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <>
      <PageHeader title="Find a doctor" description="Describe your problem and we suggest the kind of doctor to see. Every specialty lists several doctors, so you can pick another if one is not available." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="border-primary/30">
            <CardContent className="space-y-3">
              <form onSubmit={(e) => { e.preventDefault(); void ask(query); }} className="flex flex-col gap-2 sm:flex-row" noValidate>
                <div className="relative flex-1">
                  <Sparkles className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-primary" />
                  <Input className="h-10 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={300} placeholder="What is the problem? e.g. high blood pressure and headache" aria-label="Describe your symptoms or disease" />
                </div>
                <Button type="submit" className="h-10" disabled={loading}><Search /> {loading ? "Finding…" : "Find doctors"}</Button>
              </form>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Try:</span>
                {EXAMPLES.map((x) => (
                  <button key={x} type="button" onClick={() => void ask(x)} className="rounded-full border px-2.5 py-1 hover:border-primary hover:text-primary">{x}</button>
                ))}
              </div>
              {node}
            </CardContent>
          </Card>

          {result && (
            <section aria-live="polite" className="space-y-3">
              <h2 className="font-semibold">Suggested for “{asked}”</h2>
              <FinderResult
                result={result} directory={directory} busy={busy} city={me.city} selected={selected}
                onBook={book} onShowAll={showAll} openCount={openCount}
              />
            </section>
          )}

          <section id="all-doctors" className="scroll-mt-20 space-y-3">
            <h2 className="font-semibold">All doctors</h2>
            <div className="flex flex-wrap gap-2">
              {["", ...SPECIALTY_NAMES].map((s) => (
                <Button key={s || "all"} size="sm" variant={specialty === s ? "default" : "outline"} onClick={() => setSpecialty(s)}>
                  {s || "All"}{s && <span className="opacity-70">({directory.filter((e) => e.profile.specialty === s).length})</span>}
                </Button>
              ))}
            </div>
            {shown.length === 0 ? (
              <EmptyState>No doctor is listed for this specialty yet.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {shown.map((e) => (
                  <DoctorCard key={e.profile.doctorId} entry={e} busy={busy} selected={selected === e.profile.doctorId} others={openCount(e.profile.specialty)} onBook={() => book(e.profile.doctorId)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {picked ? (
          <BookingPanel key={picked.profile.doctorId} entry={picked} defaultReason={asked} />
        ) : (
          <Card className="hidden h-fit xl:block">
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Book a consultation</p>
              <p>Pick a doctor to choose a time. You can consult by video call or chat, attach your test reports and get a digital prescription.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
