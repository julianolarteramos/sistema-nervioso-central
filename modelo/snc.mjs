// Geometría del modelo del SNC, en RAS (ver marco.mjs). Cada pieza desmontable es un nodo SDF propio.
// Las medidas salen de investigacion/ANATOMIA.md; las marcadas (estimado) allí se ajustaron con las imágenes de referencias/.
import { kit, shared } from "../kit.mjs";
import { W, Wd, R } from "./marco.mjs";
import { culled, sweep as sweepW } from "../lib/campos.mjs";

// Barrido en RAS (ver lib/campos.mjs).
const sweep = (node, dir, over, opts) => sweepW(node, Wd(dir), over, opts);

const B = await kit("blob.mjs");
const { groove } = await shared();

// Primitivas en RAS.
export const ell = (c, r, { axes, ...meta } = {}) => B.ellipsoid(W(c), r, { axes: axes ? axes.map(Wd) : undefined, ...meta });
export const ball = (c, r, meta = {}) => B.ball(W(c), r, meta);
export const cone = (a, b, ra, rb = ra, meta = {}) => B.capsule(W(a), W(b), ra, rb, meta);
export const clip = (node, o, n, k = 0, meta = {}) => B.clip(node, W(o), Wd(n), k, meta);
export const half = (o, n, meta = {}) => B.halfspace(W(o), Wd(n), meta);

// Caja en el mundo a partir de dos esquinas RAS.
export function boxW(a, b) {
  const p = W(a);
  const q = W(b);
  return { min: p.map((v, i) => Math.min(v, q[i])), max: p.map((v, i) => Math.max(v, q[i])) };
}

