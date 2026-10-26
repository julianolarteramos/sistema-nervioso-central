// Sólidos de cada pieza del SNC, en RAS. Medidas de investigacion/ANATOMIA.md; la forma sale de las imágenes de
// referencias/. Cada pieza es un nodo propio: lo que toca a otra lleva un plano de contacto con holgura (capAt) o se
// talla contra la vecina engrosada en GAP.
import { B, GAP, W, Wd, R, ell, ball, cone, clip, half, blend, union, carve, grow, intersect, ovalChain, lerp, add, sub, mul, unit, dot, lcg, groove, capAt } from "./prims.mjs";
import { culled, xhull } from "../lib/campos.mjs";

const MID = 1; // semiancho de la cisura interhemisférica (mm)

// ---- Tronco del encéfalo ---------------------------------------------------------------------------------------------
// Pilas de abajo arriba por la línea media: médula (< −74) · bulbo (−74…−46) · puente (−46…−24) · mesencéfalo (−24…−2) ·
// tálamos e hipotálamo (> −2). Todos los contactos son planos horizontales con holgura, de modo que cada pieza sale
// en vertical sin rozar a las demás.
export const Z = { cord: -74, bulbPons: -46, ponsMes: -24, mesTop: -2 };

const stem = { mat: "stem" };

// Un solo cuerpo continuo del tronco, que se corta en tres tramos con los mismos planos. Antes cada tramo se modelaba por separado, con su
// propio centro (mesencéfalo y = −23,5, puente −28, bulbo −39), y en los planos de contacto las secciones no coincidían: había un escalón de
// ~11 mm entre el puente y el bulbo y las tres piezas parecían desconectadas. Al cortar un mismo cuerpo, las caras de contacto coinciden por
// construcción y el dorso baja sin saltos (2026-10-25, a petición de Julián).
const CB_X = 26; // plano del contacto puente–cerebelo
let stemMemo = null;
function stemBody() {
  if (stemMemo) return stemMemo;
  // Eje continuo: baja y se desplaza hacia atrás (y más negativo) del mesencéfalo a la médula; el puente abulta en el medio.
  const trunk = ovalChain(
    [
      [[0, -24, -4], 9.5, 8, 5],
      [[0, -24.5, -14], 11, 8.5, 5],
      [[0, -27, -24], 12.5, 9.5, 5],
      [[0, -29, -35], 15, 10, 5],
      [[0, -35, -46], 13, 8.5, 5],
      [[0, -41, -58], 9.5, 6.4, 5],
      [[0, -44, -75], 6.8, 5.5, 5],
    ],
    { k: 2, step: 3, meta: stem },
  );
  // Mesencéfalo: dos pedúnculos cerebrales por delante (con la fosa interpeduncular entre ellos), tegmento y tectum con los cuatro
  // colículos por detrás. Vertical 15–20 mm, AP ≈ 17–19, ancho 25–30.
  const core = ell([0, -23.5, -13], [11, 9, 14], stem);
  const peduncles = [-1, 1].map((s) => cone([s * 7, -17.5, -3], [s * 6.5, -18, -23], 5.6, 5.8, stem));
  const colliculi = [-1, 1].flatMap((s) => [ball([s * 4.6, -33.2, -6], 3.5, stem), ball([s * 4.6, -33.6, -14.5], 3.3, stem)]);
  // Puente: la panza basilar (abultamiento transverso), con los pedúnculos cerebelosos medios que salen a cada lado y terminan en un plano
  // para empalmar con el cerebelo.
  const belly = ell([0, -29, -35], [20, 12, 15], stem);
  const stubs = [-1, 1].map((s) => cone([s * 15, -31, -33], [s * (CB_X + 4), -39, -35], 7.2, 6.2, stem));
  // Bulbo raquídeo: las pirámides por delante y las olivas a los lados.
  const pyramids = [-1, 1].map((s) => cone([s * 2.9, -34, -48], [s * 2.6, -37.5, -73], 2.7, 2.2, stem));
  const olives = [-1, 1].map((s) => ell([s * 8.4, -38, -57], [3.2, 4.4, 7], stem));
  let out = xhull(blend(2.8, trunk, core, ...peduncles, ...colliculi, belly, ...stubs, ...pyramids, ...olives), "stem");
  const aqueduct = cone([0, -29, -2], [0, -29.5, -24], 0.9, 0.9);
  const grooveBasilar = cone([0, -16.5, -42], [0, -17.5, -28], 1.6, 1.6);
  const fossaPons = ell([0, -39.5, -38], [8, 2.6, 11], stem); // mitad superior de la fosa romboidea
  const fossaBulb = ell([0, -46, -50], [5.2, 2.4, 9], stem); // mitad inferior
  out = carve(carve(carve(carve(out, aqueduct, 0.3), grooveBasilar, 1), fossaPons, 1.5), fossaBulb, 1.2);
  for (const s of [-1, 1]) out = clip(out, [s * (CB_X - GAP / 2), 0, 0], [s, 0, 0], 0);
  stemMemo = out;
  return out;
}
const between = (top, bottom) => capAt(capAt(stemBody(), [0, 0, top], [0, 0, 1]), [0, 0, bottom], [0, 0, -1]);
const mesencephalon = () => between(Z.mesTop, Z.ponsMes);
const pons = () => between(Z.ponsMes, Z.bulbPons);
const medulla = () => between(Z.bulbPons, Z.cord);

