from urllib.parse import quote
from pathlib import Path

contacts = [
    (
        'Punta Cana Adventures',
        '18299780001',
        'Hola, equipo de Punta Cana Adventures. Vi que ofrecen excursiones, traslados y reservas online, con cobertura declarada en más de 677 hoteles y atención por WhatsApp. Como hipótesis para revisar —no como un fallo asumido—, quizá valga la pena comprobar que Google Maps, las páginas de hoteles, los horarios y los enlaces hacia reserva/WhatsApp estén totalmente alineados. En Polaris ofrecemos un diagnóstico Express de Local Lift por USD 29/RD$1,800, con hallazgos accionables y prioridades de revisión: https://polarisweb.studio/local-lift. ¿Les gustaría que les comparta cómo funciona?'
    ),
    (
        'Classic Tour Operator',
        '18496202109',
        'Hola, equipo de Classic Tour Operator. Vi que cuentan con un catálogo amplio de excursiones y traslados, reservas online y atención por WhatsApp, además de cobertura en varios destinos de República Dominicana. Como hipótesis para revisar, podría ser útil comprobar si la información local de Google/Maps —dirección, horarios, áreas, categorías y enlaces— está totalmente alineada con su web. En Polaris ofrecemos un diagnóstico Express por USD 29/RD$1,800 para revisar estos puntos y entregar prioridades prácticas. Detalles: https://polarisweb.studio/local-lift. ¿Les gustaría que les comparta el alcance?'
    ),
    (
        'XPO Tours and Travel',
        '18296279606',
        'Hola, equipo de XPO Tours and Travel. Vi que ofrecen excursiones, recogidas y transfers privados en destinos como Punta Cana, Bávaro, Uvero Alto y Puerto Plata, con reserva online y atención en español, inglés y alemán. Como hipótesis para revisar, quizá valga la pena comprobar cómo aparecen esas áreas y canales en Google Maps y si el CTA de WhatsApp/reserva funciona con claridad en móvil. En Polaris ofrecemos un diagnóstico Express por USD 29/RD$1,800 para auditarlo, sin compromiso ni promesa de resultados: https://polarisweb.studio/local-lift. ¿Les gustaría que les comparta el alcance?'
    ),
    (
        'Runners Adventures',
        '18295997444',
        'Hola, equipo de Runners Adventures. Vi que ofrecen excursiones en Bávaro, Uvero Alto, Macao y Punta Cana, con reservas online y atención por WhatsApp. Esa presencia ya es una buena base; como hipótesis para revisar, podría valer la pena comprobar que las fichas locales, horarios, zonas de recogida y enlaces de reserva estén totalmente alineados. En Polaris ofrecemos un diagnóstico Express de presencia local por USD 29/RD$1,800, con hallazgos y acciones priorizadas: https://polarisweb.studio/local-lift. ¿Les gustaría que les comparta los detalles? No haríamos ningún cambio ni contacto adicional sin su aprobación.'
    ),
]

lines = ['# Enlaces WhatsApp — Polaris Local Lift', '', 'Abre cada enlace desde el celular. WhatsApp abrirá el chat con el mensaje precargado; solo pulsa **Enviar**. No incluyo Selectum porque ya fue contactado por correo.', '']
for name, number, message in contacts:
    link = f'https://wa.me/{number}?text={quote(message, safe="")}'
    lines += [f'## {name}', '', f'**Número:** +{number}', '', f'[Abrir WhatsApp y enviar mensaje]({link})', '', '### Mensaje precargado', '', f'> {message}', '']
Path('/home/ubuntu/Polaris-Web-Studio/docs/LOCAL_LIFT_WHATSAPP_LINKS.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
