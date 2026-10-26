// Capturas de cada estado del modelo a los tres tamaños de proyección, con drive.mjs del kit.
//   node scripts/verificar.mjs [página] [--sizes 1920x1080,1280x720,1024x768] [--states a,b]
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SPECIMEN } from "../kit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const take = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i < 0 ? fallback : argv.splice(i, 2)[1];
};
const sizes = take("--sizes", "1920x1080,1280x720,1024x768").split(",");
const only = take("--states", null)?.split(",");
const page = argv[0] ?? join(ROOT, "snc-light.html");
const out = join(ROOT, "shots");
mkdirSync(out, { recursive: true });

// Cada estado parte de la página recién cargada y usa los controles reales (eventos sobre los elementos).
const ui = {
  explode: (v) => `(() => { const el = document.getElementById("snc-explode"); el.value = ${v}; el.dispatchEvent(new Event("input", { bubbles: true })); return el.value; })()`,
  toggle: (name) => `(() => { const el = document.querySelector('[data-show="${name}"]'); el.click(); return el.checked; })()`,
  opacity: (name, v) => `(() => { const el = document.querySelector('[data-op="${name}"]'); el.value = ${v}; el.dispatchEvent(new Event("input", { bubbles: true })); return el.value; })()`,
  peel: (n) => `(() => { const el = document.getElementById("snc-peel"); el.value = ${n}; el.dispatchEvent(new Event("input", { bubbles: true })); return document.querySelector("[data-peel-label]").textContent; })()`,
  labels: (mode) => `(() => { const el = document.querySelector("[data-labels]"); el.value = "${mode}"; el.dispatchEvent(new Event("change", { bubbles: true })); return document.querySelectorAll("svg[data-on] .snc-label").length; })()`,
  corte: (id) => `(() => { document.querySelector('[data-corte="${id}"]').click(); return window.__snc.state.view + " " + document.querySelectorAll("[data-seccion] path[data-part]").length; })()`,
  cortePos: (i) => `(() => { const el = document.getElementById("snc-corte-pos"); el.value = ${i}; el.dispatchEvent(new Event("input", { bubbles: true })); return document.querySelector("[data-corte-pos-label]").textContent + " | " + document.querySelectorAll("[data-seccion] path[data-part]").length + " regiones"; })()`,
  fold: (ids) => `(() => { for (const id of ${JSON.stringify(ids)}) document.querySelector('.snc-box[data-fold="' + id + '"] .snc-fold').click(); return [...document.querySelectorAll(".snc-box[data-fold]")].map((b) => b.dataset.fold + (b.hasAttribute("data-cerrado") ? "−" : "+")).join(" "); })()`,
  via: (id) => `(() => { const el = document.querySelector('input[data-via="${id}"]'); if (!el.checked) el.click(); return [...document.querySelectorAll("svg[data-on] .snc-vias > g")].filter((g) => g.style.display !== "none").length; })()`,
  isolate: (name) => `(() => { document.querySelector('[data-iso="${name}"]').click(); return document.querySelectorAll('svg[data-on] g.pz[data-part]:not([style*="none"])').length; })()`,
  // Clic real sobre la pieza: se busca un punto de su dibujo donde elementFromPoint la devuelva, y se envían
  // pointerdown/pointerup ahí.
  tap: (name) => `(() => {
    const svg = document.querySelector("svg[data-on]");
    const rs = [...svg.querySelectorAll('g.pz[data-part="${name}"]')].map((g) => g.getBoundingClientRect());
    const r = { left: Math.min(...rs.map((b) => b.left)), top: Math.min(...rs.map((b) => b.top)), right: Math.max(...rs.map((b) => b.right)), bottom: Math.max(...rs.map((b) => b.bottom)) };
    for (let y = r.top + 2; y < r.bottom; y += 4)
      for (let x = r.left + 2; x < r.right; x += 4) {
        const hit = document.elementFromPoint(x, y)?.closest("g.pz");
        if (hit && hit.dataset.part === "${name}") {
          const opts = { bubbles: true, clientX: x, clientY: y, pointerId: 1 };
          hit.dispatchEvent(new PointerEvent("pointerdown", opts));
          hit.dispatchEvent(new PointerEvent("pointerup", opts));
          return document.querySelector(".snc-ficha h3")?.textContent ?? "sin ficha";
        }
      }
    return "no encontré un punto visible de ${name}";
  })()`,
};
const settle = ["until", "!window.__snc || Math.abs(window.__snc.state.s - window.__snc.state.target) < 1e-4", 8000];
const STATES = {
  armado: [],
  "despiece-50": [["eval", ui.explode(0.5)], settle],
  "despiece-100": [["eval", ui.explode(1)], settle],
  "sin-lobulo-temporal": [["eval", ui.toggle("temporal-izq")]],
  "translucido-frontal": [["eval", ui.opacity("frontal-izq", 0.3)]],
  "sin-meninges": [["eval", ui.toggle("dura")], ["eval", ui.toggle("aracnoides")], ["eval", ui.toggle("hoz")], ["eval", ui.toggle("tienda")]],
  "aislado-cerebelo": [["eval", ui.isolate("cerebelo-izq")]],
  "aislado-mesencefalo": [["eval", ui.isolate("mesencefalo-izq")]],
  "aislado-rodaja-c6": [["eval", ui.isolate("rodaja-c6")]],
  "aislado-optica": [["eval", ui.isolate("optica-izq")]],
  "ficha-cerebelo": [["eval", ui.explode(0.5)], settle, ["eval", ui.tap("cerebelo-izq")]],
  "ficha-frontal": [["eval", ui.tap("frontal-izq")]],
  "ficha-rodaja-l3": [["eval", ui.tap("rodaja-l3")]],
  "corte-sagital": [["eval", ui.corte("sagital")]],
  "corte-coronal": [["eval", ui.corte("coronal")], ["eval", ui.cortePos(11)]],
  "corte-coronal-atras": [["eval", ui.corte("coronal")], ["eval", ui.cortePos(16)]],
  "corte-axial": [["eval", ui.corte("axial")], ["eval", ui.cortePos(14)]],
  "corte-axial-bajo": [["eval", ui.corte("axial")], ["eval", ui.cortePos(19)]],
  "panel-todo-plegado": [["eval", ui.fold(["despiece", "cortes", "pelado", "piezas", "ficha"])]],
  "panel-solo-piezas": [["eval", ui.fold(["despiece", "cortes", "pelado", "ficha"])]],
  "panel-ficha-se-abre": [["eval", ui.fold(["ficha"])], ["eval", ui.tap("frontal-izq")], ["eval", `document.querySelector('.snc-box[data-fold="ficha"]').hasAttribute("data-cerrado") ? "ficha cerrada" : "ficha abierta"`]],
  "pelado-5": [["eval", ui.peel(5)]],
  "pelado-9": [["eval", ui.peel(9)]],
  "rotulos-todos": [["eval", ui.labels("todos")]],
  "rotulos-despiece": [["eval", ui.labels("todos")], ["eval", ui.explode(0.5)], settle],
  "vias-corticoespinal-dorsal": [["eval", ui.via("corticoespinal")], ["eval", ui.via("dorsal")]],
  "vias-papez-lcr": [["eval", ui.via("papez")], ["eval", ui.via("lcr")]],
  "ficha-hipocampo-despiece": [["eval", ui.explode(1)], settle, ["eval", ui.tap("hipocampo-izq")]],
};

let failed = 0;
for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  for (const [name, steps] of Object.entries(STATES)) {
    if (only && !only.includes(name)) continue;
    const file = join(out, `${name}-${w}.png`);
    const actions = [["wait", 400], ...steps, ["wait", 700], ["shot", file, "body", 1, [0, 0, w, h]]];
    const actionsFile = join(out, `.acciones-${process.pid}.json`);
    writeFileSync(actionsFile, JSON.stringify(actions));
    const r = spawnSync(process.execPath, [join(SPECIMEN, "scripts/drive.mjs"), page, "--actions", actionsFile, "--width", String(w), "--height", String(h)], { encoding: "utf8" });
    const text = (r.stdout + r.stderr).trim().split("\n").filter((l) => /eval:|console|exception|error/i.test(l)).join(" | ");
    console.log(`${name} ${size}: ${r.status ? "FALLÓ" : "ok"} ${text}`);
    if (r.status) failed++;
  }
}
process.exitCode = failed ? 1 : 0;
