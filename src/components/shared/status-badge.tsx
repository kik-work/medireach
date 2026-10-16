import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  verified: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  confirmed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  packed: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  placed: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "pre-order": "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  suspended: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary" className={cn("capitalize", TONE[status])}>{status}</Badge>;
}

export function RxBadge({ rx }: { rx: boolean }) {
  return rx ? (
    <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" variant="secondary">Rx only</Badge>
  ) : (
    <Badge variant="secondary">OTC</Badge>
  );
}
