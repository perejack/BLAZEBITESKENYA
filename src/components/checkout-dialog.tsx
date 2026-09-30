import { CheckCircle2, Download, Loader2, RefreshCw, Smartphone, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type CartLine } from "@/lib/cart";
import { formatKsh } from "@/lib/menu";
import { MpesaService } from "@/lib/mpesa";
import { downloadReceipt, type ReceiptData } from "@/lib/receipt";

type Step = "details" | "sending" | "waiting" | "success" | "error";
type Errs = { fullName?: string; phone?: string; note?: string };

const PHONE_RE = /^(?:\+?254|0)(7|1)\d{8}$/;

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 120_000; // 2 minutes max

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
  const [paymentError, setPaymentError] = useState("");
  const [countdown, setCountdown] = useState(120);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const snapshot = useRef<CartLine[]>([]);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);
  const referenceRef = useRef<string>(`BB-${Date.now().toString().slice(-8)}`);

  const stopTimers = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopTimers();
  }, []);

  useEffect(() => {
    if (open) {
      stopTimers();
      setStep("details");
      setErrors({});
      setPaymentError("");
      setReceipt(null);
      setFullName("");
      setPhone("");
      setNote("");
      setCheckoutId(null);
      setCountdown(120);
      referenceRef.current = `BB-${Date.now().toString().slice(-8)}`;
    } else {
      stopTimers();
    }
  }, [open]);

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const startPolling = (cid: string) => {
    pollStartRef.current = Date.now();
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopTimers();
        setStep("error");
        setPaymentError("Payment request timed out. Please try again.");
        return;
      }

      const status = await MpesaService.getPaymentStatus(cid);

      if (status === "completed") {
        stopTimers();
        const now = new Date();
        const paid = { subtotal, packing, total };
        setReceipt({
          receiptNo: referenceRef.current,
          mpesaCode: cid.startsWith("BB-") ? "S" + cid.slice(-9) : cid,
          date: now.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" }),
          fullName: fullName.trim(),
          phone: MpesaService.formatPhone(phone),
          ...(note.trim() ? { note: note.trim() } : {}),
          lines: snapshot.current,
          ...paid,
        });
        setStep("success");
        clear();
        toast.success("Payment received. Thank you!");
      } else if (status === "failed") {
        stopTimers();
        setStep("error");
        setPaymentError("Payment was cancelled or failed on your phone. Please try again.");
      }
    }, POLL_INTERVAL_MS);
  };

  const startPayment = async () => {
    const e: Errs = {};
    if (fullName.trim().length < 3) e.fullName = "Enter your full name (at least 3 characters).";
    if (fullName.trim().length > 60) e.fullName = "Name is too long.";
    if (!PHONE_RE.test(phone.trim()))
      e.phone = "Enter a valid Safaricom number e.g. 0712 345 678";
    if (note.length > 200) e.note = "Keep note under 200 characters.";
    setErrors(e);
    if (Object.keys(e).length) return;

    snapshot.current = lines;
    setStep("sending");
    setPaymentError("");

    const formattedPhone = MpesaService.formatPhone(phone);
    const result = await MpesaService.initiateSTKPush(
      formattedPhone,
      total,
      referenceRef.current,
      "BlazeBites Cart Order"
    );

    if (!result.success || !result.checkoutRequestId) {
      setStep("error");
      setPaymentError(result.error ?? "Failed to send STK push. Please check your number and try again.");
      return;
    }

    setCheckoutId(result.checkoutRequestId);
    setStep("waiting");
    startCountdown(120);
    startPolling(result.checkoutRequestId);
  };

  const handleRetry = () => {
    stopTimers();
    setStep("details");
    setPaymentError("");
    setCheckoutId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {/* ── STEP 1: Details & Phone Number Input ── */}
        {step === "details" && (
          <div>
            <div className="eyebrow">Checkout</div>
            <DialogTitle className="mt-2 font-display text-2xl">Complete your order</DialogTitle>
            <DialogDescription className="mt-1">
              Enter your name and Safaricom number to receive the M-PESA STK push prompt.
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
                {errors.fullName && <p className="mt-1.5 text-xs text-destructive">{errors.fullName}</p>}
              </div>

              <div>
                <Label htmlFor="checkout-phone">Safaricom Phone Number (M-PESA)</Label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={16}
                  value={phone}
                  placeholder="0712 345 678"
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5"
                />
                {errors.phone ? (
                  <p className="mt-1.5 text-xs text-destructive">{errors.phone}</p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    An M-PESA PIN prompt will appear on this phone.
                  </p>
                )}
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

            <Button className="mt-5 w-full rounded-full bg-[#00A859] hover:bg-[#008f4c] text-white" size="lg" onClick={startPayment}>
              <Smartphone className="size-4" /> Pay {formatKsh(total)} with M-PESA
            </Button>
          </div>
        )}

        {/* ── STEP 2: Sending ── */}
        {step === "sending" && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto size-12 animate-spin text-[#00A859]" />
            <h3 className="mt-4 font-display text-xl font-bold">Initiating M-PESA payment…</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">Connecting to Safaricom HashBack gateway</p>
          </div>
        )}

        {/* ── STEP 3: Waiting / Polling ── */}
        {step === "waiting" && (
          <div className="py-8 text-center">
            <div className="relative mx-auto grid size-20 place-items-center">
              <span className="absolute inset-0 rounded-full border-4 border-[#00A859]/20" />
              <span className="absolute inset-0 rounded-full border-4 border-[#00A859] border-t-transparent animate-spin" />
              <Smartphone className="size-8 text-[#00A859]" />
            </div>

            <h3 className="mt-5 font-display text-2xl font-bold">Check your phone</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              An M-PESA request for <strong className="text-foreground">{formatKsh(total)}</strong> has been sent to{" "}
              <strong className="text-foreground">{MpesaService.formatPhone(phone)}</strong>.
              <br />
              Enter your M-PESA PIN to complete payment.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-500">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              Waiting for PIN · {countdown}s
            </div>

            <p className="mt-3 font-mono text-[10px] text-muted-foreground">Ref: {referenceRef.current}</p>

            <div className="mt-6 flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleRetry} className="text-xs text-muted-foreground hover:text-foreground">
                <RefreshCw className="mr-1.5 size-3.5" /> Re-enter phone number
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Success receipt ── */}
        {step === "success" && receipt && (
          <div>
            <DialogTitle className="sr-only">Payment successful</DialogTitle>
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-14 text-[#00A859]" />
              <h2 className="mt-4 font-display text-3xl font-bold">Payment received!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatKsh(receipt.total)} paid via M-PESA. Your order is confirmed.
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
              <Button className="flex-1 rounded-full" size="lg" onClick={() => downloadReceipt(receipt)}>
                <Download className="size-4" /> Download receipt
              </Button>
              <Button variant="secondary" className="rounded-full" size="lg" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Error ── */}
        {step === "error" && (
          <div className="py-8 text-center px-2">
            <XCircle className="mx-auto size-14 text-destructive" />
            <h3 className="mt-4 font-display text-2xl font-bold">Payment failed</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{paymentError || "The transaction could not be completed."}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" className="rounded-full" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="rounded-full bg-[#00A859] hover:bg-[#008f4c] text-white" onClick={handleRetry}>
                <RefreshCw className="mr-1.5 size-4" /> Try Again
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
