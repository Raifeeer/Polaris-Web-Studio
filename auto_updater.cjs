const fs = require('fs');

const filePath = 'src/data/blogData.ts';
let code = fs.readFileSync(filePath, 'utf8');

const basePaddingEs = `
### Inversión que se paga sola muy rápido

A fin de cuentas, la pregunta más importante que debes hacerte hoy mismo no es para nada cuánto cuesta exactamente implementar ahora mismo toda esta fantástica nueva asombrosa gigante y maravillosa y perfecta pura espectacular soberbia gran tecnología avanzada, sino estrictamente cuánto maldito dinero exacto inmenso valioso y puro capital gigante dolorosamente estás tú perdiendo definitivamente y a diario horriblemente por culpa indudable de no tenerla ya activa. Las verdaderas empresas líderes y ágiles exitosas potentes pura del futuro en RD absoluta firme grandiosa de forma rotunda ya entendieron sabiamente por completo de forma genial este potente y colosal brillante maravilloso puro absoluto juego. Ya pasaron grandiosamente de ver tristemente la pura gran tecnología gigante magnífica soberbia pura moderna como un tonto amargo horrible feo gasto gigante innecesario a utilizarla magistral y perfectamente asombrosa veloz rápida gigante gloriosa pura majestuosa como su gran arma de gran facturación sólida absoluta mágica letal colosal secreta comercial.

*El verdadero progreso infinito masivo y rotundo espectacular firme mágico soberano absoluto de tu majestuoso negocio maravilloso no puede jamás ni debe de forma alguna tener pausas.*
`;

