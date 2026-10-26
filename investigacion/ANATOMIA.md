# Sistema nervioso central: dossier de forma, tamaño, posición y conexiones

Para un modelo anatómico 3D desmontable hecho con superficies implícitas (elipsoides, cápsulas y tubos fundidos). Prioriza geometría sobre función.

**Convenciones**

- **Marco de coordenadas del modelo:** RAS, como MNI. Origen en la comisura anterior (AC). +x a la derecha, +y hacia delante, +z hacia arriba, en mm. El plano axial z = 0 pasa por la línea AC-PC; el plano medio sagital es x = 0.
- Las coordenadas «MNI aprox.» de las piezas profundas son centroides **(estimado)**: los tomé de la anatomía estándar del atlas MNI152 y los redondeé a ±3 mm. Sirven para colocar piezas, no para hacer estereotaxia. Hay una sola excepción, citada: la posición AC/PC derivada del wiki MRC-CBU.
- **(estimado)** marca todo valor que no vino de una fuente consultada en esta búsqueda. Casi siempre es el valor típico de los textos de neuroanatomía, redondeado.
- Las fuentes están numeradas [n] y su lista va al final. Las medidas lineales son de adulto; los volúmenes, de RM.

---

## 0. Referencias globales

| Referencia | Valor | Fuente |
|---|---|---|
| Encéfalo, largo × ancho × alto | ≈ 167 × 140 × 93 mm | Dato del encargo. Es coherente con las medidas de los modelos de aula a tamaño natural (3B C20: 150 × 140 × 160 mm con la base [2]; SOMSO BS 25: 200 × 180 × 240 mm con la base del cráneo [6]). |
| Masa del encéfalo | 1,2–1,4 kg. Hombres 1180–1620 g; mujeres 1030–1400 g | [10] |
| Volumen del encéfalo | ≈ 1260 cm³ (hombres), 1130 cm³ (mujeres) | [10] |
| Distancia AC-PC | 26,1 ± 1,3 mm; 26,3 mm en RM y 27,3 mm en especímenes | [12] |
| AC y PC en el molde MNI | AC en el vóxel (91, 131, 67) y PC en (91, 103, 70). Con el molde MNI152 de 1 mm (origen en el vóxel 91, 127, 73), eso da AC ≈ (0, +4, −6) y PC ≈ (0, −24, −3). | [11]; la conversión a mm es mía **(estimado)** |
| Corteza aplanada | ≈ 1 m² de superficie | [1] |
| Cerebelo | ≈ 10 % de la masa encefálica | [1] |

**Proporciones útiles (estimado):**
- el hemisferio mide unos 167 × 70 × 93 mm, como un semielipsoide con la cara medial plana;
- el polo frontal queda unos 70 mm por delante de la AC y el polo occipital unos 95 mm por detrás;
- el vértex queda unos 75 mm por encima de la línea AC-PC, y la cara inferior del lóbulo temporal unos 45 mm por debajo.

---

## 1. Telencéfalo

### 1.1 Hemisferios y lóbulos

| Pieza | Forma en primitivas | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Hemisferio** | Semielipsoide con la cara medial plana. La cara orbitaria es cóncava y cabalga sobre el techo de la órbita. La fosa temporal se modela con un lóbulo temporal en «pulgar» que apunta hacia delante y abajo. | 167 × 70 × 93 cada uno **(estimado** a partir del total) | A ambos lados de x = 0, separados por la cisura interhemisférica, que ocupa la hoz | Se une al otro hemisferio por el cuerpo calloso y las comisuras, y al diencéfalo por la cápsula interna. Lo envuelven las meninges. | Lateral, superior |
| **Lóbulo frontal** | El tercio anterior del semielipsoide, hasta el surco central. Polo romo. | ≈ 1/3 del hemisferio, 70–75 mm de largo **(estimado)** | Delante del surco central y por encima del surco lateral | Toca el parietal en el surco central y el temporal a través del surco lateral (opérculo). Su cara orbitaria cubre el bulbo olfatorio. | Lateral, medial, inferior |
| **Lóbulo parietal** | Casquete entre el surco central y la línea parietooccipital | ≈ 50 mm AP **(estimado)** | Arriba y atrás | Frontal, occipital y temporal; el cíngulo por medial | Lateral, superior, medial |
| **Lóbulo temporal** | «Pulgar»: elipsoide alargado de unos 90 × 40 × 45 mm, con el eje inclinado unos 20° hacia delante y abajo **(estimado)** | Polo temporal unos 25 mm por delante de la AC y unos 40 mm por debajo **(estimado)** | Fosa craneal media; bajo el surco lateral | Contiene el hipocampo y la amígdala en su cara medial. Rodea al cuerno temporal del ventrículo lateral. | Lateral, inferior |
| **Lóbulo occipital** | Cuña o pirámide de vértice posterior | ≈ 40 mm AP **(estimado)** | Sobre la tienda del cerebelo | Parietal y temporal; la cara medial lleva la calcarina | Medial, inferior, lateral |
| **Ínsula** | Abanico triangular hundido dentro del surco lateral, cubierto por los opérculos | ≈ 50 × 40 mm **(estimado)** | Unos 35–40 mm lateral a la línea media, a la altura del putamen | Por profundo: cápsula extrema, claustro, cápsula externa y putamen | Lateral con los opérculos retirados; coronal |
| **Lóbulo límbico** | Anillo en C de la cara medial: giro cingulado arriba y giro parahipocampal abajo, unidos por el istmo | Anillo de unos 120 × 70 mm **(estimado)** | Rodea el cuerpo calloso y el diencéfalo | Cíngulo, parahipocampo, hipocampo | Medial |

### 1.2 Surcos y cisuras (como «costuras» o tubos sustractivos)

| Surco | Trayecto | Recurso para modelarlo |
|---|---|---|
| **Central (de Rolando)** | Desde el borde superior, unos 1 cm por detrás del punto medio entre los polos, baja en dirección anteroinferior a unos 70° de la línea AC-PC. Casi alcanza el surco lateral. Tiene dos rodillas, y la superior es el «knob» de la mano **(estimado)**. | Tubo sustractivo en S suave, de unos 10 mm de profundidad |
| **Lateral (de Silvio)** | Va de delante hacia atrás y un poco hacia arriba; separa el temporal del frontal y el parietal. Tiene ramas anterior, ascendente y posterior. | El surco más profundo: es una hendidura de unos 25 mm hasta la ínsula |
| **Parietooccipital** | En la cara medial, desde el borde superior baja hacia delante hasta unirse con la calcarina en forma de Y | Medial |
| **Calcarino** | En la cara medial del occipital, horizontal hasta el polo. Su labio superior es el cuneus y el inferior el giro lingual. | Medial. Hace relieve en el cuerno posterior del ventrículo (el calcar avis). |
| **Cingulado** | Paralelo al cuerpo calloso, unos 10–15 mm por encima. Atrás sube como rama marginal. | Medial |