// ---- Diencéfalo ------------------------------------------------------------------------------------------------------
// Tálamos: dos ovoides con el eje largo hacia delante y adentro y el pulvinar atrás, unidos por la adhesión intertalámica
// (ancho 20, largo 30, alto 20 cada uno). Salen juntos hacia la izquierda por la cavidad del lóbulo que se quitó.
function thalami() {
  const lobes = [-1, 1].map((s) => {
    const L = unit([-s * 0.42, 0.91, 0.08]);
    const Wd2 = unit([L[1], -L[0], 0]);
    return ell([s * 11, -18, 7], [16, 8.8, 9.5], { axes: [L, Wd2], mat: "thalamus" });
  });
  const adhesion = ell([0, -17.5, 5.5], [4, 5.5, 3.6], { mat: "thalamus" });
  const pulvinar = [-1, 1].map((s) => ell([s * 9, -31, 8.5], [6.5, 4.5, 6], { mat: "thalamus" }));
  const body = xhull(blend(2.5, ...lobes, adhesion, ...pulvinar), "thalamus");
  return capAt(body, [0, 0, Z.mesTop], [0, 0, -1]);
}

// Hipotálamo con los cuerpos mamilares, el tallo y la hipófisis (en la silla turca, ≈ 30 mm bajo la línea AC–PC).
function hypothalamus() {
  const walls = [-1, 1].map((s) => ell([s * 4.6, -5, -7], [4.6, 8.5, 5.5], { mat: "hypothalamus" }));
  const mamillary = [-1, 1].map((s) => ball([s * 2.8, -8.2, -11.5], 2.7, { mat: "hypothalamus" }));
  const stalk = cone([0, -1.5, -9], [0, 3.2, -31], 3.3, 1.5, { mat: "hypothalamus" });
  const pituitary = ell([0, 3.6, -34], [6.5, 5, 2.6], { mat: "pituitary" });
  const lamina = ell([0, 4, -2], [4.5, 1.2, 5.5], { mat: "hypothalamus" });
  const body = xhull(blend(1.8, ...walls, ...mamillary, stalk, lamina), "hypothalamus");
  const cut = capAt(body, [0, 0, Z.mesTop], [0, 0, 1]);
  return blend(0.8, cut, pituitary);
}

