import json
import re
from pathlib import Path

ROOT = Path('/home/ubuntu/Polaris-Web-Studio')
RESEARCH_PATH = Path('/home/ubuntu/research_polaris_business_ideas.json')
PROJECTIONS_PATH = ROOT / 'docs/POLARIS_PROJECTIONS.json'
OUT_PATH = ROOT / 'docs/POLARIS_BUSINESS_OPPORTUNITIES_2026.md'

research_rows = json.loads(RESEARCH_PATH.read_text())['results']
research = {}
for item in research_rows:
    obj = item.get('output') or {}
    key = obj.get('idea_name') or item.get('input')
    research[key] = obj
projections = {r['idea']: r for r in json.loads(PROJECTIONS_PATH.read_text())}

final_names = [
    'Polaris Local Lift',
    'Polaris Hospitality Conversion',
    'Polaris WhatsApp Revenue Desk',
    'Polaris VillaOps',
    'Polaris Tourism Content Engine',
    'Polaris Review & Reputation Desk',
    'Polaris Tour Yield Analytics',
    'Polaris AI Back Office',
    'Polaris Commerce Export',
    'Polaris Productized Knowledge',
]

def norm(name):
    return name.replace('Polaris Lead Marketplaces: generación y distribución de leads para servicios locales', 'Polaris Lead Marketplaces')

# Resolve the long candidate name used by the research output.
def get_research(name):
    if name in research:
        return research[name]
    for k, v in research.items():
        if name in k or k.startswith(name):
            return v
    raise KeyError(name)

scores = {
    'Polaris Local Lift': (5, 5, 4, 5, 4, 4, 27),
    'Polaris Hospitality Conversion': (5, 2, 4, 3, 3, 5, 22),
    'Polaris WhatsApp Revenue Desk': (5, 3, 4, 4, 2, 5, 23),
    'Polaris VillaOps': (5, 3, 4, 4, 3, 4, 23),
    'Polaris Tourism Content Engine': (5, 4, 3, 4, 3, 4, 23),
    'Polaris Review & Reputation Desk': (5, 5, 4, 5, 3, 4, 26),
    'Polaris Tour Yield Analytics': (4, 3, 4, 4, 3, 4, 22),
    'Polaris AI Back Office': (4, 5, 4, 5, 3, 5, 26),
    'Polaris Commerce Export': (4, 3, 3, 3, 2, 4, 19),
    'Polaris Productized Knowledge': (3, 5, 5, 4, 4, 5, 26),
    'Polaris Voice Receptionist': (4, 2, 3, 3, 1, 5, 18),
    'Polaris Lead Marketplaces': (3, 2, 4, 2, 2, 5, 18),
}
score_headers = ['Demanda','MVP 30 días','Margen potencial','Encaje Polaris','Riesgo/regulación','Escalabilidad']

