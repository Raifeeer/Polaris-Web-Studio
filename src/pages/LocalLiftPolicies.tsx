import React from "react";
import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";

const LAST_UPDATED = "20 de agosto de 2026";

function PolicySection({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-xl md:text-2xl text-[var(--color-text-primary)] tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">{children}</div>
    </section>
  );
}

export default function LocalLiftPolicies() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 sm:px-8 pt-32 pb-20">
        <Link to="/local-lift" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] hover:text-[#16C8C1] transition-colors mb-8">
          <ArrowLeft size={14} />
          <T en="Back to Local Lift">Volver a Local Lift</T>
        </Link>

        <header className="mb-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#16C8C1]/25 bg-[#16C8C1]/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#16C8C1]">
            <ShieldCheck size={13} />
            <T en="Local Lift policies">Políticas Local Lift</T>
          </div>
          <h1 className="mt-5 font-display font-black text-4xl md:text-6xl tracking-tight text-[var(--color-text-primary)]">
            <T en="Clear scope. Guided implementation. Defined support.">Alcance claro. Implementación guiada. Soporte definido.</T>
          </h1>
          <p className="mt-5 text-base md:text-lg leading-relaxed text-[var(--color-text-secondary)]">
            <T en="These policies explain what each Local Lift package includes, how reviews work, and where the service ends. The service agreement accepted in the client portal controls the specific purchase.">
              Estas políticas explican qué incluye cada paquete Local Lift, cómo funcionan las revisiones y dónde termina el servicio. El contrato aceptado en el portal controla la compra específica.
            </T>
          </p>
          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">Última actualización: {LAST_UPDATED}</p>
        </header>

        <div className="space-y-12">
          <PolicySection title={<T en="1. What Local Lift does">1. Qué hace Local Lift</T>}>
            <p><T en="Local Lift prepares practical material from the information available about a local business presence. Depending on the package, it can include profile audit, optimized description and services, posts, review replies, WhatsApp follow-up messages, recent review analysis, a visual guide and guided review rounds.">Local Lift prepara materiales prácticos a partir de la información disponible sobre la presencia local de un negocio. Según el paquete, puede incluir auditoría del perfil, descripción y servicios optimizados, publicaciones, respuestas a reseñas, mensajes de seguimiento por WhatsApp, análisis de reseñas recientes, guía visual y rondas de revisión guiadas.</T></p>
            <p><T en="Local Lift does not promise direct publishing or permanent management inside Google Business Profile. The client remains responsible for applying changes, protecting access and complying with the rules of Google and other third-party platforms.">Local Lift no promete publicación directa ni gestión permanente dentro de Google Business Profile. El cliente mantiene la responsabilidad de aplicar los cambios, proteger sus accesos y cumplir las reglas de Google y de las demás plataformas de terceros.</T></p>
          </PolicySection>

          <PolicySection title={<T en="2. Impulso">2. Impulso</T>}>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5 md:p-6">
              <ul className="grid md:grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                {[
                  "Auditoría completa del perfil local",
                  "Descripción, servicios y llamadas a la acción optimizados",
                  "10 publicaciones listas para aplicar",
                  "15 respuestas personalizadas para reseñas",
                  "10 mensajes de WhatsApp para seguimiento",
                  "Entrega por correo y portal",
                ].map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16C8C1]" />{item}</li>)}
              </ul>
            </div>
            <p><T en="Impulso is a preparation package. It does not include meetings, implementation rounds, direct publishing, ongoing management or indefinite support. New work outside the package is quoted separately.">Impulso es un paquete de preparación. No incluye reuniones, rondas de implementación, publicación directa, gestión continua ni soporte indefinido. El trabajo nuevo fuera del paquete se cotiza por separado.</T></p>
          </PolicySection>

          <PolicySection title={<T en="3. Ascenso">3. Ascenso</T>}>
            <div className="rounded-2xl border border-[#16C8C1]/25 bg-[#16C8C1]/[0.05] p-5 md:p-6">
              <ul className="grid md:grid-cols-2 gap-3 text-sm text-[var(--color-text-secondary)]">
                {[
                  "Todo lo incluido en Impulso",
                  "Entrega preparada en un máximo de 5 horas corridas después de firmar",
                  "Análisis de reseñas recientes y buenas prácticas personalizadas",
                  "Guía paso a paso para aplicar cada cambio",
                  "Indicaciones para aplicar textos e imágenes",
                  "Hasta tres rondas agrupadas de revisión desde el portal",
                  "Acompañamiento guiado desde el portal, sin reuniones obligatorias ni contraseñas",
                ].map((item) => <li key={item} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#16C8C1]" />{item}</li>)}
              </ul>
            </div>
            <p><T en="A review round is one grouped request sent through the portal. Clarifications about the same proposed version do not consume another round. Once three rounds are used, additional work requires a separate quote.">Una ronda es una solicitud agrupada enviada desde el portal. Las aclaraciones sobre una misma versión no consumen otra ronda. Cuando se utilizan las tres rondas, el trabajo adicional requiere una cotización independiente.</T></p>
          </PolicySection>

          <PolicySection title={<T en="4. Delivery and approvals">4. Entrega y aprobaciones</T>}>
            <p><T en="After payment, the client receives portal access and must review and sign the applicable service agreement. Once the agreement is signed, Ascenso is prepared within five consecutive hours and becomes available in the portal for review. The final PDFs are released by email after the client approves the prepared version. No meeting is required; support and review requests happen through the portal.">Después del pago, el cliente recibe acceso al portal y debe revisar y firmar el contrato aplicable. Una vez firmado, Ascenso se prepara dentro de cinco horas corridas y queda disponible en el portal para revisión. Los PDFs finales se envían por correo después de que el cliente aprueba la versión preparada. No es necesaria una reunión; el soporte y las solicitudes de revisión se gestionan desde el portal.</T></p>
            <p><T en="Approving a version does not create unlimited new work. It confirms the current version and allows the service to move to its next defined stage.">Aprobar una versión no crea trabajo nuevo ilimitado. Confirma la versión actual y permite que el servicio avance a su siguiente etapa definida.</T></p>
          </PolicySection>

          <PolicySection title={<T en="5. Communication and support">5. Comunicación y soporte</T>}>
            <p><T en="The client portal is the source of truth for contract status, package status, review rounds and project notices. For questions that do not require a new deliverable, the client may contact support through the portal or WhatsApp.">El portal del cliente es la fuente principal para el estado del contrato, el paquete, las rondas de revisión y los avisos del proyecto. Para preguntas que no requieran un nuevo trabajo, el cliente puede contactar soporte desde el portal o por WhatsApp.</T></p>
            <a href="https://wa.me/18299200544" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#16C8C1] px-4 py-2.5 text-xs font-bold text-[#111936] hover:opacity-90 transition-opacity">
              <MessageCircle size={15} />
              <T en="Contact Local Lift support">Contactar soporte Local Lift</T>
            </a>
          </PolicySection>

          <PolicySection title={<T en="6. Data and third-party platforms">6. Datos y plataformas de terceros</T>}>
            <p><T en="We use the business and contact information required to prepare and support the purchased service. The Privacy Policy explains the broader handling of personal data. Google Business Profile and other external platforms have their own rules, permissions and availability; Local Lift cannot guarantee their decisions, uptime or review moderation.">Usamos la información del negocio y de contacto necesaria para preparar y acompañar el servicio adquirido. La Política de Privacidad explica el tratamiento general de los datos personales. Google Business Profile y las demás plataformas externas tienen sus propias reglas, permisos y disponibilidad; Local Lift no puede garantizar sus decisiones, disponibilidad o moderación de reseñas.</T></p>
          </PolicySection>

          <PolicySection title={<T en="7. Abandonment, pauses and refunds">7. Abandono, pausas y reembolsos</T>}>
            <p><T en="If the client does not complete a required step, Local Lift may send reminders. If there is no response after the defined reminder period, the project may be paused while preserving its history and prepared material. The client can request a manual review to resume it.">Si el cliente no completa un paso necesario, Local Lift puede enviar recordatorios. Si no hay respuesta después del periodo definido de recordatorios, el proyecto puede quedar pausado conservando su historial y el material preparado. El cliente puede solicitar una revisión manual para reanudarlo.</T></p>
            <p><T en="No automatic refund is issued after work begins. Any exception is reviewed manually according to the circumstances and the applicable agreement.">No se emite un reembolso automático después de iniciar el trabajo. Cualquier excepción se revisa manualmente según las circunstancias y el contrato aplicable.</T></p>
          </PolicySection>
        </div>
      </main>
      <Footer />
    </div>
  );
}
