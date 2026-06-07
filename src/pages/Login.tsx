import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import { T } from "../context/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard"); // Mock login success
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative pt-20">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 md:p-12 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] bento-glow"
        >
          <div className="flex justify-center mb-8">
            <Logo size={40} stacked />
          </div>

          <div className="text-center mb-8 space-y-2">
            <h1 className="text-2xl font-display font-black">
              <T en="Client Portal">Portal de Clientes</T>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              <T en="Log in to track your project progress.">
                Ingresa para ver el progreso de tu proyecto.
              </T>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
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
                  placeholder="Email Corporativo"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors"
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
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[var(--color-primary-base)] text-white font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
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

          <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-8">
            <T en="Did you forget your password? Contact your assigned manager.">
              ¿Olvidaste tu contraseña? Contacta a tu project manager asignado.
            </T>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