checklists = {
    'Polaris Local Lift': [
        'Definir un vertical inicial y un alcance cerrado por perfil/ubicación.',
        'Crear plantilla de auditoría, consentimiento y autorización de acceso.',
        'Preparar herramientas de medición, reporte y seguimiento de llamadas, clics, rutas y mensajes.',
        'Conseguir fotografías/datos auténticos del cliente y revisar cada cambio antes de publicar.',
        'Medir baseline y resultados a 30–60 días sin prometer posiciones o ventas garantizadas.',
    ],
    'Polaris Hospitality Conversion': [
        'Elegir un motor de reservas/PMS compatible con el piloto y evitar integraciones no verificadas.',
        'Crear checklist CRO móvil, paridad, confianza, tarifas y ruta de reserva.',
        'Obtener Analytics, eventos del motor y baseline de sesiones, clics e inicio de reserva.',
        'Preparar benchmark de cinco competidores y un sprint de copy/UX con hipótesis de prueba.',
        'Firmar alcance, acceso y tratamiento de datos; medir reservas directas incrementales.',
    ],
    'Polaris WhatsApp Revenue Desk': [
        'Usar solamente WhatsApp Business Platform oficial con WABA, número y permisos del cliente.',
        'Definir opt-in, plantillas aprobadas, ventana de 24 horas y reglas de escalamiento humano.',
        'Crear una base de conocimiento aprobada y un único origen para precios/disponibilidad.',
        'Configurar webhooks, logs, métricas y límites de gasto de Meta/proveedor.',
        'Piloto de 14–30 días con conversaciones, tiempos de respuesta, leads y reservas atribuidas.',
    ],
    'Polaris VillaOps': [
        'Seleccionar portafolio pequeño y definir si Polaris coordina o solo digitaliza operaciones.',
        'Mapear calendarios, reservas, check-in, limpieza, mantenimiento y escalamiento.',
        'Preparar plantillas bilingües, tablero del propietario y reporte semanal.',
        'Crear red de proveedores verificados y protocolos de emergencias.',
        'Excluir custodia de fondos, cerraduras y APIs complejas hasta validar contratos y operación.',
    ],
    'Polaris Tourism Content Engine': [
        'Definir paquete de videos/fotos, número de revisiones, idiomas y derechos de uso.',
        'Preparar brief, guiones, calendario, casting/creadores y control de calidad.',
        'Obtener autorizaciones de imagen, música, propiedades, huéspedes y uso publicitario.',
        'Establecer costos por sesión, edición, traducción, traslados y material bruto.',
        'Vender un piloto de 30 días y medir reutilización, producción, engagement y señales de conversión.',
    ],
    'Polaris Review & Reputation Desk': [
        'Usar solo accesos/API autorizados y nunca comprar, fabricar o filtrar reseñas.',
        'Crear plantillas bilingües con revisión humana y protocolo de crisis.',
        'Configurar seguimiento de reseñas, alertas 1–2 estrellas y reporte mensual.',
        'Enviar solicitudes legítimas de feedback a todos los clientes elegibles.',
        'Medir tiempo de respuesta, temas, volumen, rating y renovación, no solo estrellas.',
    ],
    'Polaris Tour Yield Analytics': [
        'Elegir una categoría y un operador con cuatro semanas de reservas y costos reales.',
        'Definir un esquema CSV/Sheets para fechas, capacidad, ingresos, comisiones y costos.',
        'Construir dashboard de ocupación, ingreso neto, margen estimado y cancelaciones.',
        'Explicar reglas de precio y capacidad sin prometer predicción estadística prematura.',
        'Registrar decisiones tomadas y comparar antes/después antes de automatizar.',
    ],
    'Polaris AI Back Office': [
        'Elegir un nicho repetitivo: tours, wedding planners, property managers o agencias.',
        'Mapear un proceso y separar datos estructurados, documentos y aprobaciones humanas.',
        'Crear formularios, plantillas de propuestas, repositorio y tablero de seguimiento.',
        'Definir permisos, backups, retención, revisión humana y plan ante errores de IA.',
        'Cobrar implementación por alcance y mensualidad por soporte, no una consultoría ilimitada.',
    ],
    'Polaris Commerce Export': [
        'Seleccionar 3–5 productores y 10–20 SKUs no perecederos con márgenes verificables.',
        'Cotizar courier, impuestos y fulfillment para uno o dos países antes de prometer entregas.',
        'Crear bundles, checkout PayPal, catálogo bilingüe y tracking de pedidos.',
        'Verificar requisitos de FDA/aduanas y excluir categorías reguladas al inicio.',
        'Validar con preventa o depósito antes de comprar inventario o financiar envíos.',
    ],
    'Polaris Productized Knowledge': [
        'Elegir un resultado concreto: vender por WhatsApp, cotizar o dar seguimiento.',
        'Entrevistar emprendedores y construir ejemplos dominicanos, no plantillas genéricas.',
        'Crear kit en Google/Canva/Sheets y cuatro microlecciones con soporte limitado.',
        'Probar preventa con cinco pagos no subvencionados antes de producir una biblioteca grande.',
        'Medir activación, uso, reembolso, bundle, recompra y adquisición orgánica/pagada.',
    ],
}

