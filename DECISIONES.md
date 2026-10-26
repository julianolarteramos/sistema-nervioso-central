# Decisiones de diseño, reglas de modelado y lo aprendido

Este documento reúne las decisiones de diseño del modelo del sistema nervioso central, las reglas de modelado que salieron de cada fallo de la auditoría, las excepciones documentadas con sus medidas y las lecciones del proceso. Es el complemento técnico del [README](README.md) y del [diario del proceso](proceso/).

Explorador interactivo, en una sola página HTML, de un **modelo de aula del encéfalo y la médula espinal** que se desmonta pieza por pieza. Se dibuja con **specimen**, nuestro fork orgánico de `/anatomy`: https://github.com/julianolarteramos/specimen.

## Decisiones de Julián (2026-10-22)

- **Alcance:** encéfalo y médula espinal. Los pares craneales van solo como muñones de salida.
- **Uso:** explorador libre con controles. El modo por pasos se puede añadir después.
- **Despiece:** detallado, de unas 24 piezas. La lista está en `investigacion/ANATOMIA.md`.
- **Giro:** 8 vistas cada 45°, más una superior y una inferior.
- **Módulo de ensamblaje** (pintar cada pieza aislada, despiece, grupos con controles): vive **en este repo**, en `lib/assembly.mjs`. No sube a specimen sin el OK de Julián.
- **Imágenes de referencia:**
  - las libres, de `referencias/`, llevan crédito y se pueden mostrar y publicar;

## specimen

- Los scripts importan el kit a través de `kit.mjs`, que lo busca en este orden:
  1. `SPECIMEN_HOME`;
  2. la caché del plugin instalado;
  3. el checkout local `~/code/experiments/specimen`.
- **No se edita el repo de specimen desde aquí.**

## Carpetas

- `investigacion/ANATOMIA.md`: unas 75 piezas con forma en primitivas, medidas, posición en un marco RAS con origen en la comisura anterior, contactos y vistas. También las vías y los despieces de los modelos comerciales. Los datos marcados «(estimado)» no tienen fuente firme.
- `investigacion/CONTROLES-VIABILIDAD.md`: qué permite el kit para cada control y la arquitectura recomendada.
- `prototipos/kit-probe/`: la prueba del encéfalo de 4 piezas pintadas aisladas, con opacidad, despiece y aislamiento.

## Reglas técnicas aprendidas

- **Una pieza desmontable es un campo propio**, pintado completo. Si se pintan varias piezas en un mismo campo, cada una sale recortada por las que la tapan, y al ocultar una queda un hueco.
- **Contactos a ras, no hundidos.** Si las piezas se hunden unas en otras, salen pares hundidos y fallos de orden. Las estructuras internas a propósito se declaran con `blend` en la auditoría.
- **Piezas trabadas:** cuando no se pueden ordenar desde alguna vista (el cerebelo bajo el occipital, vista desde atrás), se parten con `B.split`. Las semillas se eligen por vista.
- **Juntas:** `B.split` y `halfspace(..., {seam:true})` no dibujan borde. Sirven solo dentro de una misma pieza; las juntas entre piezas desmontables van con `clip` y borde.
- **Despiece:** en proyección paralela, trasladar una pieza en 3D equivale a trasladarla en 2D. Para el orden de pintor, se usa la auditoría de fotogramas de explosión del kit (`settle`).
- **Verificación por estado:**
  - `--audit` en cada vista;
  - `lines.mjs` con 0 extremos sueltos;
  - capturas a 1920×1080, 1280×720 y 1024×768 de cada estado: armado, despiece, cada corte y piezas aisladas;
  - revisar uno mismo los PNG.

## Fase 1: ensamblaje, RAM y tiempos (2026-10-22)

**Código:** `lib/assembly.mjs` (pintado por pieza en hijos, caché, orden de pintor con `A.settle` en todos los estados del deslizador, auditoría), `lib/campos.mjs` (barridos y recortes horneados), `lib/assembly-live.js` y `lib/assembly.css` (controles), `modelo/snc.mjs` (piezas y despiece), `build.mjs` (página), `scripts/verificar.mjs` (capturas por estado y tamaño), `scripts/construir.sh` (lanzador con vigilancia de RAM).

**Cómo construir (obligatorio):** `scripts/construir.sh --light --view=lat-izq [--quick] [--audit]`. No lanza con menos de 8 GB disponibles y mata los `node` si el sistema pasa de 18 GB usados. `SNC_JOBS=n` fuerza el paralelismo (por defecto 2 en el script; `lib/assembly.mjs` lo limita por RAM libre, máximo 6, y 3 para el orden). Cada hijo corre con `--max-old-space-size=3072`.

**RAM medida (una vista, 5 piezas, 11 subpiezas, `maxRSS` de cada proceso):**

