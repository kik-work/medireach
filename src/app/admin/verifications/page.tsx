import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updatePharmacyStatus, updateUserStatus } from "@/lib/actions/admin";
import { getPharmacy, listPharmacies } from "@/lib/services/pharmacy.service";
import { listUsers } from "@/lib/services/user.service";

function Decision({ action, id }: { action: (f: FormData) => Promise<void>; id: string }) {
  return (
    <div className="flex justify-end gap-2">
      {(["verified", "rejected"] as const).map((status) => (
        <form key={status} action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value={status} />
          <Button size="sm" variant={status === "verified" ? "default" : "destructive"} type="submit">
            {status === "verified" ? "Approve" : "Reject"}
          </Button>
        </form>
      ))}
    </div>
  );
}

export default function VerificationsPage() {
  const people = listUsers().filter((u) => u.role === "doctor" || u.role === "pharmacist");
  const pharmacies = listPharmacies();

  return (
    <>
      <PageHeader title="Verifications" description="In production these map to BMDC, Pharmacy Council and DGDA checks." />
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 font-semibold">Doctors &amp; pharmacists</h2>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Reg. no.</TableHead><TableHead>Pharmacy</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Decision</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {people.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}<div className="text-xs font-normal text-muted-foreground">{u.city}</div></TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell>{u.registrationNo}</TableCell>
                      <TableCell>{u.pharmacyId ? getPharmacy(u.pharmacyId)?.name : "—"}</TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell>{u.status === "pending" ? <Decision action={updateUserStatus} id={u.id} /> : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Pharmacy licences</h2>
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Pharmacy</TableHead><TableHead>Licence</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Decision</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pharmacies.filter((p) => p.status !== "verified").map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}<div className="text-xs font-normal text-muted-foreground">{p.area}, {p.city}</div></TableCell>
                      <TableCell>{p.licenseNo}</TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell>{p.status === "pending" ? <Decision action={updatePharmacyStatus} id={p.id} /> : null}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
