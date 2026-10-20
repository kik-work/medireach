"use client";

import type { ReactNode } from "react";
import { Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDashboardData } from "@/components/dashboard/data-provider";
import { formatBDT } from "@/lib/constants";
import { isPrescriptionValid } from "@/lib/dashboard-store";
import type { Order, Prescription } from "@/lib/types";

export const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm";

export function EmptyState({ children }: { children: ReactNode }) {
  return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">{children}</CardContent></Card>;
}

export function PrescriptionList({ items, party }: { items: Prescription[]; party: "doctor" | "patient" }) {
  const { medicines, users } = useDashboardData();
  const medicine = (id: string) => medicines.find((m) => m.id === id);
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      {items.map((rx) => {
        const valid = isPrescriptionValid(rx);
        const who = party === "doctor"
          ? `Patient: ${userName(rx.patientId)}`
          : rx.uploaded ? `Uploaded by you${rx.doctorName ? ` · ${rx.doctorName}` : ""}` : `By ${userName(rx.doctorId)}`;
        return (
          <Card key={rx.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {rx.id}
                <Badge variant={valid ? "default" : "outline"}>{valid ? "Valid" : "Expired"}</Badge>
                {rx.uploaded && <Badge variant="secondary">Uploaded copy</Badge>}
                <span className="ml-auto text-sm font-normal text-muted-foreground">{who} · {rx.issuedAt} → {rx.validUntil}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Diagnosis: {rx.diagnosis || "—"}</p>
              {rx.fileName && <p className="flex items-center gap-1.5 text-muted-foreground"><Paperclip className="size-3.5" /> {rx.fileName}</p>}
              <ul className="divide-y rounded-lg border">
                {rx.items.map((i) => {
                  const m = medicine(i.medicineId);
                  return (
                    <li key={i.medicineId} className="flex flex-wrap justify-between gap-x-4 gap-y-1 p-2.5">
                      <span className="font-medium">{m?.brand} {m?.strength} <span className="font-normal text-muted-foreground">({m?.generic})</span></span>
                      <span className="text-muted-foreground">{i.dose} · {i.days} days</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface OrdersTableProps {
  orders: Order[];
  show?: { patient?: boolean; pharmacy?: boolean };
  actions?: (order: Order) => ReactNode;
  empty?: string;
}

export function OrdersTable({ orders, show = { pharmacy: true }, actions, empty = "No orders yet." }: OrdersTableProps) {
  const { medicines, pharmacies, users } = useDashboardData();
  if (orders.length === 0) return <EmptyState>{empty}</EmptyState>;
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
                {show.patient && <TableCell>{users.find((u) => u.id === o.patientId)?.name ?? "Unknown"}</TableCell>}
                {show.pharmacy && <TableCell>{pharmacies.find((p) => p.id === o.pharmacyId)?.name}</TableCell>}
                <TableCell className="whitespace-normal">
                  {o.lines.map((l) => `${medicines.find((m) => m.id === l.medicineId)?.brand} ×${l.quantity}`).join(", ")}
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
