"use client";

import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import type { CautionSummary as Summary } from "@/lib/types";

/**
 * Plain-language version of the caution report, phrased by a language model from the retrieved
 * facts only. Renders nothing when phrasing is off or fails; the cards below stay complete.
 */
export function CautionSummary({ medicineIds, withProfile = false }: { medicineIds: string[]; withProfile?: boolean }) {
  const key = [...new Set(medicineIds)].sort().join(",");
  const scope = `${key}|${withProfile}`;
  // The answer is kept with the request it belongs to, so a stale one is never shown.
  const [result, setResult] = useState<{ scope: string; summary: Summary | null } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch("/api/caution/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicineIds: key.split(","), withProfile }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => !cancelled && setResult({ scope: `${key}|${withProfile}`, summary: j?.data ?? null }))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [key, withProfile]);

  const summary = result?.scope === scope ? result.summary : null;
  if (!summary) return null;
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="flex gap-2">
        <MessageSquareText className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{summary.text}</span>
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">Phrased by {summary.model} from the facts below. It adds no facts of its own.</p>
    </div>
  );
}
