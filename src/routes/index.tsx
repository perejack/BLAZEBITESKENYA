import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Flame, Receipt, Smartphone, Truck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { MenuCard } from "@/components/menu-card";
import { Button } from "@/components/ui/button";
import { formatKsh, MENU, PACKING_TIN, splitPrice } from "@/lib/menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BlazeBites — Bold Flavors, Crafted Daily | Nairobi" },
      {
        name: "description",
        content:
          "Premium smash burgers, crispy sides and craft beverages in Nairobi. Order now, pay with an M-PESA STK push and download your receipt instantly.",
      },
      { property: "og:title", content: "BlazeBites — Bold Flavors, Crafted Daily" },
      {
        property: "og:description",
        content:
          "Handcrafted with fire in Nairobi. Order online, pay with M-PESA, prices in KSh with packing tin shown.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const featured = MENU.slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Smash burger with fries, onion rings and an iced cola on dark marble"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="hero-scrim absolute inset-0" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-28 text-center">
          <p className="eyebrow animate-rise-in">Handcrafted with fire</p>
          <h1 className="animate-rise-in mt-6 font-display text-[clamp(2.75rem,10vw,6.5rem)] font-bold leading-[0.95] tracking-tight">
            Bold Flavors,
            <br />
            <span className="text-primary">Crafted Daily</span>
          </h1>
          <p className="animate-rise-in mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Premium smash burgers, crispy sides &amp; craft beverages — made from scratch, served
            with soul in the heart of Nairobi.
          </p>
          <div className="animate-rise-in mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link to="/menu">
                View Menu <ArrowDown className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-14 flex justify-center">
            <span className="grid h-10 w-6 place-items-start rounded-full border border-border pt-2">
              <span className="animate-ember-pulse size-1.5 rounded-full bg-primary" />
            </span>
          </div>
        </div>
      </section>

      {/* Transparent pricing strip */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-3 lg:px-8">
          {[
            {
              icon: Flame,
              title: "Grilled to order",
              body: "Nothing sits under a lamp. Every order hits the charcoal when you press pay.",
            },
            {
              icon: Receipt,
              title: `Packing tin at ${formatKsh(PACKING_TIN)}`,
              body: "Any item priced ending in 5 includes a KSh 5 takeaway tin — we show it separately, always.",
            },
            {
              icon: Smartphone,
              title: "M-PESA in seconds",
              body: "Enter your number, approve the STK push on your phone, download your receipt.",
            },
          ].map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <f.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured menu */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Straight off the grill</p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
              The favourites
            </h2>
          </div>
          <Button asChild variant="secondary" className="rounded-full">
            <Link to="/menu">
              See full menu <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Price board */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
          <p className="eyebrow">Price board</p>
          <h2 className="mt-3 font-display text-4xl font-bold">Every shilling, in the open</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Full price is what you pay. Where a packing tin applies, you see the food price and the
            KSh {PACKING_TIN} tin split out — on this board, in your bag and on your receipt.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Item</th>
                  <th className="px-5 py-4 text-right font-semibold">Food</th>
                  <th className="px-5 py-4 text-right font-semibold">Packing tin</th>
                  <th className="px-5 py-4 text-right font-semibold">Full price</th>
                </tr>
              </thead>
              <tbody>
                {MENU.flatMap((item) =>
                  item.variants
                    ? item.variants.map((v) => ({
                        key: item.id + v.id,
                        name: `${item.name} — ${v.label}`,
                        price: v.price,
                      }))
                    : [{ key: item.id, name: item.name, price: item.price! }],
                ).map((row) => {
                  const { food, tin } = splitPrice(row.price);
                  return (
                    <tr key={row.key} className="border-t border-border">
                      <td className="px-5 py-3.5 font-medium">{row.name}</td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {formatKsh(food)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground">
                        {tin ? formatKsh(tin) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-primary">
                        {formatKsh(row.price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="eyebrow">How ordering works</p>
        <h2 className="mt-3 font-display text-4xl font-bold">Four taps to a hot bag</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { n: "01", t: "Build your bag", d: "Add what you want from the menu, pick drink sizes." },
            { n: "02", t: "Order now", d: "Give us your full name and phone number." },
            { n: "03", t: "Approve STK push", d: "Enter your M-PESA PIN on the prompt we send." },
            { n: "04", t: "Download receipt", d: "A PDF receipt with your details, ready instantly." },
          ].map((s) => (
            <li key={s.n} className="surface-plate rounded-2xl p-6">
              <span className="font-display text-3xl font-bold text-primary/40">{s.n}</span>
              <h3 className="mt-3 font-display text-lg font-bold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="surface-plate mt-14 flex flex-col items-center gap-6 rounded-3xl p-10 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="font-display text-3xl font-bold">Hungry now?</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="size-4 text-primary" /> Nairobi CBD delivery in 30–45 minutes.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/menu">
              Order now <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
