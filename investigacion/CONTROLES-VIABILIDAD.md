# Modelo desmontable del SNC con specimen: viabilidad de los controles

Análisis del kit de specimen (sin editar su repositorio; `git status` limpio al terminar). Leídos: `SKILL.md`, `references/craft.md` (I.6–I.9, II.5, II.9), `references/motion.md` (explosión y reordenación), `kit/blob.mjs` completo, `kit/audit.mjs` (recorder, settle, overlapsOf, orderKeys, depthOrder, coverage, supports, explodeStates), `examples/heart`, `examples/brain`, `examples/endocrine` y `examples/shared/specimen.mjs` y `live.js`.

Prueba práctica en `prototipos/kit-probe/` del repositorio de trabajo: `probe.mjs`, `brain-parts.mjs`, los resultados `results-az45.txt` y `az200/log.txt`, y las capturas `sheet-az45-pieces.png`, `sheet-az45-opacity-explode-isolate.png` y `sheet-az200-interlock.png`.

---

## 0. La respuesta de fondo: qué dibuja `paint` y qué no

`B.paint(F, P)` lanza un rayo por píxel **solo contra el campo `F`** (`F.march`) y se queda con el primer impacto. De ahí salen dos casos:

| Cómo se arma | Qué sale por pieza | Qué pasa al ocultar una |
|---|---|---|
| **Un campo con varias piezas** (unión o `blend` de varios tejidos). Es lo que hacen el encéfalo de `examples/brain`, el corazón y `complex()` en endocrine, que pinta una vez y reparte las capas por material. | Cada capa (`layers[m]`) es **solo la región visible** de ese tejido, ya recortada por lo que tiene delante. Además, el tejido `base` rellena **todo** el contorno por debajo. | Lo de atrás no existe en el SVG: queda un hueco. Si se oculta la base, desaparece el relleno de todo. |
| **Un campo por pieza**, pintado por separado. Es lo que hacen `organ()` y cada trozo de vaso en endocrine. | La pieza **completa y aislada**: contorno, tonos y líneas de toda su cara hacia la cámara, incluidas las partes que otra pieza tapará. | Funciona: lo de atrás ya está pintado. La oclusión entre piezas la da solo el orden de pintor del SVG, que resuelve `A.settle`. |

Lo medido (`probe.mjs`, pruebas 1 y 5):

- **Tres bolas una tras otra.** En un solo campo, las capas `mid` y `back` cubren el **32 %** de su disco, y la capa base cubre la silueta de la unión, el 163 %. Con un campo por bola, cada una cubre el **100 %** de su disco y pesa unos 9 KB.
- **Encéfalo completo** (dos hemisferios con giros y surcos del ejemplo, cerebelo y tronco), a resolución final (`cell 0.4`):
  - en un solo campo: 98 KB por vista y **200–214 s** de pintado;
  - en 4 piezas aisladas: **116–140 KB** por vista (un 20–45 % más, porque se pintan también las zonas tapadas) y **88–105 s** de pintado, más 24–42 s de `settle`. Sale *más rápido*, porque cada rayo evalúa un campo más pequeño. Hubo dos procesos en paralelo, así que los tiempos están algo inflados.
- **Ocultar el hemisferio cercano** (`sheet-az45-pieces.png`, tercer panel): aparecen la cara medial del otro hemisferio, el tronco y el cerebelo completos y bien sombreados.

**Conclusión:** no hace falta ninguna función nueva para «pintar cada hoja por separado». Basta con construir **un `B.field` por pieza** y llamar a `paint` una vez por pieza. El patrón ya existe (`organ()` en `examples/endocrine/build.mjs:286`). Lo que hay que evitar es `complex()` y los campos únicos con varios tejidos para las piezas que se ocultan, se hacen transparentes o se separan.

**Dos trampas confirmadas en la prueba:**