### 1.3 Giros principales

| Giro | Forma | Medidas | Posición |
|---|---|---|---|
| **Precentral** | Banda de unos 10–15 mm de ancho **(estimado)** inmediatamente por delante del surco central | Del borde superior al surco lateral | Lateral |
| **Poscentral** | Banda paralela, detrás del surco central | ≈ 10 mm **(estimado)** | Lateral |
| **Temporal superior** | Cápsula alargada bajo el surco lateral; su cara superior incluye los giros de Heschl | ≈ 80 mm de largo **(estimado)** | Lateral |
| **Cingulado** | Cápsula curvada en C que abraza el cuerpo calloso | ≈ 10 mm de ancho **(estimado)** | Medial |

> Recurso práctico: los giros se pueden dibujar como cápsulas fundidas (smooth union) y los surcos como tubos restados (smooth subtraction), con una profundidad media de 8–10 mm. En v3/specimen ya se hizo el encéfalo con giros; ver el ejemplo `encéfalo` en specimen.

### 1.4 Corteza y sustancia blanca

- **Corteza:** una cáscara de unos 2,5 mm (de 1,5 a 4,5) **(estimado)**. En el corte se ve como un borde gris que sigue los giros. La sustancia blanca es el núcleo interior.
- **Para el modelo:** la sustancia blanca es el campo del hemisferio encogido unos 2,5 mm, y la corteza es la diferencia entre los dos. En un corte coronal o axial se ve el ribete gris. Se reconoce en vista coronal y axial.

### 1.5 Comisuras y fibras de proyección

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Cuerpo calloso** | Arco aplanado, como una cápsula curvada en «C acostada» en el plano sagital. Lleva un engrosamiento anterior (rodilla), un **tronco** delgado y un engrosamiento posterior en bulbo (**esplenio**). El **pico (rostrum)** vuelve hacia abajo y atrás hasta la lámina terminal. | Largo AP 69–76 mm. Rodilla 10,6–11,9 mm; tronco ≈ 6,1 mm; esplenio 11,3–12,2 mm; pico ≈ 7 mm [13] | En la línea media. La rodilla queda unos 20 mm por delante de la AC y el esplenio unos 45 mm por detrás **(estimado)**. Su borde superior está unos 25 mm por encima de AC-PC **(estimado)**. Forma el techo de los ventrículos laterales. | Se continúa lateralmente con la sustancia blanca de los dos hemisferios (radiación del cuerpo calloso). Por debajo cuelgan el septum pellucidum y el fórnix. | Medial y coronal (el puente sobre los ventrículos) |
| **Comisura anterior** | Tubo en «manubrio» o bigote, con un cruce delgado en la línea media y extremos que se abren hacia los temporales | ≈ 3–5 mm de grosor en la línea media **(estimado)** | Origen del sistema de coordenadas: (0, 0, 0). En la pared anterior del tercer ventrículo, delante de las columnas del fórnix. | Une los dos lóbulos temporales (y los bulbos olfatorios) | Medial, axial |
| **Comisura posterior** | Pequeño tubo transverso | ≈ 2–3 mm **(estimado)** | (0, −26, 0); bajo la pineal, en la entrada del acueducto | Pretectum | Medial |
| **Fórnix** | Tubo en C: dos **pilares** que salen del hipocampo, se unen en el **cuerpo** bajo el cuerpo calloso y bajan como dos **columnas** delante del tercer ventrículo hasta los cuerpos mamilares | Tubo de 3–4 mm de diámetro y unos 80–90 mm de recorrido **(estimado)** | El cuerpo, bajo el tronco del cuerpo calloso, unido a él por el septum. Las columnas pasan a 2–3 mm de la AC, por detrás y por encima. | Hipocampo (fimbria) → cuerpos mamilares. Forma el borde del foramen interventricular. | Medial (la mejor), y también como pieza suelta |
| **Septum pellucidum** | Lámina doble, delgada y vertical, con forma de vela triangular | ≈ 1–3 mm de grosor y unos 40 × 20 mm **(estimado)** | x = 0, entre el cuerpo calloso arriba y el fórnix abajo | Pared medial de los cuernos frontales | Coronal, medial |
| **Cápsula interna** | Lámina doblada en V, abierta hacia lateral en el corte axial: **brazo anterior** (entre el caudado y el lentiforme), **rodilla** y **brazo posterior** (entre el tálamo y el lentiforme). En 3D es un abanico que sube como la **corona radiada** y baja estrechándose hasta el **pedúnculo cerebral**. | Brazo anterior ≈ 16–17 mm AP y posterior ≈ 28 mm en el corte axial [búsqueda, estudio chino de 1000 adultos; ver nota] | Rodilla a unos 15–18 mm de la línea media, a la altura del foramen de Monro **(estimado)** | Continuidad: corona radiada → cápsula interna → pedúnculo cerebral → base del puente → pirámide | Axial (la «V» o boomerang) y coronal |

Nota sobre la cápsula interna: las cifras AP de 16–17 y 28 mm salieron de un resumen sin texto completo. Por contexto son los brazos de la cápsula, pero conviene verificarlas.

---

## 2. Núcleos basales

| Pieza | Forma en primitivas | Medidas (mm) | Posición (MNI aprox.) | Contactos | Vistas |
|---|---|---|---|---|---|
| **Caudado** | Cápsula curvada en C, con radio decreciente: la **cabeza** es un elipsoide grande que abomba el cuerno frontal; el **cuerpo** recorre el suelo del ventrículo lateral; la **cola** es fina y sigue el techo del cuerno temporal hasta la amígdala | Cabeza ≈ 23,5 mm, cuerpo ≈ 18,2 mm y cola ≈ 9,6 mm de largo por segmento (hombres) [14]. El arco completo mide unos 100 mm de recorrido; la cabeza, unos 20 mm de ancho; la cola, 2–3 mm **(estimado)**. | Cabeza en (±13, +12, +10); cuerpo en (±18, −10, +20); la cola acaba cerca de (±28, −8, −14) **(estimado)** | Pared lateral del ventrículo lateral. Lo une al putamen la sustancia gris en puentes a través del brazo anterior de la cápsula (cuerpo estriado). | Coronal (la cabeza) y como pieza suelta (la C) |
| **Putamen** | Lente o concha biconvexa, más gruesa arriba y delante | AP 41–47 mm (media 44); vertical 38–44 mm (media 41); ancho medio 8,5 mm [14b] | Centroide en (±25, +2, 0) **(estimado)** | Lateral: cápsula externa, claustro e ínsula. Medial: globo pálido. Lo une al caudado por los puentes del estriado. | Axial, coronal |
| **Globo pálido** | Cuña medial al putamen, con dos láminas: externa e interna. Juntos forman la lente o «cono» del núcleo lentiforme. | Polo a polo ≈ 14,5 mm (un cadáver) [14b]; ≈ 20 × 8 × 10 mm **(estimado)** | Centroide en (±19, −4, −1) **(estimado)** | El brazo posterior de la cápsula interna lo separa del tálamo | Axial, coronal |
| **Núcleo subtalámico** | Elipsoide biconvexo pequeño, como un grano de café, inclinado | 7,7 × 6 mm, con un máximo de 8,5 mm [12b] | Unos 12 mm lateral, 2,5 mm por detrás y 6 mm por debajo del punto medio intercomisural [12b]. Contactos DBS en MNI ≈ (±12, −13,5, −8) [12b]. | Encima de la sustancia negra; bajo el tálamo; medial a la cápsula interna | Coronal |
| **Sustancia negra** | Lámina en media luna, una cuña curvada, en el mesencéfalo entre el pedúnculo cerebral y el tegmento | ≈ 15 × 10 × 3–5 mm **(estimado)** | (±10, −18, −12) **(estimado)** | Dorsal al pedúnculo cerebral y ventral al núcleo rojo | Axial del mesencéfalo, coronal |

