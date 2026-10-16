import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { RxBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createMedicine } from "@/lib/actions/admin";
import { formatBDT } from "@/lib/constants";
import { listMedicines } from "@/lib/services/medicine.service";

const selectClass = "h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm";

export default function AdminMedicines() {
  const medicines = listMedicines();
  return (
    <>
      <PageHeader title="Medicine database" description="The curated source the AI caution layer retrieves from." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Brand</TableHead><TableHead>Generic</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {medicines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.brand} {m.strength}</TableCell>
                    <TableCell>{m.generic}</TableCell>
                    <TableCell>{m.category}</TableCell>
                    <TableCell className="space-x-1"><RxBadge rx={m.rx} />{m.rare && <Badge variant="outline">Rare</Badge>}</TableCell>
                    <TableCell>{formatBDT(m.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Add medicine</CardTitle></CardHeader>
          <CardContent>
            <form action={createMedicine} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="brand">Brand</Label><Input id="brand" name="brand" required /></div>
                <div className="space-y-1.5"><Label htmlFor="generic">Generic</Label><Input id="generic" name="generic" required /></div>
                <div className="space-y-1.5"><Label htmlFor="strength">Strength</Label><Input id="strength" name="strength" placeholder="500 mg" required /></div>
                <div className="space-y-1.5">
                  <Label htmlFor="form">Form</Label>
                  <select id="form" name="form" className={selectClass}>{["Tablet", "Capsule", "Syrup", "Injection"].map((f) => <option key={f}>{f}</option>)}</select>
                </div>
                <div className="space-y-1.5"><Label htmlFor="manufacturer">Manufacturer</Label><Input id="manufacturer" name="manufacturer" required /></div>
                <div className="space-y-1.5"><Label htmlFor="category">Category</Label><Input id="category" name="category" required /></div>
                <div className="space-y-1.5"><Label htmlFor="price">Price (৳)</Label><Input id="price" name="price" type="number" min={0} required /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" required /></div>
              <div className="space-y-1.5"><Label htmlFor="uses">Uses (one per line)</Label><Textarea id="uses" name="uses" /></div>
              <div className="space-y-1.5"><Label htmlFor="cautions">Cautions (one per line)</Label><Textarea id="cautions" name="cautions" /></div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5"><input type="checkbox" name="rx" /> Rx only</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="rare" /> Rare</label>
              </div>
              <Button type="submit" className="w-full">Add to database</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
