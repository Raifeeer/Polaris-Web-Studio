# Plan — Polaris Web Studio

Backlog de pendientes del negocio (no solo de código). Formato simple:
qué falta, contexto, y quién actúa.

## Pendientes activos

1. **RNC / razón social (11 jul 2026)** — Hoy Cristian opera solo, sin RNC
   propio todavía. Mientras se tramita la conversión a SRL, va a poder
   facturar con valor fiscal a nombre de otra persona (un tercero de
   confianza) como paso intermedio. Las páginas legales (`/terminos`,
   `/privacidad`) por ahora se redactan sin mencionar una razón social
   específica ni RNC — hay que volver a estos documentos cuando:
   - Se resuelva quién factura fiscalmente en el corto plazo (y agregar
     ese nombre/RNC a Términos si corresponde), y/o
   - Se complete el trámite de SRL propio (reemplazar por la razón
     social definitiva).

2. **Crear `privacidad@polarisweb.studio`** — La política de privacidad
   ya referencia este correo como canal oficial para solicitudes de
   datos (acceso/rectificación/cancelación/oposición). Falta crearlo de
   verdad en el proveedor de correo (Zoho Mail u otro) y confirmar que
   redirige/es monitoreado. Pendiente de que Cristian decida el
   proveedor — Claude Code puede ayudar con la configuración técnica
   (registros DNS, alias, etc.) cuando se defina.

3. **Sistema de eliminación de datos por retención (11 jul 2026)** — La
   política de privacidad define límites de retención reales (ver
   sección "Retención de datos" en `/privacidad`). Falta implementar el
   mecanismo técnico que efectivamente borre/anonimice datos vencidos:
   - `newsletter_subscribers` (Firestore): sin actividad de apertura de
     newsletter — hoy no se trackea apertura, así que por ahora el
     criterio es tiempo desde suscripción.
   - Leads del cotizador que no se convirtieron en cliente.
   - Cuentas del portal eliminadas (`deletedAt` en `DbUser` ya existe
     como soft-delete — falta un hard-delete/purga programada después
     del período de retención).
   Sugerido: Cloud Function o cron job similar al patrón que ya usa
   Meridian (`cloud-functions/*` + Cloud Scheduler) para correr esto
   periódicamente. No implementado todavía — solo la política está
   escrita, el enforcement técnico queda pendiente.