// ---- Cerebelo --------------------------------------------------------------------------------------------------------
// Transverso ≈ 100 mm, AP ≈ 52, alto ≈ 45. Dos hemisferios y el vermis, que se separan por planos verticales.
const VERMIS_X = 9.4;
const folia = (F, center) => (p) => {
  const [x, y, z] = R(p);
  const rr = Math.hypot(y - center[0], z - center[1]);
  return Math.max(Math.abs(Math.sin(0.72 * rr + 0.04 * x)) * 1.3 - 0.3, -(F.value(p) + 2));
};
function cerebellumBody() {
  const cb = { mat: "cerebellum" };
  return blend(6, ...[-1, 1].map((s) => ell([s * 26, -60, -37], [25, 23, 18], { axes: [[1, 0.1 * s, 0], [0, 1, 0.12]], ...cb })), ell([0, -63, -35], [12, 21, 17], cb));
}
function cerebellumPieces(stemSeat) {
  const body = carve(cerebellumBody(), grow(stemSeat, GAP), 0);
  const F0 = B.field(body);
  const textured = carve(body, B.custom(folia(F0, [-52, -40]), { bounds: F0.bounds, L: 1.3, tag: "folia" }), 0.5);
  const hemi = (s) => {
    let h = clip(textured, [s * (VERMIS_X + GAP / 2), 0, 0], [-s, 0, 0], 0, { mat: "white" });
    return h;
  };
  const vermis = clip(clip(textured, [VERMIS_X - GAP / 2, 0, 0], [1, 0, 0], 0, { mat: "white" }), [-(VERMIS_X - GAP / 2), 0, 0], [-1, 0, 0], 0, { mat: "white" });
  return { left: hemi(-1), right: hemi(1), vermis };
}

// ---- Médula espinal (cervical) ---------------------------------------------------------------------------------------
// Óvalo AP × transverso de 8,8 × 12,4 mm (C2) a 8,7 × 14 (C5–C6, engrosamiento). Baja desde el foramen magno.
export const CORD_TOP = Z.cord - GAP / 2;
export const CORD_BOTTOM = -128;
const cordAt = (z) => {
  const t = (CORD_TOP - z) / (CORD_TOP - CORD_BOTTOM);
  const enl = Math.exp(-(((t - 0.62) / 0.22) ** 2));
  return { y: -44 - 5 * t, a: 6.1 + 0.9 * enl, b: 4.4 + 0.1 * enl };
};
export const CORD_AXIS = (z) => [0, cordAt(z).y, z];
function cord() {
  const f = (p) => {
    const [x, y, z] = R(p);
    const zc = Math.max(CORD_BOTTOM, Math.min(CORD_TOP, z));
    const { y: yc, a, b } = cordAt(zc);
    const side = (Math.hypot(x / a, (y - yc) / b) - 1) * Math.min(a, b);
    return Math.max(side, z - CORD_TOP, CORD_BOTTOM - z);
  };
  const lo = W([-9, -56, CORD_BOTTOM - 1]);
  const hi = W([9, -36, CORD_TOP + 1]);
  const body = B.custom(f, { bounds: { min: lo.map((v, i) => Math.min(v, hi[i])), max: lo.map((v, i) => Math.max(v, hi[i])) }, L: 1.1, mat: "cord", tag: "cord-v2" });
  const y0 = cordAt(CORD_TOP).y;
  const fissure = cone([0, y0 + 4.5, CORD_TOP + 2], [0, cordAt(CORD_BOTTOM).y + 4.5, CORD_BOTTOM - 2], 0.9, 0.9);
  return carve(body, fissure, 0.4);
}

