import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact BlazeBites — Nairobi CBD Orders & Catering" },
      {
        name: "description",
        content:
          "Call, message or visit BlazeBites on Kimathi Street, Nairobi CBD. Open daily 10am to 11pm. Catering and bulk orders welcome.",
      },
      { property: "og:title", content: "Contact BlazeBites — Nairobi CBD" },
      {
        property: "og:description",
        content: "Kimathi Street, Nairobi. Open daily 10am–11pm. +254 712 345 678.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [errors, setErrors] = useState<{ name?: string; phone?: string; message?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: { name?: string; phone?: string; message?: string } = {};
    if (form.name.trim().length < 3) err.name = "Please enter your name.";
    if (!/^(?:\+?254|0)(7|1)\d{8}$/.test(form.phone.trim()))
      err.phone = "Enter a valid Kenyan phone number.";
    if (form.message.trim().length < 5) err.message = "Tell us a little more.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setForm({ name: "", phone: "", message: "" });
    toast.success("Message sent. We'll call you back shortly.");
  };

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-32 lg:px-8 lg:pt-40">
      <p className="eyebrow">Talk to us</p>
      <h1 className="mt-3 font-display text-5xl font-bold leading-tight sm:text-6xl">
        Come by, or <span className="text-primary">call ahead</span>
      </h1>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          {[
            { icon: MapPin, t: "Kitchen", d: "Kimathi Street, Nairobi CBD, opposite Bazaar Plaza" },
            { icon: Phone, t: "Phone & WhatsApp", d: "+254 712 345 678" },
            { icon: Mail, t: "Email", d: "hello@blazebites.co.ke" },
            { icon: Clock, t: "Open hours", d: "Monday – Sunday, 10:00am to 11:00pm" },
            { icon: Instagram, t: "Instagram", d: "@blazebites.ke" },
          ].map((c) => (
            <div key={c.t} className="surface-plate flex gap-4 rounded-2xl p-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                <c.icon className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold">{c.t}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="surface-plate rounded-3xl p-7">
          <h2 className="font-display text-2xl font-bold">Send a message</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Catering, bulk orders or feedback — we read everything.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="c-name">Full name</Label>
              <Input
                id="c-name"
                maxLength={60}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5"
              />
              {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="c-phone">Phone number</Label>
              <Input
                id="c-phone"
                inputMode="tel"
                maxLength={16}
                placeholder="0712 345 678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5"
              />
              {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="c-msg">Message</Label>
              <Textarea
                id="c-msg"
                rows={4}
                maxLength={600}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 resize-none"
              />
              {errors.message && <p className="mt-1.5 text-xs text-destructive">{errors.message}</p>}
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
            Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
