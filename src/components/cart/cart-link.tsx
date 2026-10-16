"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "./cart-provider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative")}>
      <ShoppingCart />
      Cart
      {count > 0 && (
        <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{count}</span>
      )}
    </Link>
  );
}