Volúmenes de RM como control de escala: el hipocampo mide 2900–3800 mm³, la amígdala 1400–1600 mm³ y el cerebelo unos 70 000 mm³ por lado [15].

---

## 3. Sistema límbico

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Hipocampo** | Cápsula curvada, como un caballito de mar. La **cabeza** es ancha y digitada; el **cuerpo** es cilíndrico; la **cola** se curva hacia arriba bajo el esplenio. | Largo 40–45 mm; alto ≈ 7 mm; ancho ≈ 10 mm en el cuerpo y 15–20 mm en la cabeza [16] (siguen a Duvernoy) | Suelo del cuerno temporal. Centroide en (±28, −22, −12) **(estimado)**. | Se continúa con la fimbria, que da el fórnix. Toca la amígdala por delante y el giro parahipocampal por debajo. | Coronal y como pieza suelta (desde arriba con el ventrículo abierto) |
| **Amígdala** | Almendra o disco aplanado | Volumen de 1,2–1,6 cm³ (citoarquitectura), y de 1 a casi 4 cm³ según el estudio [16b]. Sin medida lineal con fuente: ≈ 18 × 15 × 12 mm **(estimado)**. | Delante de la cabeza del hipocampo y del extremo del cuerno temporal, bajo el uncus. (±23, −5, −18) **(estimado)**. | Termina en ella la cola del caudado. Comisura anterior (parte posterior). | Coronal |
| **Cuerpos mamilares** | Dos esferas pequeñas | ≈ 5 mm de diámetro cada una **(estimado)** | Detrás del tallo de la hipófisis, en el suelo del tercer ventrículo, en (±3, −10, −12) **(estimado)** | Terminan en ellos las columnas del fórnix; sale el tracto mamilotalámico hacia el tálamo anterior | Inferior, medial |
| **Bulbo y tracto olfatorio** | Bulbo como elipsoide alargado sobre un pedículo, el tracto, que es una cinta. Atrás se abre en las estrías medial y lateral, en Y. | Bulbo ≈ 10 × 4 × 3 mm; tracto ≈ 30 mm **(estimado)** | Cara orbitaria del frontal, en el surco olfatorio, a unos 5 mm de la línea media, encima de la lámina cribosa | Lo cubre el giro recto. Termina en la sustancia perforada anterior y el uncus. | Inferior |

---

## 4. Diencéfalo

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Tálamo** | Huevo u ovoide, con el polo anterior estrecho (tubérculo anterior) y el posterior ancho (**pulvinar**). Los dos tálamos se tocan en la **adhesión intertalámica**, un puente de unos 10 mm **(estimado)**. | ≈ 30 × 20 × 20 mm (dato del encargo; coincide con los textos, **estimado**). Las cifras de RM encontradas no venían en el resumen [17]. | Centroide en (±11, −18, +7) **(estimado)**. Polo anterior en el foramen de Monro y pulvinar sobre el mesencéfalo. | Medial: pared del tercer ventrículo. Lateral: brazo posterior de la cápsula interna. Arriba: suelo del cuerpo del ventrículo lateral. Abajo: hipotálamo, separado por el surco hipotalámico. | Axial, coronal, medial |
| **Hipotálamo** | Cuña o embudo bajo el tálamo, que forma las paredes inferiores y el suelo del tercer ventrículo y se prolonga en el **infundíbulo** | ≈ 10 × 10 × 10 mm por lado **(estimado)** | (±4, −4, −10) **(estimado)**. Entre el quiasma (delante) y los mamilares (detrás). | El tallo baja a la hipófisis. Lamina terminal por delante. | Medial, inferior |
| **Epitálamo y pineal** | Pineal: piña o elipsoide pequeño | ≈ 7 × 6 × 3 mm; normal hasta unos 14 mm [18] | Línea media, detrás del tercer ventrículo, sobre los colículos superiores y bajo el esplenio. (0, −32, 0) **(estimado)**. | Pedúnculo con las comisuras habenular y posterior | Medial |
| **Hipófisis** | Frijol u elipsoide aplanado: lóbulo anterior mayor y posterior menor | Alto medio ≈ 4,9 mm, ancho ≈ 13 mm (RM, 292 adultos) [19]; AP ≈ 10 mm **(estimado)** | En la silla turca, unos 25–30 mm por debajo de la línea AC-PC: (0, +3, −32) **(estimado)** | Tallo hipofisario | Medial, inferior |
| **Tallo hipofisario** | Tubo cónico inclinado hacia delante y abajo | ≈ 2–3 mm de diámetro y unos 10 mm de largo **(estimado)**; ver [20] | Del túber cinéreo a la hipófisis, detrás del quiasma | Hipotálamo ↔ hipófisis | Medial |
| **Quiasma óptico** | X aplanada: los dos nervios ópticos entran por delante y los dos tractos ópticos salen por detrás y a los lados | Ancho ≈ 12,8–13,1 mm; alto ≈ 2,8–2,9 mm [19] | Delante del tallo, sobre el diafragma de la silla: (0, +3, −14) **(estimado)** | Los tractos ópticos rodean los pedúnculos cerebrales hasta el cuerpo geniculado lateral | Inferior |

---

## 5. Tronco del encéfalo

