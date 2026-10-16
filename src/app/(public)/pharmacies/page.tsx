import { MapPin, Phone, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageBanner } from "@/components/shared/page-banner";
import { IMAGES } from "@/lib/images";
import { CITIES } from "@/lib/constants";
import { listPharmacies } from "@/lib/services/pharmacy.service";

export const metadata = { title: "Pharmacies" };

export default function PharmaciesPage() {
  const verified = listPharmacies().filter((p) => p.status === "verified");
  return (
    <>
      <PageBanner title="Verified pharmacies" description="Only pharmacies verified by the admin appear in search results." image={IMAGES.pharmacy} />
      <div className="space-y-8">
        {CITIES.map((city) => {
          const inCity = verified.filter((p) => p.city === city);
          if (!inCity.length) return null;
          return (
            <section key={city}>
              <h2 className="mb-3 text-lg font-semibold">{city}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inCity.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="space-y-1.5">
                      <p className="font-semibold">{p.name}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{p.address}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="size-3.5" />{p.phone}</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Star className="size-3.5" />{p.rating} · Lic. {p.licenseNo}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
