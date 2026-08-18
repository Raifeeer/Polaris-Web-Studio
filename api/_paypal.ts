const PAYPAL_ORDER_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;

type PayPalTokenCache = { token: string; expiresAt: number };
let cachedPayPalToken: PayPalTokenCache | null = null;

function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function assertOrderId(orderId: string): string {
  const normalized = orderId.trim();
  if (!PAYPAL_ORDER_ID_RE.test(normalized)) throw new Error("ID de orden PayPal inválido.");
  return normalized;
}

async function parsePayPalResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.details?.[0]?.description || data?.message || data?.error_description;
    throw new Error(detail || `PayPal respondió ${response.status}.`);
  }
  return data;
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Credenciales de PayPal no configuradas.");

  if (cachedPayPalToken && cachedPayPalToken.expiresAt > Date.now()) {
    return cachedPayPalToken.token;
  }

  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await parsePayPalResponse(response);
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("PayPal no devolvió un token de acceso.");
  }

  cachedPayPalToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(30, Number(data.expires_in || 300) - 60) * 1000,
  };
  return cachedPayPalToken.token;
}

export async function paypalCreateOrder(params: {
  amount: number;
  referenceId: string;
  description: string;
}): Promise<{ id: string; status: string }> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: params.referenceId.slice(0, 256),
        description: params.description.slice(0, 127),
        amount: { currency_code: "USD", value: params.amount.toFixed(2) },
      }],
    }),
  });
  const data = await parsePayPalResponse(response);
  if (typeof data.id !== "string" || !data.id) throw new Error("PayPal no devolvió el ID de la orden.");
  return { id: data.id, status: data.status || "CREATED" };
}

export async function paypalGetOrder(orderId: string): Promise<any> {
  const normalized = assertOrderId(orderId);
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders/${encodeURIComponent(normalized)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parsePayPalResponse(response);
}

export async function paypalCaptureOrder(orderId: string): Promise<any> {
  const normalized = assertOrderId(orderId);
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders/${encodeURIComponent(normalized)}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return parsePayPalResponse(response);
}

export function paypalReferenceId(order: any): string {
  return String(order?.purchase_units?.[0]?.reference_id || "");
}

export function paypalOrderAmount(order: any): { value: number; currency: string } | null {
  const capture = order?.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = capture?.amount || order?.purchase_units?.[0]?.amount;
  if (!amount) return null;
  const value = Number(amount.value);
  if (!Number.isFinite(value)) return null;
  return { value, currency: String(amount.currency_code || "") };
}

export function paypalCaptureId(order: any): string | null {
  const id = order?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  return typeof id === "string" && id ? id : null;
}

export async function paypalRefundCapture(captureId: string): Promise<void> {
  const normalized = captureId.trim();
  if (!/^[A-Za-z0-9_-]{4,128}$/.test(normalized)) throw new Error("ID de captura PayPal inválido.");
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/payments/captures/${encodeURIComponent(normalized)}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({}),
  });
  await parsePayPalResponse(response);
}
