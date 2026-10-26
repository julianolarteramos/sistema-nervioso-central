// Foto temporal de una corrida: captura el modelo armado y a medio despiece, y anota en proceso/instantaneas/registro.jsonl
// cuántas piezas tenía, qué dijo la auditoría y cuánto tardó, para que el diario muestre cómo crece el modelo.
//   node scripts/instantanea.mjs "etiqueta corta" [página.html] [--datos='{"auditoria":"58 problemas"}']
// Si la foto es de una corrida anterior, --datos sustituye lo leído del registro de la última construcción.
import { spawnSync } from "node:child_process";
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const datosArg = process.argv.find((a) => a.startsWith("--datos="));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--datos="));
const label = args[0];
if (!label) throw new Error('uso: node scripts/instantanea.mjs "etiqueta" [página.html]');
const page = args[1] ?? join(ROOT, "snc-light.html");
const out = join(ROOT, "proceso/instantaneas");
mkdirSync(out, { recursive: true });

const r = spawnSync(process.execPath, [join(ROOT, "scripts/verificar.mjs"), page, "--sizes", "1920x1080", "--states", "armado,despiece-50"], { encoding: "utf8" });
if (r.status) throw new Error(r.stdout + r.stderr);

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const slug = label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const files = [];
for (const state of ["armado", "despiece-50"]) {
  const name = `${stamp}-${slug}-${state}.png`;
  copyFileSync(join(ROOT, `shots/${state}-1920.png`), join(out, name));
  files.push(`instantaneas/${name}`);
}

// Datos de la última construcción, leídos del registro fijo.
const logFile = join(ROOT, ".cache/construccion.log");
const log = existsSync(logFile) ? readFileSync(logFile, "utf8") : "";
const last = (re) => [...log.matchAll(new RegExp(re.source, "g"))].at(-1);
const html = readFileSync(page, "utf8");
const piezas = (html.match(/data-sys="[^"]+"/g) ?? []).length ? new Set([...html.matchAll(/data-show="([^"]+)"/g)].map((m) => m[1])).size : null;
const fallos = last(/audit failed: (\d+) problems?/);
const reg = {
  fecha: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
  etiqueta: label,
  pagina: page.split("/").pop(),
  kb: Math.round(statSync(page).size / 1024),
  piezas,
  auditoria: fallos ? `${fallos[1]} problemas` : log.includes("audit passed") ? "sin problemas" : "sin dato",
  tiempos: last(/tiempos: (.*)/)?.[1] ?? null,
  args: last(/inicio [\d:]+ · args: (.*)/)?.[1] ?? null,
  imagenes: files,
  ...(datosArg ? JSON.parse(datosArg.slice(8)) : {}),
};
appendFileSync(join(out, "registro.jsonl"), JSON.stringify(reg) + "\n");
console.log(`instantánea guardada: ${files.join(", ")}\n${JSON.stringify(reg)}`);