Medida ventral total: unos 52 mm desde la decusación de las pirámides hasta los cuerpos mamilares [21].

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Mesencéfalo** | Cilindro corto. Por delante, dos **pedúnculos cerebrales** como columnas divergentes en V (vista inferior). Por detrás, el **tectum** con cuatro esferas: los **colículos** superiores e inferiores. Lo atraviesa el acueducto. | Vertical 15,2 ± 1,5 mm (RM sagital) [21b]; AP ≈ 16,7 mm (RM) [21c]. Ancho ≈ 25–30 mm **(estimado)**. Colículos ≈ 5–6 mm cada uno **(estimado)**. | Debajo del diencéfalo y en la incisura de la tienda: (0, −22, −12) **(estimado)** | Arriba se continúa con la cápsula interna, a través de los pedúnculos, y con el diencéfalo. Abajo, con el puente. El pedúnculo cerebeloso superior va del cerebelo al mesencéfalo. | Inferior (los pedúnculos), posterior (los colículos) y medial |
| **Puente** | Abultamiento transverso redondo: un medio cilindro con estrías transversas en la cara anterior, el **basis pontis**. Se continúa lateralmente con el pedúnculo cerebeloso medio. | Vertical 22,0 ± 2,1 mm [21b]; cara ventral ≈ 26,1 mm [21]; AP ≈ 21,6 mm [21c]. Ancho ≈ 35–40 mm **(estimado)**. | Sobre el clivus: (0, −28, −35) **(estimado)** | Mesencéfalo arriba; bulbo abajo; cerebelo detrás, a través del pedúnculo medio. Forma el suelo del cuarto ventrículo. | Inferior/anterior, medial |
| **Bulbo raquídeo** | Cono truncado que se estrecha hacia la médula. En la cara anterior lleva dos **pirámides** (cápsulas paralelas en la línea media) y, a los lados, las **olivas**, elipsoides de unos 12 × 6 mm **(estimado)**. | Largo 19,5 mm (ventral) [21] o unos 28 mm (disección) [21d]. AP ≈ 13,9 mm en la unión pontobulbar y 10,8 mm en la cervicobulbar [21c]. | Del surco bulbopontino al foramen magno: (0, −38, −55) **(estimado)** | Se continúa con la médula, con la decusación de las pirámides como límite. El pedúnculo cerebeloso inferior va al cerebelo. | Anterior/inferior |

### 5.1 Salidas de los 12 pares craneales (pequeños tubos que salen de la superficie)

| Par | Sale de | Punto aparente de salida |
|---|---|---|
| I olfatorio | Telencéfalo | Bulbo olfatorio, que recibe los filetes de la lámina cribosa |
| II óptico | Diencéfalo | Quiasma (borde anterior) |
| III oculomotor | Mesencéfalo | Fosa interpeduncular, en la cara medial del pedúnculo |
| IV troclear | Mesencéfalo | **Única salida dorsal**: bajo los colículos inferiores. Rodea el pedúnculo. |
| V trigémino | Puente | Cara lateral del puente, en el límite con el pedúnculo medio. Es grueso: unos 5 mm **(estimado)**. |
| VI abducens | Unión pontobulbar | Surco bulbopontino, cerca de la línea media, sobre la pirámide |
| VII facial | Unión pontobulbar | Ángulo pontocerebeloso, lateral |
| VIII vestibulococlear | Unión pontobulbar | Ángulo pontocerebeloso, lateral al VII |
| IX glosofaríngeo | Bulbo | Surco retroolivar, arriba |
| X vago | Bulbo | Surco retroolivar, en el medio: una fila de raicillas |
| XI accesorio | Bulbo y médula cervical (C1–C5) | Surco retroolivar abajo, y la raíz espinal sube por el foramen magno |
| XII hipogloso | Bulbo | Surco preolivar, entre la pirámide y la oliva |

Lo mejor para verlos es la **vista inferior**; el IV se ve en la vista posterior.

---

## 6. Cerebelo

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Cerebelo entero** | Elipsoide ancho y aplanado, como una mariposa: dos **hemisferios** unidos por el **vermis**, con una escotadura media posterior y otra anterior | Transverso 99,8 ± 4,3 mm (RM) [22]; AP ≈ 50–55 mm; alto ≈ 50 mm **(estimado)**. Volumen ≈ 70 cm³ por lado [15]. | Fosa craneal posterior, bajo la tienda y detrás del puente y el bulbo: (0, −58, −35) **(estimado)** | El techo del cuarto ventrículo queda entre él y el tronco | Posterior, inferior, medial (el árbol de la vida) |
| **Vermis** | Cápsula media enrollada en espiral; en el corte sagital se ve el **árbol de la vida** | ≈ 20 mm de ancho y unos 45–50 mm de alto **(estimado)** | x = 0 | Hemisferios | Medial, posterior |
| **Amígdalas cerebelosas** | Elipsoides pequeños en la cara inferior, a los lados de la línea media | ≈ 15 × 10 mm **(estimado)** | Encima del foramen magno, a los lados del bulbo | Bulbo | Inferior |
| **Pedúnculo superior** | Tubo que sube hacia delante y adentro hasta el mesencéfalo y decusa | ≈ 5 mm **(estimado)** | Forma el techo rostral del cuarto ventrículo | Núcleos profundos → núcleo rojo y tálamo | Lateral con el cerebelo retirado |
| **Pedúnculo medio** | Tubo grueso, el más grande; es la continuación del puente | ≈ 15–20 mm **(estimado)** | Lateral | Puente → corteza cerebelosa | Lateral, inferior |
| **Pedúnculo inferior** | Tubo que sube desde la cara dorsolateral del bulbo | ≈ 5–8 mm **(estimado)** | Dorsolateral al bulbo | Médula y oliva → cerebelo | Lateral |
| **Hojas (folia)** | Láminas paralelas y transversas: ranuras concéntricas en el elipsoide | Espesor de la hoja ≈ 1–2 mm **(estimado)** | Toda la superficie | — | Posterior, superior |

> Recurso: las folia son ranuras sinusoidales restadas al elipsoide, con frecuencia ≈ 1 ranura cada 2 mm. La cisura primaria, que separa los lóbulos anterior y posterior, es más profunda.

---

## 7. Sistema ventricular

