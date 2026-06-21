import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import { T, useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { language, translate } = useLanguage();
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || (
        language === "en" 
          ? "Invalid credentials. Please verify your email and password." 
          : "Credenciales inválidas. Por favor verifique sus datos de acceso."
      ));
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative pt-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-6 md:p-10 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] bento-glow"
        >
          <div className="flex justify-center mb-6">
            <Logo size={40} stacked />
          </div>

          <div className="text-center mb-6 space-y-2">
            <h1 className="text-2xl font-display font-black">
              <T en="Client Portal">Portal de Clientes</T>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              <T en="Log in to track your project progress.">
                Ingresa para ver el progreso de tu proyecto.
              </T>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email"
                  className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors text-sm"
                />
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={translate("Contraseña", "Password")}
                  aria-label={translate("Contraseña", "Password")}
                  className="glass-input w-full pl-12 pr-4 py-3.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[var(--color-primary-base)] text-white font-black flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 text-sm cursor-pointer"
            >
              {loading ? (
                <T en="Authenticating...">Autenticando...</T>
              ) : (
                <>
                  <T en="Access Portal">Acceder al Portal</T>{" "}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-6">
            <T en="Did you forget your password? Contact your assigned manager.">
              ¿Olvidaste tu contraseña? Contacta a tu project manager asignado.
            </T>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