| Proceso | Pico | Notas |
|---|---|---|
| `--paint` (una subpieza) | ≈ 550 MB | Lo dominan las rejillas horneadas de los barridos (h = 0,6 mm, 3–10 M celdas). Sin el arreglo de `sweep` eran 4,4 GB por rejilla. |
| `--settle` (orden + auditoría de una vista) | ≈ 860–900 MB | Crece con (subpiezas)² × estados. |
| Proceso principal | ≈ 66 MB | La clave de la caché usa `tag` en los campos horneados; antes los evaluaba y tardaba 6 min. |
| Sistema, con 6 trabajos | ≈ 3,3 GB usados | Sin riesgo con 24 GB. |

**Tiempos (construcción completa, 1 vista, 6 trabajos):** pintado 208 s, orden 90 s, auditoría 92 s; total 391 s. La página pesa 295 KB. Para las fases 2 y 3 el tiempo, no la RAM, será la restricción: el orden crece con el cuadrado de las subpiezas y con los 25 estados del deslizador, y el pintado repite el horneado de cada barrido en cada hijo (falta una caché de rejillas en disco).

**Reglas de modelado que salieron de esta fase (cada una evitó un fallo real de la auditoría):**
1. **Despiece sin atascos.** Antes de dar un vector a una pieza hay que probar que sale libre: cada recta paralela al vector corta a la pieza que sale y a las que se quedan en intervalos separados. Con las dos mitades del tálamo como un solo ovoide centrado en la línea media, los hemisferios salen hacia los lados sin tocar el tronco; el cerebelo sale atrás y abajo (0, −45, −65); el tronco sale al final, hacia arriba. Ensayo rápido: `.cache/blocked.mjs` (no está en git) muestrea la superficie de una pieza, la mueve 6 mm y cuenta puntos dentro de la otra.
2. **Holgura de 0,8 mm (`GAP`) entre piezas que se tocan**, no contacto exacto: así el orden de pintor decide cada par sin empates (la auditoría compara con 0,3 mm de tolerancia). A esa escala se lee como una junta a ras. Consecuencia: la auditoría de soportes ve las piezas sueltas, y por eso están declaradas `ground: true`; es una decisión, no un descuido.
3. **Piezas que envuelven a otra (el hemisferio alrededor del tronco) se parten por su sombra** a lo largo de la mirada (`split: [{ shadow: [...] }]`): un trozo «detrás» de la otra pieza y otro «delante», uno por cada pieza que tapa. Los trozos comparten `data-part`, no llevan borde en la costura y salen con una clave de pintor inicial baja (`bias`). El margen de la sombra importa: 0,25 para el tronco y 0,1 para el cerebelo; con 0,6 aparecen láminas delgadas pintadas en el orden contrario.
4. **Desasiento (`stage[2]`).** Una pieza que arranca desde cero deja un fotograma en que las piezas casi a ras se ordenan por décimas de milímetro, y ahí hay ciclos de tres piezas que ninguna clave de pintor resuelve. Cada pieza se despega de golpe un 4–8 % de su recorrido (≈ 7 mm para los hemisferios) y sigue con rampa suave.
5. **Campos baratos:** los cortadores (`culled`, `sweep`) devuelven la distancia a una esfera lejos de la pieza; los barridos se hornean en una rejilla con interpolación trilineal y se escalan por 1/1,75 para seguir siendo 1-Lipschitz. Sin esto el pintado era 5–10 veces más lento.
6. **Qué no se pudo resolver con piezas que envuelven:** una pieza con muescas (cuenco) alrededor de un cuerpo que solo sale en una dirección hace que algunas vistas y estados queden con ciclos de tres piezas. Para las ~24 piezas de la fase 2 conviene que cada pieza interior salga por una dirección en que ningún tramo del hemisferio la envuelva (los núcleos salen hacia la izquierda por la cavidad del lóbulo que se quitó), como en el despiece del dossier.

## Fase 2 (en curso): piezas por grupos, tiempo y RAM (2026-10-22)

**Layout:** la página ocupa el alto de la ventana: el panel derecho reparte la altura entre el árbol de piezas y la ficha, cada uno con su desplazamiento interno, y el pie va debajo. Verificado a 1920×1080, 1280×720 y 1024×768.

