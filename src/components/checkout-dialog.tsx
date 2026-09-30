import { CheckCircle2, Download, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MpesaModal } from "@/components/mpesa-modal";
import { useCart, type CartLine } from "@/lib/cart";
import { formatKsh } from "@/lib/menu";
import { downloadReceipt, type ReceiptData } from "@/lib/receipt";

type Step = "details" | "success";

type Errs = { fullName?: string; phone?: string; note?: string };

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
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const snapshot = useRef<CartLine[]>([]);

  const reference = `BB-${Date.now().toString().slice(-8)}`;

  useEffect(() => {
    if (open) {
      setStep("details");
      setErrors({});
      setReceipt(null);
      setMpesaOpen(false);
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
    snapshot.current = lines;
    setMpesaOpen(true);
  };

  const handlePaymentSuccess = (mpesaCode?: string | null) => {
    setMpesaOpen(false);
    const now = new Date();
    const paid = { subtotal, packing, total };
    setReceipt({
      receiptNo: reference,
      mpesaCode: mpesaCode ?? "S" + randomCode(),
      date: now.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
      fullName: fullName.trim(),
      phone: normalizePhone(phone),
      ...(note.trim() ? { note: note.trim() } : {}),
      lines: snapshot.current,
      ...paid,
    });
    setStep("success");
    clear();
    toast.success("Payment received. Thank you!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {step === "details" && (
            <div>
              <div className="eyebrow">Order details</div>
              <DialogTitle className="mt-2 font-display text-2xl">Complete your order</DialogTitle>
              <DialogDescription className="mt-1">
                We need your name and phone number to process and hand over your order.
              </DialogDescription>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="checkout-fullName">Full name</Label>
                  <Input
                    id="checkout-fullName"
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
                  <Label htmlFor="checkout-phone">Phone number (M-PESA)</Label>
                  <Input
                    id="checkout-phone"
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
                  <Label htmlFor="checkout-note">Special instructions (optional)</Label>
                  <Textarea
                    id="checkout-note"
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
                <Smartphone className="size-4" /> Pay {formatKsh(total)} with M-PESA
              </Button>
            </div>
          )}

          {step === "success" && receipt && (
            <div>
              <DialogTitle className="sr-only">Payment successful</DialogTitle>
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-14 text-success" />
                <h2 className="mt-4 font-display text-3xl font-bold">Payment received!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatKsh(receipt.total)} paid via M-PESA. Your order is being processed.
                </p>
              </div>

              <dl className="mt-6 space-y-2.5 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                <Row label="Receipt no." value={receipt.receiptNo} />
                <Row label="M-PESA code" value={receipt.mpesaCode} />
                <Row label="Name" value={receipt.fullName} />
                <Row label="Phone" value={receipt.phone} />
                <Row label="Items subtotal" value={formatKsh(receipt.subtotal)} />
                <Row label="Packing" value={formatKsh(receipt.packing)} />
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

      {/* ── Real HashBack M-PESA STK Modal ── */}
      <MpesaModal
        open={mpesaOpen}
        amount={total}
        reference={reference}
        onClose={() => setMpesaOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
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
        <span>Items subtotal</span>
        <span className="text-foreground">{formatKsh(subtotal)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        <span>Packing</span>
        <span className="text-foreground">{formatKsh(packing)}</span>
      </div>
      <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="text-primary">{formatKsh(total)}</span>
      </div>
    </div>
  );
}
