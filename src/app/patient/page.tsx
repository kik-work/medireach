import Link from "next/link";
import { FileText, Package, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { requireRole } from "@/lib/auth";
import { listOrders } from "@/lib/services/order.service";
import { isValid, listForPatient } from "@/lib/services/prescription.service";

export const metadata = { title: "Patient dashboard" };

export default async function PatientHome() {
  const user = await requireRole("patient");
  const orders = listOrders({ patientId: user.id });
  const rxs = listForPatient(user.id);

  return (
    <>
      <PageHeader title={`Welcome, ${user.name}`} description={`Location: ${user.city}`}
        actions={<Link href="/medicines" className={buttonVariants()}>Find a medicine</Link>} />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Active prescriptions" value={rxs.filter(isValid).length} icon={FileText} />
        <StatCard label="Orders" value={orders.length} icon={Package} />
        <StatCard label="In progress" value={orders.filter((o) => ["placed", "confirmed", "packed", "pre-order"].includes(o.status)).length} icon={ShieldCheck} />
      </div>
      <h2 className="mb-3 font-semibold">Recent orders</h2>
      <OrdersTable orders={orders.slice(0, 5)} />
    </>
  );
}
