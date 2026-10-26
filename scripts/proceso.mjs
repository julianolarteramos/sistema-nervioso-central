// Genera proceso/index.html, una línea de tiempo de cómo creció el modelo, a partir de proceso/hitos.json.
// Para añadir un hito: copiar las capturas a proceso/img/ y sumar una entrada a hitos.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(dirname(fileURLToPath(import.meta.url)), "../proceso");
const hitos = JSON.parse(readFileSync(join(here, "hitos.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const reg = join(here, "instantaneas/registro.jsonl");
const snaps = existsSync(reg) ? readFileSync(reg, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
let fase = null;
const body = hitos.map((h, i) => `${h.fase && h.fase !== fase ? `<h3 class="fase">${esc((fase = h.fase))}</h3>` : ""}
<section>
  <header><span class="n">${String(i + 1).padStart(2, "0")}</span><div><h2>${esc(h.titulo)}</h2><p class="meta">${esc(h.fecha)}${h.datos ? " · " + esc(h.datos) : ""}</p></div></header>
  <p>${esc(h.texto)}</p>
  ${(h.enlaces ?? []).length ? `<p class="links">${h.enlaces.map((l) => `<a href="${l.href}">${esc(l.texto)}</a>`).join(" · ")}</p>` : ""}
  ${h.imagenes.length ? `<div class="fotos">${h.imagenes.map((f) => `<a href="${f}"><img src="${f}" alt="${esc(h.titulo)}" loading="lazy"></a>`).join("")}</div>` : ""}
</section>`).join("\n");

writeFileSync(join(here, "index.html"), `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cómo se construyó el modelo del SNC</title>
<style>
:root{--bg:#f4f4f1;--fg:#1c1c1c;--mut:#6b6b66;--card:#fff;--line:#dcdcd6;--ac:#b06a10}
@media (prefers-color-scheme:dark){:root{--bg:#1b1b1a;--fg:#ececea;--mut:#a3a39d;--card:#252523;--line:#3a3a37;--ac:#e0a050}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px 64px}
h1{margin:0 0 4px;font-size:28px}.lead{color:var(--mut);margin:0 0 32px}
section{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:0 0 20px}
header{display:flex;gap:14px;align-items:baseline}.n{font:600 22px ui-monospace,monospace;color:var(--ac)}
h2{margin:0;font-size:20px}.meta{margin:2px 0 0;color:var(--mut);font:13px ui-monospace,monospace}
.fotos{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;margin-top:12px}
.nav{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 24px}.nav a{padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--fg);text-decoration:none;font-size:14px}.nav a:hover{border-color:var(--ac)}.links{margin:8px 0 0;font-size:14px}.links a{color:var(--ac)}\n.fase{margin:36px 0 12px;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:var(--ac)}\n.snaps{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:14px}\n.snaps figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px}\n.fotos2{display:grid;grid-template-columns:1fr 1fr;gap:8px}\n.fotos2 img{width:100%;border:1px solid var(--line);border-radius:6px}\nfigcaption{font-size:13px;color:var(--mut);margin-top:8px}\n.fotos img{width:100%;height:auto;border:1px solid var(--line);border-radius:8px;display:block}
</style></head><body><main>
<h1>Cómo se construyó el modelo del sistema nervioso central</h1>
<p class="lead">Diario de construcción: cada hito con su captura, su peso y su tiempo. Hecho con specimen.</p>
<nav class="nav"><a href="../referencias/index.html">Imágenes de referencia (hoja de contactos)</a><a href="../investigacion/ANATOMIA.md">Dossier anatómico</a><a href="../investigacion/CONTROLES-VIABILIDAD.md">Viabilidad de los controles</a><a href="../snc-light.html">El modelo</a></nav>
${body}
${snaps.length ? `<h3 class="fase">Fotos temporales de cada corrida</h3><p class="lead">Una foto del modelo armado y a medio despiece después de cada construcción, con lo que dijo la auditoría.</p><div class="snaps">${snaps.map((s) => `<figure><div class="fotos2">${s.imagenes.map((f) => `<a href="${f}"><img src="${f}" alt="${esc(s.etiqueta)}" loading="lazy"></a>`).join("")}</div><figcaption><b>${esc(s.etiqueta)}</b><br>${esc(s.fecha)} · ${s.piezas ?? "?"} piezas · ${s.kb} KB · auditoría: ${esc(s.auditoria)}${s.tiempos ? `<br>${esc(s.tiempos)}` : ""}</figcaption></figure>`).join("")}</div>` : ""}
</main></body></html>
`);
console.log(`proceso/index.html: ${hitos.length} hitos`);
