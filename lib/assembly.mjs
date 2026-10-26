// Ensamblaje desmontable sobre el kit de specimen: cada pieza es un campo propio, pintado completo y aislado.
// Por vista: se pintan las piezas (en paralelo, un proceso por pieza y vista, con caché), se registran con la
// auditoría, se resuelve el orden de pintor en todos los estados del deslizador de despiece (A.settle) y se emite
// cada pieza como <g class="pz" data-part data-k data-l data-mx data-my>.
// No toca el repo de specimen: lo importa a través de kit.mjs.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { cpus, freemem, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { kit } from "../kit.mjs";
import { sweep, nodeKey } from "./campos.mjs";

const k = await kit("iso-kit.mjs");
const G = await kit("lathe.mjs");
const B = await kit("blob.mjs");
const A = await kit("audit.mjs");

export { k, G, B, A };

// ---- Despiece: una sola fuente para la página y la auditoría ------------------------------------------------------
// El deslizador va de 0 (armado) a 1 (desmontado). Cada pieza sale en su tramo [a, b] del deslizador, con una
// rampa suave; así sale primero lo de afuera.
export const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
// stage = [desde, hasta, salto]: la pieza sale entre `desde` y `hasta` del deslizador. `salto` (fracción del recorrido, 0
// por defecto) es el desasiento: al pasar `desde` la pieza se despega de golpe esa fracción y sigue con una rampa suave.
// Un despegue gradual desde cero deja un par de fotogramas en que las piezas casi a ras se ordenan por diferencias de
// décimas de milímetro, y ahí el orden de pintor no es verificable.
export const shareAt = (stage, s) => (s <= stage[0] ? 0 : stage[1] <= stage[0] ? (s >= stage[1] ? 1 : 0) : (stage[2] ?? 0) + (1 - (stage[2] ?? 0)) * smooth((s - stage[0]) / (stage[1] - stage[0])));
export const SHARE_SRC = `const smooth=(t)=>(t<=0?0:t>=1?1:t*t*(3-2*t));const shareAt=(st,s)=>(s<=st[0]?0:st[1]<=st[0]?(s>=st[1]?1:0):(st[2]??0)+(1-(st[2]??0))*smooth((s-st[0])/(st[1]-st[0])));`;

// Estados del deslizador que se auditan: el reposo, cada pieza recién despegada (tras el salto), a mitad de su recorrido y
// al llegar, y el despiece completo. Con las piezas saliendo una tras otra bastan para ver todas las posiciones relativas.
export function statesFor(pieces) {
  const at = new Set([0, 1]);
  for (const p of pieces) {
    if (!p.stage || p.stage[1] <= p.stage[0]) continue;
    const [a, b] = p.stage;
    for (const s of [a + 1e-4, a + (b - a) * 0.5, b]) at.add(Math.round(Math.min(1, s) * 10000) / 10000);
  }
  const list = [...at].sort((x, y) => x - y).filter((s) => s > 0 && s < 1);
  return list.map((s) => ({ label: `despiece ${s}`, shares: Object.fromEntries(pieces.map((p) => [p.name, shareAt(p.stage, s)])) }));
}
export function sliderStates(pieces, { step = 0.02 } = {}) {
  const out = [];
  for (let i = 1; i * step < 1 - 1e-9; i++) {
    const s = Math.round(i * step * 1000) / 1000;
    out.push({ label: `despiece ${s}`, shares: Object.fromEntries(pieces.map((p) => [p.name, shareAt(p.stage, s)])) });
  }
  return out;
}

// ---- Caché del pintado ----------------------------------------------------------------------------------------------
// La clave incluye el nodo (con el código de cada campo propio, y una huella de sus valores si no trae `tag`), las
// opciones de pintado y la proyección.
const hashOf = (...parts) => createHash("sha1").update(parts.join("\u0001")).digest("hex");

