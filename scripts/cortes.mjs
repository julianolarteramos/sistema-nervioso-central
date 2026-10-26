// Calcula las secciones del modelo para el visor de cortes y las guarda en modelo/cortes.json.
//   node scripts/cortes.mjs [--paso 1] [--solo coronal|axial]
//
// Para cada plano (coronal: y constante; axial: z constante) y cada posición, se muestrea el campo de distancia de cada pieza en una rejilla
// de `paso` mm sobre el plano y se extrae el contorno con marching squares (con interpolación lineal sobre el campo, así que el contorno es más
// fino que la rejilla). Los contornos se encadenan en lazos cerrados, se simplifican (Douglas-Peucker) y se escriben como el atributo `d` de un
// trazo SVG, en milímetros ya en coordenadas de pantalla del visor:
//   · coronal: x_pantalla = −x, y_pantalla = −z   (la derecha del paciente queda a la izquierda, como en un atlas de resonancia)
//   · axial:   x_pantalla = −x, y_pantalla = −y   (vista desde los pies; delante arriba)
// RAS: +x derecha, +y delante, +z arriba, origen en la comisura anterior. El mundo del kit refleja x y eleva z (modelo/marco.mjs, `W`).
// No hace falta repetirlo salvo que cambie la geometría de alguna pieza: es lo único de la página que no se reconstruye con las cachés.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const take = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i < 0 ? fallback : argv.splice(i, 2)[1];
};
const H = Number(take("--paso", 1));
const only = take("--solo", null);

const { PIECES, NUCLEO_PROFUNDO } = await import("../modelo/piezas.mjs");
const { B } = await import("../modelo/prims.mjs");
const { LIFT } = await import("../modelo/marco.mjs");

const range = (from, to, step) => {
  const out = [];
  for (let v = from; step < 0 ? v >= to - 1e-9 : v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
};
const PLANOS = {
  coronal: { eje: "y", valores: range(70, -98, -8), u: [-75, 75], w: [-135, 85], pantalla: (x, y, z) => [-x, -z], viewBox: [-75, -85, 150, 220] },
  axial: { eje: "z", valores: range(72, -128, -8), u: [-75, 75], w: [-108, 85], pantalla: (x, y, z) => [-x, -y], viewBox: [-75, -85, 150, 193] },
};

const fields = PIECES.map((p) => ({ p, F: B.field(p.node, { name: p.name, L: p.L }) }));
// La sustancia blanca del hemisferio izquierdo no es una pieza (quedó hueca al quitar la cápsula interna), pero en una sección se ve el hueco.
// Como el visor solo muestrea, se rellena con una región «virtual»: dentro del núcleo profundo y a más de 0,5 mm de toda pieza (así las
// juntas de 0,8 mm entre piezas no se pintan como líneas). No entra en el orden de pintor ni en la auditoría: solo existe en las secciones.
const KERN = B.field(NUCLEO_PROFUNDO, { name: "sustancia-blanca" });
const MARGEN = 0.5;
// Límites de cada pieza en RAS (los del campo están en el mundo del kit).
const rasBox = ({ F }) => {
  const a = F.bounds.min;
  const b = F.bounds.max;
  return { x: [-b[0], -a[0]], y: [a[1], b[1]], z: [a[2] - LIFT, b[2] - LIFT] };
};
const boxes = fields.map(rasBox);
const blanca = { p: { name: "sustancia-blanca" }, F: { v: (wx, wy, wz) => {
  let m = KERN.v(wx, wy, wz);
  if (m >= 0) return m;
  for (let k = 0; k < fields.length; k++) {
    const b = boxes[k];
    const x = -wx;
    const z = wz - LIFT;
    if (x < b.x[0] - 1 || x > b.x[1] + 1 || wy < b.y[0] - 1 || wy > b.y[1] + 1 || z < b.z[0] - 1 || z > b.z[1] + 1) continue;
    if (fields[k].p.veil) continue;
    m = Math.max(m, MARGEN - fields[k].F.v(wx, wy, wz));
    if (m >= 0) return m;
  }
  return m;
} }, box: rasBox({ F: KERN }) };
const valor = (F, x, y, z) => F.v(-x, y, z + LIFT);

// Marching squares sobre una rejilla de valores (negativo = dentro). Devuelve lazos cerrados de puntos [i, j] fraccionarios.
function contornos(val, nu, nv) {
  const get = (i, j) => val[j * (nu + 1) + i];
  const ady = new Map();
  const punto = new Map();
  const unir = (k1, k2) => {
    (ady.get(k1) ?? ady.set(k1, []).get(k1)).push(k2);
    (ady.get(k2) ?? ady.set(k2, []).get(k2)).push(k1);
  };
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = get(i, j);
      const b = get(i + 1, j);
      const c = get(i + 1, j + 1);
      const d = get(i, j + 1);
      const caso = (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
      if (caso === 0 || caso === 15) continue;
      // Aristas: 0 abajo (i,j)-(i+1,j), 1 derecha (i+1,j)-(i+1,j+1), 2 arriba (i,j+1)-(i+1,j+1), 3 izquierda (i,j)-(i,j+1).
      const clave = [`h${i},${j}`, `v${i + 1},${j}`, `h${i},${j + 1}`, `v${i},${j}`];
      const t = (p, q) => p / (p - q);
      const coord = [
        () => [i + t(a, b), j],
        () => [i + 1, j + t(b, c)],
        () => [i + t(d, c), j + 1],
        () => [i, j + t(a, d)],
      ];
      const centro = (a + b + c + d) / 4 < 0;
      const pares = {
        1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]],
        5: centro ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]],
        6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]],
        10: centro ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]],
        11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]],
      }[caso];
      for (const [e1, e2] of pares) {
        if (!punto.has(clave[e1])) punto.set(clave[e1], coord[e1]());
        if (!punto.has(clave[e2])) punto.set(clave[e2], coord[e2]());
        unir(clave[e1], clave[e2]);
      }
    }
  const visto = new Set();
  const lazos = [];
  for (const inicio of ady.keys()) {
    if (visto.has(inicio)) continue;
    const lazo = [];
    let actual = inicio;
    let previo = null;
    while (actual && !visto.has(actual)) {
      visto.add(actual);
      lazo.push(punto.get(actual));
      const vecinos = ady.get(actual);
      const sig = vecinos.find((n) => n !== previo && !visto.has(n)) ?? null;
      previo = actual;
      actual = sig;
    }
    if (lazo.length >= 3) lazos.push(lazo);
  }
  return lazos;
}

