import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from "firebase/app-check";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Protege el endpoint de suscripción al newsletter (newsletter-subscribe)
// contra bots/scripts: reCAPTCHA Enterprise invisible, sin fricción para
// personas reales. Site key pública por diseño (no es secreta, se valida
// del lado del servidor con la Secret Key correspondiente).
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider("6LfLVFgtAAAAAI1XhRAlIAkAYcAVas7W1IoWfBsT"),
  isTokenAutoRefreshEnabled: true,
});

export async function getAppCheckToken(): Promise<string | undefined> {
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch {
    // Si App Check falla (ej. dominio no autorizado en dev local), no
    // bloquear la suscripción — el backend igual aplica límite de tasa.
    return undefined;
  }
}
