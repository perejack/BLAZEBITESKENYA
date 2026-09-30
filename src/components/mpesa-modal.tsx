// MpesaModal — exact implementation from EVILCITIZEN reference project.
// Polling logic: 5 s intervals, 2 min max, 1037/DS-timeout kept as pending.

import { useState, useEffect, useRef } from "react";
import { Loader2, Smartphone, CheckCircle2, X, RefreshCw } from "lucide-react";
import { MpesaService } from "@/lib/mpesa";

type Props = {
  open: boolean;
  amount: number;
  reference: string;
  onClose: () => void;
  onSuccess: (receiptNumber?: string | null) => void;
};

type Stage = "form" | "sending" | "waiting" | "success" | "error";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS  = 120_000; // 2 minutes max

export function MpesaModal({ open, amount, reference, onClose, onSuccess }: Props) {
  const [phone, setPhone]           = useState("");
  const [stage, setStage]           = useState<Stage>("form");
  const [error, setError]           = useState("");
  const [countdown, setCountdown]   = useState(120);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef  = useRef<number>(0);

  // ── cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current)      clearInterval(pollRef.current);
    };
  }, []);

  // reset on close
  useEffect(() => {
    if (!open) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (pollRef.current)      clearInterval(pollRef.current);
      setStage("form");
      setPhone("");
      setError("");
      setCheckoutId(null);
      setCountdown(120);
    }
  }, [open]);

  if (!open) return null;

  // ── helpers ───────────────────────────────────────────────────────────────
  const stopTimers = () => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    if (pollRef.current)      { clearInterval(pollRef.current);      pollRef.current = null; }
  };

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

  // ── start polling HashBack status every 5 s ───────────────────────────────
  const startPolling = (cid: string) => {
    pollStartRef.current = Date.now();
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      // Hard-stop polling after POLL_TIMEOUT_MS
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopTimers();
        setStage("error");
        setError("Payment window expired. Please try again.");
        return;
      }

      const status = await MpesaService.getPaymentStatus(cid);

      if (status === "completed") {
        stopTimers();
        setStage("success");
        setTimeout(() => onSuccess(cid), 1200);
      } else if (status === "failed") {
        stopTimers();
        setStage("error");
        setError("Payment was not completed. Please try again.");
      }
      // "pending" → keep polling silently (includes 1037 / DS timeout)
    }, POLL_INTERVAL_MS);
  };

  // ── initiate STK push ─────────────────────────────────────────────────────
  const startPayment = async () => {
    const formatted = MpesaService.formatPhone(phone);
    if (!formatted || formatted.length !== 12) {
      setError("Enter a valid Safaricom number e.g. 0712 345 678");
      return;
    }
    setError("");
    setStage("sending");

    const result = await MpesaService.initiateSTKPush(
      formatted,
      amount,
      reference,
      "BlazeBites food order"
    );

    if (!result.success || !result.checkoutRequestId) {
      setStage("error");
      setError(result.error ?? "Payment initiation failed. Please try again.");
      return;
    }

    setCheckoutId(result.checkoutRequestId);
    setStage("waiting");
    startCountdown(120);
    startPolling(result.checkoutRequestId);
  };

  // ── retry ─────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    stopTimers();
    setError("");
    setStage("form");
    setCheckoutId(null);
    setCountdown(120);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={stage === "form" ? onClose : undefined}
      />
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

        {/* ── M-PESA header strip ── */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#00A859] to-[#007F3F] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-lg">
                M
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-90">Lipa na M-PESA</p>
                <p className="text-lg font-bold">Pay KES {amount.toLocaleString()}</p>
              </div>
            </div>
            {stage === "form" && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">

          {/* ── FORM ── */}
          {stage === "form" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm">
                <p className="font-semibold text-emerald-900">Ref: {reference}</p>
                <p className="text-emerald-800/80 text-xs mt-0.5">
                  An STK push will be sent to your Safaricom number.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Safaricom phone number
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#00A859]/40"
                  />
                </div>
                {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
              </div>

              <button
                onClick={startPayment}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00A859] to-[#007F3F] text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                Send STK Push
              </button>
              <p className="text-[11px] text-center text-muted-foreground">
                Secure payment processed by Safaricom M-PESA via HashBack.
              </p>
            </div>
          )}

          {/* ── SENDING ── */}
          {stage === "sending" && (
            <div className="py-10 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-[#00A859] animate-spin" />
              <p className="mt-4 font-semibold text-foreground">Initiating payment…</p>
              <p className="text-sm text-muted-foreground mt-1">Connecting to Safaricom</p>
            </div>
          )}

          {/* ── WAITING / POLLING ── */}
          {stage === "waiting" && (
            <div className="py-6 text-center">
              <div className="relative h-20 w-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-4 border-[#00A859] border-t-transparent animate-spin" />
                <Smartphone className="absolute inset-0 m-auto h-8 w-8 text-[#00A859]" />
              </div>

              <p className="mt-5 font-semibold text-foreground">Check your phone</p>
              <p className="text-sm text-muted-foreground mt-1">
                An M-PESA STK push has been sent.<br />
                Enter your PIN to complete payment.
              </p>

              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Waiting · {countdown}s
              </div>

              {checkoutId && (
                <p className="mt-2 text-[10px] text-muted-foreground font-mono">
                  Ref: {checkoutId}
                </p>
              )}

              <button
                onClick={handleRetry}
                className="mt-5 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 mx-auto"
              >
                <RefreshCw className="h-3 w-3" /> Resend STK Push
              </button>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {stage === "success" && (
            <div className="py-10 text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-[#00A859]" />
              </div>
              <p className="mt-4 text-lg font-bold text-foreground">Payment received!</p>
              <p className="text-sm text-muted-foreground mt-1">Your order is confirmed.</p>
            </div>
          )}

          {/* ── ERROR ── */}
          {stage === "error" && (
            <div className="py-10 text-center px-4">
              <div className="h-14 w-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                <X className="h-7 w-7 text-red-500" />
              </div>
              <p className="mt-4 font-semibold text-foreground">Payment failed</p>
              {error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}
              <button
                onClick={handleRetry}
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00A859] to-[#007F3F] text-white font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