| Pieza | Forma | Medidas (mm) | Posición | Contactos | Vistas |
|---|---|---|---|---|---|
| **Ventrículo lateral (×2)** | Molde en C, con forma de cuerno de carnero. El **cuerno frontal** es triangular, con la cabeza del caudado en la pared lateral. El **cuerpo** es una hendidura bajo el cuerpo calloso. El **atrio** es el cruce. El **cuerno occipital** es un dedo hacia atrás y el **cuerno temporal** se curva hacia delante y abajo en el temporal. | Ancho entre los cuernos frontales ≈ 33–35 mm (los dos juntos); índice de Evans ≈ 0,25–0,28 [23]. Volumen total ≈ 15–25 cm³ **(estimado)**. | Cuerpos a unos 5–20 mm de la línea media; atrio en (±28, −40, +10); punta del cuerno temporal en (±30, −5, −20) **(estimado)** | Arriba, el cuerpo calloso. Medial, el septum y el fórnix. La cola del caudado y el hipocampo siguen el cuerno temporal. | Lateral (el molde completo), superior, coronal |
| **Forámenes interventriculares (de Monro)** | Orificios ovales cortos | ≈ 3–5 mm **(estimado)** | Detrás de la columna del fórnix y delante del tubérculo anterior del tálamo: (±3, −2, +5) **(estimado)** | Ventrículo lateral → tercer ventrículo | Medial, coronal |
| **Tercer ventrículo** | Hendidura sagital delgada, como una cuña de canto. Lleva recesos anteriores: **óptico** e **infundibular**, sobre el quiasma y el tallo. Lleva recesos posteriores: **pineal** y **suprapineal**. | Ancho 3,6–5,0 mm [23]; AP ≈ 25–30 mm y alto ≈ 20 mm **(estimado)** | x = 0, entre los tálamos y los hipotálamos | Lo cruza la adhesión intertalámica | Medial (la silueta), coronal (la ranura) |
| **Acueducto mesencefálico** | Tubo fino | ≈ 1–2 mm de diámetro y unos 15 mm de largo **(estimado)** | En el mesencéfalo, bajo el tectum | Tercer ventrículo → cuarto ventrículo | Medial |
| **Cuarto ventrículo** | Tienda o rombo: el suelo es la **fosa romboidea**, sobre el puente y el bulbo, y el techo apunta al cerebelo. Tiene recesos laterales. | Ancho ≈ 10–12 mm; largo ≈ 16 mm; AP ≈ 10 mm [23] | Entre el tronco y el cerebelo: (0, −45, −35) **(estimado)** | Salidas: **forámenes de Luschka** (los dos laterales) y **foramen de Magendie** (medio) hacia la cisterna magna; abajo, el **canal central** de la médula | Medial, posterior con el cerebelo retirado |
| **Plexos coroideos** | Cintas rugosas y franjas de «racimos» | ≈ 5 mm de ancho **(estimado)** | Cuerpo y cuerno temporal del lateral (el **glomus** grande en el atrio), techo del tercero y techo del cuarto. Faltan en los cuernos frontal y occipital. | Pegados a la tela coroidea | Coronal; pieza dentro del molde |

**Ruta del LCR (orden de las aristas):** plexos de los ventrículos laterales → forámenes de Monro → tercer ventrículo → acueducto → cuarto ventrículo → forámenes de Luschka y Magendie → espacio subaracnoideo (cisternas magna y basales, y el canal medular) → convexidad → granulaciones aracnoideas → seno sagital superior → senos venosos → yugulares.

---

## 8. Meninges y senos venosos

| Pieza | Forma | Medidas | Posición | Vistas |
|---|---|---|---|---|
| **Duramadre** | Cáscara externa resistente, que en el cráneo va adherida al hueso | ≈ 0,5–1 mm **(estimado)** | La capa más externa | Todas; es la primera que se quita |
| **Hoz del cerebro** | Lámina falciforme vertical en x = 0, como una hoz o media luna. Va de la crista galli adelante a la tienda atrás. | Alto ≈ 50 mm atrás y ≈ 20 mm adelante; largo ≈ 120 mm **(estimado)** | Cisura interhemisférica | Coronal, superior |
| **Tienda del cerebelo** | Lámina en forma de tienda de campaña. Su borde libre hace la **incisura tentorial** en U, por donde pasa el mesencéfalo. | ≈ 100 × 60 mm **(estimado)** | Entre los occipitales y el cerebelo | Lateral, posterior |
| **Aracnoides** | Membrana translúcida que salta de giro a giro sin entrar en los surcos | Muy delgada | Bajo la dura; debajo queda el espacio subaracnoideo con LCR | Corte |
| **Piamadre** | Película pegada a la superficie que entra en los surcos | Muy delgada | Sobre la corteza | — |
| **Seno sagital superior** | Tubo triangular en el borde superior de la hoz | Crece de unos 3 a 10 mm de adelante hacia atrás **(estimado)** | x = 0, a lo largo del vértex | Superior, coronal |
| **Seno sagital inferior** | Tubo fino en el borde libre de la hoz | ≈ 2 mm **(estimado)** | Sobre el cuerpo calloso | Medial |
| **Seno recto** | Tubo en la unión de la hoz con la tienda | ≈ 5 mm **(estimado)** | Recibe la vena de Galeno | Medial |
| **Confluencia (tórcula), senos transversos y sigmoides** | Tubos en T y luego en S | Transverso ≈ 7–10 mm **(estimado)** | Protuberancia occipital interna → borde de la tienda → yugular | Posterior, lateral |
| **Seno cavernoso** | Almohadilla a los lados de la silla turca | — | Junto a la hipófisis | Coronal |

Para el modelo, la membrana es una cáscara translúcida, el offset del campo del encéfalo. Specimen ya tiene «membranas translúcidas».

---

## 9. Médula espinal

### 9.1 Medidas globales

| Dato | Valor | Fuente |
|---|---|---|
| Largo | ≈ 42–45 cm | [24], [24b] |
| Diámetro | ≈ 1 cm | [24] |
| Engrosamiento cervical | Segmentos C5–T1 (a nivel vertebral, de C3 a T1/T2). Circunferencia máxima ≈ 38 mm en C6. | [24], [24c] (Gray 1918, p. 752) |
| Engrosamiento lumbar | De T9–T12 a T11 en vértebra, según la fuente (segmentos L1–S3 **(estimado)**) | [24] |
| Cono medular | La punta suele estar en el disco L1/L2. Es normal hasta el disco L2/L3; L3 ya es dudoso. | [25] |
| Filum terminale | Va del cono al cóccix. El **interno** (¾ superiores) va dentro del saco dural, hasta S2. El **externo** (¼ inferior) se funde con la dura y se fija al cóccix dorsal. Largo total ≈ 20 cm **(estimado)**. | [26] |
| Diámetros por nivel (RM) | C2: 8,8 × 12,4 mm (AP × transverso). C4: 8,7 × 14 mm. C7: 7,4 × 11,4 mm. | [27] |
| | AP de 7,6 mm en C3 a 6,7 mm en C7 | [27b] |
| | T6: AP ≈ 6,4 mm (TC-mielografía), el mínimo | [27b] |

### 9.2 Segmentos y raíces

- **Hay 31 segmentos:** 8 cervicales, 12 torácicos, 5 lumbares, 5 sacros y 1 coccígeo [1]. Como la médula es más corta que el canal, los segmentos quedan más altos que sus vértebras: unos 2 niveles en la región torácica media, y los segmentos lumbosacros se agrupan entre T10 y L1 **(estimado)**.
- **Las raíces** salen como un abanico de **raicillas**:
  - la **dorsal** por el surco posterolateral y la **ventral** por el anterolateral;
  - se unen en el **nervio espinal**, en el agujero intervertebral;
  - el **ganglio de la raíz dorsal** es un elipsoide de unos 5–10 mm **(estimado)** en la raíz dorsal, justo antes de la unión.