validation_gates = {
    'Polaris Local Lift': 'Conservar si 20 prospectos producen al menos 3 conversaciones calificadas y 1 venta pagada; reformular si exigen garantía de ranking.',
    'Polaris Hospitality Conversion': 'Conservar si 3 de 10 propiedades pagan auditoría y al menos 1 permite implementar un test con baseline; detener si no hay acceso a datos.',
    'Polaris WhatsApp Revenue Desk': 'Escalar solo si 3–5 pilotos muestran reducción de tiempo de respuesta y al menos una reserva o lead atribuible por piloto.',
    'Polaris VillaOps': 'Avanzar si 2 de 5 pilotos pagan o firman con precio y se reduce tiempo administrativo sin depender de una red operativa improvisada.',
    'Polaris Tourism Content Engine': 'Avanzar si 2 pilotos pagan, el tiempo real de producción cabe en el precio y al menos uno renueva o recomienda.',
    'Polaris Review & Reputation Desk': 'Avanzar si 3 pilotos pagan y la respuesta humana por cuenta permite renovar con un SLA de 24–48 horas.',
    'Polaris Tour Yield Analytics': 'Avanzar si 5 pilotos entregan datos completos, toman decisiones con el tablero y al menos 3 renuevan.',
    'Polaris AI Back Office': 'Avanzar si 3 pilotos pagan, 2 autorizan caso de estudio y las excepciones no destruyen la capacidad.',
    'Polaris Commerce Export': 'Avanzar si una prueba de bundle obtiene 5 pagos/depositos con margen positivo después de shipping y PayPal.',
    'Polaris Productized Knowledge': 'Avanzar si una preventa logra 5 pagos no subvencionados y demuestra uso en 14 días.',
}

# Parse each candidate's local source list and use local inline citation links.
def parse_sources(raw):
    sources = {}
    for line in raw.splitlines():
        m = re.match(r'\s*(\d+)\.\s+(.*?)(?:\s+)(https?://\S+)\s*$', line.strip())
        if m:
            n, desc, url = m.groups()
            sources[n] = (desc.strip(), url.rstrip(').'))
    return sources

def linkify(text, sources):
    def repl(m):
        n = m.group(1)
        if n in sources:
            return f'[{n}]({sources[n][1]})'
        return m.group(0)
    return re.sub(r'\[(\d+)\]', repl, text)

def source_block(sources):
    if not sources:
        return ''
    lines = ['**Fuentes del estudio:**', '']
    for n, (desc, url) in sources.items():
        lines.append(f'[{n}]: {url} "{desc}"')
    return '\n'.join(lines)

def money(value):
    return f'US${value:,.0f}'

def projection_block(name):
    r = projections[name]
    return '\n'.join([
        '| Horizonte | Ingresos del escenario | Contribución antes de gastos fijos e impuestos |',
        '|---|---:|---:|',
        f"| 0–3 meses | {money(r['short_revenue'])} | {money(r['short_contribution'])} |",
        f"| 4–12 meses acumulado | {money(r['medium_revenue'])} | {money(r['medium_contribution'])} |",
        f"| Año 3, run-rate anual | {money(r['long_revenue_runrate'])} | {money(r['long_contribution_runrate'])} |",
        '',
        f"**Supuesto económico base:** {r['basis']}",
    ])

