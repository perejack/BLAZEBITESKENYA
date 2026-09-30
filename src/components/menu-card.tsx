import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatKsh, splitPrice, type MenuItem } from "@/lib/menu";
import { cn } from "@/lib/utils";

export function MenuCard({ item }: { item: MenuItem }) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(item.variants?.[0]?.id);
  const variant = item.variants?.find((v) => v.id === variantId);
  const price = variant ? variant.price : item.price!;
  const { food, tin } = splitPrice(price);

  return (
    <article className="group surface-plate grain flex flex-col overflow-hidden rounded-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        {item.tag && (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
            {item.tag}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold leading-tight">{item.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        {item.variants && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  v.id === variantId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <div className="font-display text-2xl font-bold text-primary">{formatKsh(price)}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {tin
                ? `${formatKsh(food)} food + ${formatKsh(tin)} packing tin`
                : "No packing tin required"}
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => {
              add(item, variant);
              toast.success(`${item.name} added to your bag`);
            }}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}
