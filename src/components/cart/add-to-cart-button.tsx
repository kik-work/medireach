"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, type CartLine } from "./cart-provider";

export function AddToCartButton({ line }: { line: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      size="sm"
      variant={added ? "secondary" : "default"}
      onClick={() => {
        add(line);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? <Check /> : <ShoppingCart />}
      {added ? "Added" : "Add"}
    </Button>
  );
}