# Report header
lines = [
    '# Polaris Web Studio — Mapa de oportunidades de negocio 2026',
    '',
    '> **Documento de investigación y planificación.** Las proyecciones son escenarios construidos con supuestos explícitos, no promesas de ingresos, valoración ni asesoría financiera personalizada. La decisión de invertir tiempo o dinero corresponde al propietario y debe contrastarse con ventas reales, contabilidad y asesoría legal/fiscal local cuando aplique.',
    '',
    '**Fecha de corte:** 15 de agosto de 2026.  ',
    '**Mercado base:** Punta Cana/Bávaro y República Dominicana.  ',
    '**Mercado de expansión:** Caribe, Latinoamérica, diáspora dominicana y clientes internacionales atendibles remotamente.  ',
    '**Moneda de comparación:** USD. Los cobros locales pueden convertirse a RD$ al momento de cotizar; las comisiones de PayPal, impuestos y tipo de cambio no están incluidos salvo cuando se indique.  ',
    '**Autor:** Manus AI para Polaris Web Studio.',
    '',
    '## 1. Resumen ejecutivo',
    '',
    'Polaris no necesita convertirse inmediatamente en una empresa de software para aumentar ingresos. La estrategia más razonable es combinar un servicio de entrada rápido, servicios recurrentes con datos de clientes y, solo después de validar la demanda, activos más escalables. El servicio ya publicado, **Polaris Local Lift**, es la mejor puerta de entrada porque tiene alcance limitado, puede entregarse en 24–48 horas y utiliza un problema observable: convertir presencia local, Google Maps y WhatsApp en más contactos medibles sin prometer posiciones o ventas garantizadas.',
    '',
    'La investigación conserva diez líneas de negocio. La prioridad de corto plazo es Local Lift, Review & Reputation Desk y AI Back Office; las tres pueden venderse como servicios manual-productizados sin esperar una integración compleja. WhatsApp Revenue Desk, VillaOps, Tourism Content Engine y Commerce Export tienen buen encaje con Punta Cana, pero requieren controles técnicos y operativos. Hospitality Conversion, Tour Yield Analytics y Productized Knowledge son apuestas de validación y escalamiento. Se descartan de la cartera inicial **Voice Receptionist** y **Lead Marketplaces**: ambas pueden ser interesantes a largo plazo, pero combinan mayor riesgo técnico o de adquisición con evidencia local insuficiente.',
    '',
    '## 2. Qué se investigó y cómo se decidió',
    '',
    'Se investigaron doce candidatas mediante fuentes públicas, páginas de competidores, precios publicados, organismos dominicanos, informes sectoriales y referencias internacionales. Se separaron cinco capas: demanda observable, proxy de mercado, competencia/precios, facilidad de lanzar un MVP en 30 días y riesgo de ejecución. Cuando no apareció un dato local confiable, se marcó como **no encontrado** y se dejó como variable de validación; no se sustituyó por una cifra inventada.',
    '',
    '| Criterio | Cómo se interpreta |',
    '|---|---|',
    '| Demanda | Flujo turístico, digitalización, base empresarial, problemas observables o compras comparables. |',
    '| MVP 30 días | Posibilidad de vender una primera versión con herramientas existentes y sin construir infraestructura compleja. |',
    '| Margen potencial | Capacidad de cobrar por resultado/servicio por encima de los costes directos, considerando trabajo humano. |',
    '| Encaje Polaris | Acceso local, marca, web, contenido, automatización, ventas B2B y capacidad internacional. |',
    '| Riesgo/regulación | Riesgo de datos, pagos, plataforma, derechos, seguridad, integraciones y responsabilidad operativa. |',
    '| Escalabilidad | Posibilidad de estandarizar, delegar, automatizar o convertir componentes en ingresos recurrentes. |',
    '',
    '### Ranking de decisión',
    '',
    '| Idea | Demanda | MVP | Margen | Encaje | Riesgo/regulación | Escala | Total / 30 | Decisión |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---|',
]
for name in final_names + ['Polaris Voice Receptionist', 'Polaris Lead Marketplaces']:
    s = scores[name]
    decision = 'Conservar' if name in final_names else 'Descartar por ahora'
    label = name.replace('Polaris Lead Marketplaces: generación y distribución de leads para servicios locales', 'Polaris Lead Marketplaces')
    lines.append(f"| {label} | {s[0]} | {s[1]} | {s[2]} | {s[3]} | {s[4]} | {s[5]} | {s[6]} | {decision} |")

