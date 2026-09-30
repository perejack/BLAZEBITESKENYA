import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — BlazeBites Kenya" },
      {
        name: "description",
        content:
          "How BlazeBites collects and uses your name, phone number and order details when you order food and pay with M-PESA.",
      },
      { property: "og:title", content: "Privacy Policy — BlazeBites Kenya" },
      {
        property: "og:description",
        content: "What we collect, why we collect it, and how long we keep it.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    t: "What we collect",
    b: "When you place an order we collect your full name, phone number, the items in your order and any note you leave for the kitchen. If you pay with M-PESA we also store the transaction code and amount so we can match your payment to your order.",
  },
  {
    t: "Why we collect it",
    b: "Your name and phone number let us prepare the right order, call you when it is ready and resolve payment questions. Order details let us issue your receipt and improve our menu.",
  },
  {
    t: "Payments",
    b: "M-PESA payments on this site are processed as an STK push to the number you provide. We never see, store or ask for your M-PESA PIN. Payment on this demonstration site is a simulation and no real money is moved.",
  },
  {
    t: "Your receipt",
    b: "Your receipt is generated in your browser and downloaded directly to your device. It contains your name, phone number, items, food subtotal, packing tin charges and total paid.",
  },
  {
    t: "Sharing",
    b: "We do not sell your data. We share information only with our payment provider and our delivery riders, and only what is needed to complete your order.",
  },
  {
    t: "How long we keep it",
    b: "Order and payment records are kept for 24 months for accounting and dispute resolution, then deleted. Cart contents stay in your own browser until you clear them.",
  },
  {
    t: "Your rights",
    b: "You can ask us for a copy of your data, ask for it to be corrected, or ask us to delete it. Email hello@blazebites.co.ke or call +254 712 345 678 and we will respond within 7 days.",
  },
];

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 font-display text-5xl font-bold leading-tight">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last updated 30 September 2026 · BlazeBites Kenya, Kimathi Street, Nairobi
      </p>

      <div className="mt-12 space-y-9">
        {SECTIONS.map((s, i) => (
          <section key={s.t}>
            <h2 className="font-display text-2xl font-bold">
              <span className="mr-3 text-primary/50">{String(i + 1).padStart(2, "0")}</span>
              {s.t}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