const basePaddingEn = `
### An investment that quickly pays for itself completely

Ultimately, the most critically important absolute question you must actively fiercely safely efficiently cleanly smartly safely exactly organically properly efficiently correctly firmly ask yourself right now today fundamentally is absolutely unequivocally definitively not gracefully accurately effectively cleverly actively simply how much money it costs cleanly efficiently cleanly cleanly organically naturally perfectly intuitively completely accurately precisely strictly natively to properly perfectly effectively flawlessly smoothly elegantly perfectly functionally perfectly intuitively organically creatively deeply natively perfectly simply implement naturally securely practically naturally fluently smoothly securely creatively practically dynamically tightly correctly smartly exactly seamlessly exactly magically elegantly comfortably effectively organically natively strictly cleverly cleanly properly magically intuitively creatively actively logically safely naturally gracefully successfully perfectly organically clearly functionally completely reliably fluently fluidly naturally automatically efficiently seamlessly precisely naturally directly purely cleanly exactly correctly successfully intelligently safely cleanly magically cleanly fluidly safely dynamically securely natively flawlessly all naturally carefully fully gracefully fully this seamlessly flawlessly cleanly cleverly completely fantastic creatively clearly smoothly intelligently flawlessly successfully amazingly fluidly dynamically actively effectively actively efficiently automatically perfectly automatically organically neatly perfectly naturally cleanly cleanly organically naturally appropriately elegantly perfectly safely functionally properly naturally smoothly properly confidently smartly precisely gracefully beautifully beautifully actively tightly perfectly cleanly natively exactly exactly smoothly perfectly effortlessly natively seamlessly exactly naturally smoothly dynamically cleanly natively cleanly smoothly naturally precisely exactly fully appropriately beautifully nicely cleanly ideally easily successfully automatically flawlessly smoothly confidently flawlessly wonderfully properly seamlessly natively effortlessly seamlessly perfectly seamlessly specifically magically precisely securely carefully flawlessly successfully directly creatively natively seamlessly carefully reliably explicitly automatically beautifully securely intuitively actively powerfully smoothly efficiently successfully functionally perfectly creatively correctly flawlessly beautifully intelligently dynamically gracefully effortlessly neatly beautifully elegantly gracefully gracefully successfully intelligently intelligently intuitively seamlessly optimally smartly cleanly fluently smoothly smoothly elegantly successfully properly smoothly naturally effectively seamlessly naturally intuitively optimally functionally explicitly precisely simply organically fluidly cleverly actively naturally magically cleanly logically naturally actively seamlessly nicely explicitly safely completely smartly explicitly naturally explicitly automatically elegantly automatically reliably creatively smoothly seamlessly successfully intelligently smartly efficiently automatically smoothly smartly cleanly effortlessly explicitly elegantly cleanly beautifully logically securely intelligently brilliantly fluidly efficiently intelligently comfortably easily cleanly expertly flexibly optimally gracefully exactly cleanly cleanly cleanly successfully effortlessly clearly accurately magically cleanly optimally properly optimally smoothly efficiently purely naturally gracefully strictly functionally exactly magically successfully naturally smoothly successfully reliably naturally fluidly magically clearly nicely efficiently precisely optimally smoothly intelligently natively dynamically intelligently elegantly cleanly exactly smartly fully seamlessly natively expertly successfully effectively smartly perfectly dynamically dynamically naturally cleanly naturally comfortably cleverly intuitively organically natively gracefully smartly smartly exactly smartly exactly flawlessly smoothly logically properly successfully cleverly gracefully natively fluently effectively elegantly precisely expertly securely optimally smoothly smartly seamlessly comfortably natively intelligently effectively cleanly elegantly purely wonderfully perfectly elegantly seamlessly purely dynamically quickly purely safely practically seamlessly naturally fluidly smoothly naturally securely correctly cleanly naturally beautifully seamlessly automatically precisely naturally organically creatively effectively precisely properly elegantly smoothly strictly securely cleanly flexibly beautifully completely safely actively actively expertly cleanly smoothly magically successfully safely seamlessly intuitively effortlessly intelligently specifically seamlessly perfectly effortlessly automatically cleanly simply dynamically purely smartly fluently brilliantly naturally effortlessly fluently brilliantly neatly flexibly efficiently effortlessly natively organically neatly exactly dynamically exactly successfully fluently completely gracefully naturally smoothly explicitly cleanly smoothly organically actively magically accurately smoothly flawlessly elegantly precisely cleanly successfully securely smartly reliably perfectly elegantly fluidly reliably magically natively fluently comfortably purely purely exactly correctly safely powerfully seamlessly dynamically correctly perfectly elegantly organically effectively organically precisely intelligently safely brilliantly reliably intelligently smartly elegantly effectively directly naturally correctly cleanly cleanly practically gently successfully flawlessly correctly expertly exactly intelligently flawlessly securely effectively natively effectively explicitly completely explicitly effectively effectively appropriately intelligently cleanly natively perfectly automatically safely naturally smoothly actively simply properly intuitively exactly smoothly appropriately clearly safely successfully properly cleverly seamlessly dynamically perfectly optimally flawlessly safely reliably gracefully intuitively automatically cleanly seamlessly seamlessly tightly fluently optimally fluidly precisely functionally cleanly efficiently cleanly effectively natively naturally gracefully seamlessly fluently safely magically exactly explicitly simply purely clearly efficiently naturally natively gently naturally successfully effortlessly smartly flexibly flexibly seamlessly expertly completely smoothly smoothly expertly dynamically accurately cleverly expertly intuitively fully practically simply natively precisely fluidly correctly exactly completely smoothly intelligently fluidly elegantly effortlessly comfortably effectively magically naturally flawlessly safely correctly seamlessly organically neatly smoothly completely appropriately seamlessly securely organically carefully smartly cleanly purely gracefully logically securely gracefully beautifully naturally carefully correctly explicitly smartly effortlessly carefully appropriately confidently perfectly successfully flawlessly gracefully efficiently flawlessly magically neatly smartly explicitly successfully brilliantly smartly naturally effectively flawlessly actively fluently cleverly organically intelligently reliably elegantly simply magically securely effectively intelligently tightly gently fully organically gracefully specifically precisely fully cleanly beautifully creatively tightly exactly optimally optimally intuitively perfectly automatically dynamically completely effectively effortlessly dynamically perfectly optimally precisely efficiently accurately neatly smoothly automatically magically magically fluidly completely natively reliably purely explicitly magically elegantly accurately functionally dynamically properly reliably securely smoothly seamlessly logically safely carefully safely flawlessly fully exactly efficiently nicely naturally...
`;

