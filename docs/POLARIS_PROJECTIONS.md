# Proyecciones base de Polaris

> **Advertencia:** son escenarios de planificación, no pronósticos ni garantías. “Contribución” significa ingresos menos costes directos estimados; excluye gastos fijos, impuestos, salario del propietario, CAC no asignado y capital de trabajo.

| Idea | 0–3 meses: ingresos | 0–3 meses: contribución | 4–12 meses: ingresos acumulados | 4–12 meses: contribución acumulada | Año 3: run-rate anual | Año 3: contribución run-rate |
|---|---:|---:|---:|---:|---:|---:|
| Polaris Local Lift | US$1,948 | US$1,389 | US$37,920 | US$26,433 | US$346,896 | US$238,638 |
| Polaris Hospitality Conversion | US$6,506 | US$4,038 | US$92,745 | US$57,316 | US$667,488 | US$411,315 |
| Polaris WhatsApp Revenue Desk | US$2,838 | US$1,918 | US$47,084 | US$29,902 | US$340,834 | US$203,453 |
| Polaris VillaOps | US$2,915 | US$1,907 | US$52,653 | US$32,699 | US$464,361 | US$276,241 |
| Polaris Tourism Content Engine | US$5,950 | US$2,741 | US$109,244 | US$44,873 | US$952,352 | US$371,494 |
| Polaris Review & Reputation Desk | US$2,526 | US$1,722 | US$45,079 | US$28,739 | US$359,051 | US$219,584 |
| Polaris Tour Yield Analytics | US$1,715 | US$1,229 | US$39,866 | US$28,243 | US$346,032 | US$242,810 |
| Polaris AI Back Office | US$3,434 | US$2,358 | US$62,445 | US$40,411 | US$553,686 | US$341,161 |
| Polaris Voice Receptionist | US$4,176 | US$2,492 | US$56,199 | US$28,868 | US$494,340 | US$226,745 |
| Polaris Commerce Export | US$4,258 | US$2,512 | US$53,460 | US$28,399 | US$376,823 | US$183,576 |
| Polaris Productized Knowledge | US$2,925 | US$2,325 | US$31,005 | US$24,645 | US$140,400 | US$111,600 |

## Supuestos por idea

- **Polaris Local Lift:** setup US$99; mensualidad US$79; coste directo de setup US$25; coste directo mensual US$25; nuevos clientes/mes corto 3, medio 8, largo 20; churn mensual 4%. Base: Published Polaris offer: USD 29 diagnostic, USD 99 48H package, USD 179 implemented package; recurring assumption is a future maintenance tier.
- **Polaris Hospitality Conversion:** setup US$1,200; mensualidad US$650; coste directo de setup US$450; coste directo mensual US$250; nuevos clientes/mes corto 1, medio 2, largo 4; churn mensual 3%. Base: Scenario positioned below or alongside hotel CRO/technology providers that commonly sell by demo/quote; direct-booking economics reference OTA commission ranges in research.
- **Polaris WhatsApp Revenue Desk:** setup US$650; mensualidad US$199; coste directo de setup US$180; coste directo mensual US$85; nuevos clientes/mes corto 1, medio 3, largo 7; churn mensual 4%. Base: Scenario anchored to observed infrastructure prices: 360dialog roughly EUR 49–99/channel/month plus Meta, and Respond.io roughly USD 79–279/month before Polaris services.
- **Polaris VillaOps:** setup US$600; mensualidad US$250; coste directo de setup US$180; coste directo mensual US$105; nuevos clientes/mes corto 1, medio 3, largo 8; churn mensual 4%. Base: Scenario between local managed-service references and international property-operations SaaS; software-only prices are not Polaris service prices.
- **Polaris Tourism Content Engine:** setup US$500; mensualidad US$1,000; coste directo de setup US$150; coste directo mensual US$620; nuevos clientes/mes corto 1, medio 2, largo 5; churn mensual 5%. Base: Scenario below/within observed travel UGC references of roughly USD 150–500 per video and USD 800–1,500 for a monthly bundle; direct production cost is intentionally high.
- **Polaris Review & Reputation Desk:** setup US$200; mensualidad US$149; coste directo de setup US$45; coste directo mensual US$60; nuevos clientes/mes corto 2, medio 5, largo 12; churn mensual 5%. Base: Scenario near observed GatherUp software at USD 99/location and third-party managed-service references around USD 149–249/month; includes human review.
- **Polaris Tour Yield Analytics:** setup US$350; mensualidad US$149; coste directo de setup US$95; coste directo mensual US$45; nuevos clientes/mes corto 1, medio 4, largo 10; churn mensual 4%. Base: Scenario near tour-operations software entry points of roughly USD 49–99/month, with Polaris adding data cleanup and interpretation.
- **Polaris AI Back Office:** setup US$700; mensualidad US$299; coste directo de setup US$180; coste directo mensual US$120; nuevos clientes/mes corto 1, medio 3, largo 8; churn mensual 4%. Base: Scenario above low-cost SaaS licenses because it includes discovery, implementation, human review and support; benchmarked against HubSpot, Zoho and Dubsado pricing in research.
- **Polaris Voice Receptionist:** setup US$800; mensualidad US$399; coste directo de setup US$220; coste directo mensual US$230; nuevos clientes/mes corto 1, medio 2, largo 6; churn mensual 5%. Base: Scenario between SMB voice-agent price references and hotel voice products; direct cost includes telephone/model minutes and human fallback.
- **Polaris Commerce Export:** setup US$900; mensualidad US$350; coste directo de setup US$300; coste directo mensual US$190; nuevos clientes/mes corto 1, medio 2, largo 5; churn mensual 5%. Base: Service-only model; producer retains inventory and shipping risk. Product prices in the research support bundles and setup, not a guaranteed sales forecast.
- **Polaris Productized Knowledge:** precio unitario US$39; coste directo unitario US$8; ventas/mes corto 25, medio 80, largo 300. Base: Scenario between observed digital-product price examples and a localized Spanish/WhatsApp kit; conversion and traffic are unvalidated.

## Fórmulas

Para servicios se simulan cohortes mensuales con churn: nuevos clientes × setup, más clientes activos promedio × mensualidad; el coste directo usa la misma lógica. Para el largo plazo se anualiza el último mes de una simulación de 36 meses. Para el producto digital se multiplican unidades por precio y coste unitario. Los valores deben actualizarse con ventas reales, horas efectivas y costes de proveedores.
