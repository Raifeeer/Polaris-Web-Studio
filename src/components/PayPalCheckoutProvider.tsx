import type { ReactNode } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const finalClientId = !paypalClientId ? "test" : paypalClientId;

const paypalOptions = {
  clientId: finalClientId,
  currency: "USD",
  intent: "capture",
  "disable-funding": "credit,paylater,venmo",
  "enable-funding": "card",
};

// Solo envuelve las páginas que realmente usan <PayPalButtons> (compra
// directa de Local Lift) -- mismo motivo que Tano-Excursions: no descargar
// el SDK de PayPal (~99KB) en páginas que nunca lo necesitan.
export function PayPalCheckoutProvider({ children }: { children: ReactNode }) {
  return <PayPalScriptProvider options={paypalOptions}>{children}</PayPalScriptProvider>;
}
