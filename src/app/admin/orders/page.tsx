import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { updateOrderStatus } from "@/lib/actions/admin";
import { listOrders } from "@/lib/services/order.service";

export default function AdminOrders() {
  return (
    <>
      <PageHeader title="Orders" description="All orders across pharmacies. Admin can cancel suspicious orders." />
      <OrdersTable
        orders={listOrders()}
        show={{ patient: true, pharmacy: true }}
        actions={(o) =>
          ["delivered", "cancelled"].includes(o.status) ? null : (
            <form action={updateOrderStatus}>
              <input type="hidden" name="id" value={o.id} />
              <input type="hidden" name="status" value="cancelled" />
              <Button size="sm" variant="destructive" type="submit">Cancel</Button>
            </form>
          )
        }
      />
    </>
  );
}
