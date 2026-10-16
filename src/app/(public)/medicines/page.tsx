import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MedicineCard } from "@/components/medicine/medicine-card";
import { PageBanner } from "@/components/shared/page-banner";
import { IMAGES } from "@/lib/images";
import { listCategories, listMedicines } from "@/lib/services/medicine.service";

export const metadata = { title: "Medicines" };

const selectClass = "h-8 rounded-lg border border-input bg-background px-2.5 text-sm";

export default async function MedicinesPage({ searchParams }: PageProps<"/medicines">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = one("q");
  const category = one("category");
  const rx = one("rx") === "rx" || one("rx") === "otc" ? (one("rx") as "rx" | "otc") : undefined;
  const rare = one("rare") === "1";

  const results = listMedicines({ q, category, rx, rareOnly: rare });

  return (
    <>
      <PageBanner title="Medicine catalogue" description="Search by brand, generic name or condition." image={IMAGES.pills} />

      <form className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="e.g. Napa, paracetamol, epilepsy…" className="pl-8" />
        </div>
        <select name="category" defaultValue={category ?? ""} className={selectClass}>
          <option value="">All categories</option>
          {listCategories().map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="rx" defaultValue={rx ?? ""} className={selectClass}>
          <option value="">Rx and OTC</option>
          <option value="rx">Rx only</option>
          <option value="otc">OTC only</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="rare" value="1" defaultChecked={rare} /> Rare only
        </label>
        <Button type="submit">Search</Button>
        <Link href="/medicines" className={buttonVariants({ variant: "ghost" })}>Reset</Link>
      </form>

      <p className="mb-4 text-sm text-muted-foreground">{results.length} result{results.length === 1 ? "" : "s"}</p>
      {results.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No medicines match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((m) => <MedicineCard key={m.id} medicine={m} />)}
        </div>
      )}
    </>
  );
}