- **Las raíces ganan oblicuidad hacia abajo:** las cervicales son casi horizontales y las lumbosacras, casi verticales. Por debajo del cono forman la **cola de caballo**, un haz de tubos paralelos alrededor del filum.

### 9.3 Corte transversal

- **Óvalo aplanado** en dirección AP, con dos hendiduras: la **cisura media anterior** (profunda) y el **surco medio posterior** (estrecho).
- **Sustancia gris en H o mariposa:**
  - **astas posteriores:** delgadas, llegan casi a la superficie y llevan la sustancia gelatinosa en el ápice;
  - **astas anteriores:** romas y anchas;
  - **asta lateral:** solo en T1–L2 (y S2–S4 para el parasimpático);
  - **comisura gris** con el **canal central**, de unos 0,1–1 mm.
- **Cordones blancos:** **posterior** (dividido en grácil y cuneiforme por encima de T6), **lateral** y **anterior** [1].

**Cómo cambia por nivel** (relaciones clásicas; [1] y textos, **estimado** en las proporciones):

| Nivel | Contorno | Gris | Blanca |
|---|---|---|---|
| **Cervical (C5–C8)** | Óvalo ancho, el mayor transverso | Astas anteriores muy anchas, en forma de pala (por el brazo) | Mucha blanca, la más abundante; fascículos grácil y cuneiforme |
| **Torácico** | Pequeño y redondo | H delgada, con astas finas y **asta lateral** | Proporción alta de blanca; astas finas |
| **Lumbar (L1–L5)** | Casi circular, grande | Astas anteriores y posteriores voluminosas | Menos blanca |
| **Sacro** | Pequeño | La gris domina; la H es compacta | Muy poca blanca |

Se reconoce en **axial**, con una serie de cortes apilados.

---

## 10. Vascularización (breve, opcional)

| Arteria | Diámetro (mm) | Trayecto |
|---|---|---|
| Vertebrales (×2) | ≈ 3–4 **(estimado**; sin fuente en esta búsqueda) | Suben por el foramen magno a los lados del bulbo y se unen en el surco bulbopontino |
| Basilar | 2,85 (ARM) – 3,41 (TC) [28] | Tubo en el surco basilar del puente; se bifurca en las cerebrales posteriores en la fosa interpeduncular |
| Cerebral posterior (P1) | 1,8–2,2 [28] | Rodea el mesencéfalo hacia el occipital y la calcarina |
| Comunicante posterior | 1,1–1,7 [28] | ACI ↔ ACP; es hipoplásica en una parte importante de los casos [28b] |
| Carótida interna, porción terminal | ≈ 4 **(estimado)** | Sale junto al quiasma |
| Cerebral media (M1) | 2,1–2,8 [28] | Por el surco lateral hacia la ínsula y la convexidad |
| Cerebral anterior (A1) | 1,6–2,3 [28] | Sobre el quiasma y después por la cisura interhemisférica, rodeando el cuerpo calloso |
| Comunicante anterior | 1,2–1,7 [28] | Une las dos ACA delante del quiasma |

**Círculo de Willis:** es un heptágono en la base. Rodea el quiasma, el tallo y los mamilares y queda en el espacio subaracnoideo de la cisterna supraselar. El polígono mide unos 25 × 30 mm **(estimado)**. Se ve en **vista inferior**.

---

## 11. Conexiones principales (aristas)

Formato: A → B (vía). Las marcadas ★ conviene dibujarlas en un modelo didáctico.

**Corticoespinal ★**
- Corteza precentral → corona radiada → brazo posterior de la cápsula interna → tercio medio del pedúnculo cerebral → base del puente (fascículos dispersos) → pirámide bulbar
- Pirámide → decusación de las pirámides (unos 85–90 % cruzan) → cordón lateral contralateral de la médula → asta anterior
- La fracción que no cruza → cordón anterior

**Columna dorsal-lemnisco medial ★**
- Ganglio de la raíz dorsal → cordón posterior ipsilateral (grácil y cuneiforme) → núcleos grácil y cuneiforme del bulbo
- Esos núcleos → fibras arqueadas internas (decusación sensitiva) → lemnisco medial → tálamo (VPL)
- VPL → brazo posterior de la cápsula interna → corteza poscentral

**Espinotalámica**
- Ganglio de la raíz dorsal → asta posterior → comisura blanca anterior (cruza en 1–2 segmentos) → cordón anterolateral contralateral → tronco (lateral) → tálamo (VPL) → poscentral
- Se dibuja ★ solo si hay espacio; si no, basta con resaltar la decusación medular.

**Radiaciones ópticas ★**
- Retina → nervio óptico → quiasma (cruzan las fibras nasales) → tracto óptico → cuerpo geniculado lateral → radiación óptica → corteza calcarina
- La radiación óptica es un abanico que rodea el cuerno temporal y el occipital; el **asa de Meyer** recorre el temporal.

**Circuito de Papez ★** (es el anillo más didáctico)
- Hipocampo → fimbria y fórnix → cuerpos mamilares → tracto mamilotalámico → núcleo anterior del tálamo
- Núcleo anterior → cápsula interna (rama anterior) → giro cingulado → cíngulo (haz de asociación) → parahipocampo y corteza entorrinal → vía perforante → hipocampo

**Ganglios basales**
- **Vía directa:** corteza → estriado (caudado y putamen) → GPi/SNr → tálamo (VA/VL) → corteza
- **Vía indirecta:** estriado → GPe → STN → GPi
- **Hiperdirecta:** corteza → STN
- **Nigroestriatal:** SNc → estriado
- Sirve para dibujarla ★ como diagrama de flechas sobre las piezas, no como tubos reales.

**Pedúnculos cerebelosos ★** (como tubos reales)
- Médula y oliva inferior → pedúnculo inferior → cerebelo
- Corteza → núcleos pontinos → pedúnculo medio (cruzado) → cerebelo
- Núcleos profundos (dentado) → pedúnculo superior (decusación en el mesencéfalo) → núcleo rojo y tálamo VL → corteza motora

**Flujo de LCR ★**
- Ver §7.

**Prioridad para el modelo:** el molde ventricular con el LCR, el Papez (fórnix y mamilares) y los pedúnculos cerebelosos son **piezas físicas**. Corticoespinal, lemnisco y óptica pueden ser **tubos de color superpuestos**, que se encienden por paso. Los ganglios basales van como **diagrama**.

---

## 12. Modelos comerciales de aula

