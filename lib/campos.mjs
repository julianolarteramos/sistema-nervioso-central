// Campos auxiliares para piezas desmontables (cortadores), en coordenadas del mundo del kit.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync, gzipSync } from "node:zlib";
import { kit } from "../kit.mjs";

const GRIDS = process.env.SNC_GRIDS ?? join(dirname(fileURLToPath(import.meta.url)), "..", ".cache", "grids");
// Los valores se guardan cuantizados (0,1 mm entre −12,8 y 12,8): un cortador solo necesita el signo y la cercanía a cero.
const QMIN = -12.8;
const QS = 0.1;

const B = await kit("blob.mjs");

// Un nodo caro envuelto en su esfera: lejos de ella devuelve la distancia a la esfera, que es una cota inferior de la
// distancia a la pieza (sigue siendo 1-Lipschitz); cerca, el campo exacto. Sirve para cortadores (surcos, asientos).
export function culled(node, { margin = 3 } = {}) {
  const F = B.field(node);
  const c = F.bounds.min.map((v, i) => (v + F.bounds.max[i]) / 2);
  const r = Math.hypot(...F.bounds.max.map((v, i) => (v - F.bounds.min[i]) / 2));
  return B.custom(
    (p) => {
      const d = Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - r;
      // Continuo y 1-Lipschitz: lejos, la esfera; cerca, el campo, acotado para que empalme en d = margin.
      return d >= margin ? d : Math.max(d, Math.min(F.v(p[0], p[1], p[2]), 2 * margin - d));
    },
    { bounds: F.bounds, L: 1, tag: `culled:${margin}:${nodeKey(node)}` },
  );
}