**Arquitectura nueva:**
- `modelo/prims.mjs` (primitivas RAS, `GAP`, `capAt`), `modelo/anatomia.mjs` (sólidos de cada pieza), `modelo/piezas.mjs` (lista de piezas, núcleo profundo `KERN` y reparto en capas), `textos.mjs` (sistemas y fichas).
- `scripts/planear-salidas.mjs` calcula el orden de extracción y el vector de cada pieza (voraz: sale la primera de la lista que tenga una dirección libre) y escribe `modelo/salidas.json`. Si ninguna puede salir, imprime un BLOQUEO con las piezas que la bloquean.
- `lib/assembly.mjs`: plan de cortes automático por vista (`planSplits`): busca pares que se ordenan en los dos sentidos, prueba cortar uno por la sombra del otro y conserva lo que resuelve el par. Estados del orden: reposo, cada pieza recién despegada, a mitad y al llegar.
- `lib/campos.mjs`: rejillas horneadas en disco (`.cache/grids`, cuantizadas a 0,1 mm y comprimidas) para barridos (`sweep`), cascos en x (`xhull`) y semillas (`bakeField`).

**Reglas de modelado nuevas:**
1. Todo lo que está dentro del hemisferio izquierdo sale hacia la izquierda, en capas de x (lateral → medial). Para que ninguna capa quede atrapada, el reparto de la sustancia entre piezas se hace por barridos en x: la capa lateral (ínsula, claustro, cápsula externa) es lo que ve un núcleo hacia dentro y ninguno hacia fuera; el caudado se queda con lo que tiene medial a él hasta la línea media.
2. Las piezas de la línea media (tálamos, hipotálamo, mesencéfalo) llevan un casco en x: se rellena el hueco entre sus dos mitades, para que el hemisferio no pueda quedar atrapado entre ellas.
3. Los lóbulos son casquetes alrededor de un núcleo profundo en forma de medio elipsoide con la cara plana en la línea media; así salen radialmente.
4. Cada cadena de pares trabados se rompe con cortes por la sombra; el planificador elige el corte probando solo con las dos piezas.

| Grupo (acumulado) | Piezas / trozos | Plan de cortes | Pintado `--quick` | Orden + auditoría | RAM pico (pintado · orden · plan) | Auditoría |
|---|---|---|---|---|---|---|
| 1: lóbulos, ínsula, cápsula, cerebelo (3), tálamos, hipotálamo, tronco (3), hemisferio der., médula | 16 / 36 | 119 s | 75 s | 266 s | 344 · 876 · 563 MB | 2 problemas |
| 2: + putamen, pálido, caudado | 19 / 61 | 869 s (primera vez, con rejillas sin caché) | 90 s | 508 s | 403 · 906 · 1696 MB | 76 filas (≈ 6 pares), ver el informe |

## Decisión de diseño: mitad derecha entera (2026-10-23)

Julián eligió la opción A: el **hemisferio derecho incluye la mitad derecha de todo lo que cruza la línea media** (tálamos, hipotálamo,
mesencéfalo, puente, bulbo, mitad derecha del cerebelo y del vermis, calloso, fórnix, septum, pineal, ventrículos), y las piezas de la
línea media son **mitades izquierdas** con cara plana de corte sagital (sus fichas dicen «mitad izquierda»). Se aparta del dossier
(`investigacion/ANATOMIA.md`, nota en la sección 13) porque con el derecho entero y con muescas el orden de pintor tenía ciclos de tres
piezas que ninguna clave resuelve. La médula no se parte (es la varilla). Antes: 76 filas rojas en la auditoría de una vista; después: 1.

## Qué sigue (2026-10-23, al migrar de cuenta)

1. **Estado:** fase 2, grupo 3. `modelo/piezas.mjs` tiene 24 piezas (con calloso, septum, fórnix, molde ventricular, pineal, hipocampo y vermis). Falta enchufar de `modelo/anatomia2.mjs`: bulbo olfatorio, vía óptica, dura/hoz/tienda y rodajas de médula con raíces.
2. **Pendiente de la auditoría de `lat-izq`:** el plan de cortes deja 2 pares trabados sin corte posible (`insula-izq`/`capsula-izq` y `capsula-izq`/`hipocampo-izq`). Hay que resolverlos antes de dar el grupo por bueno.
3. **Paso exacto:** `scripts/construir.sh --light --quick --view=lat-izq --audit`. La última corrida (plan de 683 s, pico de sistema 4,9 GB) se abortó en la auditoría a los ~35 min de CPU, y se desconoce su resultado. Si el orden pasa de ~30 min, parar y medir antes de añadir piezas.
4. **Después:** commit de la fase 2, revisar capturas a 1920, 1280 y 1024 y añadir el hito a `proceso/hitos.json` (`node scripts/proceso.mjs`). Luego la fase 3: 10 vistas, cortes, pelado, vías y rótulos.

## Fase 2, estado al 2026-10-24: 23 piezas, orden de pintor limpio

**Pieza quitada:** la cápsula interna. Era el origen de casi todos los ciclos (73 de 89 problemas en una prueba): un cuenco hueco que envolvía al hipocampo, al fórnix y al ventrículo. Julián decidió quitarla como pieza (2026-10-23); su volumen queda hueco dentro de los lóbulos y la sustancia blanca se ve en su cara de corte. No tiene ficha.