// Douglas-Peucker sobre un lazo cerrado (se parte por el punto más lejano del primero).
function simplificar(lazo, tol) {
  const dist = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = dx * dx + dy * dy || 1e-12;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  const dp = (pts) => {
    if (pts.length < 3) return pts;
    let max = 0;
    let idx = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = dist(pts[i], pts[0], pts[pts.length - 1]);
      if (d > max) (max = d), (idx = i);
    }
    if (max <= tol) return [pts[0], pts[pts.length - 1]];
    return [...dp(pts.slice(0, idx + 1)).slice(0, -1), ...dp(pts.slice(idx))];
  };
  let far = 0;
  let fd = 0;
  for (let i = 1; i < lazo.length; i++) {
    const d = Math.hypot(lazo[i][0] - lazo[0][0], lazo[i][1] - lazo[0][1]);
    if (d > fd) (fd = d), (far = i);
  }
  const a = dp([...lazo.slice(0, far + 1)]);
  const b = dp([...lazo.slice(far), lazo[0]]);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const salida = { generado: new Date().toISOString().slice(0, 10), paso: H, planos: {} };
for (const [nombre, plano] of Object.entries(PLANOS)) {
  if (only && only !== nombre) continue;
  const t0 = Date.now();
  const cortes = [];
  for (const c of plano.valores) {
    const piezas = [];
    [...fields.map((f, k) => ({ ...f, k })), { ...blanca, k: -1 }].forEach(({ p, F, k }) => {
      const bx = k < 0 ? blanca.box : boxes[k];
      const eje = plano.eje;
      if (c < bx[eje][0] - 1 || c > bx[eje][1] + 1) return;
      // Rejilla sobre el plano, recortada a la caja de la pieza (con 2 celdas de margen para que los lazos se cierren).
      const ejes = eje === "y" ? ["x", "z"] : ["x", "y"];
      const lo = ejes.map((e, n) => Math.max(n === 0 ? plano.u[0] : plano.w[0], bx[e][0] - 2 * H));
      const hi = ejes.map((e, n) => Math.min(n === 0 ? plano.u[1] : plano.w[1], bx[e][1] + 2 * H));
      const nu = Math.ceil((hi[0] - lo[0]) / H);
      const nv = Math.ceil((hi[1] - lo[1]) / H);
      if (nu < 2 || nv < 2) return;
      const val = new Float32Array((nu + 1) * (nv + 1));
      let dentro = false;
      for (let j = 0; j <= nv; j++)
        for (let i = 0; i <= nu; i++) {
          const u = lo[0] + i * H;
          const w = lo[1] + j * H;
          const v = eje === "y" ? valor(F, u, c, w) : valor(F, u, w, c);
          val[j * (nu + 1) + i] = v;
          if (v < 0) dentro = true;
        }
      if (!dentro) return;
      const lazos = contornos(val, nu, nv).map((l) => simplificar(l.map(([i, j]) => [lo[0] + i * H, lo[1] + j * H]), 0.12));
      const d = lazos
        .filter((l) => l.length >= 3)
        .map((l) => {
          const pts = l.map(([u, w]) => {
            const [sx, sy] = eje === "y" ? plano.pantalla(u, c, w) : plano.pantalla(u, w, c);
            return `${Math.round(sx * 10) / 10} ${Math.round(sy * 10) / 10}`;
          });
          return `M${pts.join("L")}Z`;
        })
        .join("");
      if (d) piezas.push({ p: p.name, d });
    });
    cortes.push(piezas);
    console.log(`${nombre} ${plano.eje}=${c}: ${piezas.length} piezas, ${(piezas.reduce((s, q) => s + q.d.length, 0) / 1024).toFixed(1)} KB`);
  }
  salida.planos[nombre] = { eje: plano.eje, valores: plano.valores, viewBox: plano.viewBox, cortes };
  console.log(`${nombre}: ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
const file = join(HERE, "..", "modelo", "cortes.json");
writeFileSync(file, JSON.stringify(salida));
console.log(`escribí ${file}`);
