import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { splitPrice, type MenuItem, type MenuVariant } from "./menu";

export type CartLine = {
  key: string;
  name: string;
  image: string;
  food: number;
  tin: number;
  unit: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  add: (item: MenuItem, variant?: MenuVariant) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  packing: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "blazebites.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const value = useMemo<CartState>(() => {
    const subtotal = lines.reduce((s, l) => s + l.food * l.qty, 0);
    const packing = lines.reduce((s, l) => s + l.tin * l.qty, 0);
    return {
      lines,
      open,
      setOpen,
      add: (item, variant) => {
        const price = variant ? variant.price : item.price!;
        const { food, tin } = splitPrice(price);
        const key = variant ? `${item.id}:${variant.id}` : item.id;
        const name = variant ? `${item.name} — ${variant.label}` : item.name;
        setLines((prev) => {
          const found = prev.find((l) => l.key === key);
          if (found)
            return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, 99) } : l));
          return [...prev, { key, name, image: item.image, food, tin, unit: price, qty: 1 }];
        });
      },
      setQty: (key, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => l.key !== key)
            : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 99) } : l)),
        ),
      remove: (key) => setLines((prev) => prev.filter((l) => l.key !== key)),
      clear: () => setLines([]),
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal,
      packing,
      total: subtotal + packing,
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