lines += [
    '',
    'La puntuación es una herramienta de priorización, no una probabilidad estadística. Un cinco no significa que el mercado esté garantizado; significa que, comparada con las otras candidatas, la idea merece más atención inicial bajo el contexto de Polaris.',
    '',
    '## 3. Contexto de mercado dominicano',
    '',
    'El entorno justifica una estrategia centrada en servicios digitales aplicados a negocios reales. La International Trade Administration reporta que siete de cada diez adultos dominicanos compran en línea, estima el comercio electrónico en aproximadamente **US$5.2 mil millones en 2024** y proyecta un crecimiento compuesto cercano a 17% hasta 2027. La misma fuente señala que el móvil es la plataforma empresarial más usada por las pymes, con 45% de penetración, y que PayPal es un método común para negocios dominicanos [1](https://www.trade.gov/country-commercial-guides/dominican-republic-ecommerce). Estas cifras son señales de adopción digital; no son el presupuesto disponible de Polaris.',
    '',
    'El Banco Mundial reporta que las mipymes representan **38% del PIB** y **54.5% del empleo** dominicano, mientras más de 85% de los pequeños negocios son informales. También describe fricciones de documentación y registro empresarial que pueden tardar entre 15 y 30 días [2](https://www.worldbank.org/en/region/lac/brief/verifiable-credentials-for-msmes-in-the-dominican-republic). Esto respalda servicios que reduzcan trabajo administrativo, pero no autoriza a Polaris a ofrecer asesoría legal, fiscal o regulatoria sin profesionales habilitados.',
    '',
    'El turismo sigue siendo el vertical con mayor densidad de oportunidad para Polaris. MITUR reportó **11.6 millones de visitantes en 2025**, aproximadamente 2.8 millones de cruceristas y cerca de 2,500 nuevas habitaciones [3](https://noticias.mitur.gob.do/noticias/republica-dominicana-marca-hito-historico-11-6-millones-de-visitantes-en-2025/). El flujo crea clientes potenciales para hoteles, villas, excursiones, restaurantes, transporte y proveedores B2B; no significa que todos sean compradores ni que una mejora digital produzca automáticamente ingresos.',
    '',
    '### Implicación estratégica',
    '',
    'La recomendación es vender primero **servicios estrechos con pago inicial**, después convertir los entregables repetidos en mensualidades y, finalmente, usar los datos de varios clientes para construir productos o software. Esta secuencia reduce el riesgo de invertir meses en una plataforma sin haber comprobado quién paga, cuánto paga y qué resultado valora.',
    '',
    '## 4. Proyecciones comparables',
    '',
    'La siguiente tabla usa un escenario base homogéneo para comparar magnitudes. No representa un presupuesto final. En servicios, “contribución” es ingresos menos costes directos estimados de implementación y operación; excluye gastos fijos, sueldo del propietario, impuestos, CAC no asignado, capital de trabajo, devoluciones extraordinarias y financiación. En Local Lift, el escenario asume vender el paquete de implementación de US$99 y añadir posteriormente una mensualidad hipotética; el diagnóstico de US$29 funciona como producto de adquisición y no se suma como si fuera recurrente.',
    '',
    '| Idea | 0–3 meses: ingresos | 0–3 meses: contribución | 4–12 meses: ingresos acumulados | 4–12 meses: contribución | Año 3: ingresos run-rate | Año 3: contribución run-rate |',
    '|---|---:|---:|---:|---:|---:|---:|',
]
for name in final_names:
    r = projections[name]
    lines.append(f"| {name} | {money(r['short_revenue'])} | {money(r['short_contribution'])} | {money(r['medium_revenue'])} | {money(r['medium_contribution'])} | {money(r['long_revenue_runrate'])} | {money(r['long_contribution_runrate'])} |")

lines += [
    '',
    '### Cómo leer las proyecciones',
    '',
    'El escenario usa adquisición mensual escalonada, churn mensual y costes directos por cuenta. Por ejemplo, una idea con una contribución alta en el año 3 puede requerir meses de ventas B2B antes de cobrar el primer contrato; una idea con menos ingresos puede ser mejor para generar liquidez inmediata. La primera métrica que debe sustituir estas hipótesis es el **tiempo real de entrega por cliente**; la segunda es la **tasa de cierre pagado**; la tercera es la **renovación a 30/90 días**.',
    '',
    'El modelo reproducible está en `docs/POLARIS_PROJECTIONS.csv`, `docs/POLARIS_PROJECTIONS.json` y `docs/POLARIS_PROJECTIONS.md`. Las cifras deben actualizarse después de los primeros pilotos.',
    '',
]

