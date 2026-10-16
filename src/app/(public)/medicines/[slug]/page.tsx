import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailabilityList } from "@/components/medicine/availability-list";
import { CautionPanel } from "@/components/caution/caution-panel";
import { RxBadge } from "@/components/shared/status-badge";
import { CITIES, DEFAULT_CITY, formatBDT } from "@/lib/constants";
import { getMedicineBySlug, sameIngredientBrands } from "@/lib/services/medicine.service";
import { getAvailability } from "@/lib/services/pharmacy.service";
import { buildCautionReport } from "@/lib/services/caution.service";
import { cn } from "@/lib/utils";
import type { City } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/medicines/[slug]">) {
  const m = getMedicineBySlug((await params).slug);
  return { title: m ? `${m.brand} ${m.strength}` : "Medicine" };
}

export default async function MedicineDetailPage({ params, searchParams }: PageProps<"/medicines/[slug]">) {
  const medicine = getMedicineBySlug((await params).slug);
  if (!medicine) notFound();

  const sp = await searchParams;
  const cityParam = typeof sp.city === "string" ? (sp.city as City) : DEFAULT_CITY;
  const city = CITIES.includes(cityParam) ? cityParam : DEFAULT_CITY;

  const { nearby, national } = getAvailability(medicine.id, city);
  const report = buildCautionReport([medicine.id]);
  const siblings = sameIngredientBrands(medicine);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <RxBadge rx={medicine.rx} />
            {medicine.rare && <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" variant="secondary">Rare</Badge>}
            <Badge variant="outline">{medicine.category}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{medicine.brand} <span className="font-normal text-muted-foreground">{medicine.strength}</span></h1>
          <p className="text-muted-foreground">{medicine.generic} · {medicine.form} · {medicine.manufacturer} · reference {formatBDT(medicine.price)}</p>
          <p className="mt-3">{medicine.description}</p>
        </div>

        {medicine.rx && (
          <p className="flex gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Prescription-only. Checkout requires a valid prescription from a verified doctor on your account.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Where to buy</CardTitle>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CITIES.map((c) => (
                <Link key={c} href={`/medicines/${medicine.slug}?city=${c}`}
                  className={cn("rounded-full border px-3 py-1 text-xs", c === city ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
                  {c}
                </Link>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold">In {city}</h3>
              <AvailabilityList medicine={medicine} rows={nearby}
                emptyText={`Not stocked in ${city}.${national.length ? " See other cities below." : ""}`} />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Elsewhere in Bangladesh</h3>
              <AvailabilityList medicine={medicine} rows={national} emptyText="No other pharmacy stocks this medicine." />
            </div>
          </CardContent>
        </Card>

        {siblings.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Same ingredient, other brands</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <Link key={s.id} href={`/medicines/${s.slug}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">
                  {s.brand} {s.strength}
                </Link>
              ))}
              <p className="w-full text-xs text-muted-foreground">Do not take two brands of the same ingredient together.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <CautionPanel report={report} hideRx />
        <Card>
          <CardHeader><CardTitle>Possible side effects</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {medicine.sideEffects.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
