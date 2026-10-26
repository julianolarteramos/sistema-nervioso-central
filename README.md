# Modelo desmontable del sistema nervioso central

**Página:** https://julianolarteramos.github.io/sistema-nervioso-central/ · **Código:** https://github.com/julianolarteramos/sistema-nervioso-central

Un modelo de aula del encéfalo y la médula espinal, en una sola página HTML. Se puede girar, desmontar pieza por pieza, pelar por capas, volver translúcido, rotular y recorrer con las vías principales. Está dibujado con **specimen**, un fork de `/anatomy` con superficies orgánicas (campos de distancia): https://github.com/julianolarteramos/specimen.

## Abrir el modelo

`snc-light.html` es la página (tema claro, autocontenida, ~4,9 MB). Ábrela en el navegador. En WSL: `~/.local/bin/winopen "file://wsl.localhost/Ubuntu$(pwd)/snc-light.html"`.

## Controles

| Control | Qué hace |
|---|---|
| **Panel plegable** | Cada bloque del panel (Despiece, Cortes, Pelado y rótulos, Vías, Piezas y Ficha) tiene una flecha en su título que lo pliega o lo despliega; el navegador recuerda cómo lo dejaste. «Vías» empieza plegado. Al elegir una pieza, la ficha se despliega sola. Sirve sobre todo en pantallas bajas, donde con todo abierto la lista de piezas queda pequeña. |
| **Despiece** (deslizador) | Separa las piezas una tras otra, en orden, desde «armado» hasta «desmontado». |
| **Cortes** | **Sagital medio:** quita la mitad derecha del encéfalo y las meninges y gira a la vista lateral derecha, desde la que se ve de frente la cara plana de la mitad izquierda (calloso, fórnix, ventrículo, tálamo, tronco, vermis…). **Coronal** y **axial** abren un *visor de cortes*: un deslizador recorre el plano (21 posiciones coronales, de +70 a −98 mm de la comisura anterior, y 26 axiales, de +72 a −128), el plano se dibuja translúcido sobre el modelo y en una tarjeta aparece la sección real de las piezas en esa posición, con su color; el clic en una región abre su ficha. «Sin corte» lo deshace y devuelve la vista de antes. |
| **Pelado por capas** (deslizador, 13 pasos) | Quita el modelo de afuera hacia adentro: duramadre, hoz y tienda → aracnoides → lóbulos → ínsula → núcleos → calloso y fórnix → ventrículos → caudado → hipocampo → diencéfalo → cerebelo → tronco. Debajo dice qué se quitó en cada paso. |
| **Rótulos** (lista) | «ninguno», «la pieza elegida» o «todos»: nombre corto de cada pieza con una línea de guía. Con los rótulos el cuadro se ensancha para dejar sitio al texto. |
| **Vías** (casillas) | Enciende un recorrido con flujo animado sobre el modelo y atenúa el resto. Se abre la ficha con la ruta y la función. Solo se ven con el modelo armado (al despiece se apagan). Hay seis: corticoespinal, columna dorsal y lemnisco medial, espinotalámica, vía visual, circuito de Papez y flujo del líquido cefalorraquídeo. |
| **Piezas** (árbol por sistemas) | Mostrar u ocultar cada pieza o un sistema entero, **opacidad** de cada una, y **Aislar**. «Mostrar todas» lo restablece. |
| **Ficha** | Clic o toque en una pieza del modelo, o en la lista: qué es, con qué se conecta y una imagen libre de referencia con su autor y su licencia. |
| **Giro** | 10 vistas: 8 cada 45° (lateral izquierda, anterior, anterior derecha, lateral derecha, posterior derecha, posterior, posterior izquierda y posterolateral izquierda) más superior e inferior. Teclas ← →, arrastrar en horizontal, flechas ‹ › o los puntos. |

Con «reducir movimiento» activado en el sistema, el despiece salta sin animación y el flujo de las vías queda como trazos fijos.