**Resultado:** de 127 problemas de auditoría a 1 (auditoría completa del 2026-10-23, 1725 s de chequeos del kit) y, con la excepción de abajo, 0 en el orden de pintor.

**Excepción conocida, aceptada por Julián:** el fórnix y el molde ventricular se ordenan al revés en un solape de ~7 px² (unos 3×3 píxeles) en la posición 0,68 del deslizador. Es un arco fino pegado al techo del ventrículo. Se probaron otro vector de salida del fórnix (empeoró: ciclo nuevo con el tálamo) y otro orden de salida (empeoró a 107 px²). Se declara en `build.mjs` (`allowOrder`). **Si se mueve el fórnix o el molde, hay que volver a mirar esta excepción.**

**Herramientas nuevas:**
- `scripts/construir.sh ... --orden`: solo la comprobación de profundidad con el orden ya calculado. Da los mismos problemas de orden que la auditoría completa en ~2 min (con el plan en caché) en vez de ~50. **No sustituye a la auditoría completa**, que hay que pasar al cerrar cada grupo (holguras, apoyos, pendientes de los campos).
- `scripts/construir.sh ... --solo=a,b,c`: construye y audita solo esas piezas, sin peana (`snc-solo-light.html`, ignorada por git).
- `scripts/estado.sh [--seguir]`: panel de lo que corre; el registro fijo es `.cache/construccion.log`.
- `scripts/instantanea.mjs "etiqueta"`: foto temporal de una corrida para el diario (`proceso/`). Cada grupo nuevo debe dejar su foto y su hito en `proceso/hitos.json`.

**Lo que aprendimos del planificador de cortes (`planSplits`):**
1. Solo veía pares; los ciclos de cuatro piezas (molde, hipocampo, caudado, calloso) no aparecían. Ahora lee también las reglas que el ordenamiento tiene que descartar (`orderKeys(...).dropped`) y corta una de las dos piezas.
2. Debe mirar los estados del despiece (con `move` en cada trozo), no solo el reposo.
3. Igualar su resolución con la del orden (0,75 mm) no cambió nada.
4. Una ronda sin cortes nuevos corta el bucle: la siguiente rasterizaría lo mismo.
5. Probar cada cambio por separado: cuando se juntaron dos, un retroceso costó tiempo de diagnóstico.
6. Se declara `L: 6.5` en el molde ventricular porque su campo tiene una pendiente real de 6,15; el chequeo `lipschitz` lo exige y se usa al pintar y al ordenar.

**Qué sigue:**
1. Piezas que faltan, por grupos: bulbo olfatorio, vía óptica (quiasma, nervios y tractos), duramadre con hoz y tienda y aracnoides como velo, rodajas de médula con raíces y ganglios. Todas tienen su geometría en `modelo/anatomia2.mjs` y sus fichas por escribir en `textos.mjs`.
2. Tras cada grupo: `--orden` para iterar, auditoría completa al cerrar, foto en `proceso/` y commit.
3. Fase 3: 8 vistas de giro cada 45° más superior e inferior, cortes, pelado por capas, vías y rótulos.

## Fase 2, estado al 2026-10-24 (tarde): 30 piezas

**Piezas:** las 23 de antes más el bulbo y tracto olfatorios, la vía óptica (mitad izquierda; la derecha va dentro de la mitad derecha), cuatro meninges (duramadre, aracnoides, hoz y tienda), las raíces con ganglios (unidas a la médula cervical) y las rodajas de médula (C6, T6, L3, S2; inclinadas 62° hacia la cámara y en cuadrícula alrededor del poste).

**Membranas (meninges):** piezas con `veil: opacidad` en `piezas.mjs`. Se pintan con `veilSvg`, no entran en el orden de pintor, el planificador de cortes las ignora y se declaran con `blend: ["*"]` en la auditoría (se despegan por encima atravesando sólidos: es una membrana translúcida). `scripts/planear-salidas.mjs` las saca primero, lejos y sin comprobar choques; el casquete de la duramadre abraza el cerebro por debajo del ecuador y ninguna dirección estaría libre. La hoz mide 0,6 mm para caber en la holgura de 0,8 mm entre hemisferios.

**Herramientas nuevas (además de las de arriba):**
- `--vuelo`: orden de pintor y holguras en vuelo (~16 min con el plan en caché). Es lo que hay que usar para iterar sobre penetraciones en pleno despiece.
- `--solidos`: lo anterior más apoyos y holguras con el despiece completo (~90 min: esos dos chequeos son lo lento).
- `--audit`: la auditoría completa (~85 a 100 min con 30 piezas; 4700 a 5700 s en los chequeos del kit). Es el cierre obligatorio de cada grupo.
- `modelo/ajustes-salidas.json`: vectores de despiece a mano que tienen prioridad sobre `salidas.json`. El planificador reescribe `salidas.json` entero, así que las correcciones viven aparte.

