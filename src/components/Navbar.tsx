import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useLanguage, T } from '../context/LanguageContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY && currentScrollY > 100 && !isOpen) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY) {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const navLinks = [
    { name: <T en="Home">Inicio</T>, path: '/' },
    { name: <T en="About">Nosotros</T>, path: '/nosotros' },
    { name: <T en="Services">Servicios</T>, path: '/servicios' },
    { name: <T en="Process">Metodología</T>, path: '/proceso' },
    { name: <T en="Portfolio">Portafolio</T>, path: '/portafolio' },
    { name: <T en="Client Portal">Portal</T>, path: '/login' },
  ];

  return (
    <>
      <div className="h-[60px] md:h-[76px] w-full shrink-0" aria-hidden="true" />
      <nav ref={navRef} className={`fixed left-0 right-0 top-0 w-full px-4 md:px-6 lg:px-8 xl:px-12 py-2 md:py-4 flex items-center justify-between z-50 transition duration-300 border-b backdrop-blur-md ${
        scrolled ? 'bg-[var(--color-surface-base)]/80 border-[var(--color-border-subtle)]' : 'bg-transparent border-transparent'
      } ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
        <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg" aria-label="Polaris Web Studio - Inicio">
          <Logo size={44} />
        </Link>
      
      {/* Desktop Nav */}
      <div className="hidden lg:flex items-center gap-10 xl:gap-14 text-xs lg:text-xs xl:text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
        {navLinks.map((link) => (
          <Link 
            key={link.path} 
            to={link.path} 
            className={`hover:text-[var(--color-primary-base)] transition-colors relative focus-visible:outline-none focus-visible:text-[var(--color-primary-base)] ${
              location.pathname === link.path ? 'text-[var(--color-primary-base)]' : ''
            }`}
          >
            {link.name}
            {location.pathname === link.path && (
              <motion.div 
                layoutId="nav-underline"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary-base)]"
              />
            )}
          </Link>
        ))}
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="block">
          <ThemeToggle />
        </div>
        <button 
          onClick={() => navigate('/cotizar')}
          className="hidden sm:block px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-xs sm:text-sm hover:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-[var(--color-surface-base)] whitespace-nowrap"
        >
          <T en="Get a Quote">Cotizar Proyecto</T>
        </button>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg relative w-10 h-10 flex items-center justify-center overflow-hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                <X size={24} aria-hidden="true" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute"
              >
                <Menu size={24} aria-hidden="true" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)] p-6 flex flex-col gap-4 lg:hidden z-40 shadow-lg"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)}
                className="text-lg font-bold uppercase tracking-widest hover:text-[var(--color-primary-base)] transition-colors"
              >
                {link.name}
              </Link>
            ))}
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]"><T en="Theme">Tema</T></span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]"><T en="Language">Idioma</T></span>
              <div className="flex items-center gap-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full p-1 relative">
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-all ${
                    language === 'es'
                      ? 'text-[var(--color-on-primary)]'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {language === 'es' && (
                    <motion.span
                      layoutId="activeLang"
                      className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-all ${
                    language === 'en'
                      ? 'text-[var(--color-on-primary)]'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {language === 'en' && (
                    <motion.span
                      layoutId="activeLang"
                      className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  EN
                </button>
              </div>
            </div>
            <button 
              onClick={() => { setIsOpen(false); navigate('/cotizar'); }}
              className="w-full py-4 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold uppercase tracking-widest mt-4"
            >
              <T en="Get a Quote">Cotizar Proyecto</T>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}
