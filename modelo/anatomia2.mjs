// Segunda tanda de sólidos del SNC (línea media, límbico, vías, ventrículos, meninges, médula con raíces), en RAS.
// Los de la línea media se construyen enteros; modelo/piezas.mjs los parte en la mitad izquierda (pieza) y la derecha (va
// dentro de la mitad derecha del modelo).
import { B, GAP, W, Wd, R, ell, ball, cone, clip, half, blend, union, carve, grow, intersect, ovalChain, unit, sub, add, mul, lerp, capAt } from "./prims.mjs";

const mat = (m) => ({ mat: m });

// Placa curva a lo largo de una poligonal (y, z) en el plano medio: elipsoides orientados con la tangente, de ancho x y grosor
// variables. [y, z, semiancho x, semigrosor]
export function plate(knots, { m, k = 2, step = 2.5 }) {
  const parts = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const [y0, z0, w0, t0] = knots[i];
    const [y1, z1, w1, t1] = knots[i + 1];
    const len = Math.hypot(y1 - y0, z1 - z0);
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = i ? 1 : 0; j <= n; j++) {
      const u = j / n;
      const c = [0, y0 + (y1 - y0) * u, z0 + (z1 - z0) * u];
      const tan = unit([0, y1 - y0, z1 - z0]);
      parts.push(ell(c, [Math.max(step * 0.9, 1.2), w0 + (w1 - w0) * u, t0 + (t1 - t0) * u], { axes: [tan, [1, 0, 0]], ...mat(m) }));
    }
  }
  return blend(k, ...parts);
}

// Tubo a lo largo de una poligonal de puntos RAS, con radio que va de r0 a r1.
export const tube = (pts, r0, r1, m, k = 0) => B.vessel(pts.map(W), (t) => r0 + (r1 - r0) * t, { k, ...mat(m) });

// Cuerpo calloso: arco aplanado en C con rodilla (11 mm), tronco (6) y esplenio (12), y el pico que vuelve hacia abajo.
export function corpusCallosum() {
  const body = plate(
    [
      [21, 9, 11, 5.2],
      [19.5, 17, 13, 4.4],
      [12, 24, 15, 3.4],
      [0, 27.5, 15.5, 3],
      [-14, 27.5, 15.5, 3],
      [-28, 25.5, 14, 3.6],
      [-39, 21, 12.5, 5],
      [-44.5, 14, 11, 5.8],
    ],
    { m: "callosum" },
  );
  const rostrum = tube([[0, 20, 7], [0, 16, 2.5], [0, 9, 0.5]], 2.4, 1.6, "callosum");
  return blend(1.5, body, rostrum);
}

// Septum pellucidum: lámina vertical delgada bajo el calloso, con forma de vela triangular (40 × 20 mm).
export const septum = () => ell([0, 8, 18.5], [1.8, 15, 5.8], mat("septum"));

// Fórnix: dos tubos en C (pilares desde los cuerpos mamilares, cuerpo bajo el septum, pilares posteriores que bajan hasta el
// hipocampo) unidos por la línea media.
export function fornix() {
  const left = [
    [-2.8, -8.5, -10],
    [-3.4, -4, -2],
    [-3.6, 0, 6],
    [-3.6, 3, 13.5],
    [-3.8, -4, 19.5],
    [-5.5, -14, 20.5],
    [-10, -27, 20],
    [-17, -36, 14],
    [-23, -39, 5],
    [-27, -37, -3],
    [-29, -30, -10],
    [-28, -21, -15],
    [-27, -12, -17.5],
  ];
  const side = (s) => tube(left.map(([x, y, z]) => [s * -x, y, z]), 2.2, 1.4, "fornix");
  return blend(0.6, side(-1), side(1), tube([[-3.7, 2.5, 14], [0, 2.5, 14.2], [3.7, 2.5, 14]], 2.2, 2.2, "fornix"));
}

// Pineal con su pedúnculo y las habénulas: una piña pequeña tras el tercer ventrículo, sobre los colículos.
export const pineal = () => blend(1, ell([0, -33, 1], [3, 3.8, 2.3], mat("pineal")), ell([0, -29.5, 3.2], [3.4, 1.4, 0.9], mat("pineal")));