**Lo que aprendimos del despiece:**
1. `scripts/planear-salidas.mjs` no hace nada con `--only` (lo lee y no lo usa): cada pieza nueva cuesta una pasada completa (12 a 28 min) y recalcula los vectores de casi todas.
2. Muestrea cada 4 mm y no ve penetraciones finas de ~1 mm que la auditoría (1 mm) sí halla. Exigir margen positivo (`INSIDE = 0,2`) bloquea todo, porque el campo de distancia es una cota que subestima la distancia real; se queda en -0,45 y las penetraciones finas se corrigen a mano.
3. Mesencéfalo y puente subían casi igual (115,7 y 117,7 mm) y el puente, que está debajo, se clavaba 1,2 mm en el mesencéfalo: el que sale después debe subir menos. Ahora el puente sube 105.
4. El fórnix está tucado bajo un saliente del tálamo: cualquier dirección hacia arriba lo choca (−1,03 mm) y hacia adelante y arriba queda libre. Se buscó con un muestreo fino por dirección, no a ciegas. Ahora sale a `[-25, 96, 67]`.
5. Una pieza formada por varios objetos separados (las rodajas) no puede quedar a ambos lados de algo que no es pieza (el poste del montaje): el planificador de cortes no ve el montaje y se forma un ciclo.

**Estado de la auditoría (2026-10-24 17:46): `audit passed`** con las 30 piezas (auditoría completa de 99 min; orden 116 s), `lines.mjs` con 0 de 2502 extremos sueltos y capturas a 1920×1080, 1280×720 y 1024×768 con la consola limpia en 14 estados (`scripts/verificar.mjs`). La fase 2 está cerrada.

**Qué sigue:**
1. Fase 3: 8 vistas de giro cada 45° más superior e inferior, cortes sagital, coronal y axial, pelado por capas, vías con flujo animado y rótulos. Cada vista multiplica el tiempo de construcción: con 30 piezas una sola vista tarda ~100 min con auditoría completa, así que hay que decidir con Julián cómo acotarlo antes de lanzar 10 vistas.

**Pendientes conocidos para la fase 3:** el despiece completo se ve apretado en el centro del marco y algunas piezas quedan tapadas (el mesencéfalo, que el script de capturas no halla para hacer clic); el planificador de salidas no reparte las piezas por el espacio de la pantalla, solo busca una salida libre. Conviene un reparto radial o por capas visibles.

## Fase 3, estado al 2026-10-25: las 10 vistas de giro, con el orden de pintor limpio

**Piezas:** 34 (las 30 de antes con el caudado en dos, cabeza con cuerpo y cola, y las rodajas de médula en cuatro, una por nivel). La lista y sus vectores de despiece están en `modelo/piezas.mjs`, `modelo/salidas.json` (planificador) y `modelo/ajustes-salidas.json` (a mano).

**Vistas** (`build.mjs`): 8 de giro cada 45° a 22° de elevación (`lat-izq` 30°, `az075`, `az120`, `az165`, `az210`, `az255`, `az300`, `az345`) más `sup` (elevación 78°) e `inf` (−55°, sin peana). Los nombres visibles de cada una son provisionales (`Vista 75°`…): hay que ajustarlos mirando las capturas.

**Tolerancia del orden de pintor (decidida con Julián, 2026-10-25):** `orderLeast: 4` px² en `build.mjs`. Un solape de hasta 4 px² (2×2 píxeles de la figura de 640, unos 3×3 en pantalla) no cuenta; el kit usa 0,25 (menos de una celda de la rejilla) y con ese umbral las vistas daban cientos de filas que eran el mismo trocito repetido en cada posición del deslizador. La lateral izquierda pasa con 0 incluso sin tolerancia.

**Excepciones por vista** (`allowOrder` en `build.mjs`; solapes reales mayores que la tolerancia que no se resolvieron partiendo piezas). Tras rehacer el tronco como un solo cuerpo continuo (2026-10-26) quedan **cuatro**; se retiraron las de `az120` (pineal / temporal), `inf` (hipotálamo / fórnix) y `az345` (peana / hipotálamo):
| Vista | Par | Solape | Profundidad |
|---|---|---|---|
| `az210` | **puente / temporal** | **417 px², 41 estados** (antes 643) | 18,5 mm |
| `inf` | caudado / hipocampo | 134 px², 54 estados | 8,8 mm |
| `az255` | calloso / molde ventricular | 40 px², un estado | 18,9 mm |
| `sup` | olfatorio / temporal | 28 px², un estado | 7,8 mm |
La de `az210` es la única grande: el temporal envuelve el ala del puente; ni con 6 cortes por pieza se resolvió. Hay que revisarla a ojo en varias posiciones del deslizador antes de dar la vista por buena. **Ojo al podar excepciones:** las filas excusadas de algunas vistas se imprimen con otro formato y no se ven al buscarlas; la forma fiable de saber si una excepción hace falta es quitarla y reconstruir esa vista.

