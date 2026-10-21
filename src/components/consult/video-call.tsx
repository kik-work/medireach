"use client";

import { useEffect, useState } from "react";
import { Mic, MicOff, Phone, PhoneCall, PhoneOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/consult/parts";
import { cn } from "@/lib/utils";

const CONNECT_MS = 1500;

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

interface Props {
  otherName: string;
  /** true while the call is running on the server (the other person started it). */
  active: boolean;
  onStart: () => Promise<void>;
  onEnd: () => Promise<void>;
}

/**
 * Demo video call. It looks and behaves like a call (ringing, connecting, timer, mute, camera, end)
 * but no audio or video is sent. Starting a call shows "Join" to the other person in their room.
 */
export function DemoVideoCall({ otherName, active, onStart, onEnd }: Props) {
  const [joinedAt, setJoinedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [mic, setMic] = useState(true);
  const [camera, setCamera] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (joinedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [joinedAt]);

  const join = () => {
    setMic(true);
    setCamera(true);
    setNow(Date.now());
    setJoinedAt(Date.now());
  };

  async function start() {
    setBusy(true);
    await onStart();
    setBusy(false);
    join();
  }

  async function end() {
    setBusy(true);
    await onEnd();
    setBusy(false);
    setJoinedAt(null);
  }

  if (joinedAt === null) {
    return (
      <div className="flex aspect-video max-h-[28rem] w-full flex-col items-center justify-center gap-4 rounded-xl bg-slate-900 p-6 text-center text-white">
        <Avatar name={otherName} className={cn("size-20 bg-white/15 text-2xl text-white", active && "animate-pulse ring-4 ring-emerald-400/60")} />
        {active ? (
          <>
            <p className="font-semibold">{otherName} is calling…</p>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={join}><PhoneCall /> Join call</Button>
          </>
        ) : (
          <>
            <p className="font-semibold">Video call with {otherName}</p>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={busy} onClick={start}><Phone /> {busy ? "Starting…" : "Start video call"}</Button>
          </>
        )}
        <p className="max-w-xs text-xs text-white/60">Demo call: no real audio or video is sent.</p>
      </div>
    );
  }

  const live = now - joinedAt >= CONNECT_MS;
  const seconds = live ? Math.floor((now - joinedAt - CONNECT_MS) / 1000) : 0;

  return (
    <div className="space-y-3">
      <div className="relative flex aspect-video max-h-[28rem] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Avatar name={otherName} className={cn("size-24 bg-white/15 text-3xl text-white", live && "ring-4 ring-emerald-400/50")} />
          <p className="font-semibold">{otherName}</p>
          <p className="text-xs text-white/70" role="status">{live ? (active ? "Connected" : "The other person left the call") : "Connecting…"}</p>
        </div>
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs">
          <span className={cn("size-2 rounded-full", live && active ? "animate-pulse bg-red-500" : "bg-amber-400")} /> {live ? clock(seconds) : "00:00"}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">Demo</span>
        <div className="absolute bottom-3 right-3 flex h-20 w-32 items-center justify-center rounded-lg border border-white/20 bg-slate-700 text-xs sm:h-24 sm:w-40">
          {camera ? <span className="text-white/80">You</span> : <VideoOff className="size-6 text-white/60" />}
          {!mic && <MicOff className="absolute bottom-1.5 left-1.5 size-3.5 text-red-400" />}
        </div>
      </div>
      <div className="flex justify-center gap-3">
        <Button size="icon-lg" variant={mic ? "outline" : "destructive"} className="size-11 rounded-full" onClick={() => setMic((m) => !m)} aria-label={mic ? "Mute microphone" : "Unmute microphone"} aria-pressed={!mic}>
          {mic ? <Mic /> : <MicOff />}
        </Button>
        <Button size="icon-lg" variant={camera ? "outline" : "destructive"} className="size-11 rounded-full" onClick={() => setCamera((c) => !c)} aria-label={camera ? "Turn camera off" : "Turn camera on"} aria-pressed={!camera}>
          {camera ? <Video /> : <VideoOff />}
        </Button>
        <Button size="icon-lg" className="size-11 rounded-full bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={end} aria-label="End call">
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
