// Orden en x de las piezas: recorre rectas paralelas a x (de la izquierda a la línea media) y anota qué pieza queda lateral a cuál.
// Una pieza A es lateral a B si, en alguna recta, A aparece antes que B. Si A es lateral a B en una recta y B lo es a A en
// otra, ninguna puede salir primero hacia la izquierda: el programa lo señala con un ejemplo (y, z).
//   node scripts/capas.mjs [--step 2.5] [--solo a,b,c]
process.env.SNC_NO_SALIDAS = "1";
const { B, R } = await import("../modelo/prims.mjs");
const { PIECES } = await import("../modelo/piezas.mjs");
const argv = process.argv.slice(2);
const step = Number(argv[argv.indexOf("--step") + 1] || 2.5);
const solo = argv.includes("--solo") ? argv[argv.indexOf("--solo") + 1].split(",") : null;
const items = PIECES.filter((p) => !p.fixed && !p.veil && (!solo || solo.includes(p.name))).map((p) => ({ n: p.name, F: B.field(p.node) }));
const edges = new Map();
const sample = new Map();
for (let y = -75; y <= 50; y += step)
  for (let z = -55; z <= 50; z += step) {
    const seq = [];
    let last = null;
    for (let x = -75; x <= -0.4; x += 0.6) {
      let hit = null;
      for (const it of items) {
        const b = it.F.bounds;
        // mundo: x_world = -x_RAS; y igual; z + LIFT (se resuelve con R)
        const wp = [-x, y, z + 158];
        if (wp[0] < b.min[0] || wp[0] > b.max[0] || wp[1] < b.min[1] || wp[1] > b.max[1] || wp[2] < b.min[2] || wp[2] > b.max[2]) continue;
        if (it.F.v(wp[0], wp[1], wp[2]) < -0.2) { hit = it.n; break; }
      }
      if (hit && hit !== last) { seq.push(hit); last = hit; }
      else if (hit) last = hit;
    }
    for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) {
      if (seq[i] === seq[j]) continue;
      const k = `${seq[i]}>${seq[j]}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
      if (!sample.has(k)) sample.set(k, [y, z]);
    }
  }
const out = [];
for (const [k, c] of edges) {
  const [a, b] = k.split(">");
  const back = edges.get(`${b}>${a}`);
  if (back && a < b) out.push(`${a} <-> ${b}: ${c} rectas (${sample.get(k)}) contra ${back} (${sample.get(`${b}>${a}`)})`);
}
console.log(out.length ? "CICLOS DE 2:\n" + out.join("\n") : "sin ciclos de 2 piezas");
// ciclos largos: DFS
const g = new Map();
for (const k of edges.keys()) { const [a, b] = k.split(">"); (g.get(a) ?? g.set(a, new Set()).get(a)).add(b); }
const color = new Map();
const stack = [];
const found = [];
const dfs = (u) => {
  color.set(u, 1); stack.push(u);
  for (const v of g.get(u) ?? []) {
    if (color.get(v) === 1) found.push([...stack.slice(stack.indexOf(v)), v].join(" > "));
    else if (!color.get(v)) dfs(v);
  }
  stack.pop(); color.set(u, 2);
};
for (const u of g.keys()) if (!color.get(u)) dfs(u);
console.log(found.length ? "CICLOS LARGOS:\n" + [...new Set(found)].slice(0, 12).join("\n") : "sin ciclos largos");