// ---- Proyección por vista -------------------------------------------------------------------------------------------
function boundsOfAll(pieces, offset = 0) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of pieces) {
    const F = B.field(p.node);
    if (!F.bounds) continue;
    for (const share of offset ? [0, 1] : [0]) {
      const m = G.mul3(p.moveW, share);
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], F.bounds.min[i] + m[i]);
        max[i] = Math.max(max[i], F.bounds.max[i] + m[i]);
      }
    }
  }
  return { min, max };
}
const corners = ({ min, max }) => [min[0], max[0]].flatMap((x) => [min[1], max[1]].flatMap((y) => [min[2], max[2]].map((z) => [x, y, z])));
function screenBox(points, P) {
  const flat = points.map((p) => k.iso(p, P));
  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

export function projectionOf(spec, view) {
  const { plinth } = spec.mount;
  const plinthBox = { min: [-plinth.r, -plinth.r, 0], max: [plinth.r, plinth.r, plinth.h] };
  const rest = boundsOfAll(spec.pieces);
  const pts = [...corners(rest), ...(view.base === false ? [] : corners(plinthBox))];
  const P = k.fitProjection(pts, spec.width, spec.height, { pad: spec.pad ?? 24, azimuth: view.azimuth, elevation: view.elevation ?? 24 });
  return P;
}

// ---- Soporte: peana torneada, collar y varilla que entra en la pieza `on` ------------------------------------------
function mountItems(R, P, spec, fields) {
  const { plinth, post, on } = spec.mount;
  const at = (p) => k.iso(p, P);
  const Fz = G.frameOf([0, 0, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const top = plinth.h;
  const profile = [[0, plinth.r], [1.6, plinth.r], [2.8, plinth.r - 1.4], [top - 1.6, plinth.r - 2.6], [top, plinth.r - 4.4]];
  const ringR = plinth.r - 9;
  const screws = [0, 1, 2, 3].map((i) => G.pointOf(Fz, top, ringR, Math.PI / 4 + (i * Math.PI) / 2));
  const engraving = k.lineSvg(G.circleOf(Fz, top, ringR - 3, P, 96), { tone: "faint" }) + screws.map((p) => k.lineSvg(k.ring(p[0], p[1], 1.6, top, P, 18), { tone: "lo" })).join("") + k.dotsSvg(screws.map(at), { size: 0.5 });
  R.put({ name: "stand.plinth", at: [0, 0, top / 2], svg: `<path class="iso-halo" d="${k.haloOf({ x: -plinth.r, y: -plinth.r, w: 2 * plinth.r, d: 2 * plinth.r, r: plinth.r }, 0, top, P)}"/>` + k.solidSvg(G.solidOf(profile, Fz, P, { bevel: 0.6, steps: 72 }), { tone: "mid" }) + engraving, shapes: [R.solid(A.solid(Fz, profile, { name: "stand.plinth", ground: true }))] });
  const [px, py] = post.at;
  const collar = G.frameOf([px, py, top], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const collarProfile = [[0, post.r + 4.3], [2.2, post.r + 4.3], [3, post.r + 3.4], [3.6, post.r + 2]];
  R.put({ name: "stand.collar", at: [px, py, top + 1.8], svg: k.solidSvg(G.solidOf(collarProfile, collar, P), { tone: "mid", inner: k.lineSvg(G.arcOf(collar, 2.2, post.r + 4.3, P), { tone: "faint" }) }), shapes: [R.solid(A.solid(collar, collarProfile, { name: "stand.collar" }))] });
  const host = fields[on];
  let z = top;
  while (host.value([px, py, z]) >= 0 && z < 600) z += 0.05;
  const length = z + (post.sink ?? 5) - top - 3.6;
  const postFrame = G.frameOf([px, py, top + 3.6], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  R.put({ name: "stand.post", at: [px, py, top + 3.6 + length / 3], svg: k.solidSvg(G.disc(0, length, post.r, postFrame, P), { tone: "mid" }), shapes: [R.solid(A.disc(postFrame, 0, length, post.r, { name: "stand.post", blend: [on] }))] });
}

// ---- Piezas trabadas: corte por un plano que contiene el eje de la otra pieza ------------------------------------
// Una pieza que envuelve a otra (el hemisferio alrededor del tronco) queda delante y detrás de ella a la vez. Se parte
// con B.split por un plano que contiene el eje largo de la pieza envuelta y que mira hacia la cámara tanto como se
// puede: la parte cercana queda delante de ella y la lejana detrás, y la cara de corte de la parte cercana mira lejos de
// la cámara (craft I.8). Las subpiezas comparten data-part, se mueven y se ocultan juntas, y la costura no lleva borde.
// split: [{ axis: [a, b] }] con a y b en coordenadas del mundo, o una función (vista) → esa lista.
export function subNodes(spec, view, piece) {
  const planned = spec.splits?.[view.key]?.[piece.name];
  const cuts = planned ?? (typeof piece.split === "function" ? piece.split(view) : piece.split);
  if (!cuts || !cuts.length) return [{ id: piece.name, node: piece.node, behind: 0 }];
  const V = A.cameraBasis(projectionOf(spec, view)).V;
  let nodes = [{ node: piece.node, behind: 0 }];
  for (const cut of cuts) {
    if (cut.shadow) {
      // Lo que queda detrás de las piezas nombradas: su sombra a lo largo de la mirada, en reposo. Lo demás solo puede
      // quedar delante de ellas. Cada pieza nombrada es un corte aparte (cuatro trozos con dos), y los trozos «detrás»
      // salen con una clave de pintor inicial muy baja para que el orden solo tenga que subir lo que va delante.
      nodes = nodes.flatMap(({ node, behind }) => {
        const over = B.field(node).bounds;
        const parts = cut.shadow.map((name) => sweep(spec.pieces.find((p) => p.name === name).node, V, over, { h: cut.h ?? 0.6 }));
        const margin = cut.margin ?? Number(process.env.SNC_MARGIN ?? 0.25);
        const tagBase = JSON.stringify({ shadow: parts.map((S) => S.tag), margin });
        const fns = parts.map((S) => S.f);
        const f = fns.length === 1 ? (p) => fns[0](p) - margin : (p) => { let m = Infinity; for (const g of fns) { const v = g(p); if (v < m) m = v; } return m - margin; };
        return [
          { node: B.carve(node, B.custom((p) => -f(p), { bounds: over, L: 1, seam: true, tag: `${tagBase}:neg` }), 0), behind: behind + 1 },
          { node: B.carve(node, B.custom(f, { bounds: over, L: 1, seam: true, tag: `${tagBase}:pos` }), 0), behind },
        ];
      });
      continue;
    }
    const [a, b] = cut.axis;
    const ax = G.unit3(G.sub3(b, a));
    const n = G.unit3(G.sub3(V, G.mul3(ax, G.dot3(V, ax))));
    const c = G.mul3(G.add3(a, b), 0.5);
    nodes = nodes.flatMap(({ node, behind }) => B.split(node, [G.sub3(c, n), G.add3(c, n)]).map((x, i) => ({ node: x, behind: behind + (i === 0 ? 1 : 0) })));
  }
  return nodes.map(({ node, behind }, i) => ({ id: `${piece.name}:${i}`, node, behind }));
}

// ---- Plan de cortes por vista ----------------------------------------------------------------------------------------
// Para cada vista se buscan, con las piezas en reposo y enteras, los pares que se ordenan en los dos sentidos a la vez (uno
// envuelve al otro). A la pieza más grande de cada par se le añade un corte por la sombra de la otra, y se repite hasta
// que no queden pares así (o hasta `rounds` vueltas). El resultado se guarda por vista en la caché.
// Convexidad: de pares de puntos interiores al azar, la fracción cuyo punto medio también es interior (1 = convexa). Envuelve a
// la otra la menos convexa. Se muestrea en la caja de la pieza, que puede ser holgada.
function convexityOf(F) {
  const { min, max } = F.bounds;
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const pts = [];
  for (let i = 0; i < 120000 && pts.length < 400; i++) {
    const p = [min[0] + (max[0] - min[0]) * rnd(), min[1] + (max[1] - min[1]) * rnd(), min[2] + (max[2] - min[2]) * rnd()];
    if (F.v(p[0], p[1], p[2]) < 0) pts.push(p);
  }
  if (pts.length < 20) return 1;
  let ok = 0;
  const n = 1500;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.floor(rnd() * pts.length)];
    const b = pts[Math.floor(rnd() * pts.length)];
    if (F.v((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2) < 0) ok++;
  }
  return ok / n;
}
const cutsOf = (list) => Object.fromEntries(Object.entries(list).map(([name, blockers]) => [name, blockers.map((b) => ({ shadow: [b] }))]));

// Área mayor en que a y b se ordenan en los dos sentidos a la vez, con solo esas dos piezas en escena.
function pairCycle(spec, view, P, splits, a, b, step) {
  const R = A.recorder(P);
  const sp = { ...spec, splits: { [view.key]: cutsOf(splits) } };
  for (const p of spec.pieces.filter((q) => q.name === a || q.name === b))
    for (const sub of subNodes(sp, view, p)) {
      const F = B.field(sub.node, { name: sub.id });
      R.put({ name: sub.id, piece: p.name, at: G.mul3(G.add3(F.bounds.min, F.bounds.max), 0.5), bias: -400 * sub.behind, svg: "", shapes: [R.solid(A.field(F, { name: sub.id }))] });
    }
  const ov = A.overlapsOf(R.items, P, { states: [0], step, skip: (x, y) => x.piece === y.piece });
  let worst = 0;
  for (const pr of ov.pairs) if (pr.front[0].area >= ov.least && pr.front[1].area >= ov.least) worst = Math.max(worst, Math.min(pr.front[0].area, pr.front[1].area));
  return worst;
}

export function planSplits(spec, view, { rounds = 4, step = 1, maxCuts = 4 } = {}) {
  const P = projectionOf(spec, view);
  const splits = {};
  const sol = Object.fromEntries(spec.pieces.map((p) => [p.name, convexityOf(B.field(p.node))]));
  const log = [`convexidad: ${Object.entries(sol).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(", ")}`];
  for (let round = 0; round < rounds; round++) {
    const R = A.recorder(P);
    const sp = { ...spec, splits: { [view.key]: cutsOf(splits) } };
    for (const p of spec.pieces.filter((q) => !q.veil))
      for (const sub of subNodes(sp, view, p)) {
        const F = B.field(sub.node, { name: sub.id });
        const centre = G.mul3(G.add3(F.bounds.min, F.bounds.max), 0.5);
        R.put({ name: sub.id, piece: p.name, at: centre, bias: -400 * sub.behind, move: p.moveW, svg: "", shapes: [R.solid(A.field(F, { name: sub.id }))] });
      }
    const t0 = Date.now();
    if (process.env.SNC_DEBUG) console.error(`plan: ronda ${round}, ${R.items.length} trozos, rasterizando…`);
    const ov = A.overlapsOf(R.items, P, { states: [0, ...statesFor(spec.pieces)], step, skip: (a, b) => a.piece === b.piece });
    if (process.env.SNC_DEBUG) console.error(`plan: ronda ${round} solapes en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    const cycles = new Map();
    for (const pr of ov.pairs) {
      if (pr.front[0].area < ov.least || pr.front[1].area < ov.least) continue;
      const a = R.items[pr.a].piece;
      const b = R.items[pr.b].piece;
      const key = [a, b].sort().join("|");
      const area = Math.min(pr.front[0].area, pr.front[1].area);
      cycles.set(key, { a, b, area: Math.max(area, cycles.get(key)?.area ?? 0) });
    }
    // Ciclos de más de dos piezas (A delante de B delante de C delante de A): cada par es coherente por separado y solo se ven
    // cuando el ordenamiento tiene que descartar una regla. Se tratan como un par más: se corta una de las dos piezas de la regla.
    {
      const found = cycles.size;
      const dropped = A.orderKeys(R.items, ov).dropped ?? [];
      for (const rule of dropped) {
        const a = R.items[rule.front]?.piece;
        const b = R.items[rule.back]?.piece;
        if (!a || !b || a === b) continue;
        const key = [a, b].sort().join("|");
        if (!cycles.has(key)) cycles.set(key, { a, b, area: 1 });
      }
      if (cycles.size > found) log.push(`  ciclos de más de dos piezas: ${[...cycles.keys()].slice(found).join(", ")}`);
    }
    log.push(`ronda ${round}: ${R.items.length} trozos, ${ov.pairs.length} solapes, ${cycles.size} pares trabados (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    if (!cycles.size) break;
    let changed = false;
    for (const { a, b, area } of cycles.values()) {
      // Se prueba cortar a por la sombra de b, luego b por la de a, y si ninguna basta, las dos; gana la primera que deja el
      // par sin ordenamiento doble (con solo esas dos piezas en escena).
      const have = (n, o) => (splits[n] ?? []).includes(o) || (splits[n] ?? []).length >= maxCuts;
      const tries = [[[a, b]], [[b, a]], [[a, b], [b, a]]].filter((t) => t.every(([n, o]) => !have(n, o)));
      const tp = Date.now();
      let chosen = null;
      for (const t of tries) {
        const trial = Object.fromEntries(Object.entries(splits).map(([k, v]) => [k, [...v]]));
        for (const [n, o] of t) (trial[n] ??= []).push(o);
        const left = pairCycle(spec, view, P, trial, a, b, step);
        if (left < 0.25) {
          chosen = t;
          break;
        }
      }
      chosen ??= tries.at(-1) ?? null;
      if (process.env.SNC_DEBUG) console.error(`plan:   par ${a}|${b} resuelto en ${((Date.now() - tp) / 1000).toFixed(0)} s`);
      if (!chosen) {
        log.push(`  sin corte posible para ${a} y ${b} (${area.toFixed(1)} px²)`);
        continue;
      }
      for (const [n, o] of chosen) (splits[n] ??= []).push(o);
      changed = true;
      log.push(`  ${chosen.map(([n, o]) => `${n} se parte por la sombra de ${o}`).join(" y ")} (${area.toFixed(1)} px²)`);
    }
    // Si en esta ronda no se pudo añadir ningún corte, la siguiente rasterizaría lo mismo: se corta aquí.
    if (!changed) break;
  }
  return { splits, log };
}

function planFile(spec, view) {
  const key = hashOf(view.key, JSON.stringify(view), spec.rev ?? "", `paso ${spec.orderStep ?? 0.75} ciclos-largos2 estados`, ...spec.pieces.map((p) => `${p.name}:${nodeKey(p.node)}`));
  return join(spec.cache, "plan", `${view.key}-${key}.json`);
}

// ---- Trabajos en procesos hijos -------------------------------------------------------------------------------------
function paintPiece(spec, view, piece, sub, cell, quick) {
  const P = projectionOf(spec, view);
  const F = B.field(sub.node, { name: sub.id, mix: piece.mix, cores: piece.cores ?? [], L: piece.L });
  const opts = { cell, coarse: quick ? 3 : 2, seams: false, smooth: 0.5, tones: "overlay", ...spec.paint, ...(piece.paint ?? {}), base: piece.mat };
  const t0 = Date.now();
  if (piece.veil) {
    // Membrana translúcida (meninges): solo su cobertura y un brillo, sin tonos ni líneas internas; no entra en el orden de pintor.
    const sac = B.paint(F, P, { cell, coarse: quick ? 3 : 2, tones: "overlay", jump: 99 });
    return { svg: B.compactSvg(B.veilSvg(sac, { tissue: piece.mat }), { tolerance: 0.3 }), ms: Date.now() - t0, rays: sac.stats?.probes ?? 0 };
  }
  const painted = B.paint(F, P, opts);
  const svg = B.compactSvg(B.fieldSvg(painted, { tone: "hi", tissue: spec.tissue }), { tolerance: 0.3 });
  return { svg, ms: Date.now() - t0, rays: painted.stats?.probes ?? 0 };
}

// Si el orden descartó reglas, busca con Bellman-Ford el ciclo de reglas que no se puede cumplir y lo describe.
function explainDropped(R, P) {
  const s = R.settled;
  if (!s || !s.solved.dropped.length) return "";
  const { pairs, least, V } = s.overlaps;
  const share = (it, st) => (typeof st === "number" ? st : st.shares[it.ride ?? it.piece] ?? 0);
  const lift = (it) => G.dot3(it.move ?? [0, 0, 0], V);
  const strongest = new Map();
  for (const pr of pairs) {
    const af = pr.front[0].area >= least;
    const bf = pr.front[1].area >= least;
    if (af && bf) continue;
    const [f, b] = af ? [pr.a, pr.b] : [pr.b, pr.a];
    const need = 0.02 + share(s.items[b], pr.state) * lift(s.items[b]) - share(s.items[f], pr.state) * lift(s.items[f]);
    const id = `${f}|${b}`;
    const prev = strongest.get(id);
    if (!prev || need > prev.need) strongest.set(id, { f, b, need, st: pr.state.label ?? pr.state, w: Math.max(pr.front[0].area, pr.front[1].area) });
  }
  const rules = [...strongest.values()];
  const n = s.items.length;
  const d = new Array(n).fill(0);
  const pred = new Array(n).fill(null);
  let last = -1;
  for (let it = 0; it <= n; it++) {
    last = -1;
    for (const r of rules) if (d[r.f] < d[r.b] + r.need - 1e-9) ((d[r.f] = d[r.b] + r.need), (pred[r.f] = r), (last = r.f));
    if (last < 0) break;
  }
  const out = [`reglas descartadas: ${s.solved.dropped.length}`];
  if (last >= 0) {
    let x = last;
    for (let i = 0; i < n; i++) x = pred[x].b;
    const start = x;
    do {
      const r = pred[x];
      out.push(`  ciclo: ${s.items[r.f].name} delante de ${s.items[r.b].name} (necesita ${r.need.toFixed(2)}, ${r.st}, ${r.w.toFixed(0)} px²)`);
      x = r.b;
    } while (x !== start);
  }
  return out.join("\n");
}

// Avance visible: cada línea sale por stderr, que va al registro de la construcción (.cache/construccion.log).
const stamp = () => new Date().toTimeString().slice(0, 8);
const progress = (view, msg) => console.error(`[${stamp()}] ${view}: ${msg}`);

// Excepciones de orden de pintor de una vista: pares [a, b] (valen en todas) o { view, pair: [a, b] } (solo en esa vista).
const allowFor = (spec, view) => (spec.allowOrder ?? []).filter((e) => Array.isArray(e) || !e.view || e.view === view.key).map((e) => (Array.isArray(e) ? e : e.pair));

export function settleView(spec, view, painted, auditing, ordenOnly = false, solidosOnly = false, vueloOnly = false) {
  const t0 = Date.now();
  const P = projectionOf(spec, view);
  const R = A.recorder(P);
  const fields = Object.fromEntries(spec.pieces.map((p) => [p.name, B.field(p.node, { name: p.name, L: p.L })]));
  if (view.base !== false) mountItems(R, P, spec, fields);
  for (const p of spec.pieces)
    for (const sub of subNodes(spec, view, p)) {
      const F = sub.id === p.name ? fields[p.name] : B.field(sub.node, { name: sub.id, L: p.L });
      const centre = G.mul3(G.add3(F.bounds.min, F.bounds.max), 0.5);
      R.put({ name: sub.id, piece: p.name, at: centre, bias: p.veil ? 1e4 : -400 * sub.behind, ...(p.veil ? { veil: { opacity: p.veil } } : {}), move: p.moveW, svg: painted[sub.id], shapes: [R.solid(A.field(F, { name: sub.id, ground: p.ground ?? false, blend: p.veil ? ["*"] : [...(p.blend ?? []), `${p.name}:*`] }))] });
    }
  const states = [0, 1, ...statesFor(spec.pieces)];
  const tS = Date.now();
  progress(view.key, `orden: ${R.items.length} ítems, ${states.length} estados del despiece`);
  let pairs = 0;
  let beat = Date.now();
  const counting = (a, b) => {
    pairs++;
    if (Date.now() - beat > 15000) {
      beat = Date.now();
      progress(view.key, `orden: ${pairs} pares evaluados · ${((beat - tS) / 1000).toFixed(0)} s`);
    }
    return A.sameRun(a, b);
  };
  A.settle(R, P, { states, step: spec.orderStep ?? 0.75, skip: counting, ...(spec.orderLeast ? { least: spec.orderLeast } : {}) });
  const settleMs = Date.now() - tS;
  progress(view.key, `orden: listo, ${pairs} pares en ${(settleMs / 1000).toFixed(0)} s`);
  let report = "";
  let failed = 0;
  if (solidosOnly) {
    // Modo rápido para los sólidos: orden de pintor, apoyos (pares hundidos), holguras con el despiece completo y en vuelo. Se salta
    // lo caro y no relacionado (pendientes de los campos, cobertura, líneas que se tocan). No sustituye a la auditoría completa.
    const depth = A.depthOrder(R.settled.items, P, { overlaps: R.settled.overlaps, solved: R.settled.solved, allow: allowFor(spec, view) });
    // Con --vuelo se salta lo lento (apoyos y holguras con el despiece completo: ~80 min) y solo se miran el orden y las holguras en vuelo.
    const result = vueloOnly ? { depth } : { depth, apart: A.solidClearances(R.solids, { state: 1 }), supports: A.supports(R.solids, R.tubes, { ground: R.ground }) };
    const worst = new Map();
    const flightStates = states.slice(2);
    let done = 0;
    for (const state of flightStates) {
      if (done % 10 === 0) progress(view.key, `sólidos: holguras en vuelo, estado ${done + 1} de ${flightStates.length}`);
      done++;
      for (const c of A.solidClearances(R.solids, { state, spacing: spec.flightSpacing ?? 1, sunk: spec.flightSunk ?? 0.9 })) {
        const id = `${c.tube}|${c.other}`;
        if (!worst.has(id) || worst.get(id).clearance > c.clearance) worst.set(id, c);
      }
    }
    result.flight = [...worst.values()].sort((x, y) => x.clearance - y.clearance);
    failed = A.failures(result);
    report = A.report(result);
    progress(view.key, `sólidos: comprobación lista, ${failed} problemas`);
  } else if (ordenOnly) {
    // Modo rápido para iterar sobre el orden de pintor: solo la comprobación de profundidad, con lo que ya calculó `settle`.
    // No sustituye a la auditoría completa (holguras, apoyos, pendientes de los campos), que hay que pasar al cerrar.
    const result = { depth: A.depthOrder(R.settled.items, P, { overlaps: R.settled.overlaps, solved: R.settled.solved, allow: allowFor(spec, view) }) };
    failed = A.failures(result);
    report = A.report(result);
    progress(view.key, `orden: comprobación de profundidad lista, ${failed} problemas`);
  } else if (auditing) {
    // Los fotogramas del despiece se revisan con la misma función del kit (solidClearances), con un muestreo de
    // superficie de 1 mm en lugar de 0,6 para que la auditoría de cada vista quepa en un par de minutos.
    progress(view.key, "auditoría: chequeos del kit (holguras, apoyos, orden de pintor, campos)…");
    const tA = Date.now();
    const result = A.audit(R, P, { organic: true, frames: [], apart: true, cover: spec.cover ?? [], allow: allowFor(spec, view) });
    progress(view.key, `auditoría: chequeos del kit listos en ${((Date.now() - tA) / 1000).toFixed(0)} s`);
    const worst = new Map();
    const flightStates = states.slice(2);
    let done = 0;
    for (const state of flightStates) {
      if (done % 10 === 0) progress(view.key, `auditoría: holguras en vuelo, estado ${done + 1} de ${flightStates.length}`);
      done++;
      for (const c of A.solidClearances(R.solids, { state, spacing: spec.flightSpacing ?? 1, sunk: spec.flightSunk ?? 0.9 })) {
        const id = `${c.tube}|${c.other}`;
        if (!worst.has(id) || worst.get(id).clearance > c.clearance) worst.set(id, c);
      }
    }
    result.flight = [...worst.values()].sort((x, y) => x.clearance - y.clearance);
    failed = A.failures(result);
    report = A.report(result);
  }
  report += `\n${explainDropped(R, P)}\ntiempos: orden ${(settleMs / 1000).toFixed(1)} s · auditoría ${((Date.now() - tS - settleMs) / 1000).toFixed(1)} s`;
  R.items.sort((a, b) => a.key - b.key);
  const cam = A.cameraBasis(P);
  const f2 = (v) => Math.round(v * 100) / 100;
  const body = R.items
    .map((it) => {
      const m = it.move ?? [0, 0, 0];
      const lift = G.dot3(m, cam.V);
      const mx = G.dot3(m, cam.R) * cam.k;
      const my = G.dot3(m, cam.D) * cam.k;
      const part = it.piece ? ` data-part="${it.piece}"` : ` data-stand`;
      return `<g class="pz"${part} data-k="${f2(it.key)}" data-l="${f2(lift)}" data-mx="${f2(mx)}" data-my="${f2(my)}">${it.svg}</g>`;
    })
    .join("");
  const rest = boundsOfAll(spec.pieces);
  const apart = boundsOfAll(spec.pieces, 1);
  const { plinth } = spec.mount;
  const plinthPts = view.base === false ? [] : corners({ min: [-plinth.r, -plinth.r, 0], max: [plinth.r, plinth.r, plinth.h] });
  const boxRest = screenBox([...corners(rest), ...plinthPts], P);
  const boxApart = screenBox([...corners(apart), ...plinthPts], P);
  // Caja de la figura en 26 posiciones del deslizador, con la parte de despiece que lleva cada pieza en ese momento: interpolar en
  // línea recta entre reposo y despiece completo dejaba fuera a las piezas que salen primero, que a medio camino ya están lejos.
  const boxes = Array.from({ length: 26 }, (_, k) => {
    const sl = k / 25;
    const pts = [...plinthPts];
    for (const p of spec.pieces) {
      const bb = B.field(p.node).bounds;
      if (!bb) continue;
      const m = G.mul3(p.moveW, shareAt(p.stage, sl));
      pts.push(...corners({ min: G.add3(bb.min, m), max: G.add3(bb.max, m) }));
    }
    return screenBox(pts, P);
  });
  return { key: view.key, body, boxRest, boxApart, boxes, items: R.items.length, report, failed, ms: Date.now() - t0 };
}

function pool(jobs, limit) {
  let next = 0;
  const results = new Array(jobs.length);
  return new Promise((done, fail) => {
    let running = 0;
    const launch = () => {
      if (next >= jobs.length && running === 0) return done(results);
      while (running < limit && next < jobs.length) {
        const i = next++;
        running++;
        jobs[i]()
          .then((r) => {
            results[i] = r;
            running--;
            launch();
          })
          .catch(fail);
      }
    };
    launch();
  });
}

// Cada proceso hijo tiene un tope de heap y el paralelismo sale de la RAM libre, no de los núcleos: una vez 15 hijos
// de `settle` agotaron los 24 GB de WSL. SNC_JOBS fuerza otro número.
const HEAP_MB = 3072;
function jobsFor(perJobMb) {
  const forced = Number(process.env.SNC_JOBS);
  if (forced > 0) return forced;
  const byMem = Math.floor((freemem() / 1048576 - 4096) / perJobMb);
  return Math.max(1, Math.min(cpus().length - 1, byMem, 6));
}

function child(self, args) {
  return new Promise((ok, fail) => {
    const run = spawn(process.execPath, [`--max-old-space-size=${HEAP_MB}`, self, ...args], { stdio: ["ignore", "inherit", "inherit"] });
    run.on("exit", (code) => (code ? fail(new Error(`${args[0]} terminó con ${code}`)) : ok()));
  });
}

// ---- Punto de entrada ----------------------------------------------------------------------------------------------
// spec: { self, here, width, height, pieces, views, mount, paint, tissue, cache, page(views, meta) → [{ file, html }] }
export async function run(spec) {
  const argv = process.argv.slice(2);
  const quick = argv.includes("--quick");
  const vueloOnly = argv.includes("--vuelo");
  const solidosOnly = argv.includes("--solidos") || vueloOnly;
  const ordenOnly = argv.includes("--orden") || solidosOnly;
  const auditing = argv.includes("--audit") || ordenOnly;
  const cell = quick ? 0.7 : spec.cell ?? 0.4;
  for (const p of spec.pieces) p.moveW = spec.toWorld(p.move ?? [0, 0, 0]);
  const only = argv.find((a) => a.startsWith("--view="))?.slice(7);

  const planArg = argv.find((a) => a.startsWith("--plan="));
  if (planArg) {
    const [viewKey, out] = planArg.slice(7).split(",");
    const view = spec.views.find((v) => v.key === viewKey);
    const t0 = Date.now();
    const r = planSplits(spec, view, { step: spec.orderStep ?? 0.75, maxCuts: view.maxCuts ?? 4 });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({ ...r, ms: Date.now() - t0, rssMb: Math.round(process.resourceUsage().maxRSS / 1024) }));
    return;
  }
  // El plan de cortes de cada vista sale del disco (lo calcula el proceso principal antes de pintar).
  spec.splits = {};
  if (spec.autoSplit)
    for (const v of spec.views) {
      const f = planFile(spec, v);
      if (existsSync(f)) spec.splits[v.key] = cutsOf(JSON.parse(readFileSync(f, "utf8")).splits);
    }
  const paintArg = argv.find((a) => a.startsWith("--paint="));
  if (paintArg) {
    const [viewKey, name, out] = paintArg.slice(8).split(",");
    const view = spec.views.find((v) => v.key === viewKey);
    const piece = spec.pieces.find((p) => p.name === name.split(":")[0]);
    const sub = subNodes(spec, view, piece).find((x) => x.id === name);
    const r = paintPiece(spec, view, piece, sub, cell, quick);
    writeFileSync(out, JSON.stringify({ ...r, rssMb: Math.round(process.resourceUsage().maxRSS / 1024) }));
    return;
  }
  const settleArg = argv.find((a) => a.startsWith("--settle="));
  if (settleArg) {
    const [viewKey, input, out] = settleArg.slice(9).split(",");
    const view = spec.views.find((v) => v.key === viewKey);
    const painted = JSON.parse(readFileSync(input, "utf8"));
    const r = settleView(spec, view, painted, auditing, ordenOnly, solidosOnly, vueloOnly);
    writeFileSync(out, JSON.stringify({ ...r, rssMb: Math.round(process.resourceUsage().maxRSS / 1024) }));
    return;
  }

  const started = Date.now();
  const planNote = [];
  if (spec.autoSplit) {
    const planViews = spec.views.filter((x) => !only || only.split("+").includes(x.key));
    // Los planes de cortes de las vistas que faltan se calculan en paralelo (hasta 3 a la vez: cada uno usa ~1,5 GB).
    const missing = planViews.filter((v) => !existsSync(planFile(spec, v)));
    if (missing.length) {
      console.log(`planes de cortes por calcular: ${missing.map((v) => v.key).join(", ")}`);
      await pool(missing.map((v) => () => child(spec.self, [`--plan=${v.key},${planFile(spec, v)}`, ...(quick ? ["--quick"] : [])])), Math.min(jobsFor(HEAP_MB), 3));
    }
    for (const v of planViews) {
      const f = planFile(spec, v);
      const plan = JSON.parse(readFileSync(f, "utf8"));
      spec.splits[v.key] = cutsOf(plan.splits);
      planNote.push(`plan ${v.key}: ${(plan.ms / 1000).toFixed(0)} s · ${plan.rssMb} MB · ${Object.entries(plan.splits).map(([k, b]) => `${k}←${b.join("+")}`).join(", ") || "sin cortes"}`);
      for (const l of plan.log) console.log(`  ${l}`);
    }
    for (const n of planNote) console.log(n);
  }
  const views = only ? spec.views.filter((v) => only.split("+").includes(v.key)) : spec.views;
  const cacheDir = join(spec.cache, "paint");
  mkdirSync(cacheDir, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "snc-"));
  const jobs = [];
  const fileOf = {};
  let reused = 0;
  for (const view of views) {
    const P = projectionOf(spec, view);
    for (const piece of spec.pieces) for (const sub of subNodes(spec, view, piece)) {
      const key = hashOf(nodeKey(sub.node), JSON.stringify(piece.mix ?? null), nodeKey({ of: piece.cores ?? [] }), JSON.stringify({ ...spec.paint, ...(piece.paint ?? {}), base: piece.mat }), JSON.stringify(spec.tissue), JSON.stringify(P), String(cell), String(quick), spec.rev ?? "");
      const file = join(cacheDir, `${key}.json`);
      fileOf[`${view.key}|${sub.id}`] = file;
      if (existsSync(file)) {
        reused++;
        continue;
      }
      jobs.push({ cost: piece.cost ?? 1, run: () => child(spec.self, [`--paint=${view.key},${sub.id},${file}`, ...(quick ? ["--quick"] : [])]) });
    }
  }
  jobs.sort((a, b) => b.cost - a.cost);
  const limit = jobsFor(HEAP_MB);
  const t1 = Date.now();
  await pool(jobs.map((j) => j.run), limit);
  const paintS = (Date.now() - t1) / 1000;
  console.log(`pintado: ${jobs.length} piezas×vista nuevas, ${reused} de la caché · ${paintS.toFixed(1)} s`);
  let paintMs = 0;
  let paintRss = 0;
  let paintRssName = "";
  let settleReused = 0;
  const settleJobs = views.map((view) => async () => {
    const painted = {};
    for (const piece of spec.pieces)
      for (const sub of subNodes(spec, view, piece)) {
        const r = JSON.parse(readFileSync(fileOf[`${view.key}|${sub.id}`], "utf8"));
        painted[sub.id] = r.svg;
        paintMs += r.ms;
        if ((r.rssMb ?? 0) > paintRss) (paintRss = r.rssMb), (paintRssName = `${view.key}|${sub.id}`);
      }
    const input = join(work, `${view.key}-in.json`);
    const out = join(work, `${view.key}.json`);
    writeFileSync(input, JSON.stringify(painted));
    // Caché del ordenamiento: la clave reúne lo pintado, el despiece, los cortes, la tolerancia, las excepciones, el modo y el código de
    // `settleView`. Un cambio solo de la página (CSS, JavaScript, textos) reutiliza el resultado en vez de repetir 30 min de orden.
    const mode = vueloOnly ? "vuelo" : solidosOnly ? "solidos" : ordenOnly ? "orden" : auditing ? "audit" : "plano";
    const ckey = hashOf(readFileSync(input, "utf8"), JSON.stringify(spec.pieces.map((p) => [p.name, p.moveW, p.stage, p.veil ?? null, p.ground ?? null])), JSON.stringify(spec.splits[view.key] ?? null), String(spec.orderLeast ?? 0), String(spec.orderStep ?? 0.75), JSON.stringify(allowFor(spec, view)), mode, quick ? "q" : "f", settleView.toString());
    const cfile = join(spec.cache, "settle", `${view.key}-${ckey}.json`);
    if (existsSync(cfile)) {
      settleReused++;
      return JSON.parse(readFileSync(cfile, "utf8"));
    }
    await child(spec.self, [`--settle=${view.key},${input},${out}`, ...(vueloOnly ? ["--vuelo"] : solidosOnly ? ["--solidos"] : ordenOnly ? ["--orden"] : auditing ? ["--audit"] : []), ...(quick ? ["--quick"] : [])]);
    const result = JSON.parse(readFileSync(out, "utf8"));
    mkdirSync(join(spec.cache, "settle"), { recursive: true });
    writeFileSync(cfile, JSON.stringify(result));
    return result;
  });
  const t2 = Date.now();
  const done = await pool(settleJobs, Math.min(limit, 3));
  console.log(`RAM pico: pintado ${paintRss} MB (${paintRssName}) · orden/auditoría ${Math.max(...done.map((v) => v.rssMb ?? 0))} MB · principal ${Math.round(process.resourceUsage().maxRSS / 1024)} MB · jobs ${limit}`);
  rmSync(work, { recursive: true, force: true });
  let failed = 0;
  for (const v of done) {
    console.log(`vista ${v.key}: ${v.items} ítems · ${(v.body.length / 1024).toFixed(1)} KB · orden ${(v.ms / 1000).toFixed(1)} s`);
    if (auditing) {
      console.log(`--- vista ${v.key}\n${v.report}\n${v.failed ? `vista con fallos: ${v.failed}` : "vista aprobada"}`);
      failed += v.failed;
    }
  }
  console.log(`orden y auditoría: ${((Date.now() - t2) / 1000).toFixed(1)} s · CPU de pintado acumulada ${(paintMs / 1000).toFixed(1)} s`);
  if (auditing) {
    console.log(failed ? `audit failed: ${failed} problem${failed === 1 ? "" : "s"}${solidosOnly ? " (solo sólidos)" : ordenOnly ? " (solo orden de pintor)" : ""}` : ordenOnly ? "orden de pintor sin problemas (auditoría completa pendiente)" : "audit passed");
    if (failed) process.exitCode = 1;
  }
  const svgs = done.map((v) => ({
    ...v,
    view: views.find((x) => x.key === v.key),
    svg: k.figureSvg({ width: spec.width, height: spec.height, label: "__LABEL__", body: v.body, className: "snc-view" }),
  }));
  for (const { file, html } of spec.page(svgs, { quick })) {
    writeFileSync(join(spec.here, file), html);
    console.log(`escribí ${file} · ${(html.length / 1024).toFixed(0)} KB · ${svgs.length} vista(s) · ${((Date.now() - started) / 1000).toFixed(1)} s`);
  }
}