| Modelo | Piezas | Descomposición | Fuente |
|---|---|---|---|
| **3B C18** «Classic» | 5 | Dividido en el plano medio sagital. La mitad izquierda se separa en frontal + parietal, temporal + occipital, tronco del encéfalo y cerebelo. Lleva imanes. | [3] |
| **3B C17** | 8 | Corte sagital. Cada mitad se separa en frontal + parietal, temporal + occipital, medio tronco y medio cerebelo (4 × 2). | [3] |
| **3B C20**, con arterias | 9 | Igual que el C17, más la **arteria basilar** desmontable. Mide 150 × 140 × 160 mm y pesa 0,84 kg. | [2] |
| **3B C22** «Neuro-Anatomical» | 8 | Las mismas 8 piezas. La mitad derecha va pintada por lóbulos; la izquierda lleva las áreas pre y poscentral, Broca, Wernicke, Heschl y los nervios craneales. Mide 140 × 140 × 175 mm. | [4] |
| **Erler-Zimmer C922** | 5 | La mitad izquierda se separa en 4: frontal + parietal, temporal + occipital, y tronco + cerebelo. El hipocampo va unido al tronco y muestra el plexo coroideo. | [7] |
| **Erler-Zimmer C220**, con arterias | 9 | Frontal + parietal, temporal + occipital, tronco y cerebelo (por mitades), más la arteria basilar | [7b] |
| **SOMSO BS 23/1** | 9 | Las mismas 4 × 2 piezas, más la basilar | [5] |
| **SOMSO BS 23/4** | 10 | Lo de arriba, más la **duramadre con la hoz** y las áreas citoarquitectónicas | [5] |
| **SOMSO BS 25** (según Rohen) | 15 | 2 hemisferios; temporal + occipital **con el sistema límbico**; cerebelo; lóbulo frontal; **cuerpo calloso**; 2 piezas de tronco; **cuerpo estriado**; 2 de ínsula; **lentiforme izquierdo**; **cápsula interna derecha**; **ventrículos**; base del cráneo con la columna cervical. Mide 200 × 180 × 240 mm y pesa 1,8 kg. | [6] |

**Patrón común:**
1. corte medio sagital;
2. cada hemisferio en un bloque anterosuperior (frontal + parietal) y uno posteroinferior (temporal + occipital), separados por un plano oblicuo que sigue más o menos el surco lateral y sube por detrás. Ese corte deja a la vista la ínsula, los ganglios basales y el ventrículo;
3. tronco y cerebelo por mitades.

Solo el SOMSO BS 25 separa las estructuras profundas: estriado, lentiforme, cápsula y molde ventricular.

---

## 13. Descomposición propuesta para nuestro modelo

### Nivel básico (5 piezas)

1. Hemisferio izquierdo
2. Hemisferio derecho
3. Diencéfalo y tronco (tálamo, hipotálamo, hipófisis, mesencéfalo, puente y bulbo), con la médula cervical corta
4. Cerebelo
5. Duramadre con la hoz y la tienda, como cáscara translúcida

### Nivel medio (10 piezas)

1. Frontal + parietal izquierdo
2. Temporal + occipital izquierdo (el corte oblicuo de 3B/SOMSO deja ver la ínsula y el ventrículo)
3. Hemisferio derecho entero (para comparar)
4. Cuerpo calloso + fórnix + septum (pieza medial)
5. Núcleos basales izquierdos: caudado en C + lentiforme, sobre una cápsula interna en abanico
6. Molde ventricular completo (los dos laterales, el tercero, el acueducto y el cuarto)
7. Diencéfalo: tálamos, hipotálamo, hipófisis y quiasma
8. Tronco con los muñones de los 12 pares craneales
9. Cerebelo, en dos mitades sagitales para ver el árbol de la vida (cuenta como 1 pieza o como 2)
10. Meninges: dura con la hoz y la tienda, y senos


> **Nota de implementación (2026-10-23): el despiece del modelo se aparta de esta lista.** Las piezas que cruzan la línea media
> (tálamos «izquierdo + derecho unidos», hipotálamo, mesencéfalo, puente, bulbo, vermis, cuerpo calloso, fórnix, septum, pineal,
> quiasma) se hicieron como **mitades izquierdas** con una cara plana de corte sagital, y el **hemisferio derecho** lleva su mitad
> de todas ellas (más la mitad derecha del cerebelo), como los modelos comerciales 3B C17/C18 de la sección 12. Motivo: con el
> hemisferio derecho entero y con muescas para esas piezas, el orden de pintor de las vistas giradas tenía ciclos de tres piezas
> que ninguna clave resuelve (la auditoría del kit los marcaba), y el derecho no se podía despiezar hacia ningún lado. Decisión de
> Julián, 2026-10-23.

### Nivel detallado (24 piezas)

1–4. Lóbulos izquierdos por separado: frontal, parietal, temporal y occipital
5. Ínsula izquierda (el opérculo se quita junto con 1, 2 y 3)
6. Hemisferio derecho, con la cara medial que muestra el anillo límbico
7. Cuerpo calloso
8. Fórnix
9. Septum pellucidum
10. Caudado izquierdo
11. Putamen izquierdo
12. Globo pálido izquierdo
13. Cápsula interna izquierda en abanico, con la corona radiada
14. Tálamo izquierdo + tálamo derecho, unidos por la adhesión intertalámica
15. Hipotálamo + cuerpos mamilares + tallo + hipófisis
16. Pineal y epitálamo
17. Hipocampo + amígdala izquierdos
18. Bulbo y tracto olfatorio, como pareja
19. Quiasma + nervios + tractos ópticos
20. Mesencéfalo con la sustancia negra y el NST visibles en un corte
21. Puente + bulbo, con los pares craneales
22. Cerebelo en dos hemisferios, más el vermis como pieza aparte (22a, 22b y 22c)
23. Molde ventricular, con los plexos coroideos como «hilos» internos
24. Meninges: dura, hoz, tienda y senos (en piezas), más la aracnoides como velo translúcido
25. Médula espinal con raíces, ganglios, cono, filum y cola de caballo, y 4 rodajas de corte (C6, T6, L3 y S2)
26. Círculo de Willis con la basilar y las vertebrales (opcional)

### Orden de pelado, de afuera hacia adentro

1. Duramadre, con los senos venosos encima; después la hoz y la tienda
2. Aracnoides (el velo) y las arterias del círculo de Willis, que se quitan como red
3. Lóbulos del hemisferio izquierdo: primero el **frontal + parietal**, que deja ver la ínsula y la cara superior del ventrículo; después el **temporal + occipital**, que deja ver el hipocampo y el cuerno temporal
4. Ínsula, claustro y cápsula externa
5. **Putamen**, y después **globo pálido**, lo que deja ver la cápsula interna
6. **Cápsula interna y corona radiada**, que dejan ver el caudado y el tálamo
7. **Cuerpo calloso**, que deja ver el techo del ventrículo y después el **molde ventricular**
8. **Fórnix + septum**, y luego el **caudado**
9. **Hipocampo + amígdala**
10. **Tálamo**, que deja ver el tercer ventrículo, el hipotálamo y el NST
11. **Cerebelo**, que deja ver el cuarto ventrículo y los pedúnculos (cortados)
12. **Tronco**, en pasos: mesencéfalo (con la sustancia negra en el corte), puente y bulbo. Queda la **médula** con sus raíces y las rodajas.