1. **Piezas hundidas unas en otras.** El modelo del ejemplo funde cerebelo y tronco dentro de los hemisferios. Pintadas aparte, se ve el tronco entrando en el hemisferio al ocultar el vecino, y la auditoría marca 5 `sunk pairs` y 2–3 problemas de `depth order`. Un modelo desmontable necesita **contactos a ras**: caras planas de `clip` o superficies que se tocan sin penetrarse.
2. **Encastres (interlock).** Desde atrás (azimut 200°), el cerebelo está delante de la parte baja del lóbulo occipital y detrás de su parte alta. Una pieza entera no se puede ordenar, y en `sheet-az200-interlock.png` el cerebelo se dibuja entero por encima del occipital. El kit ya lo detecta (`depth order: 3 problems`). La solución documentada es `B.split` en subpiezas (craft I.8), que en el DOM se agrupan con el mismo `data-part`.

Además, `B.split` y `halfspace(…, { seam: true })` **no dibujan contorno en la costura** (prueba 2: contorno abierto, sin cerrar; con `clip` sin costura sale cerrado). Por eso:

- las costuras solo sirven para cortar **una misma pieza** en trozos que siempre se muestran, se transparentan y se mueven juntos;
- las juntas entre piezas desmontables tienen que ser `clip` normales, con borde. Así es como se ve un modelo de aula real, con sus juntas.

---

## 1. Visibilidad por pieza: **se puede con poco**

- **Cómo:** un campo por pieza, `paint` y `fieldSvg` por pieza, `R.put({ name, piece, … })`, `A.settle` y orden por `key`. Cada ítem se emite como `<g data-part="…">`, igual que el `.it` de raptor. Ocultar es `display:none` o un atributo `data-off`.
- **Orden de pintor:** ocultar nunca obliga a reordenar. Las claves son números, y quitar ítems no invierte ningún par de los que quedan.
- **No sirve pregenerar estados.** Con 15 piezas habría 2¹⁵ combinaciones.
- **Peso:** un 20–45 % más por vista que el campo único (medido). Lo cubierto también se paga: una estructura interna (tálamo, ventrículos, núcleos) pesa aunque esté oculta.
- **Tiempo:** igual o menor que el campo único (medido).
- **Lo que hay que modelar bien:** las caras que solo se ven al desmontar (la cara medial de cada hemisferio, la cara superior del tronco, las caras de junta). Cada una tiene que ser anatómica, con `cores` para colorear, porque pasa a ser visible.

## 2. Transparencia por pieza: **se puede con poco**

- **Cómo:** `opacity` en el `<g>` de la pieza. Debe ser opacidad de grupo, no `fill-opacity` por trazado: el navegador compone el grupo entero y las capas y tonos internos no se transparentan entre sí. Probado en `sheet-az45-opacity-explode-isolate.png`, panel 1: el hemisferio al 30 % deja ver el otro hemisferio, el cerebelo y el tronco completos.
- **Mejor que `veilSvg` para esto.** `veilSvg` es una membrana dibujada al final (`bias: 1e4`) y queda fuera del orden de profundidad. Una pieza transparente, en cambio, **conserva su lugar en el orden**, así que lo que está delante de ella la sigue tapando. Hay que usar `veilSvg` solo para membranas de verdad (meninges como `B.grow` del encéfalo).
- **Límite:** una pieza transparente muestra su cara frontal teñida, no su interior ni su cara trasera. Para ver los ventrículos a través de la corteza, los ventrículos tienen que ser piezas propias, dibujadas detrás.
- **Peso:** cero extra. **Tiempo:** cero extra.
- **Ojo:** en el modo «fantasma» hay que poner `pointer-events:none` en las piezas transparentes; si no, capturan los clics de lo que hay detrás.

## 3. Despiece o explosión: **se puede con poco**, porque el kit ya trae el marco del Raptor

