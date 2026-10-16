import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/shared/page-header";
import { getSession } from "@/lib/auth";
import { prescribedMedicineIds } from "@/lib/services/prescription.service";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const user = await getSession();
  const patient = user?.role === "patient" ? user : null;
  return (
    <>
      <PageHeader title="Your cart" description="Review items and AI cautions before ordering." />
      <CartView patientName={patient?.name ?? null} prescribedIds={patient ? prescribedMedicineIds(patient.id) : []} />
    </>
  );
}