---

## 14. Fuentes

1. OpenStax, *Anatomy and Physiology 2e*, 13.2 «The Central Nervous System» (CC BY 4.0): https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system
2. 3B Scientific C20, *Human Brain Model with Arteries, 9 part*: https://3bscientific.com/gb/human-brain-model-with-arteries-9-part-1017868-c20-3b-scientific,p_13_244.html
3. 3B C17 y C18 (listado de repuestos y distribuidor): https://avantorsciences.com/ca/fr/product/8865104/3b-scientific-brain-model y https://3bscientific.com/se/base-for-brain-1017637-3b-scientific,p_171_27795.html
4. 3B C22, *Neuro-Anatomical Brain, 8 part*: https://3bscientific.com/neuro-anatomical-brain-8-part-1000228-c22-3b-scientific,p_13_245.html
5. SOMSO BS 23/1 y BS 23/4: https://candent.ca/products/brain-arteries-9-part-bs-23-1 y https://candent.ca/products/brain-arteries-cytoarchitectural-areas-bs-23-4
6. SOMSO BS 25, 15 partes: https://candent.ca/products/model-brain-15-part-bs-25 y https://www.phywe.com/equipment-accessories/models/human-anatomical-models/model-of-brain-in-15-parts_8358_9289/
7. Erler-Zimmer C922 (5 partes): https://www.meddax24.de/en/erlerzimmer-anatomical-brain-model-life-size-5-part. [7b] Erler-Zimmer C220: https://erler-zimmer.de/en/Brain-model-9-part-with-arteries/C220
10. Wikipedia, «Human brain» (masa y volumen, con fuentes primarias citadas allí): https://en.wikipedia.org/wiki/Human_brain
11. MRC CBU Imaging Wiki, «Finding the commissures»: https://imaging.mrc-cbu.cam.ac.uk/imaging/FindingCommissures
12. Distancia AC-PC (26,1 mm; 26,3 y 27,3 mm), en estudios de localización del NST. [12b] Dimensiones y coordenadas del NST, incluidos los contactos DBS en MNI. Ver https://hal.archives-ouvertes.fr/hal-01552987, https://pmc.ncbi.nlm.nih.gov/articles/PMC7976106 y https://dx.doi.org/10.1007/s00701-009-0514-z
13. Cuerpo calloso por RM: https://koreascience.kr/article/JAKO200804748557363.pdf y https://repository.sustech.edu/jspui/handle/123456789/28300
14. Caudado (Sudán): https://repository.sustech.edu/handle/123456789/15638. [14b] Putamen y lentiforme: https://journals.viamedica.pl/folia_morphologica/article/view/16434 y https://www.turkishneurosurgery.org.tr/pdf.php?id=204
15. Volúmenes del caudado, el tálamo, el hipocampo, la amígdala y el cerebelo: https://pmc.ncbi.nlm.nih.gov/articles/PMC8148703/table/T2
16. Hipocampo, de 40 a 45 mm (Duvernoy): https://arxiv.org/pdf/1605.02559 y https://webview.isho.jp/journal/detail/abs/10.11477/mf.1431900519. [16b] Amígdala: https://radiologykey.com/morphology-of-the-human-amygdala/ y https://cbic.weill.cornell.edu/node/537
17. Tálamo por RM (sin cifras en el resumen): https://nsj.org.sa/content/13/3/272.full.pdf
18. Radiopaedia, pineal: https://radiopaedia.org/articles/5831
19. Hipófisis y quiasma por RM (292 adultos): https://journals.viamedica.pl/folia_morphologica/article/view/63531
20. Radiopaedia, tallo hipofisario: https://radiopaedia.org/articles/pituitary-stalk
21. Tronco, superficie ventral: https://turkishneurosurgery.org.tr/pdf.php?id=2072. [21b] RM sagital, 2020: https://journals.viamedica.pl/folia_morphologica/article/view/64320. [21c] RM, India (142 adultos): https://dspace.sduaher.ac.in/jspui/handle/123456789/9038. [21d] Lublin, por décadas: https://www.dlibra.umcs.lublin.pl/Content/42796/download
22. Diámetro transverso del cerebelo por RM (Yonsei): https://ir.ymlib.yonsei.ac.kr/handle/22282913/117702
23. Ventrículos: https://avesis.cu.edu.tr/yayin/e80e9ccb-dda0-4856-bbfe-c454b26f6278/morphometric-mri-study-of-the-brain-ventricles-in-healthy-turkish-subjects y https://www.ijsurgery.com/index.php/isj/article/view/10191
24. Radiopaedia, engrosamientos cervical y lumbar y médula: https://radiopaedia.org/articles/cervical-enlargement y https://radiopaedia.org/articles/lumbar-enlargement. [24b] e-Anatomy: https://www.imaios.cn/en/e-anatomy/anatomical-structures/spinal-cord-116939084. [24c] Gray 1918, p. 752, citado en https://en.wikipedia.org/wiki/Cervical_enlargement
25. Radiopaedia, cono medular: https://radiopaedia.org/articles/conus-medullaris
26. Radiopaedia, filum terminale: https://radiopaedia.org/articles/filum-terminale
27. Sherman et al. 1990, AJNR, diámetros de la médula cervical: https://www.ajnr.org/content/11/2/369. [27b] Serie cervical por RM: https://oajournals.fupress.net/index.php/ijae/article/view/1666; TC-mielografía coreana, citada en la misma búsqueda.
28. Círculo de Willis: https://js.vnu.edu.vn/MPS/article/view/4351 y https://journals.viamedica.pl/folia_morphologica/article/download/FM.a2018.0095/45712. [28b] Autopsias: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9644724/
29. Neuroscience Online (UTHealth) y Neuroanatomy Online, para consultar la forma y los cortes: https://nba.uth.tmc.edu/neuroscience y https://med.uth.edu/nba/resources/neuroanatomy-online/

**Advertencia de verificación:**
- Varias cifras de [12]–[23] y [27b] vienen de resúmenes y extractos de buscador, no del texto completo; conviene abrir el artículo antes de citarlas en público.
- Gray 1918 (Bartleby) devolvió 403 desde esta máquina; su cifra de 38 mm llega por Wikipedia.
- El dominio de Olomouc (nan.upol.cz) rechazó la conexión.
