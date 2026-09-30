import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About BlazeBites — Charcoal, Craft & Nairobi Street Food" },
      {
        name: "description",
        content:
          "BlazeBites started as a charcoal grill on Kimathi Street. Today we serve smash burgers, shawarma and street sides made from scratch every morning.",
      },
      { property: "og:title", content: "About BlazeBites — Charcoal, Craft & Nairobi Street Food" },
      {
        property: "og:description",
        content: "A Nairobi kitchen built on open flame, fresh produce and honest pricing.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="pb-24 pt-32 lg:pt-40">
      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        <p className="eyebrow">Our story</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
          Built on open <span className="text-primary">flame</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          BlazeBites began in 2019 with one charcoal drum, two cousins and a queue that spilled onto
          Kimathi Street. We never wanted to be the biggest kitchen in Nairobi — just the one that
          refuses shortcuts.
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-5 lg:px-8">
        <img
          src={heroImg}
          alt="BlazeBites signature burger plated with fries and onion rings"
          loading="lazy"
          width={1920}
          height={1088}
          className="aspect-[16/9] w-full rounded-3xl object-cover"
        />
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-8 px-5 md:grid-cols-3 lg:px-8">
        {[
          {
            t: "Ground every morning",
            d: "Our beef is ground in-house daily and smashed to order — never pre-pressed, never frozen.",
          },
          {
            t: "Produce from Marikiti",
            d: "Tomatoes, onions, mangoes and passion fruit come from the market at dawn, six days a week.",
          },
          {
            t: "Honest pricing",
            d: "Food price and packing tin shown separately, on the menu and on your receipt. No hidden extras.",
          },
        ].map((v) => (
          <div key={v.t} className="surface-plate rounded-2xl p-7">
            <h2 className="font-display text-xl font-bold">{v.t}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-5 lg:px-8">
        <div className="surface-plate flex flex-col items-center gap-6 rounded-3xl p-10 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-3xl font-bold">Taste the difference</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Order in under a minute and pay with M-PESA.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/menu">
              Explore the menu <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
