from pathlib import Path
import csv, json, math

# These are explicit scenario assumptions, not observed market facts. They are anchored
# where possible to public price references in the research matrix and are meant to be
# replaced by Polaris sales data after validation.
ideas = [
    {
        'idea': 'Polaris Local Lift', 'type': 'service', 'setup_price': 99, 'monthly_price': 79,
        'setup_cost': 25, 'monthly_cost': 25, 'new_short': 3, 'new_medium': 8, 'new_long': 20,
        'churn': 0.04, 'basis': 'Published Polaris offer: USD 29 diagnostic, USD 99 48H package, USD 179 implemented package; recurring assumption is a future maintenance tier.'
    },
    {
        'idea': 'Polaris Hospitality Conversion', 'type': 'service', 'setup_price': 1200, 'monthly_price': 650,
        'setup_cost': 450, 'monthly_cost': 250, 'new_short': 1, 'new_medium': 2, 'new_long': 4,
        'churn': 0.03, 'basis': 'Scenario positioned below or alongside hotel CRO/technology providers that commonly sell by demo/quote; direct-booking economics reference OTA commission ranges in research.'
    },
    {
        'idea': 'Polaris WhatsApp Revenue Desk', 'type': 'service', 'setup_price': 650, 'monthly_price': 199,
        'setup_cost': 180, 'monthly_cost': 85, 'new_short': 1, 'new_medium': 3, 'new_long': 7,
        'churn': 0.04, 'basis': 'Scenario anchored to observed infrastructure prices: 360dialog roughly EUR 49–99/channel/month plus Meta, and Respond.io roughly USD 79–279/month before Polaris services.'
    },
    {
        'idea': 'Polaris VillaOps', 'type': 'service', 'setup_price': 600, 'monthly_price': 250,
        'setup_cost': 180, 'monthly_cost': 105, 'new_short': 1, 'new_medium': 3, 'new_long': 8,
        'churn': 0.04, 'basis': 'Scenario between local managed-service references and international property-operations SaaS; software-only prices are not Polaris service prices.'
    },
    {
        'idea': 'Polaris Tourism Content Engine', 'type': 'service', 'setup_price': 500, 'monthly_price': 1000,
        'setup_cost': 150, 'monthly_cost': 620, 'new_short': 1, 'new_medium': 2, 'new_long': 5,
        'churn': 0.05, 'basis': 'Scenario below/within observed travel UGC references of roughly USD 150–500 per video and USD 800–1,500 for a monthly bundle; direct production cost is intentionally high.'
    },
    {
        'idea': 'Polaris Review & Reputation Desk', 'type': 'service', 'setup_price': 200, 'monthly_price': 149,
        'setup_cost': 45, 'monthly_cost': 60, 'new_short': 2, 'new_medium': 5, 'new_long': 12,
        'churn': 0.05, 'basis': 'Scenario near observed GatherUp software at USD 99/location and third-party managed-service references around USD 149–249/month; includes human review.'
    },
    {
        'idea': 'Polaris Tour Yield Analytics', 'type': 'service', 'setup_price': 350, 'monthly_price': 149,
        'setup_cost': 95, 'monthly_cost': 45, 'new_short': 1, 'new_medium': 4, 'new_long': 10,
        'churn': 0.04, 'basis': 'Scenario near tour-operations software entry points of roughly USD 49–99/month, with Polaris adding data cleanup and interpretation.'
    },
    {
        'idea': 'Polaris AI Back Office', 'type': 'service', 'setup_price': 700, 'monthly_price': 299,
        'setup_cost': 180, 'monthly_cost': 120, 'new_short': 1, 'new_medium': 3, 'new_long': 8,
        'churn': 0.04, 'basis': 'Scenario above low-cost SaaS licenses because it includes discovery, implementation, human review and support; benchmarked against HubSpot, Zoho and Dubsado pricing in research.'
    },
    {
        'idea': 'Polaris Voice Receptionist', 'type': 'service', 'setup_price': 800, 'monthly_price': 399,
        'setup_cost': 220, 'monthly_cost': 230, 'new_short': 1, 'new_medium': 2, 'new_long': 6,
        'churn': 0.05, 'basis': 'Scenario between SMB voice-agent price references and hotel voice products; direct cost includes telephone/model minutes and human fallback.'
    },
    {
        'idea': 'Polaris Commerce Export', 'type': 'service', 'setup_price': 900, 'monthly_price': 350,
        'setup_cost': 300, 'monthly_cost': 190, 'new_short': 1, 'new_medium': 2, 'new_long': 5,
        'churn': 0.05, 'basis': 'Service-only model; producer retains inventory and shipping risk. Product prices in the research support bundles and setup, not a guaranteed sales forecast.'
    },
    {
        'idea': 'Polaris Productized Knowledge', 'type': 'product', 'unit_price': 39, 'unit_cost': 8,
        'sales_short': 25, 'sales_medium': 80, 'sales_long': 300,
        'basis': 'Scenario between observed digital-product price examples and a localized Spanish/WhatsApp kit; conversion and traffic are unvalidated.'
    },
]


