import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

// ── HashBack credentials (hardcoded for testing) ────────────────────────────
const HASHBACK_BASE_URL = "https://api.hashback.co.ke";
const HASHBACK_API_KEY = "9851f07892796e5ab74e04b89e6d623e15363438b39213ec4224fa2805c746f5";
const HASHBACK_ACCOUNT_ID = "HP464530";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
  if ((cleaned.startsWith("7") || cleaned.startsWith("1")) && cleaned.length === 9) {
    return `254${cleaned}`;
  }
  return null;
}

export const APIRoute = createAPIFileRoute("/api/hashback/initiate")({
  OPTIONS: async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  },

  POST: async ({ request }) => {
    const addCors = (r: Response) => {
      Object.entries(corsHeaders).forEach(([k, v]) => r.headers.set(k, v));
      return r;
    };

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const rawPhone =
      (typeof body.phone === "string" ? body.phone : undefined) ??
      (typeof body.phoneNumber === "string" ? body.phoneNumber : undefined) ??
      (typeof body.phone_number === "string" ? body.phone_number : undefined) ??
      (typeof body.msisdn === "string" ? body.msisdn : undefined) ??
      null;

    const normalizedPhone = normalizePhoneNumber(rawPhone);
    if (!normalizedPhone) {
      return addCors(
        json({ success: false, message: "Invalid phone number format" }, { status: 400 })
      );
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return addCors(json({ success: false, message: "Invalid amount" }, { status: 400 }));
    }

    const referencePrefix =
      typeof body.referencePrefix === "string" ? body.referencePrefix : "BLAZEBITES";
    const externalReference =
      typeof body.reference === "string"
        ? body.reference
        : `${referencePrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      api_key: HASHBACK_API_KEY,
      account_id: HASHBACK_ACCOUNT_ID,
      amount: String(Math.round(amount)),
      msisdn: normalizedPhone,
      reference: externalReference,
    };

    try {
      const hashbackRes = await fetch(`${HASHBACK_BASE_URL}/initiatestk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await hashbackRes.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!hashbackRes.ok || !data) {
        return addCors(
          json(
            {
              success: false,
              message:
                (typeof data?.message === "string" ? data.message : null) ??
                (typeof data?.error === "string" ? data.error : null) ??
                "HashBack STK initiation failed",
              raw: data,
            },
            { status: hashbackRes.status || 500 }
          )
        );
      }

      const checkoutId =
        (typeof data.CheckoutRequestID === "string" ? data.CheckoutRequestID : null) ??
        (typeof data.checkout_id === "string" ? data.checkout_id : null) ??
        (typeof data.checkoutid === "string" ? data.checkoutid : null) ??
        (typeof data.checkoutId === "string" ? data.checkoutId : null) ??
        (typeof data.MerchantRequestID === "string" ? data.MerchantRequestID : null);

      const isSuccess =
        data.ResponseCode === "0" ||
        data.ResponseCode === 0 ||
        data.success === true ||
        Boolean(checkoutId);

      if (!isSuccess || !checkoutId) {
        return addCors(
          json(
            {
              success: false,
              message:
                (typeof data.CustomerMessage === "string" ? data.CustomerMessage : null) ??
                (typeof data.ResponseDescription === "string" ? data.ResponseDescription : null) ??
                (typeof data.message === "string" ? data.message : null) ??
                "Payment initiation failed",
              raw: data,
            },
            { status: 400 }
          )
        );
      }

      return addCors(
        json({
          success: true,
          checkoutId,
          checkoutRequestId: checkoutId,
          reference: externalReference,
          normalizedPhone,
          message:
            (typeof data.CustomerMessage === "string" ? data.CustomerMessage : null) ??
            (typeof data.ResponseDescription === "string" ? data.ResponseDescription : null) ??
            (typeof data.message === "string" ? data.message : "STK push initiated"),
          raw: data,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment initiation failed";
      return addCors(json({ success: false, message }, { status: 500 }));
    }
  },
});