// Hipocampo (caballito de mar de 40–45 mm) con la amígdala en su extremo anterior.
export function hippocampus() {
  const chain = ovalChain(
    [
      [[-26, -5, -19], 7, 6, 4.2],
      [[-27, -15, -16], 5.5, 6.5, 3.8],
      [[-26.5, -25, -12], 5, 6.5, 3.6],
      [[-23, -33, -4], 4.6, 5, 3.4],
      [[-17, -37, 6], 4, 4.5, 3],
    ],
    { k: 2, step: 2.5, meta: mat("hippocampus") },
  );
  const amygdala = ell([-23, -1.5, -20], [8, 9, 6.5], mat("amygdala"));
  return blend(2, chain, amygdala);
}

// Bulbo y tracto olfatorios (izquierdos): un bulbo alargado sobre un pedículo, el tracto, que se abre en dos estrías atrás.
export function olfactory() {
  const bulb = ell([-5.5, 34.5, -20.5], [2.6, 5.5, 2], mat("olfactory"));
  const trac = tube([[-5.5, 31, -20.5], [-7, 24, -19.2], [-9, 14, -17.2], [-11, 7, -15.5]], 1.5, 1.1, "olfactory");
  const striae = [tube([[-11, 7, -15.5], [-13.5, 3.5, -14.5]], 1.1, 0.8, "olfactory"), tube([[-11, 7, -15.5], [-9.5, 3, -15]], 1.1, 0.8, "olfactory")];
  return blend(0.8, bulb, trac, ...striae);
}

// Vía óptica: quiasma (X aplanada de 13 × 3 mm), los nervios ópticos hacia delante (con corte plano) y los tractos que rodean los
// pedúnculos hasta el cuerpo geniculado lateral.
export function opticPath() {
  const chiasm = ell([0, 5, -13], [6.8, 3.4, 1.6], mat("optic"));
  const nerves = [-1, 1].map((s) => clip(tube([[s * 3, 7.5, -13.2], [s * 6, 17, -15], [s * 8.8, 28, -17.4]], 2.1, 1.9, "optic"), [0, 25.5, 0], [0, 1, 0], 0));
  const tracts = [-1, 1].map((s) =>
    blend(
      0.8,
      tube([[s * 4.5, 3, -12.5], [s * 9.5, -2, -11.5], [s * 14, -8, -9], [s * 17.5, -15, -5], [s * 19.5, -22, -1]], 1.9, 1.7, "optic"),
      ball([s * 19.5, -23.5, -0.5], 3.4, mat("optic")),
    ),
  );
  return blend(0.9, chiasm, ...nerves, ...tracts);
}

// Molde ventricular (parte superior): los dos ventrículos laterales (cuerno frontal, cuerpo, atrio, cuernos occipital y temporal),
// los forámenes de Monro y la parte alta del tercer ventrículo.
export function ventricles() {
  const lateral = (s) => {
    const X = (arr) => arr.map(([x, y, z]) => [s * -x, y, z]);
    return blend(
      1.2,
      tube(X([[-5, 13.5, 14.5], [-6, 10, 19], [-7.5, 5, 21.2], [-9, 0, 22], [-11, -12, 22], [-14, -24, 20.5], [-17, -33, 17]]), 3.3, 2.8, "ventricle"),
      tube(X([[-17, -33, 17], [-16.5, -38, 15], [-16, -43, 13]]), 2.7, 1.9, "ventricle"),
      tube(X([[-17, -33, 17], [-22, -35, 9], [-27, -31, 0], [-30, -23, -9], [-29, -14, -15], [-27, -8, -19]]), 3, 2, "ventricle"),
      tube(X([[-6.5, 5, 19], [-1.5, 3, 15]]), 1.7, 1.5, "ventricle"),
    );
  };
  const third = ell([0, -1, 12.5], [1.9, 9, 4.2], mat("ventricle"));
  return blend(0.8, lateral(-1), lateral(1), third);
}

