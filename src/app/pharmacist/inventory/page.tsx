import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { saveStock } from "@/lib/actions/pharmacist";
import { requireRole } from "@/lib/auth";
import { listMedicines } from "@/lib/services/medicine.service";
import { getInventory } from "@/lib/services/pharmacy.service";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const user = await requireRole("pharmacist");
  const inventory = getInventory(user.pharmacyId!);
  const rows = listMedicines().map((m) => ({ m, s: inventory.find((i) => i.medicineId === m.id) }));

  return (
    <>
      <PageHeader title="Inventory" description="Set quantity and price. Quantity 0 hides you from search results for that medicine." />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Medicine</TableHead><TableHead>Quantity</TableHead><TableHead>Price (৳)</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ m, s }) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.brand} {m.strength}<div className="text-xs font-normal text-muted-foreground">{m.generic}{m.rare ? " · rare" : ""}</div></TableCell>
                  <TableCell colSpan={3}>
                    <form action={saveStock} className="flex items-center gap-2">
                      <input type="hidden" name="medicineId" value={m.id} />
                      <Input name="quantity" type="number" min={0} defaultValue={s?.quantity ?? 0} className="w-24" />
                      <Input name="price" type="number" min={0} defaultValue={s?.price ?? m.price} className="w-24" />
                      <Button size="sm" variant="outline" type="submit">Save</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
