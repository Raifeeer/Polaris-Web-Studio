import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { T, useLanguage } from "../context/LanguageContext";
import { motion } from "framer-motion";
import { prefetchRoute } from "../lib/routePrefetch";
import CardNav, { CardNavItem } from "./CardNav";
import AtlasMark from "./AtlasMark";
import ThemeToggle from "./ThemeToggle";
import TextSizeToggle from "./TextSizeToggle";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const { language, setLanguage, translate } = useLanguage();
  const navigate = useNavigate();

  // Esconde/muestra el navbar al hacer scroll -- un solo cálculo por evento
  // de scroll (rAF-throttled), nunca una animación continua.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setHidden(true);
          } else if (currentScrollY < lastScrollY) {
            setHidden(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cards del menú: un link principal por card (sin repetir el título como
  // subtítulo) + como mucho un link secundario relacionado, para que quepan
  // completos dentro de la altura real de la card sin recortarse.
  const cardItems: CardNavItem[] = [
    {
      accent: "indigo",
      label: <T en="About">Nosotros</T>,
      links: [
        { label: <T en="Our story">La empresa</T>, to: "/nosotros", ariaLabel: "Sobre nosotros" },
        { label: <T en="Blog">Blog</T>, to: "/blog", ariaLabel: "Blog de Polaris" },
      ],
    },
    {
      accent: "violet",
      label: <T en="Services">Servicios</T>,
      links: [
        { label: <T en="What we build">Qué hacemos</T>, to: "/servicios", ariaLabel: "Servicios de Polaris" },
        { label: <T en="Our process">Metodología</T>, to: "/proceso", ariaLabel: "Nuestra metodología" },
      ],
    },
    {
      accent: "purple",
      label: <T en="Portfolio">Portafolio</T>,
      links: [
        { label: <T en="Live projects">Proyectos reales</T>, to: "/portafolio", ariaLabel: "Portafolio de proyectos" },
      ],
    },
    {
      accent: "blue",
      label: <T en="Contact">Contacto</T>,
      links: [
        { label: <T en="Get in touch">Escríbenos</T>, to: "/contacto", ariaLabel: "Contactar a Polaris" },
        { label: <T en="Client Portal">Portal Cliente</T>, to: "/login", ariaLabel: "Portal de clientes" },
      ],
    },
  ];

  // Utilidades dentro del panel expandido: Atlas Assistant + tema/tamaño de
  // texto/idioma, en una sola fila que comparte el mismo lenguaje visual
  // (glass) que el resto del panel, no una tira aparte.
  const utilities = (
    <>
      <Link
        to="/asistente"
        onMouseEnter={() => prefetchRoute("/asistente")}
        onFocus={() => prefetchRoute("/asistente")}
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors"
      >
        <AtlasMark variant="isotipo" className="w-5 h-5" />
        Atlas Assistant
      </Link>

      <div className="flex items-center gap-2">
        <TextSizeToggle />
        <ThemeToggle />
        <div className="flex items-center gap-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full p-1 relative">
          <button
            type="button"
            onClick={() => setLanguage("es")}
            className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              language === "es"
                ? "text-[var(--color-on-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {language === "es" && (
              <motion.span
                layoutId="activeLang"
                className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            ES
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              language === "en"
                ? "text-[var(--color-on-primary)]"
                : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {language === "en" && (
              <motion.span
                layoutId="activeLang"
                className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            EN
          </button>
        </div>
      </div>
    </>
  );

  return (
    <CardNav
      logo={
        <Link
          to="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg"
          aria-label={translate("Polaris Web Studio - Inicio", "Polaris Web Studio - Home")}
        >
          <img
            src="/brand/lockup-horizontal-blanco.svg"
            alt="Polaris Web Studio"
            className="logo [.light_&]:hidden"
          />
          <img
            src="/brand/lockup-horizontal-color.svg"
            alt="Polaris Web Studio"
            className="logo hidden [.light_&]:block"
          />
        </Link>
      }
      items={cardItems}
      ctaLabel={<T en="Plan your Project">Planifica tu Proyecto</T>}
      onCtaClick={() => navigate("/cotizar")}
      utilities={utilities}
      hidden={hidden}
    />
  );
}
