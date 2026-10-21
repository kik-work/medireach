"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FilePlus, FileText, MessageSquare, Paperclip, Pill, Send, Stethoscope, Trash2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModeLabel } from "@/components/consult/parts";
import { DemoVideoCall } from "@/components/consult/video-call";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { confirmAction, Notice, useFeedback } from "@/components/dashboard/shared";
import { api } from "@/lib/api";
import { formatDay, isLive, type RoomData } from "@/lib/consult";
import { SPECIALTIES } from "@/lib/specialties";
import { cn } from "@/lib/utils";
import type { ChatMessage, MedicalReport } from "@/lib/types";

const POLL_MS = 3000;

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayOf = (iso: string) => new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });

/** The five steps of one consultation, as a tracker. */
function CareJourney({ room }: { room: RoomData }) {
  const { appointment: a } = room;
  const steps = [
    { label: "Appointment booked", done: true },
    { label: "Video or chat consultation", done: a.status === "completed" },
    { label: "Test reports", done: room.reports.length > 0 },
    { label: "Digital prescription", done: room.prescriptions.length > 0 },
    { label: "Medicine order", done: room.ordered },
  ];
  const current = steps.findIndex((s) => !s.done);
  return (
    <Card>
      <CardContent>
        <ol className="grid grid-cols-5 gap-2" aria-label="Consultation progress">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col items-center gap-1.5 text-center" aria-current={i === current ? "step" : undefined}>
              <span className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                s.done ? "border-primary bg-primary text-primary-foreground" : i === current ? "border-primary text-primary" : "text-muted-foreground",
              )}>
                {s.done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("text-[11px] leading-tight sm:text-xs", s.done || i === current ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ChatPanel({ messages, meId, open, onSend }: { messages: ChatMessage[]; meId: string; open: boolean; onSend: (text: string) => Promise<string | null> }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [messages.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const err = await onSend(text);
    setError(err);
    if (!err) setText("");
  }

  return (
    <div className="space-y-3">
      <div ref={box} className="h-80 space-y-2 overflow-y-auto rounded-xl border bg-muted/30 p-3" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet.{open ? " Say hello." : ""}</p>}
        {messages.map((m, i) => {
          const mine = m.senderId === meId;
          const newDay = i === 0 || dayOf(messages[i - 1].createdAt) !== dayOf(m.createdAt);
          return (
            <div key={m.id}>
              {newDay && <p className="py-1 text-center text-[11px] text-muted-foreground">{dayOf(m.createdAt)}</p>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-background")}>
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p className={cn("mt-0.5 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{timeOf(m.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error && <Notice kind="err">{error}</Notice>}
      <form onSubmit={submit} className="flex gap-2">
        <Input className="h-10" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} disabled={!open} placeholder={open ? "Type a message…" : "Chat is closed"} aria-label="Message" />
        <Button type="submit" className="h-10" disabled={!open || !text.trim()}><Send /> <span className="hidden sm:inline">Send</span></Button>
      </form>
    </div>
  );
}

function ReportsCard({ reports, isPatient, canAttach, hints, onAdd, onRemove }: {
  reports: MedicalReport[]; isPatient: boolean; canAttach: boolean; hints: string[];
  onAdd: (fileName: string, note: string) => Promise<string | null>; onRemove: (id: string) => Promise<void>;
}) {
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // New key = empty file input after a successful upload.
  const [formKey, setFormKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fileName) return setError("Choose a file first.");
    const err = await onAdd(fileName, note);
    setError(err);
    if (!err) { setFileName(""); setNote(""); setFormKey((k) => k + 1); }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" /> Test reports</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {reports.length === 0 ? (
          <p className="text-muted-foreground">{isPatient ? "No reports attached yet." : "The patient has not attached any report."}</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center gap-2 p-2.5">
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.fileName}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.uploadedAt}{r.note ? ` · ${r.note}` : ""}</span>
                </span>
                {isPatient && canAttach && <Button size="icon-sm" variant="ghost" onClick={() => onRemove(r.id)} aria-label={`Remove ${r.fileName}`}><Trash2 /></Button>}
              </li>
            ))}
          </ul>
        )}
        {isPatient && canAttach && (
          <form key={formKey} onSubmit={submit} className="space-y-2" noValidate>
            {hints.length > 0 && <p className="text-xs text-muted-foreground">This doctor usually asks for: {hints.join(", ")}.</p>}
            <Input type="file" accept="image/*,application/pdf" className="h-10 pt-1.5" aria-label="Report file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")} />
            <Input className="h-9" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note, e.g. done last week (optional)" aria-label="Note" />
            {error && <Notice kind="err">{error}</Notice>}
            <Button type="submit" size="sm"><Paperclip /> Attach report</Button>
            <p className="text-xs text-muted-foreground">Demo: the file name is saved. The file itself is not uploaded.</p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function ConsultRoom({ id }: { id: string }) {
  const { me, users, medicines, doctorProfiles, run } = useDashboardData();
  const { show, node } = useFeedback();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "video" | null>(null);

  const load = useCallback(async () => {
    const r = await api<RoomData>("GET", `/api/appointments/${id}`);
    if (r.ok) {
      setRoom(r.data);
      setError(null);
    } else {
      setError(r.error);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (!room) {
    return error ? <Notice kind="err">{error}</Notice> : (
      <div className="flex justify-center py-24"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" /></div>
    );
  }

  const a = room.appointment;
  const isDoctor = me.role === "doctor";
  const base = isDoctor ? "/doctor/appointments" : "/patient/appointments";
  const other = users.find((u) => u.id === (isDoctor ? a.patientId : a.doctorId))?.name ?? (isDoctor ? "Patient" : "Doctor");
  const profile = doctorProfiles.find((p) => p.doctorId === a.doctorId);
  const hints = SPECIALTIES.find((s) => s.name === profile?.specialty)?.reports ?? [];
  const live = isLive(a);
  const closed = a.status === "declined" || a.status === "cancelled";
  const view = tab ?? a.mode;
  const medicine = (mid: string) => medicines.find((m) => m.id === mid);

  /** Status changes also refresh the dashboard lists. PATCH answers with the new room. */
  async function patch(body: object, okText?: string) {
    const r = await run<RoomData>("PATCH", `/api/appointments/${id}`, body);
    if (r.ok) {
      setRoom(r.data);
      if (okText) show("ok", okText);
    } else {
      show("err", r.error);
    }
    return r;
  }

  async function sendMessage(text: string) {
    const r = await api("POST", `/api/appointments/${id}/messages`, { text });
    if (r.ok) await load();
    return r.ok ? null : r.error;
  }

  async function addReport(fileName: string, note: string) {
    const r = await api("POST", `/api/appointments/${id}/reports`, { fileName, note });
    if (r.ok) await load();
    return r.ok ? null : r.error;
  }

  async function removeReport(reportId: string) {
    const r = await api("DELETE", `/api/appointments/${id}/reports/${reportId}`);
    if (r.ok) await load();
  }

  return (
    <>
      <PageHeader
        title={`Consultation with ${other}`}
        description={`${formatDay(a.date)} at ${a.time} · ${a.reason}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={a.status} />
            <Link href={base} className={buttonVariants({ variant: "outline" })}><ArrowLeft /> Appointments</Link>
          </div>
        }
      />
      <div className="space-y-6">
        <CareJourney room={room} />
        {node}
        {a.doctorNote && <p className="rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2 text-sm">{isDoctor ? "Your note" : "Doctor"}: {a.doctorNote}</p>}
        {a.previous && <p className="text-sm text-muted-foreground">This visit was moved from {formatDay(a.previous.date)}, {a.previous.time}.</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={view === "chat" ? "default" : "outline"} onClick={() => setTab("chat")}><MessageSquare /> Chat</Button>
                <Button variant={view === "video" ? "default" : "outline"} onClick={() => setTab("video")}>
                  <Video /> Video call {a.callActive && <span className="size-2 animate-pulse rounded-full bg-emerald-500" aria-label="Call in progress" />}
                </Button>
                <span className="ml-auto text-sm text-muted-foreground"><ModeLabel mode={a.mode} /> requested</span>
              </div>

              {!live && (
                <div className="space-y-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  {a.status === "requested" && <p>{isDoctor ? "Approve this request to open chat and video." : "Chat and video open after the doctor approves your request. You can attach test reports now."}</p>}
                  {a.status === "completed" && <p>This consultation is completed. The chat history stays here for your records.</p>}
                  {closed && <p>This appointment is {a.status}.</p>}
                  {a.status === "requested" && isDoctor && (
                    <Button size="sm" onClick={() => patch({ action: "approve" }, "Appointment approved.")}><Check /> Approve now</Button>
                  )}
                  {closed && !isDoctor && profile && (
                    <Link href={`/patient/doctors?specialty=${encodeURIComponent(profile.specialty)}`} className={buttonVariants({ size: "sm" })}><Stethoscope /> Book another {profile.specialty} doctor</Link>
                  )}
                </div>
              )}

              {/* Both stay mounted so a running call survives a switch to the chat tab. */}
              {(live || a.status === "completed") && (
                <div className={view === "chat" || !live ? "" : "hidden"}>
                  <ChatPanel messages={room.messages} meId={me.id} open={live} onSend={sendMessage} />
                </div>
              )}
              {live && (
                <div className={view === "video" ? "" : "hidden"}>
                  <DemoVideoCall
                    otherName={other}
                    active={Boolean(a.callActive)}
                    onStart={async () => { await patch({ action: "start-call" }); }}
                    onEnd={async () => { await patch({ action: "end-call" }); }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ReportsCard reports={room.reports} isPatient={!isDoctor} canAttach={!closed} hints={hints} onAdd={addReport} onRemove={removeReport} />

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="size-4 text-primary" /> Prescription</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {room.prescriptions.length === 0 && (
                  <p className="text-muted-foreground">{isDoctor ? "No prescription written for this visit yet." : "Your doctor will add a digital prescription here after the consultation."}</p>
                )}
                {room.prescriptions.map((rx) => (
                  <div key={rx.id} className="space-y-2 rounded-lg border p-2.5">
                    <p className="flex flex-wrap items-center gap-2 font-medium">{rx.id} {room.ordered && <Badge variant="secondary">Ordered</Badge>}<span className="ml-auto text-xs font-normal text-muted-foreground">valid until {rx.validUntil}</span></p>
                    {rx.diagnosis && <p className="text-muted-foreground">Diagnosis: {rx.diagnosis}</p>}
                    <ul className="space-y-1">
                      {rx.items.map((i) => (
                        <li key={i.medicineId} className="flex flex-wrap justify-between gap-x-3">
                          <span>{medicine(i.medicineId) ? `${medicine(i.medicineId)!.brand} ${medicine(i.medicineId)!.strength}` : "Removed medicine"}</span>
                          <span className="text-muted-foreground">{i.dose} · {i.days} days</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!isDoctor && room.prescriptions.length > 0 && !room.ordered && (
                  <Link href="/patient/prescriptions" className={buttonVariants({ className: "w-full" })}><Pill /> Order these medicines</Link>
                )}
                {isDoctor && (live || a.status === "completed") && (
                  <Link href={`/doctor/prescriptions/new?patientId=${a.patientId}&appointmentId=${a.id}`} className={buttonVariants({ variant: room.prescriptions.length ? "outline" : "default", className: "w-full" })}>
                    <FilePlus /> {room.prescriptions.length ? "Write another prescription" : "Write prescription"}
                  </Link>
                )}
              </CardContent>
            </Card>

            {isDoctor && live && (
              <Button variant="outline" className="w-full" onClick={() => confirmAction("Mark this consultation as completed? Chat and video will close.") && patch({ action: "complete" }, "Consultation completed.")}>
                <Check /> Mark consultation completed
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