## Qué lleva el modelo

34 piezas en 9 sistemas (el modelo está a escala natural; el origen de las coordenadas es la comisura anterior):

- **Meninges (4):** duramadre, aracnoides, hoz del cerebro y tienda del cerebelo, como membranas translúcidas.
- **Telencéfalo (6):** lóbulos frontal, parietal, temporal y occipital izquierdos, ínsula y la **mitad derecha del encéfalo** entera (con la mitad derecha de todo lo que cruza la línea media).
- **Núcleos basales y sustancia blanca (7):** putamen, globo pálido, cabeza con cuerpo del caudado, cola del caudado, cuerpo calloso, septum y fórnix (mitades izquierdas).
- **Diencéfalo (3):** tálamo, hipotálamo con hipófisis y pineal.
- **Sistema límbico y vías sensoriales (3):** hipocampo con amígdala, bulbo olfatorio, quiasma y vía óptica.
- **Sistema ventricular (1):** el molde de los ventrículos.
- **Tronco del encéfalo (3):** mesencéfalo, puente y bulbo, **cortados de un solo cuerpo continuo**, así que sus caras de contacto coinciden.
- **Cerebelo (2):** vermis y hemisferio.
- **Médula espinal (5):** la médula cervical con raíces y ganglios (es la varilla del montaje) y cuatro cortes ampliados al doble (C6, T6, L3 y S2) apoyados en la peana.

Las piezas de la línea media son **mitades izquierdas** con una cara plana de corte sagital, como en los modelos comerciales de aula. Esa decisión se explica en `DECISIONES.md`.

## Reconstruir

Requisitos: Node 20 o superior, un Chromium (las capturas) y el kit de specimen, que se busca en `SPECIMEN_HOME`, en una carpeta `specimen` hermana de este repositorio o en `~/code/experiments/specimen` (`kit.mjs`). No hay `npm install`.

```
scripts/construir.sh --light [--quick] [--view=a+b] [--orden | --vuelo | --solidos | --audit] [--solo=pieza,pieza]
```

**Construir siempre con `scripts/construir.sh`**: no lanza con menos de 8 GB libres y mata los procesos si el sistema pasa de 14 GB (una vez se agotó la RAM y se apagó WSL). Con las diez vistas, usa `SNC_JOBS=2`.

| Modo | Qué comprueba | Tiempo (34 piezas) |
|---|---|---|
| `--orden` | El orden de pintor entre piezas, en todos los estados del despiece. | ~15–30 min por primera vez; **17 s si todo está en caché** |
| `--vuelo` | Lo anterior más las holguras de las piezas en pleno despiece. | ~30 min por vista |
| `--solidos` | Lo anterior más apoyos y holguras con el despiece completo. | ~90 min por vista |
| `--audit` | La auditoría completa del kit. Es el cierre de cada cambio de piezas. | ~100 min por vista |
| `--solo=a,b` | Construye solo esas piezas, sin peana (`snc-solo-light.html`, ignorada por git). | minutos |

Las cachés viven en `.cache/` (plan de cortes por vista, pintado por trozo, ordenamiento por vista, rejillas de los barridos). Cambiar solo la página (CSS, JavaScript, textos, nombres) reconstruye las diez vistas en ~20 segundos. Cambiar una pieza invalida el plan de cortes de todas las vistas y puede costar horas; el despiece (`modelo/salidas.json`) se calcula con `scripts/planear-salidas.mjs` (12–30 min).

### Las secciones del visor de cortes

`modelo/cortes.json` (~360 KB) guarda los contornos de cada pieza en cada plano. Se genera con `node scripts/cortes.mjs` (~8 min; `--solo coronal|axial`, `--paso 1`) y **solo hay que repetirlo si cambia la geometría de alguna pieza**: es lo único de la página que no se reconstruye con las cachés. La sustancia blanca (el volumen del núcleo profundo que ninguna pieza ocupa, a más de 0,5 mm de cualquier pieza) se añade como una región «virtual» que no entra en el orden de pintor ni en la auditoría.

