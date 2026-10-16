import type { StockItem } from "@/lib/types";
import { medicines } from "./medicines";

const base = (id: string) => medicines.find((m) => m.id === id)!.price;
const row = (pharmacyId: string, medicineId: string, quantity: number, markup = 0): StockItem => ({
  pharmacyId,
  medicineId,
  quantity,
  price: Math.round(base(medicineId) * (1 + markup)),
});

const common = ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m08", "m09", "m10", "m11"];

/** Common medicines are widely stocked; rare ones (m12–m15) only at a few pharmacies. */
export const stock: StockItem[] = [
  ...["ph1", "ph2", "ph3", "ph4"].flatMap((p, i) =>
    common.map((m, j) => row(p, m, 20 + ((i + j) % 5) * 30, i * 0.02)),
  ),
  ...["ph5", "ph6", "ph7"].flatMap((p, i) =>
    common.slice(0, 8).map((m, j) => row(p, m, 10 + ((i + j) % 4) * 15, 0.03)),
  ),
  row("ph3", "m12", 14),
  row("ph4", "m12", 6, 0.05),
  row("ph3", "m13", 22),
  row("ph6", "m13", 8, 0.04),
  row("ph3", "m14", 5),
  row("ph4", "m15", 3),
];
