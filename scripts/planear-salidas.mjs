// Calcula el vector de despiece de cada pieza: la dirección libre más cercana a la preferida, y la distancia hasta que la
// pieza queda separada de todo lo demás más un tramo extra. Las piezas salen una tras otra en el orden de la lista; las
// que ya salieron están en su sitio final y las que faltan, en reposo.
//   node scripts/planear-salidas.mjs [--only a,b] [--extra 22] [--clear 6]
// Escribe modelo/salidas.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
process.env.SNC_NO_SALIDAS = "1"; // el plan parte del orden del dossier, no del anterior
const { B, Wd } = await import("../modelo/prims.mjs");
const { PIECES } = await import("../modelo/piezas.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "modelo", "salidas.json");
const argv = process.argv.slice(2);
const take = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i < 0 ? fallback : argv.splice(i, 2)[1];
};
const only = take("--only", null)?.split(",");
const EXTRA = Number(take("--extra", 22));
const CLEAR = Number(take("--clear", 6));
const SPREAD = Number(take("--spread", 7));
const SPACING = Number(take("--spacing", 4));
const STEP = Number(take("--step", 3));
const TMAX = Number(take("--tmax", 420));
// Margen con las demás piezas durante todo el camino (mm). Se probó 0,2 (exigir 0,2 mm de holgura) y bloquea todo: el campo de distancia es
// una cota que subestima la distancia real, así que las piezas contiguas (GAP = 0,8) ya parecen demasiado cerca. Con -0,45 pasan
// penetraciones finas (1,2 mm) entre muestras de 4 mm que luego halla la auditoría; esas se corrigen a mano en salidas.json.
const INSIDE = -0.45;

const saved = {};
const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return v.map((x) => x / l);
};
const fib = (n) => Array.from({ length: n }, (_, i) => {
  const z = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(1 - z * z);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return [r * Math.cos(a), r * Math.sin(a), z];
});
const DIRS = fib(400);

const items = PIECES.map((p) => {
  const F = B.field(p.node, { name: p.name });
  return { p, F, off: [0, 0, 0], samples: null };
});
const samplesOf = (it) => (it.samples ??= B.surfaceSamples(it.F, SPACING));
const box = (it, off) => ({ min: it.F.bounds.min.map((v, i) => v + off[i]), max: it.F.bounds.max.map((v, i) => v + off[i]) });
const overlap = (a, b, pad) => a.min.every((v, i) => v - pad <= b.max[i] && b.min[i] - pad <= a.max[i]);

// ¿Cuánto se hunde `it`, movida por `off`, en las demás? Devuelve el mínimo del campo ajeno (negativo = penetra).
function worst(it, off, others) {
  const bx = box(it, off);
  let m = Infinity;
  worst.by = null;
  for (const o of others) {
    const bo = box(o, o.off);
    if (!overlap(bx, bo, CLEAR + 4)) continue;
    // puntos de it dentro de o
    for (const s of samplesOf(it)) {
      const v = o.F.v(s[0] + off[0] - o.off[0], s[1] + off[1] - o.off[1], s[2] + off[2] - o.off[2]);
      if (v < m) m = v;
      if (m < INSIDE) return ((worst.by = o.p.name), m);
    }
    // puntos de o dentro de it
    for (const s of samplesOf(o)) {
      const v = it.F.v(s[0] + o.off[0] - off[0], s[1] + o.off[1] - off[1], s[2] + o.off[2] - off[2]);
      if (v < m) m = v;
      if (m < INSIDE) return ((worst.by = o.p.name), m);
    }
  }
  return m;
}

// Orden de extracción voraz: en cada paso sale la primera pieza de la lista (el orden del dossier) que tiene una dirección
// libre; las que están atrapadas esperan a que salgan las que las atrapan. Si ninguna puede salir, hay un bloqueo mutuo.
// Las membranas (meninges) salen primero, en la dirección preferida y sin comprobar choques: son translúcidas, y el casquete de la
// duramadre abraza al cerebro por debajo del ecuador, así que ninguna dirección estaría libre. Salen más lejos las más externas.
const veils = items.filter((it) => it.p.veil);
const remaining = items.filter((it) => !it.p.fixed && !it.p.veil);
const total = remaining.length;
const done = [];
const nameOrder = [];
veils.forEach((it, i) => {
  const dist = 70 + 20 * (veils.length - 1 - i);
  const off = unit(Wd(it.p.pref)).map((v) => v * dist);
  it.off = off;
  const ras = [-off[0], off[1], off[2]];
  saved[it.p.name] = { move: ras.map((v) => Math.round(v * 10) / 10), cos: 1, veil: true };
  console.log(`${String(done.length + 1).padStart(2)}. ${it.p.name}: ${saved[it.p.name].move.join(", ")}  (membrana, sin comprobar choques)`);
  done.push(it);
  nameOrder.push(it.p.name);
});
const tryPiece = (it, ndirs, extra) => {
  const others = items.filter((o) => o !== it && !o.p.veil); // las membranas translúcidas no son obstáculo
  const pref = unit(Wd(it.p.pref));
  const cands = DIRS.map((d) => ({ d, a: d[0] * pref[0] + d[1] * pref[1] + d[2] * pref[2] })).sort((x, y) => y.a - x.a);
  const blockers = {};
  let tried = 0;
  for (const { d, a } of cands.slice(0, ndirs)) {
    tried++;
    let ok = true;
    let tClear = null;
    for (let t = STEP; t <= TMAX; t += STEP) {
      const off = d.map((v) => v * t);
      const m = worst(it, off, others);
      if (m < INSIDE) {
        ok = false;
        blockers[worst.by] = (blockers[worst.by] ?? 0) + 1;
        break;
      }
      if (m > CLEAR) {
        tClear = t;
        break;
      }
    }
    if (ok && tClear !== null) {
      // El tramo extra también tiene que estar libre: las piezas que ya salieron están en su sitio final.
      const D = tClear + extra;
      for (let t = tClear + STEP; t <= D && ok; t += STEP) if (worst(it, d.map((v) => v * t), others) < INSIDE) ok = false;
      if (ok) return { found: { d, a, D }, tried };
      blockers.camino = (blockers.camino ?? 0) + 1;
    }
  }
  return { found: null, tried, blockers };
};
while (remaining.length) {
  let moved = false;
  const extra = EXTRA + SPREAD * (total - 1 - (done.length - veils.length)); // las membranas no cuentan como piezas salidas
  for (const it of remaining) {
    const { found, tried } = tryPiece(it, done.length ? 70 : 160, extra);
    if (!found) continue;
    const off = found.d.map((v) => v * found.D);
    it.off = off;
    const ras = [-off[0], off[1], off[2]];
    saved[it.p.name] = { move: ras.map((v) => Math.round(v * 10) / 10), cos: Math.round(found.a * 100) / 100 };
    console.log(`${String(done.length + 1).padStart(2)}. ${it.p.name}: ${saved[it.p.name].move.join(", ")}  (coseno ${saved[it.p.name].cos}, ${tried} direcciones)`);
    remaining.splice(remaining.indexOf(it), 1);
    done.push(it);
    nameOrder.push(it.p.name);
    moved = true;
    break;
  }
  if (!moved) {
    console.log("BLOQUEO: ninguna de las piezas restantes tiene salida libre:");
    for (const it of remaining) console.log(`   ${it.p.name}: bloquean ${JSON.stringify(tryPiece(it, 160, 0).blockers)}`);
    break;
  }
}
saved._orden = nameOrder;
writeFileSync(OUT, JSON.stringify(saved, null, 1) + "\n");
console.log(`escribí ${OUT}`);
