import json
from pathlib import Path

src = Path('/home/ubuntu/research_polaris_business_ideas.json')
data = json.loads(src.read_text())['results']
out = []
for item in data:
    obj = item.get('output') or {}
    out.append({
        'input': item.get('input', ''),
        'idea_name': obj.get('idea_name', ''),
        'profitability_assessment': obj.get('profitability_assessment', ''),
        'market_proxy': obj.get('market_proxy', ''),
        'demand_evidence': obj.get('demand_evidence', ''),
        'competitor_and_pricing': obj.get('competitor_and_pricing', ''),
        'barriers_and_risks': obj.get('barriers_and_risks', ''),
        'mvp_and_go_to_market': obj.get('mvp_and_go_to_market', ''),
        'key_assumptions_to_model': obj.get('key_assumptions_to_model', ''),
        'sources': obj.get('sources', ''),
    })
Path('/home/ubuntu/Polaris-Web-Studio/docs/IDEA_RESEARCH_MATRIX.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
lines = ['# Matriz de investigación de ideas', '']
for i, row in enumerate(out, 1):
    lines += [f'## {i}. {row["idea_name"] or row["input"]}', '', f'**Veredicto:** {row["profitability_assessment"]}', '', f'**Proxy de mercado:** {row["market_proxy"]}', '', f'**Evidencia de demanda:** {row["demand_evidence"]}', '', f'**Competencia y precios:** {row["competitor_and_pricing"]}', '', f'**Barreras y riesgos:** {row["barriers_and_risks"]}', '', f'**MVP y GTM:** {row["mvp_and_go_to_market"]}', '', f'**Supuestos:** {row["key_assumptions_to_model"]}', '', f'**Fuentes:**\n{row["sources"]}', '']
Path('/home/ubuntu/Polaris-Web-Studio/docs/IDEA_RESEARCH_MATRIX.md').write_text('\n'.join(lines) + '\n')
print(f'processed={len(out)}')
for row in out:
    print('\n' + (row['idea_name'] or row['input']) + '\n' + row['profitability_assessment'][:500])