function lcg(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Despiece: sale primero el cerebelo (atrás y abajo), luego los dos hemisferios hacia los lados y, al final, el
// diencéfalo con el tronco, que sube. La médula se queda en la varilla. Los asientos son planos a ras (sin barridos):
// cada pieza sale en una dirección que se aleja de todo lo que queda.
export const MOVES = { cb: [0, -45, -65], hemiL: [-85, 0, 0], hemiR: [85, 0, 0], stem: [0, 8, 70] };
const neg = (v) => v.map((x) => -x);
// Holgura entre las piezas que se tocan: a esta escala se lee como una junta a ras, y deja que el orden de pintor
// decida cada par sin empates (la auditoría compara profundidades con una tolerancia de 0,3 mm).
export const GAP = 0.8;
const MID_GAP = Number(process.env.SNC_CLIP ?? 1);

// ---- Tronco del encéfalo con el diencéfalo (fase 1: una pieza) -------------------------------------------------------
// Tálamos (±11, −18, +7), hipotálamo (0, −4, −10), mesencéfalo (0, −22, −12), puente (0, −28, −35), bulbo hasta el
// foramen magno (z ≈ −65), donde sigue la médula.
const mat = { mat: "stem" };
// Los dos tálamos son un solo ovoide centrado en la línea media (adhesión intertalámica): así cada corte del tronco por
// una recta paralela a x es un intervalo alrededor de x = 0 y los hemisferios salen hacia los lados sin tocarlo.
const THALAMI = [ell([0, -18, 7], [21, 15, 9.5], { axes: [[1, 0, 0], [0, 1, 0.15]], ...mat })];
const HYPO = ell([0, -6, -8], [7, 9, 6], mat);
const MID = B.blend(4, ell([0, -22, -10], [13, 9, 9], mat), ...[-1, 1].map((s) => cone([s * 7, -16, -4], [s * 4.5, -22, -22], 6, 5.5, mat)));
const PONS = ell([0, -27, -34], [18, 11.5, 12], mat);
const BULB = cone([0, -31, -44], [0, -35, -66], 9.5, 6.6, mat);
export const STEM_BODY = B.blend(5, ...THALAMI, HYPO, MID, PONS, BULB);
const STEM_F = B.field(STEM_BODY);
const STEM = clip(STEM_BODY, [0, -35, -65], [0, 0, -1], 0.6);

// ---- Cerebelo -------------------------------------------------------------------------------------------------------
// Transverso ≈ 100 mm, AP ≈ 52, alto ≈ 45, centro (0, −58, −35). Dos hemisferios y el vermis.
const cb = { mat: "cerebellum" };
const CB_RAW = B.blend(7, ...[-1, 1].map((s) => ell([s * 24, -58, -37], [26, 24, 19], { axes: [[1, 0.1 * s, 0], [0, 1, 0.12]], ...cb })), ell([0, -66, -33], [11, 18, 18], cb));
export const CB_BODY = B.carve(CB_RAW, B.grow(STEM_BODY, GAP), 0);
const CBF = B.field(CB_BODY);
const folia = (p) => {
  const [x, y, z] = R(p);
  const rr = Math.hypot(y + 52, z + 40);
  return Math.max(Math.abs(Math.sin(0.7 * rr + 0.04 * x)) * 1.3 - 0.3, -(CBF.value(p) + 2));
};
const CEREBELLUM = B.carve(CB_BODY, B.custom(folia, { bounds: CBF.bounds, L: 1.3 }), 0.5);

// ---- Hemisferios ----------------------------------------------------------------------------------------------------
// 167 × 70 × 120 cada uno: polo frontal +70, occipital −96, vértex +73, cara inferior del temporal −45.

function hemisphere(s) {
  const g = { mat: "cortex" };
  const MAIN = ell([s * 31, -12, 17], [33, 78, 56], g);
  const FRONTAL = ell([s * 31, 32, 12], [31, 40, 48], g);
  const ORBIT = ell([s * 25, 44, -8], [24, 26, 14], g);
  const OCC = ell([s * 28, -68, 10], [26, 28, 36], g);
  const TEMP = ell([s * 37, -12, -26], [24, 40, 20], { axes: [[1, 0, 0], [0, 1, -0.22]], ...g });
  let H = B.blend(13, MAIN, FRONTAL, ORBIT, OCC, TEMP);
  H = clip(H, [s * MID_GAP, 0, 0], [-s, 0, 0], 2);
  const SHELL = B.field(H);
  // Asiento del tronco y del cerebelo: contacto a ras. Hacia la línea media el asiento del tronco se prolonga con el
  // corte transversal del tálamo (|x| ≥ 10,5), para que el hemisferio salga hacia fuera sin rozarlo.
  H = B.carve(H, B.union(B.grow(STEM_BODY, GAP), B.grow(CB_RAW, GAP)), 0);
  const BASE = B.field(H);
  const SEATS = B.field(culled(B.union(STEM_BODY, CB_RAW)));
  const sulcus = (pts, r, depth) => groove(BASE, pts.map(([y, z]) => W([s * 90, y, z])), r, { depth });
  const NAMED = [
    // Surco lateral: del polo temporal hacia atrás y arriba.
    sulcus([[30, -12], [10, -6], [-10, 2], [-28, 9], [-45, 20]], 4.2, 0.45),
    // Surco central: del borde superior hacia delante y abajo, casi hasta el lateral.
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
    const q = R(p);
    let n = 0;
    for (const [a, b, c, ph] of WAVES) n += Math.sin(a * q[0] + b * q[1] + c * q[2] + ph);
    n /= Math.sqrt(WAVES.length);
    // Sin giros en la cara medial plana ni en los asientos: solo en la convexidad.
    const medial = Math.abs(q[0]) - 4;
    const shell = -(SHELL.value(p) + 3.4);
    if (shell > 0.5) return shell;
    return Math.max(Math.abs(n) - 0.2, shell, -medial, 3 - SEATS.value(p));
  };
  return B.carve(B.carve(H, B.custom(gyri, { bounds: BASE.bounds, L: 1 }), 1.2), B.union(...NAMED.map((n) => culled(n))), 1);
}

// ---- Médula espinal (cervical) --------------------------------------------------------------------------------------
// Óvalo AP × transverso: C2 8,8 × 12,4; C5–C6 (engrosamiento) 8,7 × 14; baja del foramen magno (−66) a −118.
const CORD_TOP = -65 - 0.8;
const CORD_BOTTOM = -118;
const cordAt = (z) => {
  const t = (CORD_TOP - z) / (CORD_TOP - CORD_BOTTOM);
  const enl = Math.exp(-(((t - 0.7) / 0.22) ** 2));
  return { y: -35 - 3 * t, a: 6.4 + 0.8 * enl, b: 4.6 + 0.1 * enl };
};
const cord = (p) => {
  const [x, y, z] = R(p);
  const zc = Math.max(CORD_BOTTOM, Math.min(CORD_TOP, z));
  const { y: yc, a, b } = cordAt(zc);
  const side = (Math.hypot(x / a, (y - yc) / b) - 1) * Math.min(a, b);
  return Math.max(side, z - CORD_TOP, CORD_BOTTOM - z);
};
const CORD_BODY = B.custom(cord, { bounds: boxW([-9, -46, CORD_BOTTOM - 1], [9, -26, CORD_TOP + 1]), L: 1.1, mat: "cord" });
// Cisura media anterior: una ranura a lo largo de la cara anterior.
const FISSURE = cone([0, -30.2, CORD_TOP + 2], [0, -33.2, CORD_BOTTOM - 2], 0.9, 0.9);
const CORD = B.carve(CORD_BODY, FISSURE, 0.4);
export const CORD_BOTTOM_AT = [0, -38, CORD_BOTTOM];

const BEHIND = [{ shadow: ["tronco"] }, { shadow: ["cerebelo"], margin: Number(process.env.SNC_MARGIN_CB ?? 0.1) }];
// Etapas del despiece [desde, hasta, salto]; SNC_STAGES (JSON) las reemplaza para probar variantes.
const STAGES = { izq: [0.3, 0.65, 0.08], der: [0.3, 0.65, 0.08], cb: [0.0001, 0.3, 0.04], tronco: [0.65, 1, 0.04], ...JSON.parse(process.env.SNC_STAGES ?? "{}") };
export const PIECES = [
  { name: "hemisferio-izq", node: hemisphere(-1), mat: "cortex", move: MOVES.hemiL, stage: STAGES.izq, split: BEHIND, ground: true },
  { name: "hemisferio-der", node: hemisphere(1), mat: "cortex", move: MOVES.hemiR, stage: STAGES.der, split: BEHIND, ground: true },
  { name: "cerebelo", node: CEREBELLUM, mat: "cerebellum", move: MOVES.cb, stage: STAGES.cb, ground: true },
  { name: "tronco", node: STEM, mat: "stem", move: MOVES.stem, stage: STAGES.tronco, ground: true },
  { name: "medula", node: CORD, mat: "cord", move: [0, 0, 0], stage: [0, 1] },
];
