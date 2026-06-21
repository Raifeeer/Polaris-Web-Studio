import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onIdTokenChanged } from "firebase/auth";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "client";
  companyName?: string;
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
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return;
      try {
        const freshToken = await firebaseUser.getIdToken();
        localStorage.setItem("portal_token", freshToken);
        setToken(freshToken);
      } catch (err) {
        console.error("Error al renovar el ID token de Firebase:", err);
      }
    });
    return () => unsubscribe();
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
          console.error("On-the-fly Firebase user creation failed (will fallback to custom session):", createErr);
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
    try {
      signOut(auth);
    } catch (err) {
      console.error("Error signing out of Firebase Auth:", err);
    }
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