# Detailed sections
for idx, name in enumerate(final_names, 1):
    obj = get_research(name)
    sources = parse_sources(obj.get('sources', ''))
    p = projections[name]
    lines += [
        f'## {idx + 4}. {name}',
        '',
        f"### Tesis y comprador", '', linkify(obj.get('buyer_and_problem', ''), sources), '',
        '### Estudio de mercado', '',
        '**Evidencia de demanda.** ' + linkify(obj.get('demand_evidence', ''), sources), '',
        '**Proxy de mercado.** ' + linkify(obj.get('market_proxy', ''), sources), '',
        '**Competencia y precios.** ' + linkify(obj.get('competitor_and_pricing', ''), sources), '',
        '### Producto mínimo y venta inicial', '', linkify(obj.get('mvp_and_go_to_market', ''), sources), '',
        '### Barreras, cumplimiento y riesgos', '', linkify(obj.get('barriers_and_risks', ''), sources), '',
        '### Economía del modelo y proyección', '',
        projection_block(name), '',
        '**Supuestos específicos a validar.** ' + linkify(obj.get('key_assumptions_to_model', ''), sources), '',
        '### Veredicto de inversión de tiempo', '', linkify(obj.get('profitability_assessment', ''), sources), '',
        f"**Puerta de validación:** {validation_gates[name]}", '',
        '### Checklist de creación y oferta', '',
    ]
    for item in checklists[name]:
        lines.append(f'- [ ] {item}')
    lines += ['', source_block(sources), '']

