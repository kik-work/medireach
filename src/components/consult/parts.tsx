"use client";

import { useMemo } from "react";
import { MessageSquare, Video } from "lucide-react";
import { useDashboardData, type DashUser } from "@/components/dashboard/data-provider";
import { MODE_LABEL } from "@/lib/consult";
import { cn } from "@/lib/utils";
import type { ConsultMode, DoctorProfile } from "@/lib/types";

export const initials = (name: string) =>
  name.replace(/^dr\.?\s+/i, "").split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary", className)} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function ModeLabel({ mode }: { mode: ConsultMode }) {
  const Icon = mode === "video" ? Video : MessageSquare;
  return <span className="inline-flex items-center gap-1"><Icon className="size-3.5" /> {MODE_LABEL[mode]}</span>;
}

export interface DoctorEntry {
  profile: DoctorProfile;
  user: DashUser;
}

/** Doctor profiles joined with the doctor's name and city. */
export function useDoctorDirectory(): DoctorEntry[] {
  const { doctorProfiles, users } = useDashboardData();
  return useMemo(
    () => doctorProfiles.flatMap((profile) => {
      const user = users.find((u) => u.id === profile.doctorId);
      return user ? [{ profile, user }] : [];
    }),
    [doctorProfiles, users],
  );
}
