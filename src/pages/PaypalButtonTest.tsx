import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Navbar from "../components/Navbar";

export default function PaypalButtonTest() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTE: Inyecta directamente el client id aquí para esta prueba, 
  // o configúralo en .env como VITE_PAYPAL_CLIENT_ID
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-md bg-[var(--color-surface-elevated)] rounded-xl shadow-lg border border-[var(--color-border-subtle)] p-8">
          <h2 className="text-2xl font-bold mb-4 text-center text-[var(--color-text-primary)]">Test de Pago ($3 USD)</h2>
          
          {success ? (
            <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 p-4 rounded-lg text-center mt-4">
              ¡Pago completado con éxito!
            </div>
          ) : (
            <div className="mt-8">
              <PayPalScriptProvider options={{ clientId: clientId, currency: "USD", intent: "capture" }}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(data, actions) => {
                    return actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [
                        {
                          amount: {
                            currency_code: "USD",
                            value: "3.00",
                          },
                          description: "Prueba de pago $3 USD (Business Test)",
                        },
                      ],
                    });
                  }}
                  onApprove={(data, actions) => {
                    return actions.order!.capture().then((details) => {
                      const name = details.payer?.name?.given_name;
                      console.log("Transacción completada por " + name);
                      setSuccess(true);
                    });
                  }}
                  onError={(err) => {
                    console.error("PayPal Checkout onError", err);
                    setError("Ocurrió un error al procesar el pago o cancelaste la operación.");
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}

          {error && <div className="text-red-500 text-center mt-4 text-sm">{error}</div>}
          
          <p className="text-xs text-[var(--color-text-tertiary)] text-center mt-6">
            Página temporal para pruebas de PayPal Business.
          </p>
        </div>
      </main>
    </div>
  );
}