**Lo que aprendimos:**
1. Con las vistas de giro, el problema se concentraba en pocos pares que se repetían entre vistas. El caudado (una C) se entrelazaba con otras dos C, el molde ventricular y el hipocampo; partirlo en cabeza con cuerpo, y cola, y las rodajas en cuatro piezas bajó los problemas de 567 a 295 en las 5 vistas más difíciles, y la tolerancia lo dejó en las excepciones de arriba.
2. Los planes de cortes se calculan en paralelo (hasta 3 a la vez). Una vista casi de espaldas (`az210`) tarda ~40 min; las demás entre 9 y 20.
3. El tope de cortes por pieza (`maxCuts`, 4 por defecto) se puede subir por vista (`view.maxCuts`); en `az210` subirlo a 6 no resolvió el par temporal / puente.
4. El vigilante de RAM de `scripts/construir.sh` cortó una construcción a 14,07 GB con tres ordenamientos pesados a la vez (la vista `inf` tiene 135 piezas y 102 estados): para las 10 vistas usar `SNC_JOBS=2`.
5. Tiempos con todo en caché: las 10 vistas con `--orden` tardan ~30 min; con planes y pintado nuevos, entre 1 y 5 horas.

**Pendientes conocidos:**
1. A medio despiece una pieza (el parietal en `az210`) se sale del marco por arriba y pisa el título: hay que revisar el encuadre `boxApart`/`boxRest` en `lib/assembly-live.js` y el recorte del marco.
2. Nombres de las 10 vistas y cómo se navega entre ellas (puntos, flechas, arrastre) por revisar.
3. Auditoría completa de las 10 vistas: sin hacer (una sola vista tarda ~100 min con 34 piezas). Plan: pasarla en dos o tres vistas representativas, no en todas.
4. Cortes sagital, coronal y axial, pelado por capas, vías con flujo animado y rótulos.
5. El despiece completo se ve apretado en el centro del marco y algunas piezas quedan tapadas.

**Tronco del encéfalo continuo (2026-10-26, a petición de Julián):** el mesencéfalo, el puente y el bulbo se modelaban como tres sólidos con su propio centro (y = −23,5, −28 y −39), y en los planos de contacto las secciones no coincidían: un escalón de ~11 mm y tres piezas que parecían desconectadas. Ahora `stemBody()` en `modelo/anatomia.mjs` es un solo cuerpo (eje continuo con un `ovalChain` más las características de cada tramo) que se corta con `capAt` en los planos `Z.ponsMes` y `Z.bulbPons`; las caras de contacto coinciden por construcción. La mitad derecha del tronco sigue dentro de la «Mitad derecha del encéfalo».

**Más lecciones de la fase 3:**
1. **El nombre de una vista no puede estar en su definición:** el objeto entero de la vista entra en la clave de la caché del plan de cortes, y poner nombres nuevos invalidó planes de horas. Los nombres visibles viven en `NOMBRES` y se aplican en `page()`.
2. **Caché del ordenamiento** (`.cache/settle/`, clave = lo pintado + despiece + cortes + tolerancia + excepciones + modo + código de `settleView`): un cambio solo de la página (CSS, JavaScript, textos, nombres) reconstruye las 10 vistas en ~17 s en vez de ~30 min.
3. **Encuadre del despiece:** la caja de la figura se calcula en 26 posiciones del deslizador (`boxes`), no por interpolación recta entre reposo y despiece completo (las piezas salen por turnos y las primeras se salían del marco). `scripts/encuadre.mjs` lo comprueba en las 10 vistas × 5 posiciones × 3 tamaños: 150 de 150 dentro.
4. **El hipotálamo no puede salir hacia abajo:** el planificador no ve la peana del montaje y lo mandaba a atravesarla (2,2 mm). Sale hacia adelante y poco hacia abajo (`ajustes-salidas.json`).
5. **Con las diez vistas, `SNC_JOBS=2`:** con 3 ordenamientos pesados a la vez (az210, sup, inf) el vigilante de RAM cortó la construcción a 14,03 GB. Los planes sí pueden ir de a 3.

## Herramientas de la página: pelado, rótulos y vías (2026-10-26)

