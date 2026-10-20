import { notFound } from "next/navigation";

// Pharmacist accounts are not part of the new local auth (patient / doctor / admin only).
// Pages below this layout are unreachable until a pharmacist flow is added.
export default function PharmacistLayout(_props: LayoutProps<"/pharmacist">) {
  notFound();
}
