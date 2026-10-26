// Comprueba el encuadre: en cada vista y en varias posiciones del deslizador, ninguna pieza visible debe quedar fuera del marco de la figura.
//   node scripts/encuadre.mjs [página] [--sizes 1920x1080,1280x720,1024x768]
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SPECIMEN } from "../kit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const si = argv.indexOf("--sizes");
const sizes = (si < 0 ? "1920x1080,1280x720,1024x768" : argv.splice(si, 2)[1]).split(",");
const page = argv[0] ?? join(ROOT, "snc-light.html");
const out = join(ROOT, "shots");
mkdirSync(out, { recursive: true });
const SLIDES = [0, 0.25, 0.5, 0.75, 1];
const settle = ["until", "!window.__snc || Math.abs(window.__snc.state.s - window.__snc.state.target) < 1e-4", 8000];
const slide = (v) => `(() => { const el = document.getElementById("snc-explode"); el.value = ${v}; el.dispatchEvent(new Event("input", { bubbles: true })); return 0; })()`;
// Cuántas piezas visibles tienen su caja (en pantalla) fuera del marco de la figura; devuelve "vista|s|fuera|nombres".
const outside = (i, v) => `(() => {
  const svg = document.querySelector("svg[data-on]");
  const f = svg.getBoundingClientRect();
  const bad = [...svg.querySelectorAll("g.pz[data-part]")].filter((g) => g.style.display !== "none").filter((g) => {
    const r = g.getBoundingClientRect();
    return r.width > 0 && (r.left < f.left - 2 || r.top < f.top - 2 || r.right > f.right + 2 || r.bottom > f.bottom + 2);
  }).map((g) => g.dataset.part);
  return "vista ${i} s=${v}: " + new Set(bad).size + (bad.length ? " fuera: " + [...new Set(bad)].join(",") : "");
})()`;

let total = 0;
for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  const steps = [["wait", 400]];
  const n = Number(process.env.SNC_VISTAS ?? 10);
  for (let i = 0; i < n; i++) {
    steps.push(["eval", `(() => { window.__snc.show(${i}); return ${i}; })()`], ["wait", 300]);
    for (const v of SLIDES) steps.push(["eval", slide(v)], settle, ["wait", 120], ["eval", outside(i, v)]);
  }
  const file = join(out, `.acciones-${process.pid}.json`);
  writeFileSync(file, JSON.stringify(steps));
  const r = spawnSync(process.execPath, [join(SPECIMEN, "scripts/drive.mjs"), page, "--actions", file, "--width", String(w), "--height", String(h)], { encoding: "utf8", maxBuffer: 1 << 26 });
  const lines = (r.stdout + r.stderr).split("\n").map((l) => l.replace(/.*(vista \d+ s=[\d.]+: .*?)"?\s*$/, "$1")).filter((l) => /^vista \d+ s=/.test(l));
  const bad = lines.filter((l) => !/: 0$/.test(l));
  // Si la herramienta de capturas pierde líneas de la salida, el comprobador no puede dar por buena la corrida.
  const esperadas = n * SLIDES.length;
  if (lines.length !== esperadas) bad.push(`faltan ${esperadas - lines.length} de ${esperadas} comprobaciones (la salida de la herramienta salió incompleta; repetir)`);
  if (process.env.SNC_VERBOSO) console.log(lines.join("\n"));
  console.log(`${size}: ${lines.length} comprobaciones, ${bad.length} con piezas fuera del marco`);
  for (const l of bad.slice(0, 12)) console.log("  " + l);
  total += bad.length;
}
process.exitCode = total ? 1 : 0;
