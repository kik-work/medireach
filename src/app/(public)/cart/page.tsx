import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <PageHeader title="Your cart" description="Review items and AI cautions before ordering." />
      <CartView />
    </>
  );
}
