// Lista de piezas desmontables: sólido, tejido, sistema, orden de salida y vector de despiece.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { B, GAP, ell, ball, cone, clip, blend, union, carve, grow, W, Wd, R } from "./prims.mjs";
import { RAW, hemisphereShell, lobes, CORD_AXIS, CORD_BOTTOM, CORD_TOP } from "./anatomia.mjs";
import { bakeField, sweep as sweepW } from "../lib/campos.mjs";
import * as A2 from "./anatomia2.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// Núcleo profundo del hemisferio izquierdo (K): medio elipsoide con la cara plana en la línea media y encierra el tálamo, el hipotálamo,
// el mesencéfalo y, más adelante, los núcleos basales. Los cuatro lóbulos son casquetes que lo envuelven desde fuera, así que
// salen radialmente sin atascos, y lo que está dentro se pela en capas de afuera hacia adentro, hacia la izquierda.
const KERN = ell([-1, -2, 0], [43.5, 46, 37], { mat: "white" });

const mes = RAW.mesencefalo();
const pons = RAW.puente();
const bulb = RAW.bulbo();
const thal = RAW.talamos();
const hypo = carve(RAW.hipotalamo(), grow(mes, GAP), 0);
const stemSeat = union(mes, pons, bulb);
const cb = RAW.cerebelo(stemSeat);
const cord = RAW.medula();
// Diseño de despiece A: el hemisferio derecho es la «mitad derecha entera» (con la mitad derecha del diencéfalo, del tronco y
// del cerebelo), como en los modelos comerciales 3B C17/C18; las piezas de la línea media son mitades izquierdas con una cara
// plana de corte sagital. Así el derecho no lleva muescas.
const lh = (n) => clip(n, [-GAP / 2, 0, 0], [1, 0, 0], 0);
const rh = (n) => clip(n, [GAP / 2, 0, 0], [-1, 0, 0], 0);
const thalL = carve(lh(thal), grow(A2.ventricles(), GAP), 0);
const hypoL = lh(hypo);
const mesL = lh(mes);
const ponsL = lh(pons);
const bulbL = lh(bulb);
const vermisL = lh(cb.vermis);

// ---- Línea media: calloso, septum, fórnix, pineal y molde ventricular (mitades izquierdas) ----------------------------------
const gc = (...n) => n.map((x) => grow(x, GAP));
const cast = A2.ventricles();
const castL = lh(cast);
const cc0 = A2.corpusCallosum();
const sep0 = A2.septum();
const forn0 = A2.fornix();
const pin0 = A2.pineal();
const ccFull = carve(cc0, grow(cast, GAP), 0);
const sepFull = carve(sep0, union(...gc(cc0, cast)), 0);
const fornFull = carve(forn0, union(...gc(cc0, sep0, cast, thal, hypo)), 0);
const pinFull = carve(pin0, union(...gc(cc0, thal, mes)), 0);
const ccL = lh(ccFull);
const sepL = lh(sepFull);
const fornL = lh(fornFull);
const pinL = lh(pinFull);

