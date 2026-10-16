import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { advanceOrder } from "@/lib/actions/pharmacist";
import { requireRole } from "@/lib/auth";
import { listOrders } from "@/lib/services/order.service";
import type { OrderStatus } from "@/lib/types";

export const metadata = { title: "Orders" };

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  placed: { status: "confirmed", label: "Confirm" },
  "pre-order": { status: "confirmed", label: "Confirm" },
  confirmed: { status: "packed", label: "Mark packed" },
  packed: { status: "delivered", label: "Mark delivered" },
};

export default async function PharmacistOrders() {
  const user = await requireRole("pharmacist");
  return (
    <>
      <PageHeader title="Orders" description="Move each order through the fulfilment steps." />
      <OrdersTable
        orders={listOrders({ pharmacyId: user.pharmacyId })}
        show={{ patient: true }}
        actions={(o) => {
          const next = NEXT[o.status];
          return next ? (
            <form action={advanceOrder}>
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="status" value={next.status} />
              <Button size="sm" type="submit">{next.label}</Button>
            </form>
          ) : null;
        }}
      />
    </>
  );
}
