import React, { createContext, useContext, useState, useEffect } from "react";

// Firebase se carga de forma PEREZOSA (11 de agosto). Medido sobre el build
// real de producción: la landing descargaba y ejecutaba 1213 KB de JS, de los
// cuales `vendor-firebase` son 542 KB -- el 45%, el chunk más grande de todos --
// y se cargaba en CADA página por este import de arriba, aunque un visitante
// anónimo de la landing nunca toca autenticación. Eso es parte del "va lento
// al principio": ese JS hay que parsearlo y ejecutarlo antes de nada.
//
// El login real de este portal NO depende de Firebase para arrancar: la sesión
// se restaura con un token propio en localStorage (`portal_token`) contra
// /api/auth/me. Firebase solo hace falta para (a) refrescar el ID token de una
// sesión que YA existe y (b) el propio login/logout. Los tres casos son bajo
// acción del usuario o con sesión previa, así que se cargan cuando de verdad
// se necesitan, no en el arranque de cada visita.
async function loadFirebaseAuth() {
  const [{ auth }, fbAuth] = await Promise.all([
    import("../lib/firebase"),
    import("firebase/auth"),
  ]);
  return { auth, ...fbAuth };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  companyName?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem("portal_token");
    if (savedToken) {
      setToken(savedToken);
      fetchUserInfo(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // El SDK de Firebase renueva el ID token internamente antes de que expire
    // (cada ~60 min); este listener captura ese refresh y lo sincroniza con el
    // token que usamos para autenticar contra nuestra propia API, evitando que
    // una sesión activa termine cerrándose sola por expiración del token.
    //
    // Solo tiene sentido si YA hay una sesión guardada: sin `portal_token` no
    // hay nada que refrescar, así que un visitante anónimo (el caso normal en
    // la landing) nunca paga los 542 KB de Firebase. Ver nota arriba.
    if (!localStorage.getItem("portal_token")) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    loadFirebaseAuth()
      .then(({ auth, onIdTokenChanged }) => {
        if (cancelled) return;
        unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) return;
          try {
            const freshToken = await firebaseUser.getIdToken();
            localStorage.setItem("portal_token", freshToken);
            setToken(freshToken);
          } catch (err) {
            console.error("Error al renovar el ID token de Firebase:", err);
          }
        });
      })
      .catch((err) => console.error("No se pudo cargar Firebase Auth:", err));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const emailClean = email.trim().toLowerCase();
      let firebaseUserCred = null;
      let fbErrorMsg = null;

      // Carga perezosa: recién acá, cuando el usuario de verdad inicia sesión,
      // se descarga el SDK de Firebase (ver nota al inicio del archivo).
      const { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } =
        await loadFirebaseAuth();

      try {
        // 1. Try to login via Firebase Auth first
        firebaseUserCred = await signInWithEmailAndPassword(auth, emailClean, password);
      } catch (fbErr: any) {
        console.warn("Firebase Auth login failed, checking fallback details:", fbErr.code);
        fbErrorMsg = fbErr.message;
        // If it's a critical error not related to auth, or is password/user error, fallback to Express
      }

      if (firebaseUserCred) {
        const idToken = await firebaseUserCred.user.getIdToken();
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("portal_token", idToken);
          setToken(idToken);
          setUser(data.user);
          return { success: true };
        }
        // Si el servidor rechaza el ID token de Firebase (p. ej. no se pudieron
        // verificar las claves de Google), NO bloqueamos al usuario: continuamos
        // al login local contra la base de datos, que emite un token firmado propio.
      }

      // 2. Fallback to Express Local DB login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailClean, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Logged in successfully via server DB.
        // Let's dynamically create the user in Firebase Auth so they can login via Firebase next time!
        try {
          const localUserCred = await createUserWithEmailAndPassword(auth, emailClean, password);
          const idToken = await localUserCred.user.getIdToken();
          localStorage.setItem("portal_token", idToken);
          setToken(idToken);
          setUser(data.user);
          return { success: true };
        } catch (createErr: any) {
          if (createErr.code === "auth/email-already-in-use") {
            try {
              // User already exists in Firebase Auth, let's sign in to get a valid token
              const signInCred = await signInWithEmailAndPassword(auth, emailClean, password);
              const idToken = await signInCred.user.getIdToken();
              localStorage.setItem("portal_token", idToken);
              setToken(idToken);
              setUser(data.user);
              return { success: true };
            } catch (signInErr: any) {
              console.warn("Firebase Auth user already exists but password/sign-in failed. Falling back to custom session:", signInErr);
            }
          } else {
            console.error("On-the-fly Firebase user creation failed (will fallback to custom session):", createErr);
          }
          // If creation fails (e.g. password too short for Firebase, or network issue), use custom token fallback
          localStorage.setItem("portal_token", data.token);
          setToken(data.token);
          setUser(data.user);
          return { success: true };
        }
      } else {
        // Fallback also failed or returned invalid credentials
        const displayError = data.error || fbErrorMsg || "Credenciales incorrectas";
        return { success: false, error: displayError };
      }
    } catch (err) {
      console.error("Login request failed:", err);
      return { success: false, error: "Error de conexión, intente más tarde." };
    }
  };

  const logout = () => {
    localStorage.removeItem("portal_token");
    setToken(null);
    setUser(null);
    setLoading(false);
    // Explicitly sign out of client-side Firebase Auth as well
    loadFirebaseAuth()
      .then(({ auth, signOut }) => signOut(auth))
      .catch((err) => console.error("Error signing out of Firebase Auth:", err));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
