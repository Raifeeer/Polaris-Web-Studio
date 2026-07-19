import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken, type AppCheck } from "firebase/app-check";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Protege el endpoint de suscripción al newsletter (newsletter-subscribe)
// contra bots/scripts: reCAPTCHA Enterprise invisible, sin fricción para
// personas reales. Site key pública por diseño (no es secreta, se valida
// del lado del servidor con la Secret Key correspondiente).
//
// Se inicializa PEREZOSAMENTE (solo cuando el newsletter realmente lo pide),
// no al cargar la app. Bug real (19 de julio): inicializarlo de entrada en
// el mismo `app` que usa Firebase Auth hace que el SDK de Auth adjunte un
// token de App Check automáticamente a cada sign-in -- y reCAPTCHA
// Enterprise, aunque su modo sea "invisible", puede escalar a un desafío
// visible (seleccionar imágenes) cuando evalúa una sesión como riesgosa.
// Eso disparaba el captcha visible en /login, que no tiene nada que ver con
// el newsletter. El resto de la seguridad del login (reglas de Firestore,
// límite de tasa por IP en los endpoints públicos, JWT + ownership checks
// en el servidor) sigue intacta -- no dependía de esto.
let appCheckInstance: AppCheck | null = null;
function getAppCheckInstance(): AppCheck {
  if (!appCheckInstance) {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider("6LfLVFgtAAAAAI1XhRAlIAkAYcAVas7W1IoWfBsT"),
      isTokenAutoRefreshEnabled: false,
    });
  }
  return appCheckInstance;
}

export async function getAppCheckToken(): Promise<string | undefined> {
  try {
    const result = await getToken(getAppCheckInstance(), false);
    return result.token;
  } catch {
    // Si App Check falla (ej. dominio no autorizado en dev local), no
    // bloquear la suscripción — el backend igual aplica límite de tasa.
    return undefined;
  }
}
