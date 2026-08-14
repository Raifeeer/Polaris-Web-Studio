# Análisis de monetización de Polaris Web Studio

## Fecha
14 de agosto de 2026.

## Hallazgos del repositorio

- Polaris ya tiene una marca premium, bilingüe y con estética dark/liquid-glass.
- La landing posiciona a Polaris como estudio de desarrollo web de alto impacto, con proyectos desde $299 USD.
- El repositorio ya incluye cotizador, captura de leads, WhatsApp, agenda, Firebase, Google Analytics, Atlas Assistant y contenido sobre SEO, Google Business Profile, Google Analytics, automatización de correo y e-commerce.
- El portafolio contiene tres prototipos propios: Lúmina Sky (turismo/hotel), Nexus Realty (inmobiliaria) y Chroma Tech Store (e-commerce). No deben presentarse como clientes pagantes ni como testimonios.
- El plan de marketing existente recomienda Punta Cana/RD, turismo, hoteles boutique, excursiones, restaurantes e inmobiliarias, con WhatsApp como canal de cierre.
- La auditoría CRO existente identifica como fugas principales la captura de correo sin WhatsApp, la falta de localización explícita en RD y la baja exposición de la oferta. También recomienda reforzar la captura de teléfono/WhatsApp.
- El proyecto compila correctamente con `npm run build`.
- El repositorio es React/Vite/TypeScript con Express, Firebase y despliegue preparado para Vercel.

## Hallazgos de fuentes externas

1. Google indica que Business Profile permite editar información de negocio, horarios, contacto, fotos, servicios, productos, preguntas y respuestas, y que la verificación puede ser necesaria para mostrar cambios en Search y Maps: https://support.google.com/business/answer/3039617?hl=en
2. Google presenta Business Profile como un canal gratuito para aparecer en Search y Maps, gestionar reseñas, compartir actualizaciones, mostrar servicios/productos, facilitar reservas y medir interacciones como llamadas, reseñas y reservas: https://business.google.com/us/business-profile/
3. WhatsApp Business Platform describe usos de generación de leads, conversaciones bidireccionales, catálogos/listas, flujos interactivos, recordatorios y automatización de soporte; la implementación avanzada puede requerir API, proveedor y configuración adicional: https://whatsappbusiness.com/products/business-platform/
4. Un competidor local visible en RD ofrece por separado optimización de Google Maps desde RD$5,000, automatización de WhatsApp desde RD$12,000, reservas desde RD$18,000, publicaciones desde RD$6,000 y mantenimiento desde RD$3,500/mes: https://impulsodigitalrd.com/

## Decisión provisional

La oferta más rápida y alineada con la capacidad actual no debe ser otra web completa. Debe ser un servicio productizado de visibilidad y recuperación de clientes, entregable en 48 horas, denominado provisionalmente “Polaris Local Lift” o “Polaris Lead Rescue”.

Oferta núcleo recomendada:

- Auditoría de Google Business Profile/Google Maps y WhatsApp.
- Optimización o checklist de datos, categorías, servicios, descripción, fotos, enlaces y llamadas a la acción.
- Menú de servicios/productos y respuestas preparadas para preguntas frecuentes.
- 15 respuestas personalizadas para reseñas y 10 mensajes de seguimiento para WhatsApp.
- 10 publicaciones listas para Google/Instagram.
- Miniinforme con problemas prioritarios y acciones de 7 días.
- Opcional: implementación asistida del perfil, catálogo o respuestas, siempre con autorización del propietario y sin inventar información.

## Precios de prueba

- Diagnóstico Express: USD 29 / RD$1,800–2,000; se puede descontar del paquete principal si compra en 7 días.
- Pack 48 Horas: USD 99 / RD$5,900; núcleo completo y entregable digital.
- Pack Implementado: USD 179–249 / RD$10,500–14,500; incluye configuración asistida y una revisión.
- Mantenimiento opcional: USD 49–99/mes / RD$3,000–6,000/mes; revisión de información, publicaciones y respuestas, sin prometer posiciones ni ventas garantizadas.

Estos precios son hipótesis iniciales para validar demanda, no afirmaciones de mercado ni garantías de ingresos.

## Principios de seguridad y confianza

- No prometer “salir primero en Google”, duplicar ventas ni resultados garantizados.
- No crear reseñas falsas, perfiles falsos, datos inventados ni testimonios ficticios.
- No solicitar contraseñas; usar acceso delegado, pantalla compartida o que el cliente realice la acción sensible.
- No publicar mensajes, contactar prospectos ni modificar perfiles sin autorización explícita en el momento de la acción.
- Los tres proyectos del portafolio se describirán como prototipos/conceptos propios, no como casos de clientes.

## Canales iniciales

- RD: WhatsApp, Instagram, Facebook Groups y contacto personal con hoteles boutique, excursiones, restaurantes, barberías, salones, clínicas, inmobiliarias y comercios locales.
- Internacional: inglés/español para servicios, cleaners, contractors, coaches, restaurantes y negocios de servicios con perfil local incompleto.
- Polaris debe usar su sitio actual como prueba de criterio visual y técnico, pero la nueva página debe vender el resultado de visibilidad y conversaciones, no páginas web.

## Verificación visual de Local Lift

- La ruta `/local-lift` carga correctamente con Vite después de permitir el host temporal de revisión.
- La página muestra encabezado bilingüe, CTA directo a WhatsApp, tres paquetes, proceso, límites de confianza y métodos de pago.
- La vista extraída confirmó que los enlaces de WhatsApp llevan el número de Polaris y mensajes prellenados.
- La primera carga incluye el cargador global del sitio; después renderiza la página completa. La compilación de producción finalizó correctamente.
- `npm run lint` sigue mostrando siete errores existentes en `src/pages/ClientDashboard.tsx`, no relacionados con Local Lift. `npm run build` sí finaliza correctamente y genera el chunk `LocalLift`.