### Verificar

```
node scripts/verificar.mjs [página]      # capturas de cada estado a 1920×1080, 1280×720 y 1024×768, con la consola limpia
node scripts/encuadre.mjs [página]       # ninguna pieza fuera del marco, en las 10 vistas × 5 posiciones del deslizador × 3 tamaños
node ~/code/experiments/specimen/scripts/lines.mjs snc-light.html   # extremos de línea sueltos
scripts/estado.sh --seguir               # panel en vivo de una construcción en curso (procesos, RAM, últimas líneas del registro)
```

El registro de la última construcción es `.cache/construccion.log`.

## Carpetas

- `modelo/`: la anatomía en código. `anatomia.mjs` y `anatomia2.mjs` (los sólidos), `piezas.mjs` (la lista de piezas y el reparto en capas), `vias.mjs` (los recorridos de las vías), `salidas.json` y `ajustes-salidas.json` (el despiece), `prims.mjs` y `marco.mjs` (primitivas y marco de coordenadas).
- `lib/`: el motor. `assembly.mjs` (pintado por pieza, plan de cortes, orden de pintor, auditoría y cachés), `assembly-live.js` y `assembly.css` (la página), `campos.mjs` (campos de distancia horneados), `referencias.mjs` (miniaturas y créditos).
- `textos.mjs`: sistemas, fichas, nombres cortos de los rótulos, capas del pelado y textos de los controles.
- `investigacion/`: el dossier anatómico (`ANATOMIA.md`, ~75 piezas con forma, medidas, posición y conexiones) y el informe de viabilidad de los controles.
- `referencias/`: 206 imágenes libres de referencia, con `MANIFEST.md` (autor y licencia de cada una) y una hoja de contactos `index.html`.
- `proceso/`: el diario de cómo se construyó, con fotos de cada etapa (`proceso/index.html`).
- `scripts/`: construcción, verificación, diario y el cálculo de las secciones del visor (`cortes.mjs`).
- `DECISIONES.md`: las decisiones de diseño, las reglas de modelado, las excepciones documentadas y lo aprendido.

## Límites conocidos

- **El visor de cortes dibuja secciones, no corta las piezas:** se calculan muestreando las mismas formas y corresponden al modelo armado (con el despiece se apagan). La mitad derecha del encéfalo es una sola pieza, así que su sección es un bloque homogéneo; los lóbulos son casquetes gruesos, no una corteza de 3 mm; y la sustancia blanca de la mitad izquierda es una región de relleno que solo existe en las secciones.
- La forma de las piezas es esquemática: simplifica superficies y colores, no posiciones. Los giros de la corteza son un patrón, salvo los surcos lateral y central.
- El tronco, el caudado y varias piezas pequeñas (pineal, mamilares) están más cerca de una escala didáctica que de un atlas.
- El orden de pintor tiene **una tolerancia de 4 px²** (2×2 píxeles de la figura) y cuatro excepciones por vista, medidas y documentadas en `DECISIONES.md`. La mayor es la del puente con el temporal en la vista posterior derecha (417 px²).
- Las vías son recorridos esquemáticos, no trazados anatómicos fieles, y solo se ven con el modelo armado.
- La auditoría completa de las 34 piezas no se ha pasado en todas las vistas (una sola tarda ~100 min); sí en la lateral izquierda con 30 piezas.

## Licencia y créditos

El código y los textos son MIT (`LICENSE`); las imágenes de referencia conservan su licencia. Construido con [specimen](https://github.com/julianolarteramos/specimen) y Claude Code.


Las imágenes de las fichas son libres (Wikimedia Commons: láminas de Gray's Anatomy de 1918, renders de BodyParts3D, fotografías de John A. Beal, ilustraciones de Patrick J. Lynch, OpenStax y Blausen); cada ficha muestra su autor y su licencia, y `referencias/MANIFEST.md` los reúne.
