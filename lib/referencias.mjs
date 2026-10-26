// Miniaturas y créditos de las imágenes libres de referencias/ (nunca de referencias/privadas/).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REF = join(ROOT, "referencias");
const THUMBS = join(ROOT, "miniaturas");

let rows = null;
function manifest() {
  if (rows) return rows;
  rows = new Map();
  for (const line of readFileSync(join(REF, "MANIFEST.md"), "utf8").split("\n")) {
    const m = line.match(/^\| `([^`]+)` \| ([^|]*) \| ([^|]*) \| ([^|]*) \| \[[^\]]*\]\(([^)]+)\)/);
    if (m) rows.set(m[1], { que: m[2].trim(), autor: m[3].trim(), licencia: m[4].trim(), fuente: m[5].trim() });
  }
  return rows;
}

const AUTHORS = [
  [/^John A Beal/, "John A. Beal, LSU Health Sciences Center Shreveport"],
  [/Life Science Databases|lifesciencedb|DBCLS/, "BodyParts3D / Anatomography, DBCLS"],
  [/^Henry Vandyke Carter/, "Henry Vandyke Carter, Gray's Anatomy (1918)"],
  [/^Patrick J\. Lynch/, "Patrick J. Lynch"],
];

export function creditOf(path) {
  if (path.startsWith("privadas/")) throw new Error(`referencia privada: ${path}`);
  const row = manifest().get(path);
  if (!row) throw new Error(`no está en MANIFEST.md: ${path}`);
  const autor = AUTHORS.find(([re]) => re.test(row.autor))?.[1] ?? row.autor.replace(/…$/, "");
  return { autor, licencia: row.licencia, fuente: row.fuente };
}

// Miniatura WebP de 240 px de ancho como data URI; se genera una vez con ffmpeg y se guarda en miniaturas/.
export function thumbnail(path) {
  if (path.startsWith("privadas/")) throw new Error(`referencia privada: ${path}`);
  mkdirSync(THUMBS, { recursive: true });
  const out = join(THUMBS, path.replace(/\//g, "__").replace(/\.[a-z]+$/i, ".webp"));
  if (!existsSync(out)) {
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", join(REF, path), "-vf", "scale='min(240,iw)':-2:flags=lanczos,format=rgba", "-frames:v", "1", "-c:v", "libwebp", "-quality", "72", out]);
  }
  return `data:image/webp;base64,${readFileSync(out).toString("base64")}`;
}
