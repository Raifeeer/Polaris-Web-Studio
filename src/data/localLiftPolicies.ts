export type LocalLiftLocale = "es" | "en";

export type LocalLiftBilingualText = {
  es: string;
  en: string;
};

export type LocalLiftPolicySection = {
  id: string;
  title: LocalLiftBilingualText;
  paragraphs: LocalLiftBilingualText[];
  items?: LocalLiftBilingualText[];
  tone?: "default" | "teal";
  support?: boolean;
};

export const LOCAL_LIFT_POLICY_LAST_UPDATED = "20 de agosto de 2026";

export const LOCAL_LIFT_POLICY_INTRO: LocalLiftBilingualText = {
  es: "Estas políticas explican qué incluye cada paquete Local Lift, cómo funcionan las revisiones y dónde termina el servicio. El contrato aceptado en el portal controla la compra específica.",
  en: "These policies explain what each Local Lift package includes, how reviews work, and where the service ends. The service agreement accepted in the client portal controls the specific purchase.",
};

export const LOCAL_LIFT_POLICY_SECTIONS: LocalLiftPolicySection[] = [
  {
    id: "what-local-lift-does",
    title: { es: "1. Qué hace Local Lift", en: "1. What Local Lift does" },
    paragraphs: [
      {
        es: "Local Lift prepara materiales prácticos a partir de la información disponible sobre la presencia local de un negocio. Según el paquete, puede incluir auditoría del perfil, descripción y servicios optimizados, publicaciones, respuestas a reseñas, mensajes de seguimiento por WhatsApp, análisis de reseñas recientes, guía visual y rondas de revisión guiadas.",
        en: "Local Lift prepares practical material from the information available about a local business presence. Depending on the package, it can include profile audit, optimized description and services, posts, review replies, WhatsApp follow-up messages, recent review analysis, a visual guide and guided review rounds.",
      },
      {
        es: "Local Lift no promete publicación directa ni gestión permanente dentro de Google Business Profile. El cliente mantiene la responsabilidad de aplicar los cambios, proteger sus accesos y cumplir las reglas de Google y de las demás plataformas de terceros.",
        en: "Local Lift does not promise direct publishing or permanent management inside Google Business Profile. The client remains responsible for applying changes, protecting access and complying with the rules of Google and other third-party platforms.",
      },
    ],
  },
  {
    id: "impulso",
    title: { es: "2. Impulso", en: "2. Impulso" },
    tone: "default",
    items: [
      { es: "Auditoría completa del perfil local", en: "Complete audit of your local profile" },
      { es: "Descripción, servicios y llamadas a la acción optimizados", en: "Optimized description, services, and CTAs" },
      { es: "10 publicaciones listas para aplicar", en: "10 posts ready to apply" },
      { es: "15 respuestas personalizadas para reseñas", en: "15 personalized review replies" },
      { es: "10 mensajes de WhatsApp para seguimiento", en: "10 WhatsApp follow-up messages" },
      { es: "Entrega por correo y portal", en: "Delivery by email and portal" },
    ],
    paragraphs: [
      {
        es: "Impulso es un paquete de preparación. No incluye reuniones, rondas de implementación, publicación directa, gestión continua ni soporte indefinido. El trabajo nuevo fuera del paquete se cotiza por separado.",
        en: "Impulso is a preparation package. It does not include meetings, implementation rounds, direct publishing, ongoing management or indefinite support. New work outside the package is quoted separately.",
      },
    ],
  },
  {
    id: "ascenso",
    title: { es: "3. Ascenso", en: "3. Ascenso" },
    tone: "teal",
    items: [
      { es: "Todo lo incluido en Impulso", en: "Everything in Impulso" },
      { es: "Entrega preparada en un máximo de 5 horas corridas después del pago", en: "Prepared delivery within 5 consecutive hours after payment" },
      { es: "Análisis de reseñas recientes y buenas prácticas personalizadas", en: "Recent review analysis and personalized best practices" },
      { es: "Guía paso a paso para aplicar cada cambio", en: "Step-by-step guide to apply each change" },
      { es: "Indicaciones para aplicar textos e imágenes", en: "Instructions for applying text and images" },
      { es: "Hasta tres rondas agrupadas de revisión desde el portal", en: "Up to three grouped review rounds through the portal" },
      { es: "Acompañamiento guiado desde el portal, sin reuniones obligatorias ni contraseñas", en: "Guided support through the portal, without mandatory meetings or passwords" },
    ],
    paragraphs: [
      {
        es: "Una ronda es una solicitud agrupada enviada desde el portal. Las aclaraciones sobre una misma versión no consumen otra ronda. Cuando se utilizan las tres rondas, el trabajo adicional requiere una cotización independiente.",
        en: "A review round is one grouped request sent through the portal. Clarifications about the same proposed version do not consume another round. Once three rounds are used, additional work requires a separate quote.",
      },
    ],
  },
  {
    id: "delivery-approvals",
    title: { es: "4. Entrega y aprobaciones", en: "4. Delivery and approvals" },
    paragraphs: [
      {
        es: "Después del pago y la aceptación en el checkout, Local Lift empieza inmediatamente a preparar el servicio adquirido. El portal del cliente está disponible como espacio opcional para seguir el avance, revisar el paquete Ascenso y solicitar cambios agrupados. Ascenso se prepara dentro de cinco horas corridas después del pago. Los PDFs finales se envían por correo después de que el cliente aprueba la versión preparada. No es necesaria una reunión.",
        en: "After payment and checkout acceptance, Local Lift begins preparing the purchased service immediately. The client portal is available as an optional place to follow progress, review the prepared Ascenso package and request grouped changes. Ascenso is prepared within five consecutive hours after payment. The final PDFs are released by email after the client approves the prepared version. No meeting is required.",
      },
      {
        es: "Aprobar una versión no crea trabajo nuevo ilimitado. Confirma la versión actual y permite que el servicio avance a su siguiente etapa definida.",
        en: "Approving a version does not create unlimited new work. It confirms the current version and allows the service to move to its next defined stage.",
      },
    ],
  },
  {
    id: "communication-support",
    title: { es: "5. Comunicación y soporte", en: "5. Communication and support" },
    paragraphs: [
      {
        es: "El portal del cliente es la fuente principal para el estado del paquete, las rondas de revisión y los avisos del proyecto. Entrar al portal no es necesario para que comencemos el servicio; resulta útil cuando el cliente quiere revisar el material preparado, solicitar cambios o seguir el avance.",
        en: "The client portal is the source of truth for package status, review rounds and project notices. Portal access is optional for starting the service; it becomes useful when the client wants to review the prepared material, request changes or follow progress.",
      },
    ],
    support: true,
  },
  {
    id: "data-third-party",
    title: { es: "6. Datos y plataformas de terceros", en: "6. Data and third-party platforms" },
    paragraphs: [
      {
        es: "Usamos la información del negocio y de contacto necesaria para preparar y acompañar el servicio adquirido. La Política de Privacidad explica el tratamiento general de los datos personales. Google Business Profile y las demás plataformas externas tienen sus propias reglas, permisos y disponibilidad; Local Lift no puede garantizar sus decisiones, disponibilidad o moderación de reseñas.",
        en: "We use the business and contact information required to prepare and support the purchased service. The Privacy Policy explains the broader handling of personal data. Google Business Profile and other external platforms have their own rules, permissions and availability; Local Lift cannot guarantee their decisions, uptime or review moderation.",
      },
    ],
  },
  {
    id: "abandonment-refunds",
    title: { es: "7. Abandono, pausas y reembolsos", en: "7. Abandonment, pauses and refunds" },
    paragraphs: [
      {
        es: "Local Lift no exige una firma posterior al pago ni activar el portal para comenzar. En Ascenso, los recordatorios se envían únicamente cuando el paquete preparado está esperando la revisión o aprobación del cliente. Si no hay respuesta después del periodo definido, el proyecto puede quedar pausado conservando su historial y el material preparado. El cliente puede solicitar una revisión manual para reanudarlo.",
        en: "Local Lift does not require a post-payment signature or portal activation to begin. For Ascenso, reminders may be sent only when the prepared package is waiting for the client's review or approval. If there is no response after the defined reminder period, the project may be paused while preserving its history and prepared material. The client can request a manual review to resume it.",
      },
      {
        es: "No se emite un reembolso automático después de iniciar el trabajo. Cualquier excepción se revisa manualmente según las circunstancias y el contrato aplicable.",
        en: "No automatic refund is issued after work begins. Any exception is reviewed manually according to the circumstances and the applicable agreement.",
      },
    ],
  },
];
