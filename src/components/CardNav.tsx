import React, { useState, useRef, useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { prefetchRoute } from "../lib/routePrefetch";
import "./CardNav.css";

export interface CardNavLink {
  label: React.ReactNode;
  ariaLabel?: string;
  to: string;
}

export interface CardNavItem {
  label: React.ReactNode;
  bgColor: string;
  textColor?: string;
  links: CardNavLink[];
}

interface CardNavProps {
  logo?: React.ReactNode;
  logoAlt?: string;
  items: CardNavItem[];
  ctaLabel?: React.ReactNode;
  onCtaClick?: () => void;
  utilities?: React.ReactNode;
  ease?: string;
  hidden?: boolean;
}

// GSAP "power3.out" ≈ cubic-bezier(0.22, 1, 0.36, 1)
const EASE = [0.22, 1, 0.36, 1] as const;

export default function CardNav({
  logo,
  logoAlt = "Polaris Web Studio",
  items,
  ctaLabel,
  onCtaClick,
  utilities,
  ease,
  hidden = false,
}: CardNavProps) {
  const [open, setOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mide la altura natural del contenido para animar la expansión de la card
  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  });

  // Cierra el menú al hacer click fuera del navbar
  useLayoutEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  // Bloquea el scroll del body cuando el menú está abierto
  useLayoutEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNavigate = () => setOpen(false);

  return (
    <div
      ref={containerRef}
      className={`card-nav-container${hidden ? " nav-hidden" : ""}`}
    >
      <motion.div
        className={`card-nav${open ? " open" : ""}`}
        initial={false}
        animate={{ height: open ? 60 + contentHeight : 60 }}
        transition={{ ease: EASE, duration: 0.45 }}
      >
        {/* Top bar: hamburguesa | logo centrado | CTA */}
        <div className="card-nav-top">
          <button
            type="button"
            className={`hamburger-menu${open ? " open" : ""}`}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <span className="hamburger-line" aria-hidden="true" />
            <span className="hamburger-line" aria-hidden="true" />
          </button>

          {logo && (
            <div className="logo-container">
              {typeof logo === "string" ? (
                <img className="logo" src={logo} alt={logoAlt} />
              ) : (
                logo
              )}
            </div>
          )}

          {ctaLabel && (
            <button
              type="button"
              className="card-nav-cta-button"
              onClick={onCtaClick}
            >
              {ctaLabel}
            </button>
          )}
        </div>

        {/* Panel expandido: cards de colores + utilidades */}
        <div className="card-nav-content" ref={contentRef}>
          <div className="nav-cards-row">
            {items.map((item, i) => (
              <div
                key={i}
                className="nav-card"
                style={{
                  backgroundColor: item.bgColor,
                  color: item.textColor ?? "#fff",
                }}
              >
                <span className="nav-card-label">{item.label}</span>
                <div className="nav-card-links">
                  {item.links.map((link, j) => (
                    <Link
                      key={j}
                      className="nav-card-link"
                      to={link.to}
                      aria-label={link.ariaLabel}
                      onClick={handleNavigate}
                      onMouseEnter={() => prefetchRoute(link.to)}
                      onFocus={() => prefetchRoute(link.to)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {utilities && (
            <div className="nav-card-utilities">{utilities}</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