// ---- Hemisferio: corteza con surcos y giros --------------------------------------------------------------------------
// 167 × 70 × 120: polo frontal +70, occipital −96, vértex +73, cara inferior del temporal −45. La cara medial es plana.
export function hemisphereShell(s) {
  const g = { mat: "cortex" };
  const MAIN = ell([s * 31, -12, 17], [33, 78, 56], g);
  const FRONTAL = ell([s * 31, 32, 12], [31, 40, 48], g);
  const ORBIT = ell([s * 25, 44, -8], [24, 26, 14], g);
  const OCC = ell([s * 28, -68, 10], [26, 28, 36], g);
  const TEMP = ell([s * 37, -12, -26], [24, 40, 20], { axes: [[1, 0, 0], [0, 1, -0.22]], ...g });
  let H = blend(13, MAIN, FRONTAL, ORBIT, OCC, TEMP);
  H = clip(H, [s * MID, 0, 0], [-s, 0, 0], 2);
  const BASE = B.field(H);
  const SHELL = B.field(H);
  const sulcus = (pts, r, depth) => groove(BASE, pts.map(([y, z]) => W([s * 90, y, z])), r, { depth });
  const NAMED = [
    // Surco lateral (de Silvio): del polo temporal hacia atrás y arriba.
    sulcus([[30, -12], [10, -6], [-10, 2], [-28, 9], [-45, 20]], 3.6, 0.4),
    // Surco central (de Rolando): del borde superior hacia delante y abajo, casi hasta el lateral.
    sulcus([[-18, 72], [-14, 58], [-8, 40], [-2, 22], [3, 8]], 2.4, 0.22),
  ];
  const random = lcg(s > 0 ? 23 : 11);
  const WAVES = Array.from({ length: 7 }, () => {
    const z = random() * 2 - 1;
    const t = random() * Math.PI * 2;
    const k = 0.2 + random() * 0.06;
    return [Math.sqrt(1 - z * z) * Math.cos(t) * k, Math.sqrt(1 - z * z) * Math.sin(t) * k, z * k, random() * Math.PI * 2];
  });
  const gyri = (p) => {
    const shell = -(SHELL.value(p) + 3.4);
    if (shell > 0.5) return shell;
    const q = R(p);
    let n = 0;
    for (const [a, b, c, ph] of WAVES) n += Math.sin(a * q[0] + b * q[1] + c * q[2] + ph);
    n /= Math.sqrt(WAVES.length);
    return Math.max(Math.abs(n) - 0.2, shell, -(Math.abs(q[0]) - 4));
  };
  const gyrified = carve(carve(H, B.custom(gyri, { bounds: BASE.bounds, L: 1, tag: `gyri${s}` }), 1.2), union(...NAMED.map((n) => culled(n))), 1);
  return { shell: gyrified, plain: H };
}

// ---- Lóbulos del hemisferio izquierdo --------------------------------------------------------------------------------
// Planos (RAS, [o, n]) que parten el hemisferio en cuatro cuñas casi convexas:
//   central:   baja hacia delante, de (y −18, z 72) a (y 3, z 8); n hacia delante y arriba (lado frontal)
//   lateral:   de (y 30, z −12) a (y −45, z 20); n hacia arriba (lado frontal y parietal)
//   polo:      y = 26; n hacia delante (lado frontal)
//   occipital: de (y −62, z 72) a (y −72, z −30); n hacia delante
export const PLANES = {
  central: { o: [0, -18, 72], n: unit([0, 0.95, 0.31]) },
  lateral: { o: [0, 30, -12], n: unit([0, 0.39, 0.92]) },
  polo: { o: [0, 26, 0], n: [0, 1, 0] },
  occipital: { o: [0, -62, 72], n: unit([0, 1, -0.1]) },
};
// Región como intersección de semiespacios, cada uno corrido `shift` hacia dentro (o hacia fuera si es negativo).
const region = (list, shift) => intersect(0, ...list.map(([key, sign]) => half(add(PLANES[key].o, mul(PLANES[key].n, -sign * shift)), mul(PLANES[key].n, sign))));
// Una `half` deja fuera lo que está del lado de n; (key, +1) deja el lado n negativo.
export const REGIONS = {
  // lado opuesto a n: «detrás» del plano; lado de n: «delante»
  temporal: [["lateral", +1], ["polo", +1], ["occipital", -1]], // bajo el plano lateral, detrás del polo, delante del plano occipital
  occipital: [["occipital", +1]], // detrás del plano occipital
  parietal: [["central", +1], ["lateral", -1], ["occipital", -1]], // detrás del central, sobre el lateral, delante del occipital
  frontal: [["central", -1]], // delante del plano central, menos el temporal
};
export function lobes(H, seats, g = GAP / 2) {
  const inside = (list) => region(list, g);
  const T = intersect(0, H, inside(REGIONS.temporal));
  const O = intersect(0, H, inside(REGIONS.occipital));
  const P = intersect(0, H, inside(REGIONS.parietal));
  const F0 = intersect(0, H, inside(REGIONS.frontal));
  const F = carve(F0, region(REGIONS.temporal, -g), 0);
  const cut = (n) => carve(n, seats, 0);
  return { frontal: cut(F), parietal: cut(P), temporal: cut(T), occipital: cut(O) };
}

export const RAW = {
  mesencefalo: mesencephalon,
  puente: pons,
  bulbo: medulla,
  talamos: thalami,
  hipotalamo: hypothalamus,
  cerebelo: cerebellumPieces,
  medula: cord,
};
