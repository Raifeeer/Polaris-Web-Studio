# Validación de mockups

La captura HD de La Reja se obtuvo desde `https://la-reja-rd.vercel.app/` con escala de dispositivo y resolución 1366 × 3948.

En la vista local, la composición del `BrowserFrame` ya no muestra la franja degradada: el contenido visual termina en la pantalla y la identificación del proyecto vive en un `figcaption` separado. La ruta `/manus-storage/...` no se sirve desde el preview local de este repositorio PWS, por lo que la captura se conservará como asset público de la rama experimental para que Vercel la entregue directamente.

La segunda captura local confirma que la imagen real de La Reja ocupa el viewport interior y que la información del proyecto ya no se superpone sobre la pantalla. El velo lavanda observado corresponde al estado de entrada/animación de la landing durante la captura automatizada; se hará una captura posterior tras esperar la estabilización visual.

La captura estabilizada confirma el resultado esperado: la web real de La Reja es visible y nítida dentro del único marco de navegador; la pantalla no contiene la banda de color y la leyenda queda en una franja blanca independiente debajo del viewport.

La captura de la sección de proyectos confirma que el mismo `BrowserFrame` corregido se aplica a la galería: La Reja se muestra con la captura real dentro de una única pantalla y la franja de color ya no invade el contenido. La navegación de proyectos permanece intacta.

También se probó el hero en viewport móvil de 390 × 844 con captura a escala de dispositivo; no se detectaron errores de carga en la navegación automatizada. La imagen se revisará visualmente antes del cierre.

La revisión móvil confirma que el hero no desborda horizontalmente y que el `BrowserFrame` queda contenido en el flujo vertical de la página. La captura del proyecto aparece después del bloque inicial, sin alterar el CTA ni la navegación.
