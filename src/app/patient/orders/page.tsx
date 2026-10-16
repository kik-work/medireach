import { OrdersTable } from "@/components/dashboard/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth";
import { listOrders } from "@/lib/services/order.service";

export const metadata = { title: "My orders" };

export default async function PatientOrders() {
  const user = await requireRole("patient");
  return (
    <>
      <PageHeader title="My orders" description="Track every order from placement to delivery." />
      <OrdersTable orders={listOrders({ patientId: user.id })} />
    </>
  );
}