const L = hemisphereShell(-1);
const Rh = hemisphereShell(1);
const kern = B.intersect(0, L.plain, KERN);
// Núcleos basales (izquierdos). Putamen y pálido forman el núcleo lenticular; el caudado lo rodea en C: cabeza delante,
// cuerpo arriba y cola que baja por detrás y vuelve hacia delante bajo el lenticular, hasta la amígdala.
const putRaw = B.intersect(0, kern, ell([-25, 2, 1], [6.8, 22, 20], { axes: [[1, 0, 0], [0, 1, 0.08]], mat: "putamen" }));
const palRaw = ell([-16.4, -4, 0], [5, 10, 10], { mat: "pallidus" });
const cauRaw = B.intersect(
  0,
  kern,
  blend(
    3,
    ell([-12.8, 13, 9], [6.8, 12, 10], { mat: "caudate" }),
    B.vessel(
      [[-13, 8, 14], [-15, 0, 20], [-18, -9, 24], [-22, -18, 25], [-26, -26, 20], [-29, -31, 9], [-30, -31, -3], [-29, -27, -13], [-28, -19, -21], [-26, -10, -24]].map(W),
      (t) => 5.6 - 3.5 * Math.min(1, t * 1.15),
      { mat: "caudate" },
    ),
  ),
);
// Para que cada capa salga hacia la izquierda sin atrapar a la de al lado, se reparte todo el núcleo en capas de x: lo que
// queda por fuera de los núcleos (hasta la superficie del núcleo profundo) es la ínsula con el claustro y la cápsula externa;
// lo que queda por dentro del caudado (hasta la línea media) se queda con el caudado.
const sweepR = (node, dirRAS) => ({ ...sweepW(node, Wd(dirRAS), B.field(kern).bounds, { h: 0.8 }), mat: "insula" });
const nuclei = union(putRaw, palRaw, cauRaw);
// capa lateral = lo que ve un núcleo hacia dentro y ninguno hacia fuera (sin el hueco entre putamen y caudado)
const lateral = carve(B.intersect(0, kern, sweepR(nuclei, [1, 0, 0]), ell([-40, 1, 0], [30, 40, 34], { mat: "insula" })), sweepR(nuclei, [-1, 0, 0]), 0);
const ins = carve(lateral, union(...[putRaw, palRaw, cauRaw].map((n) => grow(n, GAP))), 0);
const putamen = carve(putRaw, grow(ins, GAP), 0);
const pallidus = carve(palRaw, union(grow(putRaw, GAP), grow(thalL, GAP)), 0);
const caudate = carve(
  cauRaw,
  union(grow(putRaw, GAP), grow(palRaw, GAP), grow(ins, GAP), grow(thalL, GAP), grow(hypoL, GAP), grow(mesL, GAP), grow(ponsL, GAP), grow(castL, GAP), grow(ccL, GAP), grow(fornL, GAP), grow(sepL, GAP), grow(pinL, GAP)),
  0,
);
// Hipocampo con la amígdala (dentro del núcleo profundo, que llega hasta el suelo del cuerno temporal).
const hippo = carve(
  B.intersect(0, kern, A2.hippocampus()),
  union(...gc(mesL, ponsL, thalL, hypoL, caudate, fornL, castL, putamen, pallidus, ins)),
  0,
);
const solo = [thalL, hypoL, mesL, ponsL, bulbL].map((n) => grow(n, GAP));
// ---- Vías sensoriales: bulbo olfatorio (izquierdo) y quiasma con la vía óptica (mitad izquierda; la derecha va en la mitad derecha) ----
const olfL = carve(A2.olfactory(), union(...gc(ins, putamen, pallidus, caudate, hypoL, thalL, mesL)), 0);
const optFull = carve(A2.opticPath(), union(...gc(hypo, mes, thal, ins, putamen, pallidus, caudate, hippo, olfL)), 0);
const optL = lh(optFull);
// ---- Médula: raíces con ganglios (unidas a la médula cervical) y rodajas ampliadas sobre la peana --------------------------------
const cordFull = union(cord, ...A2.rootsFor(CORD_AXIS, [-86, -97, -108]));
// Las cuatro rodajas (C6, T6, L3, S2; ampliadas al doble) se apoyan en la peana, inclinadas hacia la cámara como cartulinas, en cuadrícula
// alrededor del poste: tendidas no se lee la H de la sustancia gris, y en fila no caben (la peana mide 46 mm de radio).
const TILT = (62 * Math.PI) / 180;
const tiltBasis = [[Math.cos(TILT), 0, -Math.sin(TILT)], [0, 1, 0], [Math.sin(TILT), 0, Math.cos(TILT)]];
const postY = CORD_AXIS(CORD_BOTTOM)[1];
const plinthTop = 9; // cara superior de la peana, en el mundo del kit
// Ninguna rodaja puede quedar detrás del poste visto desde la cámara: el poste es parte del montaje, no una pieza, y una rodaja de la
// misma pieza por detrás y otra por delante forman un ciclo que el orden de pintor no resuelve (se vio con S2 en [20, -20]).
const slicePlaces = [[-20, 20], [20, 20], [-20, -20], [-33, 0]];
const sliceNodes = A2.SLICE_LEVELS.map((lv, i) => {
    // Se construye con su centro en el origen del mundo para rotarla sobre sí misma, y luego se lleva a su sitio sobre la peana.
    const local = A2.cordSlice(lv, R([0, 0, 0]));
    const half = lv.a * Math.sin(TILT) + 2.4 * Math.cos(TILT) + 0.7;
    return B.place(local, { basis: tiltBasis, move: [-slicePlaces[i][0], postY + slicePlaces[i][1], plinthTop + half + 0.5] });
});

