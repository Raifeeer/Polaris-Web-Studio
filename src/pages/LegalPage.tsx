import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";
import { resetCookieConsent } from "../lib/cookieConsent";

type LegalPageKind = "privacy" | "terms" | "cookies";

interface LegalPageProps {
  page: LegalPageKind;
}

const LAST_UPDATED = "11 de julio de 2026";
const LAST_UPDATED_EN = "July 11, 2026";

function Section({
  heading,
  children,
  highlight,
}: {
  heading: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <section
      className={`space-y-3 ${
        highlight
          ? "p-6 rounded-2xl bg-[var(--color-primary-base)]/5 border border-[var(--color-primary-base)]/20"
          : ""
      }`}
    >
      <h2 className="font-display font-bold text-xl md:text-2xl text-[var(--color-text-primary)] tracking-tight">
        {heading}
      </h2>
      <div className="space-y-3 text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-bold text-base text-[var(--color-text-primary)] pt-2">
      {children}
    </h3>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-10">
      <Section heading={<T en="1. Who is responsible for your data">1. Quién es responsable de tus datos</T>}>
        <p>
          <T en="Polaris Web Studio is a web development agency operated by Cristian, based in the Dominican Republic and working fully remotely (no physical office). For this policy, Polaris Web Studio is the party responsible for deciding how and why your personal data is processed.">
            Polaris Web Studio es una agencia de desarrollo web operada por Cristian, con base en
            República Dominicana y trabajo 100% remoto (sin oficina física). Para efectos de esta
            política, Polaris Web Studio es quien decide cómo y para qué se usan tus datos
            personales.
          </T>
        </p>
        <p>
          <T en="At the time of writing, Polaris Web Studio operates as a sole proprietor (not yet incorporated as an SRL). This section will be updated once incorporation is complete.">
            Al momento de escribir esto, Polaris Web Studio opera como persona física (todavía no
            está constituida como SRL). Esta sección se actualizará cuando se complete ese
            trámite.
          </T>
        </p>
      </Section>

      <Section heading={<T en="2. What data we collect and why">2. Qué datos recolectamos y para qué</T>}>
        <SubHeading><T en="Quote requests (Get a Quote wizard)">Solicitud de cotización (cotizador)</T></SubHeading>
        <p>
          <T en="Name, email, phone number, and the project details/preferences you select. We use this to prepare and send you a quote, and to follow up about it. This data is temporarily saved in your browser (localStorage) while you complete the wizard, and sent to us only when you submit or explicitly save it.">
            Nombre, correo, teléfono, y los detalles/preferencias del proyecto que elegís. Lo
            usamos para preparar y enviarte una cotización, y para dar seguimiento. Estos datos se
            guardan temporalmente en tu navegador (localStorage) mientras completás el
            formulario, y nos llegan recién cuando lo enviás o guardás explícitamente.
          </T>
        </p>
        <SubHeading><T en="Newsletter">Newsletter</T></SubHeading>
        <p>
          <T en="Only your email address, used to send you articles about growing your business with technology. You can unsubscribe at any time by writing to us.">
            Solo tu correo electrónico, usado para enviarte artículos sobre cómo hacer crecer tu
            negocio con tecnología. Podés darte de baja cuando quieras escribiéndonos.
          </T>
        </p>
        <SubHeading><T en="Client portal">Portal de clientes</T></SubHeading>
        <p>
          <T en="If you become a client, we store your name, email, company name, and an encrypted password (hashed, never stored in plain text) to give you access to your project dashboard — deliverables, invoices, meetings, and updates.">
            Si te convertís en cliente, guardamos tu nombre, correo, nombre de empresa, y una
            contraseña cifrada (hasheada, nunca en texto plano) para darte acceso a tu panel de
            proyecto — entregables, facturas, reuniones y novedades.
          </T>
        </p>
        <SubHeading><T en="Payments">Pagos</T></SubHeading>
        <p>
          <T en="Invoices in your portal can be paid via PayPal or manually confirmed (bank transfer / cash). We never see or store your card or bank account numbers — PayPal processes online payments directly, and we only receive confirmation of payment status and amount.">
            Las facturas en tu portal se pueden pagar vía PayPal o confirmarse manualmente
            (transferencia bancaria / efectivo). Nunca vemos ni guardamos tu número de tarjeta o
            cuenta bancaria — PayPal procesa los pagos en línea directamente, y a nosotros solo
            nos llega la confirmación del estado y monto del pago.
          </T>
        </p>
        <SubHeading><T en="Scheduled meetings">Reuniones agendadas</T></SubHeading>
        <p>
          <T en="If you book a call with us, the scheduling is handled by Cal.com, a third-party service that will also receive your name and email to confirm the booking.">
            Si agendás una llamada con nosotros, la reserva la gestiona Cal.com, un servicio de
            terceros que también va a recibir tu nombre y correo para confirmar la cita.
          </T>
        </p>
        <SubHeading><T en="AI assistant (Atlas Terminal)">Asistente de IA (Atlas Terminal)</T></SubHeading>
        <p>
          <T en="Messages you send to our chat assistant are processed by Google Gemini, with xAI Grok as a fallback if Gemini is unavailable. We don't ask you for sensitive personal data through the chat, and you shouldn't share any either.">
            Los mensajes que le escribís a nuestro asistente de chat se procesan con Google
            Gemini, con xAI Grok como respaldo si Gemini no está disponible. No te pedimos datos
            personales sensibles por el chat, y te recomendamos no compartir ninguno.
          </T>
        </p>
        <SubHeading><T en="Site usage (analytics)">Uso del sitio (analítica)</T></SubHeading>
        <p>
          <T en="Only if you accept analytics cookies in our cookie banner, we use third-party analytics tools to understand which pages are visited and how — see our">
            Solo si aceptás las cookies analíticas en nuestro banner, usamos herramientas de
            analítica de terceros para entender qué páginas se visitan y cómo — ver nuestra
          </T>{" "}
          <a href="/cookies" className="text-[var(--color-primary-base)] underline">
            <T en="Cookie Policy">Política de Cookies</T>
          </a>
          .
        </p>
      </Section>

      <Section heading={<T en="3. Legal basis for processing">3. Base legal para el tratamiento</T>}>
        <p>
          <T en="We process your data based on: (a) your consent (quote form, newsletter, analytics cookies, AI chat); (b) the performance of a contract (client portal, invoicing, project delivery); and (c) our legitimate interest in operating and improving the service, always balanced against your rights.">
            Tratamos tus datos con base en: (a) tu consentimiento (formulario de cotización,
            newsletter, cookies analíticas, chat de IA); (b) la ejecución de un contrato (portal de
            clientes, facturación, entrega de proyectos); y (c) nuestro interés legítimo en operar
            y mejorar el servicio, siempre equilibrado con tus derechos.
          </T>
        </p>
      </Section>

      <Section heading={<T en="4. Who we share data with">4. Con quién compartimos tus datos</T>}>
        <p>
          <T en="We don't sell your data. We share it only with the service providers strictly necessary to run the site and portal, who process it on our behalf:">
            No vendemos tus datos. Los compartimos solo con los proveedores estrictamente
            necesarios para operar el sitio y el portal, que los procesan en nuestro nombre:
          </T>
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><T en="Google (Firebase / Google Cloud) — authentication, database, and hosting infrastructure.">Google (Firebase / Google Cloud) — autenticación, base de datos, e infraestructura de hosting.</T></li>
          <li><T en="Vercel — hosting and deployment of the site itself.">Vercel — hosting y despliegue del sitio en sí.</T></li>
          <li><T en="PayPal — online payment processing.">PayPal — procesamiento de pagos en línea.</T></li>
          <li><T en="Cal.com — meeting scheduling.">Cal.com — agenda de reuniones.</T></li>
          <li><T en="Google Gemini / xAI (Grok) — AI chat assistant.">Google Gemini / xAI (Grok) — asistente de chat con IA.</T></li>
          <li><T en="Third-party analytics providers — site usage analytics, only with your consent.">Proveedores de analítica de terceros — analítica de uso del sitio, solo con tu consentimiento.</T></li>
        </ul>
        <p>
          <T en="Most of these providers process data on servers located outside the Dominican Republic (mainly in the United States). By using our services, you accept this international transfer, which is necessary to provide them.">
            La mayoría de estos proveedores procesan datos en servidores fuera de República
            Dominicana (principalmente en Estados Unidos). Al usar nuestros servicios, aceptás esta
            transferencia internacional, necesaria para poder prestarlos.
          </T>
        </p>
        <p>
          <T en="We only disclose data to authorities if required by a valid legal order.">
            Solo revelamos datos a autoridades si nos lo exige una orden legal válida.
          </T>
        </p>
      </Section>

      <Section heading={<T en="5. How long we keep your data">5. Cuánto tiempo conservamos tus datos</T>}>
        <p>
          <T en="We keep personal data only for as long as it's needed for the purpose it was collected for:">
            Conservamos los datos personales solo el tiempo necesario para la finalidad por la que
            se recolectaron:
          </T>
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <T en="Newsletter: while you remain subscribed, or up to 24 months without activity, whichever comes first. You can unsubscribe at any time.">
              Newsletter: mientras sigas suscrito, o hasta 24 meses sin actividad, lo que ocurra
              primero. Podés darte de baja cuando quieras.
            </T>
          </li>
          <li>
            <T en="Quote requests that never became a project: 12 months from the last contact, then deleted.">
              Cotizaciones que nunca se convirtieron en proyecto: 12 meses desde el último
              contacto, luego se eliminan.
            </T>
          </li>
          <li>
            <T en="Client portal accounts: kept while you're an active client. If a project ends and there's no further activity, the account is deleted 90 days after you request it or after 24 months of inactivity.">
              Cuentas del portal de clientes: se conservan mientras seas cliente activo. Si un
              proyecto termina y no hay más actividad, la cuenta se elimina a los 90 días de que lo
              pidas, o a los 24 meses de inactividad.
            </T>
          </li>
          <li>
            <T en="Invoices and billing records: kept for 10 years, as required by Dominican tax regulations, even after your account is deleted — only the financial record (amounts, dates, service description) is kept for this purpose, not your portal login.">
              Facturas y registros de facturación: se conservan 10 años, según lo exige la
              normativa fiscal dominicana, incluso después de eliminarse tu cuenta — solo se
              conserva el registro financiero (montos, fechas, descripción del servicio) para este
              fin, no tu acceso al portal.
            </T>
          </li>
        </ul>
        <p className="text-xs text-[var(--color-text-tertiary)] italic">
          <T en="Note: the technical deletion mechanism for expired data is being built. Until it's finished, we honor deletion requests manually if you write to us.">
            Nota: el mecanismo técnico de eliminación automática todavía se está construyendo.
            Hasta que esté listo, atendemos pedidos de eliminación de forma manual si nos
            escribís.
          </T>
        </p>
      </Section>

      <Section heading={<T en="6. Your rights">6. Tus derechos</T>}>
        <p>
          <T en="Under Dominican Republic Law No. 172-13 on the Protection of Personal Data, you have the right to:">
            Según la Ley No. 172-13 sobre Protección de Datos de Carácter Personal de República
            Dominicana, tenés derecho a:
          </T>
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><T en="Access: know what data we have about you.">Acceso: saber qué datos tenemos sobre vos.</T></li>
          <li><T en="Rectification: correct inaccurate or outdated data.">Rectificación: corregir datos inexactos o desactualizados.</T></li>
          <li><T en="Cancellation: request deletion of your data when it's no longer necessary.">Cancelación: pedir que eliminemos tus datos cuando ya no sean necesarios.</T></li>
          <li><T en="Opposition: object to a specific use of your data (e.g. the newsletter).">Oposición: oponerte a un uso específico de tus datos (ej. el newsletter).</T></li>
        </ul>
        <p>
          <T en="To exercise any of these rights, write to us at">Para ejercer cualquiera de estos derechos, escribinos a</T>{" "}
          <a href="mailto:privacidad@polarisweb.studio" className="text-[var(--color-primary-base)] underline">
            privacidad@polarisweb.studio
          </a>
          . <T en="We'll respond within a reasonable timeframe, generally no more than 30 days.">Te respondemos en un plazo razonable, generalmente no mayor a 30 días.</T>
        </p>
      </Section>

      <Section heading={<T en="7. Security">7. Seguridad</T>}>
        <p>
          <T en="All traffic to our site travels encrypted (HTTPS). Portal passwords are stored using scrypt hashing, never in plain text. Our database has security rules that deny access by default, and only allow the specific operations each part of the site actually needs.">
            Todo el tráfico a nuestro sitio viaja cifrado (HTTPS). Las contraseñas del portal se
            guardan con hash scrypt, nunca en texto plano. Nuestra base de datos tiene reglas de
            seguridad que niegan el acceso por defecto, y solo permiten las operaciones específicas
            que cada parte del sitio realmente necesita.
          </T>
        </p>
      </Section>

      <Section heading={<T en="8. Minors">8. Menores de edad</T>}>
        <p>
          <T en="Our services are aimed at business owners and professionals of legal age. We don't knowingly collect data from minors under 18. If you believe a minor has provided us data, write to us and we'll delete it.">
            Nuestros servicios están dirigidos a dueños de negocio y profesionales mayores de edad.
            No recolectamos a sabiendas datos de menores de 18 años. Si creés que un menor nos
            proporcionó datos, escribinos y los eliminamos.
          </T>
        </p>
      </Section>

      <Section heading={<T en="9. Changes to this policy">9. Cambios a esta política</T>}>
        <p>
          <T en="We may update this policy as the site or our services change. We'll update the date below when we do. If a change is significant, we'll make it noticeable on the site.">
            Podemos actualizar esta política a medida que cambie el sitio o nuestros servicios.
            Actualizamos la fecha de abajo cuando eso pasa. Si un cambio es significativo, lo vamos
            a hacer notorio en el sitio.
          </T>
        </p>
      </Section>

      <Section heading={<T en="10. Contact">10. Contacto</T>}>
        <p>
          <T en="For anything related to this policy or your data:">Para cualquier tema relacionado a esta política o tus datos:</T>{" "}
          <a href="mailto:privacidad@polarisweb.studio" className="text-[var(--color-primary-base)] underline">
            privacidad@polarisweb.studio
          </a>
        </p>
      </Section>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-10">
      <Section heading={<T en="1. Acceptance of these terms">1. Aceptación de estos términos</T>}>
        <p>
          <T en="By using this site, requesting a quote, or becoming a client of Polaris Web Studio, you accept these Terms and Conditions. If you don't agree with any part, please don't use our services.">
            Al usar este sitio, solicitar una cotización, o convertirte en cliente de Polaris Web
            Studio, aceptás estos Términos y Condiciones. Si no estás de acuerdo con alguna parte,
            por favor no uses nuestros servicios.
          </T>
        </p>
        <p>
          <T en="Polaris Web Studio currently operates as a sole proprietorship based in the Dominican Republic, working fully remotely.">
            Polaris Web Studio opera actualmente como persona física con base en República
            Dominicana, con trabajo 100% remoto.
          </T>
        </p>
      </Section>

      <Section heading={<T en="2. Our services">2. Nuestros servicios</T>}>
        <p>
          <T en="We offer custom web development under three packages (Flash, Constellation, Nova), plus a client portal to track deliverables, invoices, and meetings for active projects. The exact scope, price, and timeline for your project are defined in the quote you accept, not in this document — this document governs the general relationship, not the specifics of a particular project.">
            Ofrecemos desarrollo web a medida bajo tres paquetes (Destello, Constelación, Nova), más
            un portal de clientes para seguir entregables, facturas y reuniones de proyectos
            activos. El alcance, precio y plazo exactos de tu proyecto quedan definidos en la
            cotización que aceptás, no en este documento — este documento rige la relación general,
            no los detalles de un proyecto en particular.
          </T>
        </p>
      </Section>

      <Section heading={<T en="3. Quote and hiring process">3. Proceso de cotización y contratación</T>}>
        <p>
          <T en="A quote request through our wizard is not a binding contract — it's the first step. The relationship becomes binding once you explicitly accept a specific quote (in writing, by email or through the portal) and, where applicable, pay the agreed deposit.">
            Una solicitud de cotización por el cotizador no es un contrato vinculante — es el
            primer paso. La relación se vuelve vinculante cuando aceptás explícitamente una
            cotización concreta (por escrito, por correo o desde el portal) y, cuando corresponda,
            pagás el anticipo acordado.
          </T>
        </p>
      </Section>

      <Section heading={<T en="4. Prices and payment methods">4. Precios y formas de pago</T>}>
        <p>
          <T en="Prices are those stated in your accepted quote, in the currency indicated there. We accept payment via PayPal (online) and bank transfer or cash (manually confirmed by us in your portal). Invoices paid manually are marked as paid once we verify receipt of funds.">
            Los precios son los indicados en tu cotización aceptada, en la moneda que ahí se
            indique. Aceptamos pago vía PayPal (en línea) y transferencia bancaria o efectivo
            (confirmado manualmente por nosotros en tu portal). Las facturas pagadas manualmente se
            marcan como pagadas una vez que verificamos la recepción de los fondos.
          </T>
        </p>
      </Section>

      <Section
        highlight
        heading={<T en="5. Refund policy">5. Política de reembolso</T>}
      >
        <p className="font-bold text-[var(--color-text-primary)]">
          <T en="This is a custom professional service, not a retail product — please read this section carefully before making a payment.">
            Este es un servicio profesional a medida, no un producto de venta al detalle — te
            pedimos leer esta sección con atención antes de hacer un pago.
          </T>
        </p>

        <SubHeading><T en="5.1 Deposit and start of work">5.1 Anticipo e inicio de trabajo</T></SubHeading>
        <p>
          <T en="Accepting a quote may require an upfront deposit to reserve the work slot and cover initial planning and design costs. Once work has started (kickoff, first design draft, or any deliverable has been produced), the deposit is non-refundable, except as described in section 5.4.">
            Aceptar una cotización puede requerir un anticipo para reservar el cupo de trabajo y
            cubrir los costos iniciales de planificación y diseño. Una vez iniciado el trabajo
            (kickoff, primer borrador de diseño, o cualquier entregable producido), el anticipo no
            es reembolsable, salvo lo descrito en la sección 5.4.
          </T>
        </p>

        <SubHeading><T en="5.2 Cancellation before work starts">5.2 Cancelación antes de iniciar el trabajo</T></SubHeading>
        <p>
          <T en="If you cancel before any work has begun, we refund 100% of the deposit, minus any payment processing fees already charged to us by PayPal or our bank (these are never refundable by Polaris, since they were already paid to a third party).">
            Si cancelás antes de que empiece cualquier trabajo, reembolsamos el 100% del anticipo,
            menos las comisiones de procesamiento de pago que ya nos hayan cobrado PayPal o el
            banco (esas nunca son reembolsables por Polaris, ya que se pagaron a un tercero).
          </T>
        </p>

        <SubHeading><T en="5.3 Cancellation after work has started">5.3 Cancelación después de iniciado el trabajo</T></SubHeading>
        <p>
          <T en="If you cancel after work has started, we invoice the value of work actually completed up to that point. If you had paid more than that value, we refund the difference; if you had paid less, the remaining balance for completed work becomes due. Any amount already spent on your behalf on third-party costs (domain names, premium licenses/plugins purchased at your request, etc.) is never refundable under any circumstance, as it has already been transferred to those providers.">
            Si cancelás después de que el trabajo empezó, facturamos el valor del trabajo
            efectivamente completado hasta ese momento. Si habías pagado más que ese valor,
            reembolsamos la diferencia; si habías pagado menos, el saldo restante por el trabajo
            completado queda pendiente de pago. Cualquier monto ya gastado en tu nombre en costos
            de terceros (dominios, licencias/plugins premium comprados a tu pedido, etc.) nunca es
            reembolsable bajo ninguna circunstancia, ya que fue transferido a esos proveedores.
          </T>
        </p>

        <SubHeading><T en="5.4 If we fail to deliver">5.4 Si nosotros no entregamos</T></SubHeading>
        <p>
          <T en="If Polaris Web Studio fails to deliver the agreed work for reasons attributable to us (not due to delays caused by you in providing content, access, or feedback), you're entitled to a full refund of the deposit if no substantial progress was delivered, or a proportional refund based on the progress actually delivered.">
            Si Polaris Web Studio no entrega el trabajo acordado por razones atribuibles a
            nosotros (no por demoras tuyas en proveer contenido, accesos, o retroalimentación),
            tenés derecho a un reembolso total del anticipo si no se entregó ningún avance
            sustancial, o a un reembolso proporcional según el avance efectivamente entregado.
          </T>
        </p>

        <SubHeading><T en="5.5 Revisions vs. refunds">5.5 Revisiones vs. reembolsos</T></SubHeading>
        <p>
          <T en="If you're not satisfied with a delivered result, our first step is always to work in good faith on reasonable adjustments within the scope agreed in your quote — not to issue a refund. A refund is only considered if we're unable to deliver a result reasonably aligned with what was agreed, after a genuine attempt at revisions.">
            Si no estás conforme con un resultado entregado, nuestro primer paso siempre es
            trabajar de buena fe en ajustes razonables dentro del alcance acordado en tu
            cotización — no emitir un reembolso. Un reembolso se considera solo si no logramos
            entregar un resultado razonablemente alineado con lo acordado, después de un intento
            genuino de revisiones.
          </T>
        </p>

        <SubHeading><T en="5.6 Subscriptions / recurring maintenance">5.6 Suscripciones / mantenimiento recurrente</T></SubHeading>
        <p>
          <T en="If your plan includes recurring monthly maintenance, you can cancel it at any time, effective at the end of the current billing cycle. Amounts already paid for the current cycle are not refunded.">
            Si tu plan incluye mantenimiento mensual recurrente, podés cancelarlo cuando quieras,
            con efecto al final del ciclo de facturación en curso. Los montos ya pagados del ciclo
            actual no se reembolsan.
          </T>
        </p>

        <SubHeading><T en="5.7 How refunds are processed">5.7 Cómo se procesan los reembolsos</T></SubHeading>
        <p>
          <T en="Refunds for payments made via PayPal are processed back to PayPal, to the original payment account. Refunds for payments made via bank transfer or cash are processed via bank transfer to an account under the name of the person who made the payment, and may require identity verification. All approved refunds are processed within 15 business days.">
            Los reembolsos de pagos hechos por PayPal se procesan de vuelta a PayPal, a la cuenta de
            pago original. Los reembolsos de pagos hechos por transferencia o efectivo se procesan
            por transferencia bancaria a una cuenta a nombre de quien hizo el pago, y pueden
            requerir verificación de identidad. Todo reembolso aprobado se procesa dentro de 15
            días hábiles.
          </T>
        </p>

        <SubHeading><T en="5.8 Payment disputes and chargebacks">5.8 Disputas de pago y contracargos</T></SubHeading>
        <p>
          <T en="Before opening a payment dispute (chargeback) with PayPal or your bank, you agree to first contact us at hola@polarisweb.studio so we can try to resolve the issue directly. Opening a dispute without first giving us the chance to respond is considered a breach of this agreement, and we reserve the right to present evidence of work delivered to the payment processor and to suspend any ongoing services associated with the disputed payment.">
            Antes de abrir una disputa de pago (contracargo) con PayPal o tu banco, aceptás
            contactarnos primero a hola@polarisweb.studio para intentar resolver el problema
            directamente. Abrir una disputa sin darnos antes la oportunidad de responder se
            considera un incumplimiento de este acuerdo, y nos reservamos el derecho de presentar
            evidencia del trabajo entregado al procesador de pago, y de suspender cualquier
            servicio en curso asociado al pago disputado.
          </T>
        </p>
      </Section>

      <Section heading={<T en="6. Delivery timelines and your responsibilities">6. Plazos de entrega y tus responsabilidades</T>}>
        <p>
          <T en="Delivery timelines stated in a quote assume timely delivery of content, access credentials, and feedback from you. Delays caused by you extend the timeline accordingly and don't count as a delay attributable to us.">
            Los plazos de entrega indicados en una cotización asumen que nos das a tiempo el
            contenido, accesos, y retroalimentación necesarios. Las demoras causadas por vos
            extienden el plazo en la misma medida, y no cuentan como una demora atribuible a
            nosotros.
          </T>
        </p>
      </Section>

      <Section heading={<T en="7. Intellectual property">7. Propiedad intelectual</T>}>
        <p>
          <T en="Once your project is fully paid for, you own the custom code, design, and content created specifically for you. This doesn't include third-party libraries, frameworks, plugins, or assets used to build it, which remain under their own respective licenses. Until full payment is received, all deliverables remain the property of Polaris Web Studio.">
            Una vez que tu proyecto está pagado en su totalidad, sos dueño del código, diseño y
            contenido a medida creado específicamente para vos. Esto no incluye librerías,
            frameworks, plugins o recursos de terceros usados para construirlo, que se mantienen
            bajo sus propias licencias. Hasta recibir el pago completo, todos los entregables siguen
            siendo propiedad de Polaris Web Studio.
          </T>
        </p>
      </Section>

      <Section heading={<T en="8. Client portal account">8. Cuenta del portal de clientes</T>}>
        <p>
          <T en="You're responsible for keeping your portal password confidential and for any activity under your account. Notify us immediately if you suspect unauthorized access.">
            Sos responsable de mantener tu contraseña del portal confidencial y de cualquier
            actividad bajo tu cuenta. Avisanos de inmediato si sospechás de un acceso no
            autorizado.
          </T>
        </p>
      </Section>

      <Section heading={<T en="9. Scheduled meetings">9. Reuniones agendadas</T>}>
        <p>
          <T en="Meeting scheduling through Cal.com is subject to Cal.com's own terms in addition to ours. Please give us reasonable notice if you need to reschedule.">
            La agenda de reuniones vía Cal.com está sujeta también a los términos propios de
            Cal.com, además de los nuestros. Te pedimos avisar con tiempo razonable si necesitás
            reprogramar.
          </T>
        </p>
      </Section>

      <Section heading={<T en="10. Limitation of liability">10. Limitación de responsabilidad</T>}>
        <p>
          <T en="We work to deliver a quality service, but we don't guarantee that the site or portal will be free of interruptions or errors at all times. To the extent permitted by Dominican law, our total liability for any claim related to our services is limited to the amount actually paid for the specific project in question.">
            Trabajamos para entregar un servicio de calidad, pero no garantizamos que el sitio o el
            portal estén libres de interrupciones o errores en todo momento. En la medida permitida
            por la ley dominicana, nuestra responsabilidad total por cualquier reclamo relacionado a
            nuestros servicios se limita al monto efectivamente pagado por el proyecto específico en
            cuestión.
          </T>
        </p>
      </Section>

      <Section heading={<T en="11. Governing law">11. Ley aplicable</T>}>
        <p>
          <T en="These terms are governed by the laws of the Dominican Republic. Any dispute will first be attempted to resolve directly between the parties before resorting to the competent courts of the Dominican Republic.">
            Estos términos se rigen por las leyes de la República Dominicana. Cualquier disputa se
            intentará resolver primero directamente entre las partes antes de recurrir a los
            tribunales competentes de República Dominicana.
          </T>
        </p>
      </Section>

      <Section heading={<T en="12. Changes to these terms">12. Cambios a estos términos</T>}>
        <p>
          <T en="We may update these terms as our services evolve. Changes apply to new quotes accepted after the update — an already-accepted quote is governed by the terms in effect when you accepted it.">
            Podemos actualizar estos términos a medida que evolucionan nuestros servicios. Los
            cambios aplican a cotizaciones nuevas aceptadas después de la actualización — una
            cotización ya aceptada se rige por los términos vigentes al momento en que la
            aceptaste.
          </T>
        </p>
      </Section>

      <Section heading={<T en="13. Contact">13. Contacto</T>}>
        <p>
          <a href="mailto:hola@polarisweb.studio" className="text-[var(--color-primary-base)] underline">
            hola@polarisweb.studio
          </a>
        </p>
      </Section>
    </div>
  );
}