Todo vive en `lib/assembly-live.js` (comportamiento), `lib/assembly.css` (estilos), `build.mjs` (panel y datos), `textos.mjs` (textos, nombres cortos y capas) y `modelo/vias.mjs` (recorridos). No cambian ninguna pieza: reconstruir la página con las cachés tarda ~20-35 s.

**Pelado por capas.** `CAPAS` en `textos.mjs` (13 pasos, en el orden del dossier §12: duramadre, hoz y tienda → aracnoides → frontal y parietal → temporal, occipital y mitad derecha → ínsula → putamen y pálido → calloso, septum y fórnix → ventrículos → caudado y su cola → hipocampo → tálamo, hipotálamo, pineal, olfatorio y óptica → cerebelo → tronco). El deslizador `#snc-peel` escribe en `state.hidden`: oculta las piezas de las capas hasta el paso elegido y vuelve a mostrar las demás. Las rodajas y la médula no se pelan. «Mostrar todas» lo restablece a 0. Ocultar a mano una pieza suelta sigue funcionando entre un paso y otro.

**Rótulos.** Lista `data-labels` con «ninguno», «la pieza elegida» y «todos». Los nombres cortos son `CORTOS` en `textos.mjs` (34, uno por pieza). El ancla de cada pieza es el centro de la caja de sus trozos en la vista, ya desplazados por el despiece (`getBBox` guardado una vez por trozo, más la traslación de `data-mx/my`); la dura y la aracnoides se anclan cerca del borde superior porque su centro es el del encéfalo. Cada columna (izquierda y derecha, según el lado del ancla) se ordena por altura y se separa a 1,55 tamaños de letra. Con rótulos el cuadro (`viewBox`) se ensancha ~10,5 tamaños de letra a cada lado; sin rótulos no cambia. Las líneas y el texto van dentro del svg (`g.snc-labels`), así que siguen el encuadre y el despiece.

**Vías.** `modelo/vias.mjs` guarda 6 recorridos en RAS (corticoespinal, columna dorsal y lemnisco medial, espinotalámica, vía visual, circuito de Papez —cerrado— y flujo del LCR), con su ruta y su función tomadas del dossier §11 y los colores de la paleta Okabe-Ito. `build.mjs` los suaviza (Catmull-Rom, 7 muestras por tramo), los proyecta a cada una de las 10 vistas con `k.iso(punto, P)` y emite un `d` por vista. En la página son dos trazos por vía (un halo y un flujo de trazos que avanza con `stroke-dashoffset`); mientras una vía está encendida el resto de piezas baja al 20 % (`svg[data-vias] g.pz`). Solo se ven con el modelo armado: pasado el 3 % del despiece se apagan y aparece el aviso, porque las piezas se separan de su recorrido. Con «reducir movimiento» queda el trazo fijo. Los recorridos son **esquemáticos**: pasan por posiciones reales de las piezas (cápsula interna entre tálamo y lenticular, pedúnculo cerebral, pirámide, fórnix…), pero no son trazados anatómicos fieles.

**Qué hay que saber al tocar esto:**
1. Los grupos superpuestos (`g.snc-vias`, `g.snc-labels`) van dentro de cada svg y el orden de pintor inserta las piezas **antes** de ellos (`insertBefore(frag, v.vias)`); si se vuelve a `appendChild`, las capas quedan debajo de las piezas.
2. `data-via` es la casilla del panel; el grupo del trazo usa `data-via-id`. Se mezclaron una vez y la prueba tomó el grupo en vez de la casilla.
3. Estados nuevos en `scripts/verificar.mjs`: `pelado-5`, `pelado-9`, `rotulos-todos`, `rotulos-despiece`, `vias-corticoespinal-dorsal` y `vias-papez-lcr`; pasan a los tres tamaños con la consola limpia.
4. A 1024×768 los rótulos se leen pequeños y el árbol de piezas queda apretado (se desplaza): conviene revisar el panel en pantallas bajas.

**Corte sagital medio.** Sin geometría nueva: las piezas de la línea media son mitades izquierdas con una cara plana de corte (decisión de la opción A) y la mitad derecha del encéfalo es una pieza aparte. El botón `data-corte="sagital"` (`setCorte()` en `lib/assembly-live.js`) pone el despiece a 0, oculta `hemisferio-der`, `dura`, `aracnoides`, `hoz` y `tienda`, y salta a la vista `az165` (lateral derecha, la que mira la cara plana). «Sin corte» devuelve las piezas ocultas y la vista que había antes; «Mostrar todas» también lo deshace. Lo que se ve es la cara medial de la mitad izquierda con el interior **hueco** (la sustancia blanca no es una pieza: se quitó la cápsula, ver arriba), así que se asoma la superficie interior de la corteza.

