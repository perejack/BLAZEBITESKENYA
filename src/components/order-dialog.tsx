import { CheckCircle2, Download, ShoppingCart, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MpesaModal } from "@/components/mpesa-modal";
import { useCart } from "@/lib/cart";
import { formatKsh, splitPrice, type MenuItem, type MenuVariant } from "@/lib/menu";
import { downloadReceipt, type ReceiptData } from "@/lib/receipt";

type Step = "item" | "details" | "success";
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

export function OrderDialog({
  open,
  onOpenChange,
  item,
  variant,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: MenuItem | null;
  variant?: MenuVariant;
}) {
  const { add } = useCart();
  const [step, setStep] = useState<Step>("item");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errs>({});
  const [mpesaOpen, setMpesaOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const price = item ? (variant ? variant.price : item.price!) : 0;
  const { food, tin } = item ? splitPrice(price) : { food: 0, tin: 0 };

  const reference = `BB-${Date.now().toString().slice(-8)}`;

  useEffect(() => {
    if (open) {
      setStep("item");
      setErrors({});
      setReceipt(null);
      setFullName("");
      setPhone("");
      setNote("");
      setMpesaOpen(false);
    }
  }, [open]);

  if (!item) return null;

  const handleAddToCart = () => {
    add(item, variant);
    toast.success(`${item.name} added to your bag`);
    onOpenChange(false);
  };

  const validateDetails = () => {
    const e: Errs = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name (at least 3 characters).";
    if (fullName.trim().length > 60) e.fullName = "Name is too long.";
    if (!PHONE_RE.test(phone.trim()))
      e.phone = "Enter a valid Kenyan number, e.g. 0712 345 678.";
    if (note.length > 200) e.note = "Keep the note under 200 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;
    // Open the real M-PESA modal
    setMpesaOpen(true);
  };

  const handlePaymentSuccess = (mpesaCode?: string | null) => {
    setMpesaOpen(false);
    const now = new Date();
    setReceipt({
      receiptNo: reference,
      mpesaCode: mpesaCode ?? "S" + randomCode(),
      date: now.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
      fullName: fullName.trim(),
      phone: normalizePhone(phone),
      ...(note.trim() ? { note: note.trim() } : {}),
      lines: [
        {
          key: item.id + (variant ? "-" + variant.id : ""),
          id: item.id,
          name: item.name + (variant ? ` (${variant.label})` : ""),
          image: item.image,
          qty: 1,
          food,
          tin,
          unit: price,
        } as any,
      ],
      subtotal: food,
      packing: tin,
      total: price,
    });
    setStep("success");
    toast.success("Payment received. Thank you!");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">

          {/* ── STEP 1: Item preview ── */}
          {step === "item" && (
            <div>
              <div className="eyebrow">Place an order</div>
              <DialogTitle className="mt-2 font-display text-2xl">{item.name}</DialogTitle>
              <DialogDescription className="mt-1">{item.description}</DialogDescription>

              <div className="mt-4 overflow-hidden rounded-xl">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-44 w-full object-cover"
                />
              </div>

              <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Item price</span>
                  <span className="text-foreground">{formatKsh(food)}</span>
                </div>
                {tin > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packing</span>
                    <span className="text-foreground">{formatKsh(tin)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatKsh(price)}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full rounded-full"
                  onClick={() => setStep("details")}
                >
                  <Smartphone className="size-4" /> Order now · {formatKsh(price)}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full rounded-full"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="size-4" /> Add to cart
                </Button>
              </div>
              <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                Pay by M-PESA · receipt available instantly
              </p>
            </div>
          )}

          {/* ── STEP 2: Customer details ── */}
          {step === "details" && (
            <div>
              <div className="eyebrow">Your details</div>
              <DialogTitle className="mt-2 font-display text-2xl">Complete your order</DialogTitle>
              <DialogDescription className="mt-1">
                We need your name and phone number to process and hand over your order.
              </DialogDescription>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="od-fullName">Full name</Label>
                  <Input
                    id="od-fullName"
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
                  <Label htmlFor="od-phone">Phone number (M-PESA)</Label>
                  <Input
                    id="od-phone"
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
                  <Label htmlFor="od-note">Special instructions (optional)</Label>
                  <Textarea
                    id="od-note"
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

              <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{item.name}{variant ? ` (${variant.label})` : ""}</span>
                  <span className="text-foreground">{formatKsh(food)}</span>
                </div>
                {tin > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Packing</span>
                    <span className="text-foreground">{formatKsh(tin)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatKsh(price)}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button variant="secondary" className="rounded-full" onClick={() => setStep("item")}>
                  Back
                </Button>
                <Button className="flex-1 rounded-full" size="lg" onClick={validateDetails}>
                  <Smartphone className="size-4" /> Pay with M-PESA
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Success receipt ── */}
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
                <Row label="Item" value={formatKsh(receipt.subtotal)} />
                {receipt.packing > 0 && <Row label="Packing" value={formatKsh(receipt.packing)} />}
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
        amount={price}
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
