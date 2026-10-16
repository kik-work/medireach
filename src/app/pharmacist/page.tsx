import { Package, Pill, Wallet } from "lucide-react";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { formatBDT } from "@/lib/constants";
import { requireRole } from "@/lib/auth";
import { listOrders } from "@/lib/services/order.service";
import { getInventory, getPharmacy } from "@/lib/services/pharmacy.service";

export const metadata = { title: "Pharmacist dashboard" };

export default async function PharmacistHome() {
  const user = await requireRole("pharmacist");
  const pharmacy = getPharmacy(user.pharmacyId!)!;
  const orders = listOrders({ pharmacyId: pharmacy.id });
  return (
    <>
      <PageHeader title={pharmacy.name} description={`${pharmacy.address} · Lic. ${pharmacy.licenseNo}`} />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Medicines listed" value={getInventory(pharmacy.id).length} icon={Pill} />
        <StatCard label="Open orders" value={orders.filter((o) => ["placed", "confirmed", "packed", "pre-order"].includes(o.status)).length} icon={Package} />
        <StatCard label="Order value" value={formatBDT(orders.reduce((s, o) => s + o.total, 0))} icon={Wallet} />
      </div>
      <h2 className="mb-3 font-semibold">Latest orders</h2>
      <OrdersTable orders={orders.slice(0, 5)} show={{ patient: true }} />
    </>
  );
}
