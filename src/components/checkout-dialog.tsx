import { CheckCircle2, Download, Loader2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type CartLine } from "@/lib/cart";
import { formatKsh } from "@/lib/menu";
import { downloadReceipt, type ReceiptData } from "@/lib/receipt";

type Step = "details" | "pay" | "pushing" | "success";

type Errs = { fullName?: string; phone?: string; payPhone?: string; note?: string };

const PHONE_RE = /^(?:\+?254|0)(7|1)\d{8}$/;

function normalizePhone(v: string) {
  const digits = v.replace(/[^\d]/g, "");
  if (digits.startsWith("254")) return "+" + digits;
  if (digits.startsWith("0")) return "+254" + digits.slice(1);
  return "+254" + digits;
}

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

export function CheckoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { lines, subtotal, packing, total, clear } = useCart();
  const [step, setStep] = useState<Step>("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [seconds, setSeconds] = useState(18);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const snapshot = useRef<CartLine[]>([]);

  useEffect(() => {
    if (open) {
      setStep("details");
      setErrors({});
      setReceipt(null);
    }
  }, [open]);

  const validateDetails = () => {
    const e: Errs = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name (at least 3 characters).";
    if (fullName.trim().length > 60) e.fullName = "Name is too long.";
    if (!PHONE_RE.test(phone.trim()))
      e.phone = "Enter a valid Kenyan number, e.g. 0712 345 678.";
    if (note.length > 200) e.note = "Keep the note under 200 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setPayPhone(phone);
    setStep("pay");
  };

  const startPush = () => {
    if (!PHONE_RE.test(payPhone.trim())) {
      setErrors({ payPhone: "Enter the M-PESA number to be charged." });
      return;
    }
    setErrors({});
    snapshot.current = lines;
    const paid = { subtotal, packing, total };
    setStep("pushing");
    setSeconds(18);

    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    setTimeout(() => {
      clearInterval(tick);
      const now = new Date();
      setReceipt({
        receiptNo: "BB-" + now.getTime().toString().slice(-8),
        mpesaCode: "S" + randomCode(),
        date: now.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
        fullName: fullName.trim(),
        phone: normalizePhone(payPhone),
        ...(note.trim() ? { note: note.trim() } : {}),
        lines: snapshot.current,
        ...paid,
      });
      setStep("success");
      clear();
      toast.success("Payment received. Karibu!");
    }, 6200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {step === "details" && (
          <div>
            <div className="eyebrow">Order information</div>
            <DialogTitle className="mt-2 font-display text-2xl">Who are we cooking for?</DialogTitle>
            <DialogDescription className="mt-1">
              We only need your name and phone number to prepare and hand over your order.
            </DialogDescription>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  maxLength={60}
                  placeholder="e.g. Amina Wanjiru"
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5"
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  maxLength={16}
                  value={phone}
                  placeholder="0712 345 678"
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5"
                />
                {errors.phone && <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="note">Note for the kitchen (optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  maxLength={200}
                  placeholder="Extra chilli, no onions…"
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1.5 resize-none"
                  rows={2}
                />
                {errors.note && <p className="mt-1.5 text-xs text-destructive">{errors.note}</p>}
              </div>
            </div>

            <OrderTotals subtotal={subtotal} packing={packing} total={total} />

            <Button className="mt-5 w-full rounded-full" size="lg" onClick={validateDetails}>
              Continue to payment
            </Button>
          </div>
        )}

        {step === "pay" && (
          <div>
            <div className="eyebrow">M-PESA</div>
            <DialogTitle className="mt-2 font-display text-2xl">Pay {formatKsh(total)}</DialogTitle>
            <DialogDescription className="mt-1">
              Confirm the number to receive the STK push prompt. A PIN request will appear on that
              phone.
            </DialogDescription>

            <div className="mt-6">
              <Label htmlFor="payPhone">M-PESA number</Label>
              <Input
                id="payPhone"
                inputMode="tel"
                maxLength={16}
                value={payPhone}
                onChange={(e) => setPayPhone(e.target.value)}
                className="mt-1.5"
              />
              {errors.payPhone && (
                <p className="mt-1.5 text-xs text-destructive">{errors.payPhone}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Paying as {fullName.trim() || "guest"} · charged to {normalizePhone(payPhone)}
              </p>
            </div>

            <OrderTotals subtotal={subtotal} packing={packing} total={total} />

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="rounded-full" onClick={() => setStep("details")}>
                Back
              </Button>
              <Button className="flex-1 rounded-full" size="lg" onClick={startPush}>
                <Smartphone className="size-4" /> Send STK push
              </Button>
            </div>
          </div>
        )}

        {step === "pushing" && (
          <div className="py-8 text-center">
            <DialogTitle className="sr-only">Waiting for M-PESA payment</DialogTitle>
            <div className="relative mx-auto grid size-24 place-items-center">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ember-pulse" />
              <Loader2 className="size-10 animate-spin text-primary" />
            </div>
            <h2 className="mt-6 font-display text-2xl font-bold">Check your phone</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              An M-PESA request for <strong className="text-foreground">{formatKsh(total)}</strong>{" "}
              has been sent to {normalizePhone(payPhone)}. Enter your M-PESA PIN to authorise the
              payment.
            </p>
            <p className="mt-5 text-xs uppercase tracking-widest text-muted-foreground">
              Request expires in {seconds}s
            </p>
          </div>
        )}

        {step === "success" && receipt && (
          <div>
            <DialogTitle className="sr-only">Payment successful</DialogTitle>
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-14 text-success" />
              <h2 className="mt-4 font-display text-3xl font-bold">Payment received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatKsh(receipt.total)} paid via M-PESA. Your order is on the grill.
              </p>
            </div>

            <dl className="mt-6 space-y-2.5 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
              <Row label="Receipt no." value={receipt.receiptNo} />
              <Row label="M-PESA code" value={receipt.mpesaCode} />
              <Row label="Name" value={receipt.fullName} />
              <Row label="Phone" value={receipt.phone} />
              <Row label="Food subtotal" value={formatKsh(receipt.subtotal)} />
              <Row label="Packing tins" value={formatKsh(receipt.packing)} />
              <div className="flex justify-between border-t border-border pt-2.5 font-semibold">
                <dt>Total paid</dt>
                <dd className="text-primary">{formatKsh(receipt.total)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1 rounded-full"
                size="lg"
                onClick={() => downloadReceipt(receipt)}
              >
                <Download className="size-4" /> Download receipt
              </Button>
              <Button
                variant="secondary"
                className="rounded-full"
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function OrderTotals({
  subtotal,
  packing,
  total,
}: {
  subtotal: number;
  packing: number;
  total: number;
}) {
  return (
    <div className="mt-6 space-y-2 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
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
  );
}
