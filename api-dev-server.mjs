// Local dev API server — serves /api/hashback/* on port 3000
// This lets vite proxy (/api → port 3000) hit the real HashBack endpoints in dev.
// Run with: node api-dev-server.mjs

import http from "http";

const PORT = 3000;

// ─── Inline handlers (same logic as api/hashback/*.js) ────────────────────────

const HASHBACK_BASE_URL = "https://api.hashback.co.ke";
const HASHBACK_API_KEY = "9851f07892796e5ab74e04b89e6d623e15363438b39213ec4224fa2805c746f5";
const HASHBACK_ACCOUNT_ID = "HP464530";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function normalizePhone(phone) {
  if (!phone) return null;
  const c = String(phone).replace(/\D/g, "");
  if (c.startsWith("0") && c.length === 10) return `254${c.slice(1)}`;
  if (c.startsWith("254") && c.length === 12) return c;
  if ((c.startsWith("7") || c.startsWith("1")) && c.length === 9) return `254${c}`;
  return null;
}

function mapStatus(data) {
  const rc = String(data.ResultCode ?? data.resultCode ?? "").trim();
  const rd = String(data.ResultDesc ?? data.resultDesc ?? data.message ?? "").toLowerCase();
  const st = String(data.status ?? "").toLowerCase();
  if (rc === "0" || ["success","completed","paid"].includes(st) || rd.includes("success")) return "paid";
  if (rc === "1037" || rd.includes("user cannot be reached") || rd.includes("ds timeout")) return "pending";
  if (rc === "1032" || rd.includes("cancelled by user") || rd.includes("insufficient") || rd.includes("wrong pin") || ["cancelled","canceled"].includes(st)) return "failed";
  return "pending";
}

async function readBody(req) {
  return new Promise((res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { res(JSON.parse(raw)); } catch { res({}); }
    });
  });
}

function reply(res, status, data) {
  const body = JSON.stringify(data);
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(body);
}

// ─── HTTP Server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url?.split("?")[0];

  // ── POST /api/hashback/initiate ────────────────────────────────────────────
  if (url === "/api/hashback/initiate" && req.method === "POST") {
    const body = await readBody(req);
    const phone = normalizePhone(body.phone ?? body.phoneNumber ?? body.phone_number);
    if (!phone) return reply(res, 400, { success: false, message: "Invalid phone number" });
    const amount = Number(body.amount);
    if (!amount || amount <= 0) return reply(res, 400, { success: false, message: "Invalid amount" });
    const reference = body.reference ?? `BLAZEBITES-${Date.now()}`;

    try {
      const r = await fetch(`${HASHBACK_BASE_URL}/initiatestk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: HASHBACK_API_KEY, account_id: HASHBACK_ACCOUNT_ID, amount: String(Math.round(amount)), msisdn: phone, reference }),
      });
      const data = await r.json().catch(() => null);
      const checkoutId = data?.CheckoutRequestID ?? data?.checkout_id ?? data?.checkoutid ?? data?.checkoutId ?? data?.MerchantRequestID ?? null;
      const ok = data?.ResponseCode === "0" || data?.ResponseCode === 0 || data?.success === true || Boolean(checkoutId);
      if (!ok || !checkoutId) return reply(res, 400, { success: false, message: data?.CustomerMessage ?? data?.message ?? "STK initiation failed", raw: data });
      return reply(res, 200, { success: true, checkoutId, checkoutRequestId: checkoutId, reference, message: data?.CustomerMessage ?? "STK push sent", raw: data });
    } catch (e) {
      return reply(res, 500, { success: false, message: e.message });
    }
  }

  // ── POST /api/hashback/status ──────────────────────────────────────────────
  if (url === "/api/hashback/status" && req.method === "POST") {
    const body = await readBody(req);
    const cid = body.checkoutId ?? body.checkoutid ?? body.checkoutRequestId ?? body.reference;
    if (!cid) return reply(res, 400, { status: "error", message: "Missing checkoutId" });

    try {
      const r = await fetch(`${HASHBACK_BASE_URL}/transactionstatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: HASHBACK_API_KEY, account_id: HASHBACK_ACCOUNT_ID, checkoutid: cid }),
      });
      const data = await r.json().catch(() => null);
      if (!r.ok || !data) return reply(res, 200, { status: "pending", message: "Status pending" });
      const mapped = mapStatus(data);
      return reply(res, 200, {
        success: mapped === "paid",
        status: mapped,
        state: mapped === "paid" ? "completed" : mapped,
        rawStatus: String(data.ResultDesc ?? data.status ?? ""),
        resultDesc: String(data.ResultDesc ?? data.ResponseDescription ?? data.message ?? ""),
        receiptNumber: data.TransactionReceipt ?? data.TransactionID ?? null,
        raw: data,
      });
    } catch (e) {
      return reply(res, 200, { status: "pending", message: e.message });
    }
  }

  // 404
  reply(res, 404, { message: `No handler for ${req.method} ${url}` });
});

server.listen(PORT, () => {
  console.log(`\n✅  HashBack API server running at http://localhost:${PORT}`);
  console.log(`   /api/hashback/initiate  — STK push`);
  console.log(`   /api/hashback/status    — polling\n`);
});