function CookiesContent() {
  return (
    <div className="space-y-10">
      <Section heading={<T en="1. What are cookies">1. Qué son las cookies</T>}>
        <p>
          <T en="Cookies are small files a site saves on your device to remember information. We also use similar technologies, mainly your browser's localStorage, for the same kind of purpose.">
            Las cookies son archivos pequeños que un sitio guarda en tu dispositivo para recordar
            información. También usamos tecnologías similares, principalmente el localStorage de tu
            navegador, con el mismo tipo de propósito.
          </T>
        </p>
      </Section>

      <Section heading={<T en="2. Cookies/storage we always use (essential)">2. Cookies/almacenamiento que siempre usamos (esenciales)</T>}>
        <p>
          <T en="These don't require your consent because the site can't work properly without them:">
            Estos no requieren tu consentimiento porque el sitio no puede funcionar bien sin
            ellos:
          </T>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-left">
                <th className="py-2 pr-4 font-bold text-[var(--color-text-primary)]"><T en="Name">Nombre</T></th>
                <th className="py-2 pr-4 font-bold text-[var(--color-text-primary)]"><T en="Purpose">Propósito</T></th>
                <th className="py-2 font-bold text-[var(--color-text-primary)]"><T en="Duration">Duración</T></th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-[var(--color-border-subtle)]/50">
                <td className="py-2 pr-4 font-mono text-xs">polaris-theme</td>
                <td className="py-2 pr-4"><T en="Remembers your light/dark theme choice.">Recuerda tu elección de tema claro/oscuro.</T></td>
                <td className="py-2"><T en="Until you clear it">Hasta que lo borres</T></td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]/50">
                <td className="py-2 pr-4 font-mono text-xs">language</td>
                <td className="py-2 pr-4"><T en="Remembers your language choice (ES/EN).">Recuerda tu idioma elegido (ES/EN).</T></td>
                <td className="py-2"><T en="Until you clear it">Hasta que lo borres</T></td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]/50">
                <td className="py-2 pr-4 font-mono text-xs">portal_token</td>
                <td className="py-2 pr-4"><T en="Keeps you logged in to the client portal.">Mantiene tu sesión iniciada en el portal de clientes.</T></td>
                <td className="py-2"><T en="Until you log out">Hasta que cierres sesión</T></td>
              </tr>
              <tr className="border-b border-[var(--color-border-subtle)]/50">
                <td className="py-2 pr-4 font-mono text-xs">wizardQuote_*</td>
                <td className="py-2 pr-4"><T en="Saves your progress in the quote wizard so you don't lose it.">Guarda tu avance en el cotizador para que no lo pierdas.</T></td>
                <td className="py-2"><T en="Until submitted or cleared">Hasta que lo envíes o lo borres</T></td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-xs">polaris_cookie_consent</td>
                <td className="py-2 pr-4"><T en="Remembers your cookie preference (this exact choice).">Recuerda tu preferencia de cookies (esta elección).</T></td>
                <td className="py-2"><T en="Until you change it">Hasta que la cambies</T></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading={<T en="3. Optional analytics cookies (require your consent)">3. Cookies analíticas opcionales (requieren tu consentimiento)</T>}>
        <p>
          <T en={'We only load these if you click "Accept all" in our cookie banner. If you choose "Essential only", these are never loaded and no analytics cookies are set.'}>
            Solo las cargamos si hacés clic en "Aceptar todo" en nuestro banner de cookies. Si
            elegís "Solo esenciales", estas nunca se cargan y no se pone ninguna cookie analítica.
          </T>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-left">
                <th className="py-2 pr-4 font-bold text-[var(--color-text-primary)]"><T en="Category">Categoría</T></th>
                <th className="py-2 pr-4 font-bold text-[var(--color-text-primary)]"><T en="Purpose">Propósito</T></th>
                <th className="py-2 font-bold text-[var(--color-text-primary)]"><T en="Duration">Duración</T></th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-[var(--color-border-subtle)]/50">
                <td className="py-2 pr-4"><T en="Web traffic analytics">Analítica de tráfico web</T></td>
                <td className="py-2 pr-4"><T en="Understand how many people visit and which pages they use.">Entender cuánta gente visita y qué páginas usa.</T></td>
                <td className="py-2"><T en="Up to 14 months">Hasta 14 meses</T></td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><T en="Session behavior analytics">Analítica de comportamiento de sesión</T></td>
                <td className="py-2 pr-4"><T en="Understand how visitors navigate (heatmaps and anonymized session recordings) to improve the site.">Entender cómo navegan los visitantes (mapas de calor y grabaciones de sesión anonimizadas) para mejorar el sitio.</T></td>
                <td className="py-2"><T en="Up to 12 months">Hasta 12 meses</T></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading={<T en="4. Third-party cookies outside our control">4. Cookies de terceros fuera de nuestro control</T>}>
        <p>
          <T en="If you use our meeting scheduler or pay an invoice through our online payment provider, those services may set their own cookies according to their own policies, independently of your choice on our banner — we don't control this. We recommend checking those providers' own cookie/privacy policies if you have questions.">
            Si usás nuestro agendador de reuniones o pagás una factura a través de nuestro
            proveedor de pagos en línea, esos servicios pueden poner sus propias cookies según sus
            propias políticas, independientemente de tu elección en nuestro banner — esto no lo
            controlamos nosotros. Te recomendamos revisar las políticas de cookies/privacidad
            propias de esos proveedores si tenés dudas.
          </T>
        </p>
      </Section>

      <Section heading={<T en="5. Managing your preferences">5. Gestionar tus preferencias</T>}>
        <p>
          <T en="You can change your cookie choice at any time from this page, or by clearing your browser's site data.">
            Podés cambiar tu elección de cookies cuando quieras desde esta página, o borrando los
            datos del sitio en tu navegador.
          </T>
        </p>
        <button
          onClick={() => resetCookieConsent()}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Cookie size={14} />
          <T en="Manage my cookies">Configurar mis cookies</T>
        </button>
      </Section>
    </div>
  );
}