// ---- Meninges: membranas translúcidas (no entran en el orden de pintor) ----------------------------------------------------------
const brainEnvelope = B.union(L.shell, Rh.shell);
const duraN = A2.duraCap(brainEnvelope);
const aracN = clip(carve(grow(brainEnvelope, 1.2), grow(brainEnvelope, 0.4), 0), [0, 0, -8], [0, 0, -1], 0);
const falxN = A2.falx();
const tentN = A2.tentorium(union(cb.left, cb.right, cb.vermis), stemSeat);
const bounds = (n) => B.field(n).bounds;
const lob = lobes(L.shell, bakeField(union(grow(KERN, GAP), ...[thalL, hypoL, mesL, ponsL, bulbL, cb.left, vermisL, ccL, fornL, sepL, castL, pinL, hippo, olfL, optL].map((n) => grow(n, GAP))), bounds(L.shell)));
const hemiR = B.union(Rh.shell, rh(thal), rh(hypo), rh(mes), rh(pons), rh(bulb), cb.right, rh(cb.vermis), rh(ccFull), rh(sepFull), rh(fornFull), rh(pinFull), rh(cast), rh(optFull));

// Sistemas del árbol: id, nombre y piezas en orden de salida.
const defs = [
  { name: "dura", node: duraN, mat: "dura", sys: "meninges", veil: 0.32, pref: [0, 0, 1] },
  { name: "aracnoides", node: aracN, mat: "dura", sys: "meninges", veil: 0.22, pref: [0, 0, 1] },
  { name: "hoz", node: falxN, mat: "dura", sys: "meninges", veil: 0.4, pref: [0, 0, 1] },
  { name: "tienda", node: tentN, mat: "dura", sys: "meninges", veil: 0.4, pref: [0, -0.4, 1] },
  { name: "frontal-izq", node: lob.frontal, mat: "cortex", sys: "telencefalo", pref: [-1, 0.8, 0.3] },
  { name: "parietal-izq", node: lob.parietal, mat: "cortex", sys: "telencefalo", pref: [-1, -0.3, 0.9] },
  { name: "temporal-izq", node: lob.temporal, mat: "cortex", sys: "telencefalo", pref: [-1, 0.2, -0.9] },
  { name: "occipital-izq", node: lob.occipital, mat: "cortex", sys: "telencefalo", pref: [-1, -1, 0.2] },
  { name: "insula-izq", node: ins, mat: "insula", sys: "telencefalo", pref: [-1, 0.6, 0.15] },
  { name: "putamen-izq", node: putamen, mat: "putamen", sys: "nucleos", pref: [-1, -0.5, -0.3] },
  { name: "pallido-izq", node: pallidus, mat: "pallidus", sys: "nucleos", pref: [-1, 0.15, -0.8] },
  // El caudado es una C que se entrelaza con otras dos C (el molde ventricular y el hipocampo) y con la ínsula, el calloso y el fórnix:
  // desde casi todos los ángulos salían ciclos que el planificador no podía cortar. Se parte en cabeza con cuerpo, y cola, como en la anatomía.
  { name: "caudado-izq", node: clip(caudate, [0, -26.6, 0], [0, -1, 0], 0), mat: "caudate", sys: "nucleos", pref: [-1, -0.6, 0.6] },
  { name: "cola-caudado-izq", node: clip(caudate, [0, -27.4, 0], [0, 1, 0], 0), mat: "caudate", sys: "nucleos", pref: [-1, -0.8, -0.2] },
  { name: "cuerpo-calloso", node: ccL, mat: "callosum", sys: "nucleos", pref: [-0.5, 0, 1] },
  { name: "septum-izq", node: sepL, mat: "septum", sys: "nucleos", pref: [-0.4, 0.2, 1] },
  { name: "fornix-izq", node: fornL, mat: "fornix", sys: "nucleos", pref: [-0.5, -0.4, 1] },
  // L: pendiente real del campo del molde (la audita `lipschitz`); se declara para que el trazado de rayos no salte su superficie.
  { name: "molde-ventricular-izq", node: carve(castL, grow(ins, GAP), 0), mat: "ventricle", sys: "ventriculos", pref: [-0.5, 0, 1], L: 6.5 },
  { name: "pineal-izq", node: pinL, mat: "pineal", sys: "diencefalo", pref: [0, -1, 0.4] },
  { name: "hipocampo-izq", node: hippo, mat: "hippocampus", sys: "limbico", pref: [-1, -0.2, -0.5] },
  { name: "olfatorio-izq", node: olfL, mat: "olfactory", sys: "limbico", pref: [-0.3, 0.8, -0.6] },
  { name: "optica-izq", node: optL, mat: "optic", sys: "limbico", pref: [-0.6, 0.2, -0.8] },
  { name: "vermis-izq", node: vermisL, mat: "cerebellum", sys: "cerebelo", pref: [0, -1, -0.4] },
  { name: "cerebelo-izq", node: cb.left, mat: "cerebellum", sys: "cerebelo", pref: [-1, -0.3, -0.5], jump: 0.25 },
  { name: "talamo-izq", node: thalL, mat: "thalamus", sys: "diencefalo", pref: [-1, 0.35, 0.25] },
  { name: "hipotalamo-izq", node: hypoL, mat: "hypothalamus", sys: "diencefalo", pref: [0, 0.4, -1] },
  { name: "mesencefalo-izq", node: mesL, mat: "stem", sys: "tronco", pref: [0, 0, 1] },
  { name: "puente-izq", node: ponsL, mat: "stem", sys: "tronco", pref: [0, 0, 1] },
  { name: "bulbo-izq", node: bulbL, mat: "stem", sys: "tronco", pref: [0, 0.2, 1] },
  { name: "hemisferio-der", node: hemiR, mat: "cortex", sys: "telencefalo", pref: [1, 0, 0.2] },
  // Una pieza por nivel: reunidas en una sola, desde algunos ángulos unas quedaban delante y otras detrás del poste del montaje, que el
  // planificador de cortes no ve, y se formaba un ciclo (87 filas en az300).
  ...A2.SLICE_LEVELS.map((lv, i) => ({ name: `rodaja-${lv.name.toLowerCase()}`, node: sliceNodes[i], mat: "cord", sys: "medula", pref: [0, -1, 0.25] })),
  { name: "medula", node: cordFull, mat: "cord", sys: "medula", pref: [0, 0, 0], fixed: true },
];

