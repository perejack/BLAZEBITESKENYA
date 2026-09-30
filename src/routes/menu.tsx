import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MenuCard } from "@/components/menu-card";
import { CATEGORIES, MENU, PACKING_TIN } from "@/lib/menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu & Prices in KSh — BlazeBites Nairobi" },
      {
        name: "description",
        content:
          "Browse the full BlazeBites menu: smash burgers, shawarma, quarter chicken, kebabs, fries, bhajia, sodas and fresh juice. Prices in KSh with packing tin shown.",
      },
      { property: "og:title", content: "Menu & Prices in KSh — BlazeBites Nairobi" },
      {
        property: "og:description",
        content: "Every item, every price, packing tin included and shown separately.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [active, setActive] = useState<string>("All");
  const items = active === "All" ? MENU : MENU.filter((i) => i.category === active);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <p className="eyebrow">Our menu</p>
      <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
        Fire, fried <span className="text-primary">&amp; fresh</span>
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        All prices are in Kenya Shillings. Items priced ending in 5 include a KSh {PACKING_TIN}{" "}
        packing tin — we split it out so you always see the food price too.
      </p>

      <div className="mt-10 flex flex-wrap gap-2.5">
        {["All", ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-medium transition-all",
              c === active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
