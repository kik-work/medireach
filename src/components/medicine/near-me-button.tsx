"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LocateFixed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inBangladesh } from "@/lib/geo";

/**
 * Asks the browser for the user's position and reloads the page with ?lat=&lng=,
 * so the server ranks pharmacies by distance. Nothing is stored.
 */
export function NearMeButton({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function locate() {
    if (!("geolocation" in navigator)) return setError("Your browser cannot share its location.");
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setBusy(false);
        const point = { lat: coords.latitude, lng: coords.longitude };
        if (!inBangladesh(point)) return setError("Your location is outside Bangladesh. Choose a city instead.");
        router.replace(`${pathname}?lat=${point.lat.toFixed(5)}&lng=${point.lng.toFixed(5)}`, { scroll: false });
      },
      (e) => {
        setBusy(false);
        setError(e.code === e.PERMISSION_DENIED ? "Location permission was denied. Choose a city instead." : "Could not find your location. Choose a city instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={locate} disabled={busy}>
        <LocateFixed /> {busy ? "Locating…" : active ? "Update my location" : "Near me"}
      </Button>
      {active && (
        <Link href={pathname} scroll={false} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
          <X className="size-3" /> Stop using my location
        </Link>
      )}
      {error && <p role="alert" className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