lines += [
    '## 15. Ideas descartadas por ahora',
    '',
    '### Polaris Voice Receptionist',
    '',
    'La idea tiene demanda potencial y competidores reales, pero se descarta de la primera cartera porque exige precisión de voz bilingüe, telefonía, grabación, consentimiento, transferencia humana, monitoreo y posible integración con reservas. Un error puede afectar una llamada de compra o una urgencia. Puede reabrirse después de validar WhatsApp Revenue Desk y contar con un caso de uso de bajo riesgo, como preguntas frecuentes y captura de leads sin modificar reservas.',
    '',
    '### Polaris Lead Marketplaces',
    '',
    'El modelo de pago por lead es conocido internacionalmente, pero exige resolver simultáneamente adquisición de consumidores, proveedores disponibles, atribución, deduplicación, calidad, reembolsos y privacidad. La evidencia local de precio y disposición de pago en Punta Cana fue insuficiente. Puede probarse más adelante en un único vertical —por ejemplo, mantenimiento de villas— con cinco proveedores y preventa; no conviene construir un marketplace horizontal ahora.',
    '',
    '## 16. Secuencia recomendada de implementación',
    '',
    '| Fase | Qué vender | Objetivo de validación | No hacer todavía |',
    '|---|---|---|---|',
    '| 0–30 días | Local Lift, Review & Reputation Desk y AI Back Office | Cobrar los primeros pilotos, medir horas y obtener testimonios autorizados. | No construir SaaS general ni prometer resultados garantizados. |',
    '| 31–90 días | WhatsApp Revenue Desk, VillaOps y Productized Knowledge | Confirmar mensualidad, renovación y repetibilidad del onboarding. | No absorber costes de Meta, courier o integraciones sin trasladarlos claramente. |',
    '| 3–12 meses | Hospitality Conversion, Tourism Content Engine y Tour Yield Analytics | Crear casos verticales, alianzas y procedimientos delegables. | No vender a resorts corporativos como si fueran pymes de decisión rápida. |',
    '| 12+ meses | Commerce Export y productos derivados de datos | Escalar solo los flujos con margen y repetición demostrados. | No financiar inventario, shipping o nómina con proyecciones no validadas. |',
    '',
    '## 17. Sistema de validación de mercado que Polaris debería operar',
    '',
    'Cada nueva oferta debería pasar por un ciclo de cuatro semanas. En la primera semana se seleccionan 20–50 prospectos de una sola vertical y se documenta el problema con datos públicos. En la segunda semana se realizan entrevistas y se muestran muestras, no presentaciones abstractas. En la tercera semana se ofrece un piloto pagado con alcance fijo, fecha de entrega y métrica de éxito. En la cuarta semana se revisa contribución, horas, objeciones, renovaciones y referrals. La oferta se conserva solo si consigue pagos, no únicamente respuestas positivas.',
    '',
    '| Métrica | Qué registrar | Señal de decisión |',
    '|---|---|---|',
    '| Respuesta | Prospectos contactados, respuestas y reuniones | Identifica canal y vertical, no prueba rentabilidad por sí sola. |',
    '| Venta | Depósitos, pagos y ticket real | Es la evidencia principal de disposición de pago. |',
    '| Entrega | Horas, retrabajo, herramientas y subcontratos | Define margen real y capacidad. |',
    '| Resultado | Leads, reservas, tiempos, reviews, horas ahorradas o activos usados | Permite construir una promesa verificable. |',
    '| Retención | Renovación a 30/90 días y referidos | Decide si existe negocio recurrente. |',
    '',
    '## 18. Riesgos transversales y controles',
    '',
    'Polaris debe conservar la propiedad del acceso y de los activos del cliente, usar permisos mínimos, documentar consentimiento, separar datos de cada cuenta, hacer backups y revisar manualmente cualquier salida de IA que contenga precios, políticas, contratos o información de clientes. En reputación no se deben comprar reseñas ni filtrar solicitudes para obtener solo opiniones positivas. En WhatsApp, voz y mensajería deben usarse plataformas oficiales, plantillas y opt-in. En Commerce Export, la venta de alimentos, alcohol, suplementos y productos regulados necesita verificación específica por país. En cualquier servicio con datos personales, el documento comercial debe describir alcance, retención, subencargados y responsabilidades; el análisis no sustituye revisión legal o fiscal.',
    '',
    '## 19. Conclusión operativa',
    '',
    'La oportunidad más inmediata no es una idea espectacular aislada; es un **portafolio escalonado**. Local Lift abre conversaciones porque se entiende en una frase. Review & Reputation Desk y AI Back Office crean recurrencia con herramientas ya disponibles. WhatsApp Revenue Desk y VillaOps convierten el conocimiento local de Polaris en operaciones de mayor valor. Tourism Content Engine y Hospitality Conversion elevan el ticket. Tour Yield Analytics y Commerce Export pueden generar activos diferenciados si primero se validan con datos. Productized Knowledge captura el aprendizaje y lo vuelve vendible a escala.',
    '',
    'La regla de control es simple: **no invertir en construir la versión grande hasta que la versión pequeña tenga pagos, margen y renovación**. Este informe deja una cartera de experimentos; la siguiente versión debe reemplazar cada supuesto por datos de Polaris: prospectos, conversaciones, pagos, horas, costes, resultados y retención.',
    '',
    '## 20. Referencias macro',
    '',
    '[1]: https://www.trade.gov/country-commercial-guides/dominican-republic-ecommerce "International Trade Administration — Dominican Republic - eCommerce"',
    '[2]: https://www.worldbank.org/en/region/lac/brief/verifiable-credentials-for-msmes-in-the-dominican-republic "World Bank — Verifiable Credentials for MSMEs in the Dominican Republic"',
    '[3]: https://noticias.mitur.gob.do/noticias/republica-dominicana-marca-hito-historico-11-6-millones-de-visitantes-en-2025/ "MITUR — República Dominicana marca hito histórico: 11.6 millones de visitantes en 2025"',
    '',
    '## Disclosure financiero',
    '',
    '**Base:** las proyecciones usan ingresos por setup/mensualidad o unidades digitales menos costes directos estimados; no incluyen gastos fijos, impuestos, salario del propietario, CAC no asignado, capital de trabajo ni costes extraordinarios. **Tiempo:** datos y fuentes consultados con corte al 15 de agosto de 2026; cuando una fuente reporta otro periodo, se conserva esa fecha. **Supuestos:** adquisición mensual escalonada, churn de 3%–5% en servicios, precios de prueba visibles en `POLARIS_PROJECTIONS.json`, y contribución calculada por cohortes; todos deben reemplazarse con ventas reales. **Fuentes y confianza:** se priorizaron organismos oficiales, Banco Mundial, MITUR, ITA, precios publicados de competidores y fuentes sectoriales; las cifras de consultoras y proveedores son referencias, no auditorías, y la disposición de pago específica en Punta Cana sigue siendo la principal incertidumbre. **Compliance:** este documento contiene investigación y análisis de negocio, no asesoría financiera personalizada. This is research and analysis only, not personalized financial advice.',
]

OUT_PATH.write_text('\n'.join(lines) + '\n')
print(f'wrote {OUT_PATH} with {len(lines)} lines')