- **La traslación es exacta.** La proyección es paralela y la luz (`lightOf(P)`) es direccional y fija respecto a la cámara. Por eso trasladar en 3D es exactamente trasladar en 2D, con el mismo sombreado. Medido en la prueba 3: con un desplazamiento proyectado de (0, −384,77) px, el contorno se movió (0,8, −384,8) px; la diferencia es el ajuste a la rejilla de 0,4. Hay una captura en el panel 2.
- **El orden de pintor ya está resuelto en el kit**, heredado de Anatomy:
  - `R.put({ piece, move, ride })` y `A.recorder(P, { order, spring })`;
  - `A.explodeStates` genera estados uniformes, los muelles reales con escalonamiento y reversiones, y los estados de prefijo;
  - `A.settle` mide la profundidad real de cada par en todos esos estados y resuelve claves `key + lift × share`, con `lift = dot(move, V)`;
  - en la página, cada fotograma ordena por `data-k + lift × muelle` y reinserta los nodos solo si cambia el orden (`examples/raptor-engine/live.js:150-161`, `motion.md`, «Depth re-sorting»);
  - la auditoría recorre cada fotograma, incluidas las reversiones a medias, y falla si algo atraviesa algo (`flight`, `apart`, `solidClearances`).
- **Requisito:** la pieza tiene que estar **pintada completa**. Con el campo único, la explosión dejaría ver huecos.
- **Lo que hay que diseñar:**
  - **Vectores de explosión anatómicos:** hemisferios hacia lateral, tronco y cerebelo hacia abajo y atrás, médula hacia abajo.
  - **Orden del escalonamiento:** «el que está afuera sale primero».
  - **Una vía o un tracto que cruza dos piezas** va con una de ellas (`ride`) o se parte.
  - **`data-m` por vista:** el desplazamiento en pantalla depende del azimut, así que se guarda por vista o se proyecta con la `P` de cada vista.
- **Peso:** casi nada (los `data-k`, `data-m` y el script, unos 3–5 KB).
- **Tiempo:** `settle` sube con los estados de muelle (1.119 en el Raptor). Para 15–40 ítems calculo de 1 a 3 min más por vista. No lo medí con explosión.

## 4. Cortes sagital, coronal y axial: **se puede con poco**, como estados pregenerados

- **No hay corte en tiempo de ejecución.** `carve`, `clip` y `cores` se evalúan al construir. Un `clipPath` de SVG no sirve: dejaría la pieza hueca, sin cara de corte.
- **Corte sagital medio: gratis con el desmontaje.** La cara medial de un hemisferio es el corte sagital, así que ocultar o separar el otro hemisferio lo muestra. Hay que modelar esa cara (cuerpo calloso, tálamo, tercer ventrículo, fórnix, con `cores`). El ejemplo de endocrine ya tiene una cara medial con calloso y tálamo.
- **Coronal y axial:** son vistas extra, como la `cut` del corazón.
  - En la misma vista se aplica a cada pieza `B.clip(node, o, n, k, { mat: "cut" })`, o `carve` con `halfspace` y `{ mat }`, más `cores` para la sustancia gris, la blanca, los ventrículos y los núcleos.
  - Cada pieza recortada sigue siendo una pieza aislada, así que la visibilidad y el resaltado siguen funcionando en el estado de corte.
  - Lo que queda entero del lado retirado desaparece.
  - El corte axial se lee mejor con más elevación (`fitProjection(…, { elevation: 55–65 })`); el kit admite elevación por vista.
- **Peso:** cada estado de corte es una vista entera: ~130–200 KB sin comprimir por azimut en que se ofrezca.
  - Recomiendo cada corte **en 1 o 2 vistas fijas** y no en las 8–12 del giro.
  - Con 3 planos a 2 azimuts son ~6 vistas, ~0,8–1,2 MB sin comprimir y ~0,3–0,4 MB con gzip.
- **Tiempo:** el de una vista: 2–4 min de CPU, en paralelo por proceso.

## 5. Giro: **ya se puede** (vistas pregeneradas y fundido)

- **Cómo funciona hoy:** una `P` por azimut, un proceso hijo por vista (`spawn … --child=`) y un `<svg data-view>` apilado con fundido CSS (`opacity .5s`). Cada vista se audita por separado.
- **Cuántas vistas para 360°:**
  - **12 vistas a 30°** dan un giro aceptable con fundido. `brain` usa pasos de 30° y endocrine de 15°.
  - **8 a 45°** son el mínimo: se lee como «tocadiscos» a saltos.
  - Añadiría **2 vistas de elevación:** superior (giros y cisura longitudinal) e **inferior o basal** (pares craneales, quiasma, tronco), la más didáctica para el SNC.
  - En total, 10–14 vistas.
