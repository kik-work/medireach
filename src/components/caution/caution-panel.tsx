import { AlertOctagon, Copy, Info, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CautionReport } from "@/lib/types";

const SEVERITY: Record<string, string> = {
  major: "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
  moderate: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  minor: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
};

/**
 * Presentational AI caution card. Data comes from the caution service
 * (retrieval from the curated database). Used on medicine pages and the cart.
 */
export function CautionPanel({ report, hideRx = false }: { report: CautionReport; hideRx?: boolean }) {
  const hasAlerts = report.duplicates.length > 0 || report.interactions.length > 0;
  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> AI caution layer
          <Badge variant="outline" className="ml-auto font-normal">retrieval-based</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {report.duplicates.map((d) => (
          <div key={d.ingredient} className="flex gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <Copy className="mt-0.5 size-4 shrink-0" />
            <p>
              <b>Duplicate ingredient:</b> {d.brands.join(" and ")} both contain <b className="capitalize">{d.ingredient}</b>. Taking them together can cause an overdose.
            </p>
          </div>
        ))}

        {report.interactions.map((i) => (
          <div key={i.pair.join("-")} className={cn("flex gap-3 rounded-lg border p-3", SEVERITY[i.severity])}>
            <AlertOctagon className="mt-0.5 size-4 shrink-0" />
            <p>
              <b className="capitalize">{i.severity} interaction:</b> {i.brands[0]} + {i.brands[1]}. {i.message}
            </p>
          </div>
        ))}

        {!hasAlerts && report.items.length > 1 && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Info className="size-4" /> No duplicate ingredients or known interactions found in the curated database.
          </p>
        )}

        {!hideRx && report.rxRequired.length > 0 && (
          <p className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-rose-600" />
            Prescription required for: {report.rxRequired.map((r) => r.brand).join(", ")}
          </p>
        )}

        <div className="space-y-3">
          {report.items.map((it) => (
            <div key={it.medicineId}>
              <p className="font-medium">
                {it.brand} <span className="font-normal text-muted-foreground">({it.generic}) — {it.uses.join(", ")}</span>
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                {it.cautions.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <p className="rounded-md bg-muted px-3 py-2 text-xs font-medium">{report.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
