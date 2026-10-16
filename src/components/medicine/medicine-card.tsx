import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RxBadge } from "@/components/shared/status-badge";
import { formatBDT } from "@/lib/constants";
import { getStockSummary } from "@/lib/services/pharmacy.service";
import { cn } from "@/lib/utils";
import type { Medicine } from "@/lib/types";

export function MedicineCard({ medicine: m }: { medicine: Medicine }) {
  const stock = getStockSummary(m.id);
  return (
    <Link href={`/medicines/${m.slug}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/5">
        <span className={cn("absolute inset-x-0 top-0 h-1", m.rare ? "bg-violet-500" : "bg-primary/60")} />

        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">{m.category}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {m.rare && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-950 dark:text-violet-300">Rare</span>}
            <RxBadge rx={m.rx} />
          </div>
        </div>

        <h3 className="mt-3 flex items-center gap-1 text-xl font-bold">
          {m.brand}
          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </h3>
        <p className="text-sm text-muted-foreground">{m.generic} · {m.strength} · {m.form}</p>

        <p className="mt-3 line-clamp-1 flex-1 text-sm">
          <span className="text-muted-foreground">For </span>
          {m.uses.slice(0, 2).join(", ")}
        </p>

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <p className="text-lg font-extrabold">
            <span className="mr-1 text-xs font-medium text-muted-foreground">from</span>
            {formatBDT(stock.minPrice ?? m.price)}
          </p>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("size-2 rounded-full", stock.pharmacies ? "bg-emerald-500" : "bg-red-500")} />
            {stock.pharmacies ? `${stock.pharmacies} in stock` : "Out of stock"}
          </p>
        </div>
      </article>
    </Link>
  );
}
