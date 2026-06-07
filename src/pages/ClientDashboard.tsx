import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
} from "lucide-react";
import Logo from "../components/Logo";
import { T } from "../context/LanguageContext";

export default function ClientDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-6 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Logo size={32} showText={true} />
          <div className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black tracking-widest rounded-full flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Client
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] font-bold rounded-lg transition-colors"
          >
            <Clock size={18} />
            <T en="Overview">Resumen</T>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] font-medium rounded-lg transition-colors"
          >
            <CheckCircle2 size={18} />
            <T en="Tasks & Approvals">Tareas y Aprobaciones</T>
            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              1
            </span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] font-medium rounded-lg transition-colors"
          >
            <FileText size={18} />
            <T en="Invoices">Facturas</T>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] font-medium rounded-lg transition-colors"
          >
            <Calendar size={18} />
            <T en="Meetings">Reuniones</T>
          </a>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 font-bold rounded-lg transition-colors mt-auto"
        >
          <LogOut size={18} />
          <T en="Log Out">Cerrar Sesión</T>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-display font-black tracking-tight mb-2">
            <T en="Welcome back, Nexus Inc.">Bienvenido, Nexus Inc.</T>
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            <T en="Here is the status of your «Nexus E-commerce» project.">
              Aquí tienes el estado de tu proyecto «Nexus E-commerce».
            </T>
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Tracker */}
          <div className="lg:col-span-2 p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-6">
            <h2 className="text-xl font-display font-bold">
              Progreso del Proyecto
            </h2>

            <div className="relative pt-4">
              <div className="absolute top-7 left-3 w-0.5 h-[calc(100%-40px)] bg-[var(--color-border-strong)] z-0" />

              <div className="space-y-6 relative z-10">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 border-4 border-[var(--color-surface-elevated)]">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Fase 1: Descubrimiento y UI</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Completado el 15 de Octubre.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary-base)] flex items-center justify-center shrink-0 border-4 border-[var(--color-surface-elevated)] shadow-[0_0_10px_var(--color-primary-base)]">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--color-primary-base)]">
                      Fase 2: Desarrollo Frontend
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                      En progreso. Estamos codificando los componentes de React.
                    </p>
                    <div className="h-2 w-full max-w-xs bg-[var(--color-surface-highlight)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary-base)] w-[65%]" />
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 opacity-50">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-surface-highlight)] border-2 border-[var(--color-border-strong)] flex items-center justify-center shrink-0" />
                  <div>
                    <h3 className="font-bold">
                      Fase 3: Integración Backend & QA
                    </h3>
                    <p className="text-sm">Estimado: 10 de Noviembre.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-[var(--radius-bento)] bg-[var(--color-primary-muted)]/10 border border-[var(--color-primary-base)] text-center space-y-4 relative overflow-hidden bento-glow">
              <div className="relative z-10">
                <div className="w-12 h-12 mx-auto bg-[var(--color-primary-base)] text-white rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-display font-bold text-lg">
                  Aprobación Pendiente
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Revisa los últimos mockups subidos hoy.
                </p>
                <button className="w-full py-3 bg-[var(--color-primary-base)] text-white font-bold rounded-xl text-sm">
                  Revisar Diseños
                </button>
              </div>
            </div>

            <div className="p-6 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-4">
              <h3 className="font-bold flex items-center justify-between">
                Última Factura
                <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-2 py-1 rounded">
                  Pagada
                </span>
              </h3>
              <div className="text-2xl font-display font-black">$649.50</div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Factura #INV-2023-089
              </p>
              <button className="w-full py-2 bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[var(--color-border-subtle)] transition">
                <Download size={16} /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
