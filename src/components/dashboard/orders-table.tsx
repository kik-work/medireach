import type { ReactNode } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBDT } from "@/lib/constants";
import { getMedicineById } from "@/lib/services/medicine.service";
import { getPharmacy } from "@/lib/services/pharmacy.service";
import { getUser } from "@/lib/services/user.service";
import type { Order } from "@/lib/types";

interface Props {
  orders: Order[];
  show?: { patient?: boolean; pharmacy?: boolean };
  actions?: (order: Order) => ReactNode;
}

export function OrdersTable({ orders, show = { pharmacy: true }, actions }: Props) {
  if (orders.length === 0) {
    return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No orders yet.</CardContent></Card>;
  }
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              {show.patient && <TableHead>Patient</TableHead>}
              {show.pharmacy && <TableHead>Pharmacy</TableHead>}
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.id}<div className="text-xs font-normal text-muted-foreground">{o.createdAt}</div></TableCell>
                {show.patient && <TableCell>{getUser(o.patientId)?.name}</TableCell>}
                {show.pharmacy && <TableCell>{getPharmacy(o.pharmacyId)?.name}</TableCell>}
                <TableCell className="whitespace-normal">
                  {o.lines.map((l) => `${getMedicineById(l.medicineId)?.brand} ×${l.quantity}`).join(", ")}
                </TableCell>
                <TableCell>{formatBDT(o.total)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                {actions && <TableCell className="text-right">{actions(o)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