**Visor de cortes coronal y axial (decisión de Julián, 2026-10-26).** Se descartó cortar el modelo 3D de verdad (cada pieza recortada por un plano, vistas nuevas con geometría nueva, horas de construcción por corte y el riesgo de reabrir los ciclos de orden de pintor, más rellenar el hueco de la sustancia blanca) y se hizo un **visor de secciones**, como un atlas de resonancia:
- `scripts/cortes.mjs` muestrea el campo de distancia de cada pieza en una rejilla de 1 mm sobre cada plano y extrae el contorno con marching squares (con interpolación sobre el campo, más fino que la rejilla); los lazos se encadenan, se simplifican (Douglas-Peucker, 0,12 mm) y se guardan como `d` de SVG, en mm y ya en coordenadas de pantalla del visor, en `modelo/cortes.json` (~360 KB, tarda ~8 min). Coronal: y de +70 a −98 cada 8 mm (21), con x_pantalla = −x, y_pantalla = −z (la derecha del paciente a la izquierda, como en un atlas). Axial: z de +72 a −128 cada 8 mm (26), con x_pantalla = −x, y_pantalla = −y (delante arriba).
- **La sustancia blanca** de la mitad izquierda no es una pieza (se quitó la cápsula); en la sección es una región de relleno: dentro del núcleo profundo (`NUCLEO_PROFUNDO`, exportado de `modelo/piezas.mjs`) y a más de 0,5 mm de toda pieza no membranosa (así las juntas de 0,8 mm no se pintan como líneas). Solo existe en las secciones: no entra en el orden de pintor ni en la auditoría.
- En la página (`lib/assembly-live.js`): botones `data-corte` (sagital, coronal, axial, sin corte), deslizador `#snc-corte-pos`, tarjeta `[data-seccion]` con el svg de la sección (regiones con `data-part` y `data-tissue`, clic = ficha; respeta las piezas ocultas por el pelado o el aislamiento, salvo el relleno) y un polígono `g.snc-plano` por vista con el plano translúcido. Cada vista lleva su proyección afín (`afin`: origen y vectores de x, y, z, calculados en `build.mjs` con `k.iso`), así que el plano se proyecta en el navegador sin volver a calcular nada. Como las vías, el plano solo se ve con el modelo armado (pasado el 3 % del despiece se apaga). Con el visor abierto la figura se desplaza (`.snc-plate[data-visor] .snc-stage{margin-left}`) para que la tarjeta no la tape.
- **Límites:** la mitad derecha es una sola pieza, así que su sección es un bloque homogéneo; los lóbulos son casquetes gruesos (~25 mm), no una corteza de 3 mm; las secciones corresponden al modelo armado.
- Estados de verificación nuevos en `scripts/verificar.mjs`: `corte-sagital`, `corte-coronal`, `corte-coronal-atras`, `corte-axial` y `corte-axial-bajo`.
- `scripts/encuadre.mjs` ahora falla si la herramienta de capturas pierde líneas de la salida (una corrida dio 40 comprobaciones en vez de 50 y habría dado por buena una verificación incompleta).

## Panel plegable (2026-10-26, a petición de Julián)

El panel tiene seis bloques, cada uno una `section.snc-box[data-fold]`: `despiece`, `cortes`, `pelado` (pelado y rótulos), `vias`, `piezas` y `ficha`. (Antes «Cortes», «Pelado y rótulos» y «Vías» eran un solo bloque; se separaron en `build.mjs` para poder plegarlos por separado.)
- Al arrancar, `lib/assembly-live.js` envuelve el texto de cada `h2` en un botón `.snc-fold` con `aria-expanded` y una flecha CSS; el clic pone o quita `data-cerrado` en el bloque, y el CSS oculta todo menos el `h2` (`.snc-box[data-cerrado]>:not(h2){display:none}`) y le quita el `flex` que repartía la altura, así que un bloque plegado deja su sitio a los demás.
- **Persistencia:** `localStorage["snc.panel"]` guarda `{id: cerrado}`. Está en `try/catch`: si el almacenamiento no está disponible (ventana privada, bloqueado), la página funciona igual. Por defecto todo está abierto salvo `vias`.
- `select(pieza)` y encender una vía llaman a `abrirSeccion("ficha")`: elegir algo despliega la ficha aunque la hayas plegado.
- **Ojo con `[hidden]`:** una regla CSS con `display:flex` anula el atributo `hidden`. Pasó con el deslizador de cortes, que se veía sin corte activo; ahora hay `.snc-corte-pos[hidden],.snc-cortedice[hidden],.snc-viaaviso[hidden]{display:none}`. Si se añade otro elemento con `display` propio y `hidden`, hay que añadirle su regla.
- Estados de verificación nuevos: `panel-todo-plegado`, `panel-solo-piezas` y `panel-ficha-se-abre` (a tres tamaños, consola limpia).
