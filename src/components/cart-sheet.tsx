import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatKsh } from "@/lib/menu";

export function CartSheet() {
  const { lines, open, setOpen, setQty, remove, subtotal, packing, total, count } = useCart();
  const [checkout, setCheckout] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="border-b border-border">
            <SheetTitle className="font-display text-xl">
              Your bag {count > 0 && <span className="text-primary">({count})</span>}
            </SheetTitle>
          </SheetHeader>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <ShoppingBag className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your bag is empty. Fire it up with something from the menu.
              </p>
              <Button asChild className="rounded-full" onClick={() => setOpen(false)}>
                <Link to="/menu">Browse the menu</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {lines.map((l) => (
                  <div key={l.key} className="flex gap-3.5">
                    <img
                      src={l.image}
                      alt={l.name}
                      loading="lazy"
                      className="size-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug">{l.name}</h3>
                        <button
                          type="button"
                          aria-label={`Remove ${l.name}`}
                          onClick={() => remove(l.key)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatKsh(l.food)}
                        {l.tin ? ` + ${formatKsh(l.tin)} tin` : ""} each
                      </p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 rounded-full border border-border bg-secondary p-1">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(l.key, l.qty - 1)}
                            className="grid size-7 place-items-center rounded-full hover:bg-accent"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQty(l.key, l.qty + 1)}
                            className="grid size-7 place-items-center rounded-full hover:bg-accent"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="font-display text-base font-bold text-primary">
                          {formatKsh(l.unit * l.qty)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border bg-card/60 p-5">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Food subtotal</span>
                    <span className="text-foreground">{formatKsh(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packing tins</span>
                    <span className="text-foreground">{formatKsh(packing)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatKsh(total)}</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="mt-4 w-full rounded-full"
                  onClick={() => {
                    setOpen(false);
                    setCheckout(true);
                  }}
                >
                  Order now · {formatKsh(total)}
                </Button>
                <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                  Pay by M-PESA STK push · receipt available instantly
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog open={checkout} onOpenChange={setCheckout} />
    </>
  );
}
