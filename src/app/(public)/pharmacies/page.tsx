import { MapPin, Navigation, Phone, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NearMeButton } from "@/components/medicine/near-me-button";
import { PageBanner } from "@/components/shared/page-banner";
import { IMAGES } from "@/lib/images";
import { CITIES } from "@/lib/constants";
import { formatKm, parsePoint } from "@/lib/geo";
import { listPharmacies, pharmaciesNear } from "@/lib/services/pharmacy.service";
import type { Pharmacy } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pharmacies" };

function PharmacyCard({ p, distance }: { p: Pharmacy; distance?: { km: number; exact: boolean } }) {
  return (
    <Card>
      <CardContent className="space-y-1.5">
        <p className="font-semibold">{p.name}</p>
        {distance && (
          <p className="flex items-center gap-1.5 text-sm font-medium" title={distance.exact ? undefined : "Approximate: distance to the city centre"}>
            <Navigation className="size-3.5" />{distance.exact ? "" : "~"}{formatKm(distance.km)} away
          </p>
        )}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{p.address}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="size-3.5" />{p.phone}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Star className="size-3.5" />{p.rating} · Lic. {p.licenseNo}</p>
      </CardContent>
    </Card>
  );
}

export default async function PharmaciesPage({ searchParams }: PageProps<"/pharmacies">) {
  const sp = await searchParams;
  const origin = parsePoint(sp.lat, sp.lng);
  const verified = listPharmacies().filter((p) => p.status === "verified");
  return (
    <>
      <PageBanner title="Verified pharmacies" description="Only pharmacies verified by the admin appear in search results." image={IMAGES.pharmacy} />
      <div className="space-y-8">
        <NearMeButton active={Boolean(origin)} />
        {origin ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Nearest to you</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pharmaciesNear(origin).map(({ pharmacy, distanceKm, exact }) => (
                <PharmacyCard key={pharmacy.id} p={pharmacy} distance={{ km: distanceKm, exact }} />
              ))}
            </div>
          </section>
        ) : (
          CITIES.map((city) => {
            const inCity = verified.filter((p) => p.city === city);
            if (!inCity.length) return null;
            return (
              <section key={city}>
                <h2 className="mb-3 text-lg font-semibold">{city}</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {inCity.map((p) => <PharmacyCard key={p.id} p={p} />)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