- **Peso por vista:** el encéfalo de 4 piezas mide 116–140 KB sin comprimir, frente a 94–98 KB del ejemplo `brain`. Con 8–20 piezas, más los tractos y la médula, estimo **150–250 KB por vista**, y gzip deja un ~35 % (el `brain-light.html` publicado baja de 335 KB a 121 KB).
  - 12 vistas suman ~2–3 MB sin comprimir y ~0,7–1 MB por la red. Más los cortes, ~3–4 MB.
  - Es del orden de la v3 endocrina (2,9 MB).
- **Tiempo de construcción:** 2–4 min de CPU por vista. Con 16 núcleos y un proceso por vista, **~5–8 min de reloj** para todo; el modo `--quick` es ~3 veces más rápido.
- **Ojo con el giro completo:**
  - Las divisiones con `B.split` dependen del azimut: la cara de corte de la subpieza cercana tiene que mirar lejos de la cámara (craft I.8). Con 360° hay que **elegir semillas por vista**, o aceptar más subpiezas. Cada vista se construye aparte, así que se puede.
  - **El soporte:** la varilla tiene que entrar por una cara que no se vea desde ninguna vista. Lo natural es que **la médula espinal sea la varilla** que baja a la peana. En la vista basal se oculta la peana.

## 6. Seleccionar con clic o toque, resaltar, ficha y aislar: **se puede con poco**

- **El hit-test sale gratis.** El orden del DOM es el orden de pintor, así que el elemento de más arriba bajo el puntero es la pieza visible. Hace falta activar `pointer-events` en la vista activa: hoy `.sp-stage>svg` los tiene a `none`.
- **Resaltado por CSS, como endocrine:**
  - `data-lit` en grupos `data-g` (`examples/endocrine/live.js:46`), o
  - el `data-on`/`data-focus` del Raptor: baja un tono a todo lo demás y sube el contorno y los tokens `--tissue-*` de la pieza elegida.
- **Ficha:** HTML del panel, con texto por pieza en un `text.mjs` con la lista literal de nombres y funciones. Sin coste en el SVG.
- **Aislar** es ocultar todo lo demás, y funciona porque la pieza está completa (panel 3 de `sheet-az45-opacity-explode-isolate.png`). Opcionalmente, se traslada la pieza al centro, o se escala con `vector-effect: non-scaling-stroke` en los trazos.
- **Atenuar** las demás en lugar de ocultarlas deja fantasmas encima de la pieza si están delante. En ese modo conviene dibujar la elegida al final (reinsertarla en el DOM) o ocultar del todo lo que tiene delante.
- **Peso:** ~0. **Tiempo:** ~0.

## 7. Resaltar vías y tractos: **se puede con poco** (en superficie o con transparencia); **hace falta trabajo** para un atlas de tractos internos

Las vías van por dentro del encéfalo, así que en un modelo opaco no se ven. Hay tres caminos, que se pueden combinar:

1. **Tracto como pieza propia.** Un `B.vessel` a lo largo de su recorrido, partido en trozos con costura como los vasos de endocrine, cada trozo pintado aislado y ordenado por `settle`. Se ve cuando se ocultan o transparentan las piezas que lo cubren, o en un corte.
   - Encender y apagar es CSS (`data-g="corticoespinal"`, `data-lit`).
   - Pesa unos 3–10 KB por tracto y vista.
   - En la auditoría hay que declarar el `blend` con las piezas que lo contienen; si no, `supports` lo marca como hundido.
2. **Flujo animado.** Un trazado discontinuo animado a lo largo de la línea central proyectada, como el `flowPath` y los canales `--lv-*` de endocrine. Unos cientos de bytes por tracto y vista. Encima de un hemisferio opaco sería una línea dibujada a rayos X, contra la doctrina de «no wireframes». Hay que usarlo solo sobre piezas transparentes u ocultas, o en caras de corte.
3. **El tracto en la cara de corte.** `cores` con el material del tracto, que colorea su sección en los cortes coronal y axial (la cápsula interna, por ejemplo). Es lo más «de modelo de aula», y su peso va incluido en la vista de corte.

