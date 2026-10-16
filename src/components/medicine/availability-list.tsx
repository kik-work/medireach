import { MapPin, Star } from "lucide-react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { formatBDT } from "@/lib/constants";
import type { Availability } from "@/lib/services/pharmacy.service";
import type { Medicine } from "@/lib/types";

export function AvailabilityList({ medicine, rows, emptyText }: { medicine: Medicine; rows: Availability[]; emptyText: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <ul className="divide-y rounded-lg border">
      {rows.map(({ pharmacy, stock }) => (
        <li key={pharmacy.id} className="flex flex-wrap items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{pharmacy.name}</p>
            <p className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-3" />{pharmacy.area}, {pharmacy.city}</span>
              <span className="flex items-center gap-1"><Star className="size-3" />{pharmacy.rating}</span>
              <span>{stock.quantity} in stock</span>
            </p>
          </div>
          <p className="font-semibold">{formatBDT(stock.price)}</p>
          <AddToCartButton
            line={{
              medicineId: medicine.id, pharmacyId: pharmacy.id, brand: medicine.brand, generic: medicine.generic,
              strength: medicine.strength, pharmacyName: pharmacy.name, unitPrice: stock.price, rx: medicine.rx,
            }}
          />
        </li>
      ))}
    </ul>
  );
}