def service_projection(x):
    # Short: months 1-3; medium: months 4-12; long: steady-state annual run-rate at month 36.
    def cohort_metrics(new_per_month, months, prior_active=0):
        active = prior_active
        total_setup = 0.0
        total_monthly = 0.0
        total_setup_cost = 0.0
        total_monthly_cost = 0.0
        for _ in range(months):
            new = new_per_month
            total_setup += new * x['setup_price']
            total_setup_cost += new * x['setup_cost']
            avg_active = active + new / 2.0
            total_monthly += avg_active * x['monthly_price']
            total_monthly_cost += avg_active * x['monthly_cost']
            active = active * (1 - x['churn']) + new
        return active, total_setup + total_monthly, total_setup_cost + total_monthly_cost

    active3, rev3, cost3 = cohort_metrics(x['new_short'], 3, 0)
    active12, rev_medium_period, cost_medium_period = cohort_metrics(x['new_medium'], 9, active3)
    rev12 = rev3 + rev_medium_period
    cost12 = cost3 + cost_medium_period
    # Long: approximate steady-state month 36 using a 36-month cohort simulation and annualize last month.
    active = 0.0
    last_rev = 0.0
    last_cost = 0.0
    for month in range(1, 37):
        if month <= 3:
            new = x['new_short']
        elif month <= 12:
            new = x['new_medium']
        else:
            new = x['new_long']
        avg_active = active + new / 2.0
        last_rev = new * x['setup_price'] + avg_active * x['monthly_price']
        last_cost = new * x['setup_cost'] + avg_active * x['monthly_cost']
        active = active * (1 - x['churn']) + new
    rev36_runrate = last_rev * 12
    cost36_runrate = last_cost * 12
    return {
        'short_revenue': rev3, 'short_cost': cost3, 'short_contribution': rev3-cost3,
        'medium_revenue': rev12, 'medium_cost': cost12, 'medium_contribution': rev12-cost12,
        'long_revenue_runrate': rev36_runrate, 'long_cost_runrate': cost36_runrate, 'long_contribution_runrate': rev36_runrate-cost36_runrate,
        'active_end_short': active3, 'active_end_medium': active12, 'active_month36': active,
    }


def product_projection(x):
    def calc(sales, months):
        rev = sales * months * x['unit_price']
        cost = sales * months * x['unit_cost']
        return rev, cost
    r3, c3 = calc(x['sales_short'], 3)
    r12, c12 = r3 + calc(x['sales_medium'], 9)[0], c3 + calc(x['sales_medium'], 9)[1]
    r36 = x['sales_long'] * 12 * x['unit_price']
    c36 = x['sales_long'] * 12 * x['unit_cost']
    return {
        'short_revenue': r3, 'short_cost': c3, 'short_contribution': r3-c3,
        'medium_revenue': r12, 'medium_cost': c12, 'medium_contribution': r12-c12,
        'long_revenue_runrate': r36, 'long_cost_runrate': c36, 'long_contribution_runrate': r36-c36,
        'active_end_short': x['sales_short']*3, 'active_end_medium': x['sales_medium']*9, 'active_month36': x['sales_long']*12,
    }

rows = []
for x in ideas:
    projection = product_projection(x) if x['type'] == 'product' else service_projection(x)
    row = {'idea': x['idea'], 'type': x['type'], 'basis': x['basis'], **x, **projection}
    rows.append(row)

out_dir = Path('/home/ubuntu/Polaris-Web-Studio/docs')
with (out_dir / 'POLARIS_PROJECTIONS.csv').open('w', newline='') as f:
    fieldnames = []
    for row in rows:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)
    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader(); writer.writerows(rows)
(out_dir / 'POLARIS_PROJECTIONS.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')

lines = ['# Proyecciones base de Polaris', '', '> **Advertencia:** son escenarios de planificación, no pronósticos ni garantías. “Contribución” significa ingresos menos costes directos estimados; excluye gastos fijos, impuestos, salario del propietario, CAC no asignado y capital de trabajo.', '', '| Idea | 0–3 meses: ingresos | 0–3 meses: contribución | 4–12 meses: ingresos acumulados | 4–12 meses: contribución acumulada | Año 3: run-rate anual | Año 3: contribución run-rate |', '|---|---:|---:|---:|---:|---:|---:|']
for r in rows:
    lines.append(f"| {r['idea']} | US${r['short_revenue']:,.0f} | US${r['short_contribution']:,.0f} | US${r['medium_revenue']:,.0f} | US${r['medium_contribution']:,.0f} | US${r['long_revenue_runrate']:,.0f} | US${r['long_contribution_runrate']:,.0f} |" )
lines += ['', '## Supuestos por idea', '']
for x in ideas:
    if x['type'] == 'service':
        lines.append(f"- **{x['idea']}:** setup US${x['setup_price']:,.0f}; mensualidad US${x['monthly_price']:,.0f}; coste directo de setup US${x['setup_cost']:,.0f}; coste directo mensual US${x['monthly_cost']:,.0f}; nuevos clientes/mes corto {x['new_short']}, medio {x['new_medium']}, largo {x['new_long']}; churn mensual {x['churn']:.0%}. Base: {x['basis']}")
    else:
        lines.append(f"- **{x['idea']}:** precio unitario US${x['unit_price']:,.0f}; coste directo unitario US${x['unit_cost']:,.0f}; ventas/mes corto {x['sales_short']}, medio {x['sales_medium']}, largo {x['sales_long']}. Base: {x['basis']}")
lines += ['', '## Fórmulas', '', 'Para servicios se simulan cohortes mensuales con churn: nuevos clientes × setup, más clientes activos promedio × mensualidad; el coste directo usa la misma lógica. Para el largo plazo se anualiza el último mes de una simulación de 36 meses. Para el producto digital se multiplican unidades por precio y coste unitario. Los valores deben actualizarse con ventas reales, horas efectivas y costes de proveedores.']
(out_dir / 'POLARIS_PROJECTIONS.md').write_text('\n'.join(lines) + '\n')
print((out_dir / 'POLARIS_PROJECTIONS.md').read_text())
