import { getRemoteConfig } from "firebase-admin/remote-config";
import { firebaseApp } from "./server-db.js";

// Lee offer_active/offer_discount_percent de Firebase Remote Config (mismo
// template que ya consumen quote-pdf/proposal-send/proposal-followup-send
// en Meridian) -- así la oferta de lanzamiento se prende/apaga desde la
// consola de Firebase sin redeploy, y el portal (facturas de traspaso/BD,
// contract-pdf) queda consistente con lo que el cliente ya vio en su
// cotización/propuesta.
//
// server.ts es un proceso de larga vida (a diferencia de las Cloud
// Functions serverless de Meridian, que cachean por invocación) -- acá se
// refresca en segundo plano cada 5 min y resolveContractPricing() lee el
// valor cacheado de forma síncrona, sin bloquear cada request.
let offerConfigCache = { offerActive: true, offerDiscountPercent: 25 };
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

async function refreshOfferConfig(): Promise<void> {
  try {
    const template = await getRemoteConfig(firebaseApp).getTemplate();
    const active = template.parameters?.offer_active?.defaultValue;
    const percent = template.parameters?.offer_discount_percent?.defaultValue;
    offerConfigCache = {
      offerActive: active && "value" in active ? active.value === "true" : offerConfigCache.offerActive,
      offerDiscountPercent: percent && "value" in percent ? Number(percent.value) : offerConfigCache.offerDiscountPercent,
    };
  } catch (err) {
    console.error("refreshOfferConfig: no se pudo leer Remote Config, se mantiene el valor cacheado", err);
  }
}

export function getOfferConfig(): { offerActive: boolean; offerDiscountPercent: number } {
  return offerConfigCache;
}

// Primer fetch al levantar el proceso (no bloqueante) + refresco periódico.
void refreshOfferConfig();
setInterval(() => void refreshOfferConfig(), REFRESH_INTERVAL_MS);
