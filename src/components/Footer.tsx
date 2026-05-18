import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';

interface FooterProps {
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

export default function Footer({ twitterUrl, instagramUrl, linkedinUrl }: FooterProps) {
  const socialLinks = [
    { icon: Twitter, label: 'Twitter', url: twitterUrl },
    { icon: Instagram, label: 'Instagram', url: instagramUrl },
    { icon: Linkedin, label: 'Linkedin', url: linkedinUrl },
  ];

  return (
    <footer className="w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-6 py-16 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1 space-y-6">
          <Logo size={48} />
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs md:w-[140px] lg:w-auto lg:max-w-xs md:text-justify lg:text-left">
            Ingeniería digital de precisión para marcas que buscan destacar en el universo web.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social, i) => {
              const Icon = social.icon;
              const hasUrl = !!social.url;
              return (
                <a 
                  key={i}
                  href={hasUrl ? social.url : undefined}
                  target={hasUrl ? "_blank" : undefined}
                  rel={hasUrl ? "noopener noreferrer" : undefined}
                  aria-label={social.label} 
                  className={`p-2 rounded-lg bg-[var(--color-surface-highlight)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] ${
                    hasUrl 
                      ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] cursor-pointer' 
                      : 'text-[var(--color-text-tertiary)] opacity-30 cursor-not-allowed'
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-6">
          <h4 className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)]">Estudio</h4>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)]">
            <Link to="/" className="hover:text-[var(--color-primary-base)] transition-colors">Inicio</Link>
            <Link to="/nosotros" className="hover:text-[var(--color-primary-base)] transition-colors">Nosotros</Link>
            <Link to="/servicios" className="hover:text-[var(--color-primary-base)] transition-colors">Servicios</Link>
            <Link to="/portafolio" className="hover:text-[var(--color-primary-base)] transition-colors">Portafolio</Link>
            <Link to="/proceso" className="hover:text-[var(--color-primary-base)] transition-colors">Metodología</Link>
            <div className="group flex items-center gap-2 cursor-default">
              <span className="text-[var(--color-text-tertiary)]">Blog</span>
              <span className="text-[10px] font-black uppercase tracking-tighter bg-[var(--color-surface-highlight)] px-1.5 py-0.5 rounded text-[var(--color-primary-base)] opacity-60">Próximamente</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-6">
          <h4 className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)]">Servicios</h4>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)]">
            <Link to="/servicios" className="hover:text-[var(--color-primary-base)] transition-colors">Landing Pages</Link>
            <Link to="/servicios" className="hover:text-[var(--color-primary-base)] transition-colors">E-commerce</Link>
            <Link to="/servicios" className="hover:text-[var(--color-primary-base)] transition-colors">Apps Corporativas</Link>
            <Link to="/servicios" className="hover:text-[var(--color-primary-base)] transition-colors">Optimización SEO</Link>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h4 className="font-display font-bold uppercase tracking-widest text-xs text-[var(--color-text-primary)]">Contacto</h4>
          <div className="flex flex-col gap-3 text-sm text-[var(--color-text-secondary)] items-start">
            <a href="mailto:hola@polarisweb.studio" className="flex items-center hover:text-[var(--color-primary-base)] transition-colors text-left md:text-sm">
               <span>hola@polarisweb.studio</span>
            </a>
            <p className="leading-relaxed text-left">Operación 100% Remota.<br />Disponibles para todo el mundo.</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[var(--color-border-subtle)] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[var(--color-text-tertiary)] text-xs font-medium uppercase tracking-[0.2em] text-center md:text-left leading-relaxed">
          © 2026 Polaris Web Studio. <br className="hidden md:block xl:hidden" />
          <span className="inline-block mt-1 md:mt-0">Ingeniería Digital de Precisión.</span>
        </p>
        <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          <Link to="/privacidad" className="hover:text-[var(--color-primary-base)]">Privacidad</Link>
          <Link to="/terminos" className="hover:text-[var(--color-primary-base)]">Términos</Link>
          <Link to="/cookies" className="hover:text-[var(--color-primary-base)]">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