// ---- Meninges ---------------------------------------------------------------------------------------------------------------------
// Hoz del cerebro: lámina en el plano medio, entre los dos hemisferios, que cuelga del techo y termina libre sobre el calloso.
export function falx() {
  const slab = ell([0, -18, 54], [0.3, 56, 21], { mat: "dura" }); // 0,6 mm de grosor: cabe en la holgura entre los hemisferios (0,8 mm)
  return clip(slab, [0, 0, 34.5], [0, 0, -1], 0);
}
// Tienda del cerebelo: la piel superior del cerebelo, a 2–3 mm de él, detrás de la muesca del tronco.
export function tentorium(cbBody, stemSeat) {
  const shell = carve(grow(cbBody, 2.8), grow(cbBody, 1.2), 0);
  const upper = clip(shell, [0, 0, -34], [0, 0, -1], 0);
  const behind = clip(upper, [0, -27, 0], [0, 1, 0], 0);
  return carve(behind, grow(stemSeat, 1.5), 0);
}
// Duramadre: casquete que cubre la convexidad de los dos hemisferios, de 1,6 mm, hasta un plano bajo el ecuador.
export function duraCap(envelope) {
  const shell = carve(grow(envelope, 3), grow(envelope, 1.4), 0);
  return clip(shell, [0, 0, -8], [0, 0, -1], 0);
}

// ---- Rodajas de médula (C6, T6, L3, S2), ampliadas ×2 -------------------------------------------------------------------------
// Cuatro niveles de la médula: semiejes de la rodaja y tamaño de las astas. Ampliados al doble.
export const SLICE_LEVELS = [
  { name: "C6", a: 14, b: 9.5, horn: 1 },
  { name: "T6", a: 9, b: 8.5, horn: 0.6 },
  { name: "L3", a: 11.5, b: 10, horn: 0.9 },
  { name: "S2", a: 8, b: 7.5, horn: 0.5 },
];
// Una rodaja centrada en `c` (RAS), tendida en el plano xy; la sustancia gris en H sobresale 0,3 mm por la cara superior.
export function cordSlice(lv, c = [0, 0, 0]) {
  const disc = ell(c, [lv.a, lv.b, 2.4], mat("cord"));
  const gray = blend(
    0.8,
    ell(add(c, [0, 0, 2.2]), [lv.a * 0.18, lv.b * 0.7, 0.7], mat("graymatter")),
    ...[-1, 1].flatMap((s) => [
      ell(add(c, [s * lv.a * 0.4, lv.b * 0.32, 2.2]), [lv.a * 0.24 * lv.horn + 1.2, lv.b * 0.34, 0.7], mat("graymatter")),
      ell(add(c, [s * lv.a * 0.4, -lv.b * 0.45, 2.2]), [lv.a * 0.12 + 0.8, lv.b * 0.3, 0.7], mat("graymatter")),
    ]),
  );
  return union(disc, gray);
}

// ---- Raíces y ganglios de la médula cervical ------------------------------------------------------------------------------------
export function rootsFor(axisAt, zs) {
  const out = [];
  for (const z of zs) {
    const { y } = { y: axisAt(z)[1] };
    for (const s of [-1, 1]) {
      const dorsal = tube([[s * 5.2, y - 3.8, z + 0.5], [s * 9, y - 5.4, z - 3], [s * 13.5, y - 5.6, z - 6]], 0.7, 0.7, "root");
      const ganglion = ell([s * 15.5, y - 5.7, z - 7], [2.6, 1.6, 1.6], mat("ganglion"));
      const ventral = tube([[s * 5.6, y + 3.6, z + 0.5], [s * 9.5, y + 2, z - 3.4], [s * 14.2, y - 1.5, z - 6.5]], 0.6, 0.6, "root");
      const nerve = tube([[s * 17.5, y - 5.5, z - 7.6], [s * 24, y - 4.5, z - 10]], 1.5, 1.4, "root");
      out.push(blend(0.5, dorsal, ganglion, ventral, nerve));
    }
  }
  return out;
}