// Barrido de una pieza: los puntos p desde los que, al avanzar en la dirección `dir` (mundo), se toca la pieza. Es el
// asiento que hay que quitarle a la pieza que sale en esa dirección para que no roce nunca a la otra durante el
// despiece. Campo = mínimo del campo de la pieza a lo largo de la semirrecta (sigue siendo 1-Lipschitz). Se hornea en
// una rejilla alineada con `dir`, de `h` mm, recorriendo cada línea desde el final: g[k] = min(f(p_k), g[k+1]); fuera
// de la rejilla devuelve cotas inferiores. `over` es la caja (mundo) donde hace falta: la de la pieza que se talla.
// Con `length` finito el barrido es un segmento (de 0 a length en la dirección), con un mínimo de ventana deslizante.
export function sweep(node, dir, over, { h = 0.6, length = Infinity } = {}) {
  const F = B.field(node);
  const e3 = dir.map((v, i, a) => v / Math.hypot(...a));
  const helper = Math.abs(e3[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (v) => v.map((x) => x / Math.hypot(...v));
  const e1 = norm(cross(helper, e3));
  const e2 = cross(e3, e1);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cornersOf = (bx) => [bx.min[0], bx.max[0]].flatMap((x) => [bx.min[1], bx.max[1]].flatMap((y) => [bx.min[2], bx.max[2]].map((z) => [x, y, z])));
  const range = (pts, e) => [Math.min(...pts.map((p) => dot(p, e))), Math.max(...pts.map((p) => dot(p, e)))];
  const nb = cornersOf(F.bounds);
  const ob = cornersOf(over);
  const pad = 3;
  // La sección de la rejilla es la de `over` (donde se va a evaluar), no la de la pieza: así un barrido encadenado sobre un
  // campo con caja enorme (la de otro barrido) no hornea una rejilla del tamaño de esa caja.
  const [a1, b1] = range(ob, e1).map((v, i) => v + (i ? pad : -pad));
  const [a2, b2] = range(ob, e2).map((v, i) => v + (i ? pad : -pad));
  const finite = Number.isFinite(length);
  const a3 = (finite ? range(ob, e3)[0] : Math.min(range(ob, e3)[0], range(nb, e3)[0])) - pad;
  const b3 = (finite ? range(ob, e3)[1] + length : range(nb, e3)[1]) + pad;

  const n1 = Math.ceil((b1 - a1) / h) + 1;
  const n2 = Math.ceil((b2 - a2) / h) + 1;
  const n3 = Math.ceil((b3 - a3) / h) + 1;
  const r = (v) => Math.round(v * 100) / 100;
  const tag = JSON.stringify({ sweep: dir.map(r), h, length: finite ? r(length) : 0, over: [...over.min, ...over.max].map(r), of: nodeKey(node) });
  const file = join(GRIDS, `${createHash("sha1").update(tag).digest("hex")}.bin.gz`);
  let grid = null;
  const bake = () => {
    if (existsSync(file)) {
      grid = new Uint8Array(gunzipSync(readFileSync(file)));
      if (grid.length === n1 * n2 * n3) return;
    }
    if (process.env.SNC_DEBUG) console.error("bake", n1, n2, n3, ((n1 * n2 * n3) / 1e6).toFixed(1), "M cells", length);
    // Cota ajustada de la pieza: los puntos interiores de una malla de 3 mm (la caja de las hojas es mucho más holgada).
      const inside = [];
      {
        const { min, max } = F.bounds;
        for (let x = min[0]; x <= max[0]; x += 3) for (let y = min[1]; y <= max[1]; y += 3) for (let z = min[2]; z <= max[2]; z += 3) if (F.v(x, y, z) < 1.5) inside.push([x, y, z]);
      }
      const tight = inside.length ? inside : nb;
      const nr1 = range(tight, e1);
      const nr2 = range(tight, e2);
      const nr3 = range(tight, e3);
    grid = new Uint8Array(n1 * n2 * n3);
    const put = (idx, v) => (grid[idx] = Math.max(0, Math.min(255, Math.round((v - QMIN) / QS))));
    const line = new Float64Array(n3);
    const queue = new Int32Array(n3);
    for (let i = 0; i < n1; i++)
      for (let j = 0; j < n2; j++) {
        let g = Infinity;
        const u1 = a1 + i * h;
        const u2 = a2 + j * h;
        const bx = e1[0] * u1 + e2[0] * u2;
        const by = e1[1] * u1 + e2[1] * u2;
        const bz = e1[2] * u1 + e2[2] * u2;
        const base = (i * n2 + j) * n3;
        if (!Number.isFinite(length)) {
          // Solo se evalúa donde la pieza puede estar a menos de 14 mm; fuera, el valor satura en «lejos».
          if (u1 < nr1[0] - 14 || u1 > nr1[1] + 14 || u2 < nr2[0] - 14 || u2 > nr2[1] + 14) {
            for (let k = 0; k < n3; k++) grid[base + k] = 255;
            continue;
          }
          const kHi = Math.min(n3 - 1, Math.ceil((nr3[1] + 14 - a3) / h));
          const kLo = Math.max(0, Math.floor((nr3[0] - 14 - a3) / h));
          for (let k = n3 - 1; k > kHi; k--) grid[base + k] = 255;
          for (let k = kHi; k >= kLo; k--) {
            const u3 = a3 + k * h;
            const v = F.v(bx + e3[0] * u3, by + e3[1] * u3, bz + e3[2] * u3);
            if (v < g) g = v;
            put(base + k, g);
          }
          for (let k = kLo - 1; k >= 0; k--) put(base + k, g);
          continue;
        }
        // Ventana [k, k + W]: cola monótona de índices con valores crecientes.
        const W = Math.ceil(length / h);
        for (let k = 0; k < n3; k++) {
          const u3 = a3 + k * h;
          line[k] = F.v(bx + e3[0] * u3, by + e3[1] * u3, bz + e3[2] * u3);
        }
        let head = 0;
        let tail = 0;
        for (let k = n3 - 1; k >= 0; k--) {
          while (tail > head && line[queue[tail - 1]] >= line[k]) tail--;
          queue[tail++] = k;
          while (queue[head] > k + W) head++;
          put(base + k, line[queue[head]]);
        }
      }
    mkdirSync(GRIDS, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileSync(tmp, gzipSync(grid, { level: 1 }));
    renameSync(tmp, file);
  };
  const f = (p) => {
    const u1 = dot(p, e1);
    const u2 = dot(p, e2);
    const u3 = dot(p, e3);
    if (u3 >= b3 - h) return F.v(p[0], p[1], p[2]);
    if (!grid) bake();
    // Fuera de la rejilla: el valor del borde menos la distancia al borde (cota inferior continua y 1-Lipschitz), y
    // nunca menos que el margen sin pieza que rodea la rejilla.
    const c1 = Math.min(b1, Math.max(a1, u1));
    const c2 = Math.min(b2, Math.max(a2, u2));
    const c3 = Math.max(a3, u3);
    const e = Math.hypot(u1 - c1, u2 - c2, u3 - c3);
    const x = (c1 - a1) / h;
    const y = (c2 - a2) / h;
    const z = (c3 - a3) / h;
    const i = Math.min(n1 - 2, Math.floor(x));
    const j = Math.min(n2 - 2, Math.floor(y));
    const k = Math.min(n3 - 2, Math.floor(z));
    const fx = x - i;
    const fy = y - j;
    const fz = Math.min(1, z - k);
    const at = (di, dj, dk) => grid[((i + di) * n2 + j + dj) * n3 + k + dk] * QS + QMIN;
    const c00 = at(0, 0, 0) * (1 - fx) + at(1, 0, 0) * fx;
    const c10 = at(0, 1, 0) * (1 - fx) + at(1, 1, 0) * fx;
    const c01 = at(0, 0, 1) * (1 - fx) + at(1, 0, 1) * fx;
    const c11 = at(0, 1, 1) * (1 - fx) + at(1, 1, 1) * fx;
    const g = (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
    if (!(e > 0)) return g;
    const side = Math.hypot(u1 - c1, u2 - c2);
    return side > 0 ? Math.max(g - e, Math.min(g, pad) + side) : g - e;
  };
  // La caja del barrido (no la de la pieza): el pintado descarta los cortadores cuyo volumen no cruza el rayo.
  const frameCorners = [a1, b1].flatMap((u1) => [a2, b2].flatMap((u2) => [a3, b3].map((u3) => [0, 1, 2].map((i) => e1[i] * u1 + e2[i] * u2 + e3[i] * u3))));
  const bounds = { min: [0, 1, 2].map((i) => Math.min(...frameCorners.map((c) => c[i]))), max: [0, 1, 2].map((i) => Math.max(...frameCorners.map((c) => c[i]))) };
  // La interpolación trilineal puede tener pendiente hasta √3: se escala el valor por 1/1,75, que conserva el conjunto
  // de nivel cero (lo único que importa a un cortador) y deja el campo 1-Lipschitz.
  return B.custom((p) => f(p) / 1.75, { bounds, L: 1, tag });
}


// Clave de un nodo para la caché del pintado. Los campos propios (`custom`) que traen `tag` (los barridos y los recortes con
// esfera) se identifican por él, sin evaluarlos; los demás se muestrean en 48 puntos para que un cambio dentro de una
// clausura también invalide la caché.
export function nodeKey(node) {
  const samples = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return n;
    if (n.op === "custom" && !n.tag) {
      const { min, max } = n.bounds ?? { min: [-50, -50, -50], max: [50, 50, 50] };
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      for (let i = 0; i < 48; i++) samples.push(n.f([0, 1, 2].map((j) => min[j] + (max[j] - min[j]) * rnd())).toFixed(4));
    }
    if (n.of) n.of.forEach(walk);
  };
  walk(node);
  return JSON.stringify(node, (key, value) => (typeof value === "function" ? value.toString() : value)) + samples.join(",");
}

// Casco a lo largo de x de un nodo: lo que queda entre dos partes suyas en una misma recta paralela a x. Rellena los huecos
// de la línea media (entre los colículos, entre los pulvinares) para que ninguna pieza vecina quede atrapada en ellos al
// salir hacia un lado. Devuelve el nodo unido al casco.
export function xhull(node, mat) {
  const over = B.field(node).bounds;
  const fp = sweep(node, [1, 0, 0], over, { h: 0.8 });
  const fm = sweep(node, [-1, 0, 0], over, { h: 0.8 });
  const hull = B.custom((p) => Math.max(fp.f(p), fm.f(p)), { bounds: over, L: 1, mat, tag: `xhull:${fp.tag}:${fm.tag}` });
  return B.union(node, hull);
}

// Hornea un nodo caro (una unión de varias piezas engrosadas, por ejemplo) en una rejilla de `h` mm sobre la caja `over`, con
// caché en disco. Sirve de cortador barato: una sola consulta trilineal en lugar de evaluar cada pieza. Fuera de la caja
// devuelve «lejos». Igual que los barridos, se escala por 1/1,75 para seguir siendo 1-Lipschitz; el conjunto de nivel cero
// (lo único que importa a un cortador) no cambia.
export function bakeField(node, over, { h = 0.8, pad = 4 } = {}) {
  const lo = over.min.map((v) => v - pad);
  const hi = over.max.map((v) => v + pad);
  const n = lo.map((v, i) => Math.ceil((hi[i] - v) / h) + 1);
  const r = (v) => Math.round(v * 100) / 100;
  const tag = JSON.stringify({ bake: 1, h, lo: lo.map(r), hi: hi.map(r), of: nodeKey(node) });
  const file = join(GRIDS, `${createHash("sha1").update(tag).digest("hex")}.bin.gz`);
  let grid = null;
  const bake = () => {
    if (existsSync(file)) {
      grid = new Uint8Array(gunzipSync(readFileSync(file)));
      if (grid.length === n[0] * n[1] * n[2]) return;
    }
    const F = B.field(node);
    if (process.env.SNC_DEBUG) console.error("bakeField", n, ((n[0] * n[1] * n[2]) / 1e6).toFixed(1), "M celdas");
    grid = new Uint8Array(n[0] * n[1] * n[2]);
    for (let i = 0; i < n[0]; i++)
      for (let j = 0; j < n[1]; j++)
        for (let k = 0; k < n[2]; k++) {
          const v = F.v(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
          grid[(i * n[1] + j) * n[2] + k] = Math.max(0, Math.min(255, Math.round((v - QMIN) / QS)));
        }
    mkdirSync(GRIDS, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    writeFileSync(tmp, gzipSync(grid, { level: 1 }));
    renameSync(tmp, file);
  };
  const f = (p) => {
    if (!grid) bake();
    const cx = Math.min(hi[0], Math.max(lo[0], p[0]));
    const cy = Math.min(hi[1], Math.max(lo[1], p[1]));
    const cz = Math.min(hi[2], Math.max(lo[2], p[2]));
    const e = Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz);
    const x = (cx - lo[0]) / h;
    const y = (cy - lo[1]) / h;
    const z = (cz - lo[2]) / h;
    const i = Math.min(n[0] - 2, Math.floor(x));
    const j = Math.min(n[1] - 2, Math.floor(y));
    const k = Math.min(n[2] - 2, Math.floor(z));
    const fx = x - i;
    const fy = y - j;
    const fz = z - k;
    const at = (di, dj, dk) => grid[((i + di) * n[1] + j + dj) * n[2] + k + dk] * QS + QMIN;
    const c00 = at(0, 0, 0) * (1 - fx) + at(1, 0, 0) * fx;
    const c10 = at(0, 1, 0) * (1 - fx) + at(1, 1, 0) * fx;
    const c01 = at(0, 0, 1) * (1 - fx) + at(1, 0, 1) * fx;
    const c11 = at(0, 1, 1) * (1 - fx) + at(1, 1, 1) * fx;
    const val = (c00 * (1 - fy) + c10 * fy) * (1 - fz) + (c01 * (1 - fy) + c11 * fy) * fz;
    // Fuera de la caja: el valor del borde más la distancia al borde (continuo y 1-Lipschitz).
    return e > 0 ? val + e : val;
  };
  return B.custom((p) => f(p) / 1.75, { bounds: { min: lo, max: hi }, L: 1, tag });
}