Para encender una vía de punta a punta (corteza motora → cápsula interna → pedúnculo → pirámide → médula) lo práctico es combinar el modo transparente de las piezas que la cubren, el camino 1 y el flujo animado. Un atlas de muchos tractos con rutas fieles es sobre todo trabajo de datos anatómicos (las rutas 3D), no del kit.

---

## 8. La auditoría con piezas aisladas

**Sigue sirviendo tal cual:**

- **`A.field`** por pieza, con `organic: true`. La prueba 4 da 0 problemas de profundidad con piezas separadas y detecta las hundidas (`sunk pairs`).
- **`depthOrder` y `settle`** comparan **cada par** que se solapa en pantalla con sus propias superficies, sin importar si un tercero los tapa. Por eso cubren de antemano cualquier subconjunto visible y cualquier transparencia. Era justo la duda: no hay que auditar las 2ᴺ combinaciones.
- **El despiece, completo:** `explodeStates`, `flight`, `apart` y `looseEnds`.
- **`coverage` («stand-in shapes»)** compara el recuadro dibujado con el registrado por ítem: sirve igual.
- **`lipschitz`, `fieldBounds` y `veils`** sirven igual.

**Hay que relajar o declarar:**

- **`supports`:** las estructuras internas a propósito (tractos, ventrículos, núcleos dentro del hemisferio) se declaran con `blend: [...]`; si no, cuentan como hundidas. En los estados «aislado» o «desmontado» una pieza puede quedar flotando. Es aceptable como estado didáctico, pero el chequeo estático no lo sabe: se documenta como decisión.
- **`terminals` en modo orgánico:** los tractos que nacen y mueren dentro de piezas se declaran como `blend` o `free`.

**Habría que añadir:**

1. **Costuras huérfanas.** Las subpiezas de `B.split` (con costura y sin borde) deben compartir `data-part`; si no, al ocultar una se ve una cara abierta. Es un chequeo barato en la construcción.
2. **Capturas y `lines.mjs` por preset.** Las caras ocultas en el montaje (medial, juntas) solo se ven al desmontar, y `scripts/lines.mjs` revisa la página en su estado inicial. Hay que pasarle presets (cada pieza aislada, desmontado, cada corte) con `drive.mjs`.
3. **Encastres por vista.** Ya los detecta `depthOrder`. Conviene un aviso que nombre la pieza a partir y proponga semillas para `B.split`.

---

## 9. ¿Hace falta una función nueva en el kit?

**Para los controles 1, 2, 3, 5 y 6, no.** Todo sale de un campo por pieza, `recorder`/`settle`/`explodeStates` y atributos `data-*`. Lo que falta es **ensamblaje**, y eso va mejor en un módulo nuevo que en `blob.mjs`:

| Qué | Dónde | Trabajo | Riesgo para los ejemplos |
|---|---|---|---|
| **`assembly.mjs`**: recibe `pieces[{ name, node, tissue, move, group, splits }]` y, por vista, pinta cada pieza aislada, registra `A.field`, aplica los `split`, hace `settle` con `explodeStates` y emite `<g class="it" data-part data-k data-m>`. Incluye un `live.js` con mostrar y ocultar, opacidad, explosión con reordenación, selección y ficha, y los presets de estado. | `examples/shared/assembly.mjs` y `assembly-live.js` (o `kit/assembly.mjs` si se quiere como API) | 1,5–2,5 días | Ninguno: es un archivo nuevo y nadie más lo importa. |
| **`paint({ seamEdge: true })`**: emite aparte, como `painted.seamEdge`, el borde a lo largo de la costura, para dibujarlo solo cuando la pieza vecina esté oculta o separada. Permite subpiezas con costura que se separan. | `kit/blob.mjs`, en `paint` (ramas `splitRun`) y `fieldSvg` | 0,5 día | Bajo si va **apagado por defecto**. Hay que comprobar que heart, endocrine, kidney, liver y brain generan el mismo HTML byte a byte antes y después (hay CI en Ubuntu). |
| **Sugerencia automática de `split`** para los pares en ciclo (semillas a lo largo de la normal del par) | `kit/audit.mjs`, junto a `orderKeys` y su `cycles` | 1–2 días | Bajo si es una función nueva y solo informativa. |
| **Paralelismo por pieza** (hoy es por vista) | El constructor | 0,5 día | Ninguno. Solo hace falta si hay muchas más vistas que núcleos. |