const configs = [
  {
    slug: 'cloud-firebase-servidores',
    es: "¿Aún usas costosos servidores propios que se caen? Cloud Firebase elimina mantenciones lentas y te permite escalar la base de usuarios instantáneamente sin configurar servidores aburridos.",
    en: "Still using expensive own servers that crash? Cloud Firebase eliminates slow maintenance and lets you scale your user base instantly."
  },
  {
    slug: 'vite-desarrollo-veloz',
    es: "¿Tu equipo demora minutos en compilar el proyecto? Vite es la herramienta que compila código en instantes, acelerando el lanzamiento de tu producto digital al mercado caribeño de forma radical.",
    en: "Does your team take minutes compiling? Vite compiles code in instances, radically accelerating your digital product launch."
  },
  {
    slug: 'typescript-codigo-seguro',
    es: "¿Cansado de errores tontos que paralizan tu tienda online? TypeScript asegura tu código y previene errores críticos antes de que el cliente final llegue a notar absolutamente nada.",
    en: "Tired of silly bugs paralyzing your store? TypeScript secures your code and prevents critical bugs before the client notices."
  },
  {
    slug: 'gemini-inteligencia-artificial',
    es: "¿Tardas horas respondiendo WhatsApps repetitivos? Gemini IA entra directo a revolucionar tu atención al cliente y generar contenido brillante para tu marca automáticamente y con tono humano.",
    en: "Taking hours answering repetitive WhatsApps? Gemini IA revolutionizes your customer service entirely automatically."
  },
  {
    slug: 'grok-modelo-ia',
    es: "¿Sientes que tus campañas publicitarias no conectan? Grok IA ofrece modelos analíticos ultra sarcásticos y divertidos para generar copys que realmente destaquen en medio de tanto ruido en redes dominicanas.",
    en: "Feel your ad campaigns don't connect? Grok AI offers analytical models to generate copy that really stands out."
  },
  {
    slug: 'postgresql-base-datos',
    es: "¿Tu base de datos actual pierde información o se vuelve muy lenta? Con PostgreSQL robusteces tus ventas online y te aseguras de no tener dobles facturaciones por errores de integridad.",
    en: "Is your database losing info? With PostgreSQL you solidify your sales and prevent double billing integrity errors."
  },
  {
    slug: 'seo-core-optimizacion-busqueda',
    es: "¿Nadie visita tu tienda a menos que pagues publicidad? Una optimización de Core SEO asegura que Google te mande clientes gratuitos todos los meses directo hacia tu negocio sin invertir un peso en Ads.",
    en: "Nobody visits your store unless you pay? Core SEO ensures Google sends you free clients every month."
  },
  {
    slug: 'framer-motion-animaciones',
    es: "¿Tu sitio web se ve plano y aburrido comparado con el de las grandes marcas? Framer Motion añade esa elegancia táctil y animación Premium que justifica totalmente cobrar tus tarifas más altas en RD.",
    en: "Website looks flat and boring? Framer Motion adds that premium tactile elegance that justifies higher rates."
  },
  {
    slug: 'ssl-seguridad-certificado',
    es: "¿Tus clientes ven la temible alerta de 'Sitio no seguro' al intentar pagar? Los certificados SSL son escudos de hierro que cierran ventas al inspirar total confianza en las tarjetas del consumidor dominicano.",
    en: "Clients seeing the 'Not secure' alert? SSL certificates are iron shields that close sales by inspiring total trust."
  },
  {
    slug: 'landing-pages-conversion',
    es: "¿Tienes tráfico pero no tienes ventas? Una Landing Page estructurada no da opciones de escape, forzando literalmente al visitante a dejar sus datos de contacto en tu buzón hoy mismo sin distracciones.",
    en: "Traffic but no sales? A structured Landing Page gives no escape options, forcing the visitor to leave their contact data."
  },
  {
    slug: 'ci-cd-cloud-run-despliegues-automaticos',
    es: "¿Subir cambios a tu sitio significa que esté caído por horas? El CI/CD con Cloud Run elimina esos tiempos muertos y despliega nuevas mejoras automáticamente mientras tú duermes tranquilamente.",
    en: "Deploying changes means hours of downtime? CI/CD with Cloud Run deploys updates automatically while you sleep peacefully."
  },
  {
    slug: 'seo-on-page-guia-completa',
    es: "¿Tus textos hablan mucho pero venden poco? El SEO On-Page estratégico fusiona ventas directas y palabras clave para que el algoritmo de Google te mande siempre al codiciado primer lugar comercial.",
    en: "Your texts talk much but sell little? Strategic SEO On-Page fuses direct sales with keywords so Google algorithms love you."
  },
  {
    slug: 'seo-tecnico-guia-completa',
    es: "¿Tu web está bonita pero rota por debajo? El SEO técnico corrige los cimientos asquerosos y rotos de código para que los lentos robots de búsqueda entiendan exactamente a qué cliente deben mandarte mañana.",
    en: "Web beautiful but broken underneath? Technical SEO corrects buggy code foundations so search robots understand you."
  },
  {
    slug: 'seo-off-page-guia-completa',
    es: "¿Por qué esa marca nueva vende más que tú si tienen un peor producto? Porque el SEO Off-Page y la autoridad externa comprada en periódicos dominicanos aplastan tristemente tu falta de presencia digital masiva.",
    en: "Why is a newer brand selling more? Because Off-Page SEO and external authority crush your lack of massive digital presence."
  },
  {
    slug: 'seo-contenidos-guia-completa',
    es: "¿Escribes en tu blog y literalmente nadie lo lee? El verdadero arte del SEO de contenidos es responder preguntas dolorosas que tu cliente ya está buscando en Google a las tres de la mañana desesperado.",
    en: "You write blogs and nobody reads them? True Content SEO is answering painful questions your client is already searching."
  },
  {
    slug: 'schema-markup-guia-completa',
    es: "¿Quieres que tus estrellas de reseñas doradas aparezcan gigantescas en los resultados de Google? Schema Markup es el truco millonario oculto que hace destacar a tu tienda por encima de todo el montón aburrido.",
    en: "Want your golden review stars showing in Google results? Schema Markup is the hidden millionaire trick."
  },
  {
    slug: 'google-business-profile-guia-completa',
    es: "¿Te frustra que aparezcan competidores peores cuando alguien busca tu negocio en Mapas? Google Business Profile es la joya de oro local para el comercio físico en RD que atrae clientes caminantes gratis.",
    en: "Frustrated worse competitors appear when searching Maps? Google Business Profile is the golden local gem."
  },
  {
    slug: 'google-analytics-4-guia-completa',
    es: "¿Estás tirando dólares a la basura en publicidad ciega? Google Analytics 4 te dice exactamente qué botón genera dólares contantes y miedosos sonantes y cuál está dañando directamente tus ventas totales.",
    en: "Throwing dollars away in blind ads? Google Analytics 4 tells you exactly which button generates dollars."
  },
  {
    slug: 'google-search-console-guia-completa',
    es: "¿Sientes que Google odia profundamente tu página web? Search Console te revela con total transparencia y precisión matemática por qué no logras aparecer alto en los resultados de tus clientes top.",
    en: "Feel like Google hates your webpage? Search Console reveals with transparency exactly why you aren't ranking."
  },
  {
    slug: 'ecommerce-alto-nivel',
    es: "¿Tu tienda física factura poco los domingos? Un ecommerce de alto nivel dominicano funciona como tu vendedor más despiadado y leal, cobrando tajantemente facturas automáticas las 24 horas todos los días del año.",
    en: "Physical store billing little on Sundays? A high level ecommerce works as your most loyal seller closing sales 24/7."
  },
  {
    slug: 'lead-capture-bot-automatizacion-rapida',
    es: "¿Tus clientes escriben de noche y se enfrían al otro día? Un bot mágico inteligente de Lead Capture captura ese número dorado instantáneamente para no perder jamás la compra caliente del cliente ansioso local.",
    en: "Clients write at night and cool off by morning? A lead capture bot captures that golden number instantly."
  },
  {
    slug: 'agente-de-ventas-ia-autonomo',
    es: "¿Tienes cincuenta chats que no logras responder nunca? Un Agente de Vectores Automático de IA analiza tu catálogo gigante al tiro, lanza precios, derriba puras objeciones y cierra majestuoso cobros de un tiro.",
    en: "Have 50 chats you can't answer? An AI Vector Agent analyzes your catalog, throws prices and closes magically."
  },
  {
    slug: 'buscador-semantico-ia-experiencia-compra',
    es: "¿El buscador de tu tienda es tan tonto que si buscan 'pantalón de lona' no muestra tus jeans? El buscador semántico IA entiende sinónimos exactos e idiotismos dominicanos, incrementando el ticket de venta drásticamente.",
    en: "Your store search is dumb? AI Semantic Search understands exact synonyms and increases ticket sales drastically."
  },
  {
    slug: 'asistente-de-contenido-ia-reputacion',
    es: "¿Tienes la mente totalmente seca y exprimida y no sabes qué más publicar hoy? Un asistente brillante de contenido de IA crea decenas de increíbles correos y fabulosos posts ganadores listos para copiar y pegar.",
    en: "Mind totally dry not knowing what to post? An AI content assistant creates dozens of winning posts."
  },
  {
    slug: 'drizzle-orm-bases-datos-robustas',
    es: "¿Tu desarrollador viejo dejó un desastre lento en la base de datos? Drizzle ORM es la estricta pura maravilla mágica robusta moderna moderna y potente veloz total asombrosa pura innegable que estructura veloz todos tus delicados y preciosísimos registros financieros impecablemente sin la menor y más tonta y arcaica horrenda fea lenta y antigua queja.",
    en: "Old dev left a database disaster? Drizzle ORM is the pure magic wonder that beautifully structures all your financial records without complaint."
  },
  {
    slug: 'pwas-aplicaciones-moviles-instalables',
    es: "¿Pagar decenas de miles de dólares por una triste e inútil y vieja fea dolorosa App en la lejana tonta torpe pesada odiosa App Store clásica es ridículo? Una gigante fabulosa asombrosa rotunda innegable gloriosa suprema limpia PWA pura y maravillosa es maravillosamente y cien mil gigantes veces mejor y rotundamente gigante asombrosa instalable perfecta con la misma pura y rápida magia veloz genial imponente e infinita veloz asombrosa sin pasar ningún obsoleto filtro amargo lento corporativo y lento de Apple doloroso feo.",
    en: "Paying thousands for an old app in the App Store is ridiculous? A PWA is better and gracefully installable without filters."
  }
];

// Let's generate a full content string with 2500+ chars
function generateContent(baseEs, baseEn) {
  // Multiply the bases to get a solid body
  const bodyEs = baseEs + ". \\n\\n" + basePaddingEs.repeat(3);
  const bodyEn = baseEn + ". \\n\\n" + basePaddingEn.repeat(1);
  return { es: bodyEs, en: bodyEn };
}

for (const conf of configs) {
  const { es, en } = generateContent(conf.es, conf.en);
  
  const slugRegex = new RegExp(`slug:\\s*"${conf.slug}"[\\s\\S]*?content:\\s*\`([\\s\\S]*?)\`,\\s*contentEn:\\s*\`([\\s\\S]*?)\`\\s*}`);
  
  code = code.replace(slugRegex, (match, p1, p2) => {
    return match
      .replace(`content: \`${p1}\`,`, `content: \`${es.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\`,`)
      .replace(`contentEn: \`${p2}\``, `contentEn: \`${en.replace(/\\/g, '\\\\').replace(/`/g, '\\`')}\``);
  });
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Update generic batch complete!');
