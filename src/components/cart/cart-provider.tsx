"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  medicineId: string;
  pharmacyId: string;
  quantity: number;
  /** Snapshot for display so the cart page needs no extra lookups. */
  brand: string;
  generic: string;
  strength: string;
  pharmacyName: string;
  unitPrice: number;
  rx: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (medicineId: string, pharmacyId: string, quantity: number) => void;
  remove: (medicineId: string, pharmacyId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "medireach-cart";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, loaded]);

  const add = useCallback<CartContextValue["add"]>((line, quantity = 1) => {
    setLines((prev) => {
      const hit = prev.find((l) => l.medicineId === line.medicineId && l.pharmacyId === line.pharmacyId);
      return hit
        ? prev.map((l) => (l === hit ? { ...l, quantity: l.quantity + quantity } : l))
        : [...prev, { ...line, quantity }];
    });
  }, []);

  const setQuantity = useCallback<CartContextValue["setQuantity"]>((medicineId, pharmacyId, quantity) => {
    setLines((prev) =>
      prev.map((l) => (l.medicineId === medicineId && l.pharmacyId === pharmacyId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    );
  }, []);

  const remove = useCallback<CartContextValue["remove"]>((medicineId, pharmacyId) => {
    setLines((prev) => prev.filter((l) => !(l.medicineId === medicineId && l.pharmacyId === pharmacyId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
      add, setQuantity, remove, clear,
    }),
    [lines, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
