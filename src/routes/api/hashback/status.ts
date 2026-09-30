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

function mapHashbackStatus(data: Record<string, unknown>): "paid" | "failed" | "pending" {
  const resultCode = String(
    data.ResultCode ?? data.resultCode ?? data.result_code ?? ""
  ).trim();
  const resultDesc = String(
    data.ResultDesc ?? data.resultDesc ?? data.message ?? ""
  ).toLowerCase();
  const status = String(data.status ?? data.Status ?? "").toLowerCase();

  // ── Explicit success ────────────────────────────────────────────────────────
  if (
    resultCode === "0" ||
    status === "success" ||
    status === "completed" ||
    status === "paid" ||
    resultDesc.includes("success") ||
    resultDesc.includes("processed successfully") ||
    resultDesc.includes("accepted for processing")
  ) {
    return "paid";
  }

  // ── CRITICAL: Code 1037 ("DS timeout user cannot be reached.") is returned by HashBack
  // IMMEDIATELY while the phone prompt is ringing / waiting for PIN entry.
  // It MUST NOT be treated as a failure — keep it pending!
  if (
    resultCode === "1037" ||
    resultDesc.includes("user cannot be reached") ||
    resultDesc.includes("ds timeout")
  ) {
    return "pending";
  }

  const isConclusiveFailure =
    resultCode === "1032" ||
    resultDesc.includes("cancelled by user") ||
    resultDesc.includes("canceled by user") ||
    resultDesc.includes("request cancelled") ||
    resultDesc.includes("insufficient") ||
    resultDesc.includes("wrong pin") ||
    resultDesc.includes("invalid pin") ||
    status === "cancelled" ||
    status === "canceled";

  if (isConclusiveFailure) return "failed";

  // ── Everything else (including non-zero codes while still processing) ────
  return "pending";
}

export const APIRoute = createAPIFileRoute("/api/hashback/status")({
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

    const checkoutId =
      (typeof body.checkoutId === "string" ? body.checkoutId : undefined) ??
      (typeof body.checkoutid === "string" ? body.checkoutid : undefined) ??
      (typeof body.checkoutRequestId === "string" ? body.checkoutRequestId : undefined) ??
      (typeof body.reference === "string" ? body.reference : undefined);

    if (!checkoutId) {
      return addCors(
        json({ status: "error", message: "Missing checkoutId/reference" }, { status: 400 })
      );
    }

    const payload = {
      api_key: HASHBACK_API_KEY,
      account_id: HASHBACK_ACCOUNT_ID,
      checkoutid: checkoutId,
    };

    try {
      const hashbackRes = await fetch(`${HASHBACK_BASE_URL}/transactionstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await hashbackRes.json().catch(() => null)) as Record<
        string,
        unknown
      > | null;

      if (!hashbackRes.ok || !data) {
        // Return pending so the client keeps polling — don't fail on transient API errors
        return addCors(
          json({
            status: "pending",
            message:
              (typeof data?.message === "string" ? data.message : null) ??
              (typeof data?.error === "string" ? data.error : null) ??
              "Status check pending",
            raw: data,
          })
        );
      }

      const mappedStatus = mapHashbackStatus(data);
      const success = mappedStatus === "paid";

      return addCors(
        json({
          success,
          status: mappedStatus,
          // "completed" is what MpesaService polls for — map "paid" → "completed"
          state:
            mappedStatus === "paid"
              ? "completed"
              : mappedStatus === "failed"
                ? "failed"
                : "pending",
          rawStatus: String(
            data.ResultDesc ?? data.status ?? data.ResponseDescription ?? ""
          ),
          resultDesc:
            (typeof data.ResultDesc === "string" ? data.ResultDesc : "") ||
            (typeof data.ResponseDescription === "string" ? data.ResponseDescription : "") ||
            (typeof data.message === "string" ? data.message : ""),
          receiptNumber:
            (typeof data.TransactionReceipt === "string" ? data.TransactionReceipt : null) ??
            (typeof data.TransactionID === "string" ? data.TransactionID : null) ??
            (typeof data.receipt === "string" ? data.receipt : null),
          raw: data,
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Status check failed";
      // Return pending so polling continues — don't prematurely fail on server errors
      return addCors(json({ status: "pending", message }));
    }
  },
});
