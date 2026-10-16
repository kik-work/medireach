import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updatePharmacyStatus } from "@/lib/actions/admin";
import { getInventory, listPharmacies } from "@/lib/services/pharmacy.service";

export default function AdminPharmacies() {
  return (
    <>
      <PageHeader title="Pharmacies" description="Suspend bad actors or reinstate them. Suspended pharmacies disappear from search." />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Pharmacy</TableHead><TableHead>City</TableHead><TableHead>Listings</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {listPharmacies().map((p) => {
                const suspended = p.status === "suspended";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.licenseNo}</div></TableCell>
                    <TableCell>{p.city}</TableCell>
                    <TableCell>{getInventory(p.id).length}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell className="text-right">
                      {(p.status === "verified" || suspended) && (
                        <form action={updatePharmacyStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value={suspended ? "verified" : "suspended"} />
                          <Button size="sm" variant={suspended ? "outline" : "destructive"} type="submit">{suspended ? "Reinstate" : "Suspend"}</Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