export default function LegalPage({ page }: LegalPageProps) {
  const navigate = useNavigate();

  const titles: Record<LegalPageKind, React.ReactNode> = {
    privacy: <T en="Privacy Policy">Política de Privacidad</T>,
    terms: <T en="Terms and Conditions">Términos y Condiciones</T>,
    cookies: <T en="Cookie Policy">Política de Cookies</T>,
  };

  const content: Record<LegalPageKind, React.ReactNode> = {
    privacy: <PrivacyContent />,
    terms: <TermsContent />,
    cookies: <CookiesContent />,
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full pt-32 pb-20 px-6 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <T en="Back">Volver</T>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter mb-3 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-primary-base)] bg-clip-text text-transparent">
            {titles[page]}
          </h1>
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-text-tertiary)] mb-12">
            <T en={`Last updated: ${LAST_UPDATED_EN}`}>{`Última actualización: ${LAST_UPDATED}`}</T>
          </p>

          {content[page]}

          <p className="text-[var(--color-text-tertiary)] text-sm italic mt-12 pt-8 border-t border-[var(--color-border-subtle)]">
            <T en="This document was drafted based on the real services and features of this site. If you have questions before contacting a lawyer yourself, write to us at">
              Este documento se redactó en base a los servicios y funciones reales de este sitio.
              Si tenés dudas antes de consultar con un abogado, escribinos a
            </T>{" "}
            <a
              href="mailto:hola@polarisweb.studio"
              className="text-[var(--color-primary-base)] underline"
            >
              hola@polarisweb.studio
            </a>
            .
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