El **riesgo principal no está en el kit sino en el modelo**: piezas a ras sin penetrarse, caras de contacto anatómicas, `split` por vista para los encastres y un recorrido creíble de los tractos. Eso es lo que más tiempo se lleva.

---

## 10. Arquitectura recomendada

1. **Modelo en `model.mjs`:** cada pieza es un nodo SDF propio, en mm y en un marco anatómico (x anterior, y izquierda, z superior). Piezas propuestas (~14–18):
   - cada hemisferio en 2 (frontal + parietal; temporal + occipital), con la cara medial modelada;
   - cerebelo, mesencéfalo, protuberancia, bulbo y médula, que hace de varilla;
   - internas: tálamo y diencéfalo, ventrículos laterales, núcleos basales e hipocampo;
   - tractos como trozos de `vessel` con costura;
   - meninges opcionales como velo.

   Las juntas entre piezas son `clip` a ras, con borde. Las costuras (`seam`) solo van dentro de una misma pieza, para resolver encastres.
2. **Constructor:**
   - un proceso hijo por vista: 12 azimuts a 30° con elevación de 24°, más una vista superior, una basal y 4–6 vistas de corte (coronal y axial en 2 azimuts cada uno);
   - dentro de cada vista, `paint` por pieza con los ajustes del ejemplo `brain` (`jump: 5`, `toneSmooth: 2.5`, `tones: "overlay"`), `A.recorder(P, { order: STAGGER, spring: SPRING })`, `A.settle`, y `audit({ organic: true })` por vista;
   - presupuesto: ~3–4 MB sin comprimir y ~1–1,3 MB con gzip; 5–8 min de reloj en 16 núcleos y 1–2 min con `--quick`.
3. **DOM por vista:** `<svg data-view>` con hijos `<g class="it" data-part data-g data-k data-m>` en el orden resuelto.
4. **`live.js`:**
   - **visibilidad:** `data-off` → `display:none`;
   - **transparencia:** `style.opacity` en el grupo y `pointer-events:none`;
   - **despiece:** muelles y escalonamiento iguales a los de la auditoría, `translate` desde `data-m` y reordenación solo cuando cambia;
   - **selección:** `pointerdown` en `[data-part]`, más `data-focus` y `data-on`;
   - **ficha:** panel HTML;
   - **tractos:** `data-lit` por grupo y flujo con `stroke-dasharray`;
   - **giro:** el fundido actual, conservando entre vistas el estado (ocultas, transparencia, selección, despiece), que se aplica de nuevo a la vista entrante;
   - **controles de presentador:** las flechas siguen siendo del presentador, regla de la v2/v3.
5. **Verificación:**
   - `--audit` por vista;
   - `lines.mjs` y capturas a 1920, 1280 y 1024 en presets (montado, cada pieza aislada, desmontado, cada corte, cada tracto encendido);
   - revisar cada PNG.

**Veredictos:**

| Control | Veredicto |
|---|---|
| 1. Visibilidad | Se puede con poco (un campo por pieza; nada de `complex()` ni campo único) |
| 2. Transparencia | Se puede con poco (`opacity` de grupo sobre piezas completas) |
| 3. Despiece | Se puede con poco (el kit ya trae la maquinaria del Raptor) |
| 4. Cortes | Se puede con poco (estados pregenerados con `clip`/`carve` + `cores`; el sagital medio sale gratis al desmontar) |
| 5. Giro | Ya se puede (12 + 2 vistas; ~150–250 KB por vista sin comprimir) |
| 6. Selección, ficha y aislamiento | Se puede con poco |
| 7. Vías y tractos | Se puede con poco en modo transparente, de corte o de flujo; un atlas fiel de tractos es trabajo de modelo, no del kit |
| Kit | No hace falta tocar `blob.mjs` ni `audit.mjs`. Recomendado: `assembly.mjs` nuevo (1,5–2,5 días); opcional: `seamEdge` apagado por defecto (0,5 día) |
