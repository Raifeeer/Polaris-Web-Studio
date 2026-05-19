import React, { useState, useRef, useEffect } from 'react';
import { Mail, MessageSquare, Send, User, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { T } from '../context/LanguageContext';

export default function ContactSection() {
  const formRef = useRef<HTMLFormElement>(null);
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: 'landing',
    details: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    if (plan) {
      const lowerPlan = plan.toLowerCase();
      setFormData(prev => ({
        ...prev,
        details: `Hola, estoy interesado en el ${plan}. Me gustaría recibir más información.`,
        project: lowerPlan.includes('nova') || lowerPlan.includes('ecommerce') ? 'ecommerce' : 
                 lowerPlan.includes('constelación') || lowerPlan.includes('constelacion') || lowerPlan.includes('corporativa') ? 'corporate' : 'landing'
      }));
    }
  }, [location.search]);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setLoading(true);
    setError(null);

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setError('Configuración de EmailJS faltante. Por favor revisa las variables de entorno.');
      setLoading(false);
      return;
    }

    try {
      await emailjs.sendForm(
        serviceId,
        templateId,
        formRef.current,
        publicKey
      );
      setSubmitted(true);
    } catch (err) {
      console.error('EmailJS submit error:', err);
      setError('Error al enviar el mensaje. Inténtalo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="py-24 px-6 md:px-12 bg-[var(--color-surface-base)] relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-primary-muted)] rounded-full blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-start">
        {/* Text Area */}
        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <span className="inline-block mb-4 text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-highlight)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Contact">Contacto</T></span>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter leading-tight">
              <T en={<>Let's talk about <br className="hidden md:block" /> your next project.</>}>Hablemos de <br className="hidden md:block" /> tu próximo proyecto.</T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-md leading-relaxed">
              <T en="We are ready to transform your ideas into a high-impact digital reality. Fill out the form and we will respond shortly.">Estamos listos para transformar tus ideas en una realidad digital de alto impacto. Completa el formulario y responderemos en breve.</T>
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 transition-transform">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs font-bold uppercase tracking-widest"><T en="Email">Correo</T></p>
                <p className="font-bold">hola@polarisweb.studio</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 transition-transform">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs font-bold uppercase tracking-widest">WhatsApp / Cel</p>
                <p className="font-bold">+1 (829) 920-0544</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1 w-full bg-[var(--color-surface-elevated)] p-8 md:p-12 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] shadow-2xl relative"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="form"
                ref={formRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="user-name" className="text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-secondary)]"><T en="Your Name">Tu Nombre</T></label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} aria-hidden="true" />
                      <input 
                        id="user-name"
                        name="user_name"
                        type="text" 
                        placeholder="Juan Pérez"
                        className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary-base)] focus:ring-2 focus:ring-[var(--color-primary-base)]/20 transition-all font-body"
                        required
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="user-email" className="text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-secondary)]"><T en="Corporate Email">Email Corporativo</T></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" size={16} aria-hidden="true" />
                      <input 
                        id="user-email"
                        name="user_email"
                        type="email" 
                        placeholder="juan@empresa.com"
                        className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary-base)] focus:ring-2 focus:ring-[var(--color-primary-base)]/20 transition-all font-body"
                        required
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-secondary)]"><T en="Project Type">Tipo de Proyecto</T></label>
                  <select 
                    name="project_type"
                    value={formData.project}
                    className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-[var(--color-primary-base)] transition-colors appearance-none"
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                  >
                    <option value="landing">Landing Page de Conversión</option>
                    <option value="corporate">Web Corporativa</option>
                    <option value="ecommerce">Tienda Online (E-commerce)</option>
                    <option value="custom">Desarrollo a Medida</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.1em] text-[var(--color-text-secondary)]"><T en="Project Details">Detalles del Proyecto</T></label>
                  <textarea 
                    name="message"
                    rows={4}
                    value={formData.details}
                    placeholder="Cuéntanos un poco sobre tus objetivos..."
                    className="w-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-[var(--color-primary-base)] transition-colors resize-none"
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-lg hover:scale-[1.02] shadow-lg transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <T en="Sending...">Enviando...</T> <Loader2 size={18} className="animate-spin" />
                      </>
                    ) : (
                      <>
                        <T en="Send Request">Enviar Solicitud</T> <Send size={18} aria-hidden="true" />
                      </>
                    )}
                  </button>

                  {error && (
                    <p className="text-red-500 text-xs font-bold text-center animate-bounce">
                      {error}
                    </p>
                  )}
                </div>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-6"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Send size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold"><T en="Message Sent!">¡Mensaje Enviado!</T></h3>
                  <p className="text-[var(--color-text-secondary)] max-w-xs mx-auto">
                    <T en="Thank you for trusting Polaris. Our team will review your request and contact you soon.">Gracias por confiar en Polaris. Nuestro equipo revisará tu solicitud y te contactará pronto.</T>
                  </p>
                </div>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-[var(--color-primary-base)] font-bold uppercase tracking-widest text-xs"
                >
                  <T en="Send another message">Enviar otro mensaje</T>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-8 pt-8 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
             <p className="text-[var(--color-text-tertiary)] text-[10px] font-bold uppercase tracking-widest"><T en="Protected Security">Seguridad Protegida</T></p>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest"><T en="Systems Online">Sistemas en línea</T></p>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
