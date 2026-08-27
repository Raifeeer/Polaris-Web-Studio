import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Linkedin, Mail, Globe } from "lucide-react";
import { useLanguage, T } from "../context/LanguageContext";
import FooterTerminal from "./FooterTerminal";

interface FooterProps {
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  variant?: "default" | "immersive" | "editorial" | "mercury" | "auros";
}

// Lucide no incluye el logo de X (antes Twitter); se dibuja a mano con el
// mismo contrato de props (size, aria-hidden) para que funcione como
// reemplazo directo de los íconos de lucide-react en socialLinks.
function XIcon({ size = 18, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer({
  twitterUrl,
  instagramUrl,
  linkedinUrl,
  variant = "default",
}: FooterProps) {
  const { language, setLanguage, translate } = useLanguage();

  const socialLinks = [
    { icon: XIcon, label: "X", url: twitterUrl },
    { icon: Instagram, label: "Instagram", url: instagramUrl },
    { icon: Linkedin, label: "Linkedin", url: linkedinUrl },
  ];

  return (
    <footer className={`w-full border-t border-[var(--color-border-subtle)] px-6 py-16 md:px-12 ${variant === "auros" ? "auros-footer bg-[#020617]" : variant === "mercury" ? "mercury-footer bg-[#171721]" : variant === "editorial" ? "twilight-footer bg-[#f7f7f7]" : variant === "immersive" ? "bg-[var(--color-surface-elevated)]" : "glass-panel"}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 space-y-6">
          {/* El Footer queda oscuro en modo oscuro (tema por defecto) y claro
              en modo claro (clase .light en <html>) -- el logotipo con texto
              azul marino se pierde contra un fondo casi negro, así que acá
              se usa la variante blanca en modo oscuro y la de color en modo
              claro. */}
          <img
            src="/brand/lockup-horizontal-blanco.svg"
            alt="Polaris Web Studio"
            className="h-12 w-auto [.light_&]:hidden"
          />
          <img
            src="/brand/lockup-horizontal-color.svg"
            alt="Polaris Web Studio"
            className="h-12 w-auto hidden [.light_&]:block"
          />
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs md:w-[140px] lg:w-auto lg:max-w-xs md:text-justify lg:text-left">
            <T en="Precision digital engineering for brands looking to shine in the web universe.">
              Ingeniería digital de precisión para marcas que buscan destacar en
              el universo web.
            </T>
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social, i) => {
              const Icon = social.icon;
              const hasUrl = !!social.url;
              if (!hasUrl) {
                return (
                  <span
                    key={i}
                    className="p-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-tertiary)] opacity-30 cursor-not-allowed"
                  >
                    <Icon size={18} aria-hidden="true" />
                  </span>
                );
              }
              return (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2 rounded-lg bg-[var(--color-surface-highlight)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] cursor-pointer"
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-6">
          <h3 className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)]">
            <T en="Studio">Estudio</T>
          </h3>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)]">
            <Link
              to="/"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Home">Inicio</T>
            </Link>
            <Link
              to="/nosotros"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="About">Nosotros</T>
            </Link>
            <Link
              to="/servicios"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Services">Servicios</T>
            </Link>
            <Link
              to="/portafolio"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Portfolio">Portafolio</T>
            </Link>
            <Link
              to="/proceso"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Process">Metodología</T>
            </Link>
            <Link
              to="/blog"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-6">
          <h3 className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)]">
            <T en="Services">Servicios</T>
          </h3>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)]">
            <Link
              to="/servicios"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              Landing Pages
            </Link>
            <Link
              to="/servicios"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              E-commerce
            </Link>
            <Link
              to="/servicios"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Corporate Apps">Apps Corporativas</T>
            </Link>
            <Link
              to="/servicios"
              className="hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="SEO Optimization">Optimización SEO</T>
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Link
              to="/contacto"
              className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)] hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Contact">Contacto</T>
            </Link>
            {/* Language Switcher */}
            <div className="flex items-center gap-2 border border-[var(--color-border-subtle)] rounded-full px-2 py-1 bg-[var(--color-surface-base)]">
              <Globe size={12} className="text-[var(--color-text-secondary)]" />
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <button
                  onClick={() => setLanguage("es")}
                  className={`transition-colors uppercase ${language === "es" ? "text-[var(--color-primary-base)] font-bold" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
                >
                  ES
                </button>
                <span className="text-[var(--color-border-strong)]">|</span>
                <button
                  onClick={() => setLanguage("en")}
                  className={`transition-colors uppercase ${language === "en" ? "text-[var(--color-primary-base)] font-bold" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)] items-start">
            <a
              href="mailto:hola@polarisweb.studio"
              className="flex items-center hover:text-[var(--color-primary-base)] transition-colors text-left md:text-sm"
            >
              <span>hola@polarisweb.studio</span>
            </a>
            <p className="leading-relaxed text-left">
              <T
                en={
                  <>
                    100% Remote Operation.
                    <br />
                    Based in the Dominican Republic.
                  </>
                }
              >
                Operación 100% Remota.
                <br />
                Basados en República Dominicana.
              </T>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[var(--color-text-secondary)] text-xs font-medium uppercase tracking-[0.2em] text-center md:text-left leading-relaxed">
          © 2026 Polaris Web Studio.{" "}
          <br className="hidden md:block xl:hidden" />
          <span className="inline-block mt-1 md:mt-0">
            <T en="Precision Digital Engineering.">
              Ingeniería Digital de Precisión.
            </T>
          </span>
        </p>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
          <Link
            to="/privacidad"
            className="hover:text-[var(--color-primary-base)] transition-colors"
          >
            <T en="Privacy">Privacidad</T>
          </Link>
          <Link
            to="/terminos"
            className="hover:text-[var(--color-primary-base)] transition-colors"
          >
            <T en="Terms">Términos</T>
          </Link>
          <Link
            to="/cookies"
            className="hover:text-[var(--color-primary-base)] transition-colors"
          >
            <T en="Cookies">Cookies</T>
          </Link>
        </div>
      </div>

      {variant !== "editorial" && variant !== "mercury" && variant !== "auros" && (
        <div className="max-w-6xl mx-auto">
          <FooterTerminal />
        </div>
      )}
    </footer>
  );
}
