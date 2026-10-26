// Primitivas en RAS (mm, origen en la comisura anterior: +x derecha, +y delante, +z arriba) sobre el kit de specimen.
import { kit, shared } from "../kit.mjs";
import { W, Wd, R } from "./marco.mjs";

export const B = await kit("blob.mjs");
export const { groove } = await shared();
export { W, Wd, R };

// Holgura entre las piezas que se tocan: a esta escala se lee como una junta a ras, y deja que el orden de pintor
// decida cada par sin empates (la auditoría compara profundidades con una tolerancia de 0,3 mm).
export const GAP = 0.8;

export const ell = (c, r, { axes, ...meta } = {}) => B.ellipsoid(W(c), r, { axes: axes ? axes.map(Wd) : undefined, ...meta });
export const ball = (c, r, meta = {}) => B.ball(W(c), r, meta);
export const cone = (a, b, ra, rb = ra, meta = {}) => B.capsule(W(a), W(b), ra, rb, meta);
export const clip = (node, o, n, k = 0, meta = {}) => B.clip(node, W(o), Wd(n), k, meta);
export const half = (o, n, meta = {}) => B.halfspace(W(o), Wd(n), meta);
export const blend = B.blend;
export const union = B.union;
export const carve = B.carve;
export const grow = B.grow;
export const intersect = B.intersect;

// Elipsoide con el eje largo `along` (RAS, unitario) y el segundo eje en el plano de `side`.
export function ellAlong(c, r, along, side = [0, 0, 1], meta = {}) {
  const u = unit(along);
  const w = unit(sub(side, mul(u, dot(side, u))));
  return ell(c, r, { axes: [u, w], ...meta });
}
export const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const lerp = (a, b, t) => add(mul(a, 1 - t), mul(b, t));

// Cadena de elipsoides a lo largo de una poligonal: cada nudo lleva [centro, rx, ry, rz]. Sirve para troncos de sección
// ovalada que se afina (bulbo, médula, nervios gruesos).
export function ovalChain(knots, { k = 2, step = 3, meta = {} } = {}) {
  const parts = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const [c0, ...r0] = knots[i];
    const [c1, ...r1] = knots[i + 1];
    const len = Math.hypot(...sub(c1, c0));
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = 0; j <= n; j++) {
      if (j === 0 && i > 0) continue;
      const t = j / n;
      parts.push(ell(lerp(c0, c1, t), r0.map((v, q) => v + (r1[q] - v) * t), { ...meta }));
    }
  }
  return B.blend(k, ...parts);
}

export function lcg(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// Caja en el mundo a partir de dos esquinas RAS.
export function boxW(a, b) {
  const p = W(a);
  const q = W(b);
  return { min: p.map((v, i) => Math.min(v, q[i])), max: p.map((v, i) => Math.max(v, q[i])) };
}

// Plano de contacto con holgura: la pieza queda del lado opuesto a `n`, a media holgura del plano que pasa por `o`.
// La pieza vecina usa el mismo `o` y `-n`.
export const capAt = (node, o, n, meta = {}) => clip(node, sub(o, mul(unit(n), GAP / 2)), n, 0, meta);
