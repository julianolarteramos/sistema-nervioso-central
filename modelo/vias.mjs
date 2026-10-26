// Vías y flujos que se superponen al modelo, en RAS (mm, origen en la comisura anterior: +x derecha, +y delante, +z arriba).
// Son recorridos esquemáticos, no trazados anatómicos fieles: pasan por las piezas del modelo (cápsula interna entre el tálamo y el
// lenticular, pedúnculo cerebral, pirámide, fórnix, etc.) usando sus posiciones reales. La fuente de cada ruta es investigacion/ANATOMIA.md §11
// (las vías marcadas ★). Los colores son de la paleta Okabe-Ito, la misma de la presentación del sistema endocrino.
//
// `pasos` son los puntos de la ruta, de origen a destino; `cerrada` une el último con el primero (el circuito de Papez es un anillo). La
// página los suaviza (Catmull-Rom), los proyecta a cada vista y los anima con un flujo de trazos que avanza en el sentido de la vía.

export const VIAS = [
  {
    id: "corticoespinal",
    nombre: "Vía corticoespinal",
    color: "#D55E00",
    ruta: "Corteza precentral → corona radiada → brazo posterior de la cápsula interna → pedúnculo cerebral → base del puente → pirámide bulbar → decusación de las pirámides → cordón lateral contralateral de la médula.",
    funcion: "Lleva las órdenes del movimiento voluntario desde la corteza motora hasta las neuronas de las astas anteriores. Entre el 85 y el 90 % de las fibras cruzan en la decusación: la corteza izquierda mueve el lado derecho del cuerpo.",
    pasos: [
      [-36, -16, 56], [-24, -14, 38], [-17, -9, 16], [-17, -9, 6], [-14, -12, -6], [-9, -17, -14], [-8, -19, -23], [-6, -20, -34],
      [-4, -24, -44], [-3, -34, -55], [-2.6, -37, -70], [0, -40, -74], [4.8, -45.5, -86], [5, -46.8, -105], [5, -48.5, -125],
    ],
  },
  {
    id: "dorsal",
    nombre: "Columna dorsal y lemnisco medial",
    color: "#0072B2",
    ruta: "Ganglio de la raíz dorsal → cordón posterior ipsilateral (grácil y cuneiforme) → núcleos grácil y cuneiforme del bulbo → fibras arqueadas internas (cruzan) → lemnisco medial → tálamo (VPL) → brazo posterior de la cápsula interna → corteza poscentral.",
    funcion: "Lleva el tacto fino, la vibración y la posición de las articulaciones. Sube por el mismo lado de la médula y cruza en el bulbo, así que la corteza poscentral derecha siente el lado izquierdo.",
    pasos: [
      [-2, -51.5, -124], [-2, -50, -100], [-2, -48, -82], [-2, -45, -66], [0, -42, -60], [4, -39, -52], [5, -35, -38], [6, -27, -18],
      [8, -22, -6], [13, -20, 4], [16, -10, 8], [22, -14, 36], [34, -24, 54],
    ],
  },
  {
    id: "espinotalamica",
    nombre: "Vía espinotalámica",
    color: "#CC79A7",
    ruta: "Ganglio de la raíz dorsal → asta posterior → comisura blanca anterior (cruza en 1 o 2 segmentos) → cordón anterolateral contralateral → tronco del encéfalo (lateral) → tálamo (VPL) → corteza poscentral.",
    funcion: "Lleva el dolor, la temperatura y el tacto grueso. A diferencia de la columna dorsal, cruza en la propia médula, a pocos segmentos de donde entra.",
    pasos: [
      [-4, -47, -112], [0, -45, -106], [6, -44, -98], [7, -43, -80], [9, -39, -62], [10, -35, -42], [9, -28, -20], [14, -19, 2],
      [16, -11, 10], [24, -16, 38], [35, -26, 52],
    ],
  },
  {
    id: "visual",
    nombre: "Vía visual",
    color: "#009E73",
    ruta: "Retina → nervio óptico → quiasma (cruzan las fibras nasales) → tracto óptico → cuerpo geniculado lateral → radiación óptica → corteza calcarina del lóbulo occipital.",
    funcion: "Lleva la información de la luz desde el ojo hasta la corteza visual primaria. Se dibuja el hemicampo derecho: el tracto y la radiación izquierdos, que rodean el cuerno temporal del ventrículo lateral (asa de Meyer).",
    pasos: [
      [-8.8, 28, -17.4], [-6, 17, -15], [-3, 7.5, -13.2], [0, 5, -13], [-4.5, 3, -12.5], [-9.5, -2, -11.5], [-14, -8, -9], [-17.5, -15, -5],
      [-19.5, -22, -1], [-21, -25, 0], [-28, -30, 4], [-36, -42, 6], [-38, -58, 6], [-32, -78, 4], [-20, -92, 2], [-10, -98, 0],
    ],
  },
  {
    id: "papez",
    nombre: "Circuito de Papez",
    color: "#E69F00",
    cerrada: true,
    ruta: "Hipocampo → fimbria y fórnix → cuerpos mamilares → tracto mamilotalámico → núcleo anterior del tálamo → giro cingulado → cíngulo → parahipocampo y corteza entorrinal → hipocampo.",
    funcion: "Es el anillo de la memoria y de parte de la emoción. Es el circuito más didáctico del sistema límbico, porque pasa por piezas que el modelo separa: el hipocampo, el fórnix, el hipotálamo y el tálamo.",
    pasos: [
      [-24, -30, -14], [-20, -34, -8], [-15, -34, 2], [-10, -28, 12], [-6, -14, 19], [-4, -2, 15], [-4, -8, -26], [-5, -8, -12],
      [-6, -8, 4], [-7, -8, 9], [-8, 2, 22], [-6, 10, 30], [-6, -10, 32], [-7, -28, 26], [-8, -40, 12], [-12, -44, 0], [-22, -40, -12],
    ],
  },
  {
    id: "lcr",
    nombre: "Flujo del líquido cefalorraquídeo",
    color: "#56B4E9",
    ruta: "Plexos coroideos del ventrículo lateral → forámenes de Monro → tercer ventrículo → acueducto cerebral → cuarto ventrículo → conducto central de la médula y espacio subaracnoideo.",
    funcion: "El LCR se produce en los plexos coroideos y circula por los ventrículos, que el molde ventricular reproduce. Amortigua el encéfalo y lo mantiene flotando; se absorbe en los senos venosos de la duramadre.",
    pasos: [
      [-17, -33, 17], [-14, -24, 20], [-11, -12, 22], [-8, 0, 21], [-5, 3, 16], [-1.5, 3, 15], [0, -1, 12], [0, -8, 6], [0, -18, 1], [0, -29, -2],
      [0, -29.5, -24], [0, -39, -38], [0, -46, -50], [0, -44, -76], [0, -48, -100], [0, -49, -125],
    ],
  },
];
