import json
from pathlib import Path

root = Path('/home/ubuntu/Polaris-Web-Studio')
research = json.loads(Path('/home/ubuntu/research_local_lift_prospects.json').read_text())['results']
drafts = json.loads(Path('/home/ubuntu/prepare_local_lift_messages.json').read_text())['results']
research_by_name = {}
for item in research:
    out = item.get('output', {})
    research_by_name[out.get('business_name', item.get('input', ''))] = out

draft_by_name = {}
for item in drafts:
    out = item.get('output', {})
    draft_by_name[out.get('business_name', item.get('input', ''))] = out

lines = [
    '# Polaris Local Lift — Lote 01 para aprobación',
    '',
    '**Estado:** preparado para revisión; no se ha enviado ningún mensaje.',
    '',
    'Este lote contiene diez prospectos investigados con información pública. La prioridad y la oportunidad son hipótesis comerciales, no afirmaciones de que un negocio tenga errores o necesite contratar a Polaris. Antes de enviar, hay que confirmar manualmente el canal, la identidad del destinatario y que la información siga vigente.',
    '',
    '## Resumen de prioridades',
    '',
    '| Prioridad | Prospecto | Canal propuesto | Motivo de revisión | Estado |',
    '|---|---|---|---|---|',
]

for item in drafts:
    d = item.get('output', {})
    name = d.get('business_name', item.get('input', ''))
    priority = d.get('priority', 'Sin clasificar')
    channel = d.get('public_contact_channel', 'No verificado')
    rationale = d.get('fit_rationale', '').replace('|', '\\|').replace('\n', ' ')
    if len(rationale) > 190:
        rationale = rationale[:187] + '...'
    lines.append(f"| {priority} | {name} | {channel.replace('|', '\\|')} | {rationale} | NO ENVIADO |")

lines += ['', '## Recomendación de primera ronda', '', 'Para maximizar la probabilidad de una respuesta rápida, empezaría con **Selectum Hacienda Punta Cana**, **Punta Cana Adventures**, **Classic Tour Operator**, **XPO Tours and Travel** y **Runners Adventures**. Tienen una relación clara con turismo y conversión local, canales públicos verificables y una hipótesis de auditoría fácil de explicar. Punta Cana Tours puede ser la sexta opción. Amstar, Puntacana Resort e Impressive son operaciones más grandes y conviene dejarlas para una segunda ronda. Le Sivory debe permanecer fuera de contacto hasta confirmar que continúa operando, porque la ficha pública de Google aparece como cerrada permanentemente.', '', '## Mensajes listos para revisar', '']

for item in drafts:
    d = item.get('output', {})
    name = d.get('business_name', item.get('input', ''))
    r = research_by_name.get(name, {})
    lines += [
        f'### {name}',
        '',
        f"**Prioridad:** {d.get('priority', 'Sin clasificar')}  ",
        f"**URL oficial:** {r.get('official_url', 'No verificada')}  ",
        f"**Canal público propuesto:** {d.get('public_contact_channel', 'No verificado')}  ",
        '**Estado:** NO ENVIADO — PENDIENTE DE APROBACIÓN',
        '',
        '**Mini-diagnóstico interno:**',
        d.get('mini_diagnosis', 'No disponible'),
        '',
        '**Mensaje en español:**',
        '',
        '> ' + d.get('message_es', '').replace('\n', '\n> '),
        '',
        '**Mensaje en inglés:**',
        '',
        '> ' + d.get('message_en', '').replace('\n', '\n> '),
        '',
        f"**Comprobación manual antes de enviar:** {d.get('manual_check_before_send', 'Confirmar canal, destinatario y datos actuales.')}",
        '',
    ]

lines += [
    '## Decisión que necesito del usuario',
    '',
    'Confirma si autorizas enviar únicamente a los cinco prospectos de la primera ronda recomendada, o si prefieres modificar la selección. También puedes indicar si quieres usar español, inglés o ambos idiomas por prospecto. Después de esa confirmación se podrá preparar el envío individual; no se realizará un envío masivo.',
    '',
    '## Fuentes y archivos',
    '',
    '- Investigación completa: `research_local_lift_prospects.csv` y `research_local_lift_prospects.json`.',
    '- Borradores estructurados: `prepare_local_lift_messages.csv` y `prepare_local_lift_messages.json`.',
    '- Oferta pública: https://polarisweb.studio/local-lift',
]

(root / 'docs/LOCAL_LIFT_BATCH_01_APPROVAL.md').write_text('\n'.join(lines) + '\n')