// Vectores de despiece (RAS) calculados por scripts/planear-salidas.mjs; si faltan, la preferencia a 90 mm.
const salidasFile = join(HERE, "salidas.json");
const salidas = existsSync(salidasFile) && !process.env.SNC_NO_SALIDAS ? JSON.parse(readFileSync(salidasFile, "utf8")) : {};
// Correcciones a mano de los vectores (ver ajustes-salidas.json): tienen prioridad sobre las del planificador.
const ajustesFile = join(HERE, "ajustes-salidas.json");
const ajustes = existsSync(ajustesFile) ? JSON.parse(readFileSync(ajustesFile, "utf8")) : {};
const rank = (d) => { const i = (salidas._orden ?? []).indexOf(d.name); return i < 0 ? 1e6 + defs.indexOf(d) : i; };
const movable = defs.filter((d) => !d.fixed).sort((a, b) => rank(a) - rank(b));
const unitv = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
export const JUMP = 0.08;
export const PIECES = [...movable, ...defs.filter((d) => d.fixed)].map((d) => {
  const i = movable.indexOf(d);
  const n = movable.length;
  const move = d.fixed ? [0, 0, 0] : ajustes[d.name] ?? salidas[d.name]?.move ?? unitv(d.pref).map((x) => x * 90);
  const stage = d.fixed ? [0, 1] : [(i + 0.02) / n, (i + 1) / n, d.jump ?? JUMP];
  return { ...d, move, stage, ground: d.name !== "medula" };
});

export const CORD_BOTTOM_AT = CORD_AXIS(CORD_BOTTOM);
export { CORD_TOP };
// El núcleo profundo del hemisferio izquierdo: el volumen de sustancia blanca que ninguna pieza ocupa (quedó hueco al quitar la cápsula). Lo usa
// scripts/cortes.mjs para rellenarlo en el visor de cortes.
export const NUCLEO_PROFUNDO = kern;
