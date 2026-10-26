// Arma el paquete público en una carpeta (el clon de https://github.com/julianolarteramos/sistema-nervioso-central).
//   node scripts/publicar.mjs <carpeta-del-clon>
// No hace commit ni push: deja el árbol listo para revisarlo (`git status`, `git diff`) y publicarlo.
//
// Qué lleva el paquete:
//   index.html + img/        la portada (portada/)
//   explorador/index.html    el modelo (snc-light.html)
//   proceso/                 el diario, con sus enlaces ajustados a la página
//   referencias/             el banco de imágenes LIBRES, sin la carpeta privadas/ ni su sección en la hoja y en el MANIFEST
//   investigacion/, modelo/, lib/, scripts/, miniaturas/, build.mjs, kit.mjs, textos.mjs   el código y el dossier
//   README.md, LICENSE, DECISIONES.md (generado de CLAUDE.md sin lo que solo vale para el trabajo local)
// Lo que NO lleva: .claude/, CLAUDE.md, .cache/, shots/, prototipos/, referencias/privadas/ y las páginas de prueba (snc-solo*).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = process.argv[2];
if (!dest || !existsSync(dest)) throw new Error("uso: node scripts/publicar.mjs <carpeta-del-clon>");
const REPO = "https://github.com/julianolarteramos/sistema-nervioso-central";

// 1. Vaciar el destino (menos .git).
for (const f of readdirSync(dest)) if (f !== ".git") rmSync(join(dest, f), { recursive: true, force: true });

const copiar = (de, a, filtro) => cpSync(join(ROOT, de), join(dest, a ?? de), { recursive: true, filter: filtro });
const sinRuido = (src) => !/\/(\.cache|node_modules|\.DS_Store)(\/|$)/.test(src);

// 2. Código, dossier y recursos.
for (const f of ["build.mjs", "kit.mjs", "textos.mjs", "README.md", "LICENSE"]) copiar(f);
for (const d of ["modelo", "lib", "scripts", "investigacion", "miniaturas", "proceso"]) copiar(d, d, sinRuido);
copiar("referencias", "referencias", (src) => sinRuido(src) && !/\/referencias\/privadas(\/|$)/.test(src));

// 3. El modelo y la portada.
mkdirSync(join(dest, "explorador"), { recursive: true });
cpSync(join(ROOT, "snc-light.html"), join(dest, "explorador/index.html"));
mkdirSync(join(dest, "img"), { recursive: true });
cpSync(join(ROOT, "portada/index.html"), join(dest, "index.html"));
for (const f of readdirSync(join(ROOT, "portada"))) if (f.endsWith(".png")) cpSync(join(ROOT, "portada", f), join(dest, "img", f));
writeFileSync(join(dest, ".nojekyll"), "");
writeFileSync(join(dest, ".gitignore"), ".cache/\nshots/\nsnc-solo*.html\nnode_modules/\n");

// 4. El diario enlaza al modelo y a los documentos de la página (en el repositorio de trabajo apuntan a archivos locales).
const proceso = join(dest, "proceso/index.html");
writeFileSync(
  proceso,
  readFileSync(proceso, "utf8")
    .replaceAll('href="../snc-light.html"', 'href="../explorador/"')
    .replaceAll('href="../investigacion/ANATOMIA.md"', `href="${REPO}/blob/main/investigacion/ANATOMIA.md"`)
    .replaceAll('href="../investigacion/CONTROLES-VIABILIDAD.md"', `href="${REPO}/blob/main/investigacion/CONTROLES-VIABILIDAD.md"`)
    .replaceAll('href="../referencias/MANIFEST.md"', `href="${REPO}/blob/main/referencias/MANIFEST.md"`),
);

// 5. Banco de imágenes: sin la sección de privadas (ni en la hoja de contactos ni en el MANIFEST).
const hoja = join(dest, "referencias/index.html");
let h = readFileSync(hoja, "utf8");
h = h.slice(0, h.indexOf('<h2 id="privadas"')) + "</body></html>";
h = h.replace('<a href="#privadas" class="w">Privadas</a>', "").replace("206 imágenes libres y 8 privadas.", "206 imágenes libres.");
h = h.replaceAll('href="MANIFEST.md"', `href="${REPO}/blob/main/referencias/MANIFEST.md"`);
writeFileSync(hoja, h);
const man = join(dest, "referencias/MANIFEST.md");
let m = readFileSync(man, "utf8");
m = m.slice(0, m.indexOf("## PRIVADA, no publicar")).trimEnd() + "\n";
m = m.replace(/, más 8 privadas no libres \(sección final\)/, "");
writeFileSync(man, m);

// 6. DECISIONES.md: CLAUDE.md sin lo que solo vale para el trabajo local (la configuración del plugin, las reglas de publicación y las
//    imágenes privadas), y con otro título.
const lineas = readFileSync(join(ROOT, "CLAUDE.md"), "utf8").split("\n");
const sal = [];
let saltar = false;
for (const l of lineas) {
  if (/^## /.test(l)) saltar = /^## Publicación/.test(l);
  if (saltar) continue;
  if (/\.claude\/settings\.json|sin atribución de IA|referencias\/privadas|Nada se publica|`referencias\/`: 206/.test(l)) continue;
  sal.push(l);
}
let dec = sal.join("\n").replace(/^# .*\n/, "# Decisiones de diseño, reglas de modelado y lo aprendido\n\nEste documento reúne las decisiones de diseño del modelo del sistema nervioso central, las reglas de modelado que salieron de cada fallo de la auditoría, las excepciones documentadas con sus medidas y las lecciones del proceso. Es el complemento técnico del [README](README.md) y del [diario del proceso](proceso/).\n");
writeFileSync(join(dest, "DECISIONES.md"), dec.replace(/\n{3,}/g, "\n\n"));

// 7. Comprobaciones: nada privado ni local en el paquete.
const hallazgos = [];
const recorre = (dir) => {
  for (const f of readdirSync(dir)) {
    if (f === ".git") continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) recorre(p);
    else if (/\.(mjs|js|md|html|json|css|sh|txt)$/.test(f) && statSync(p).size < 8_000_000) {
      if (p.endsWith("scripts/publicar.mjs")) continue; // contiene las expresiones de la comprobación
      const t = readFileSync(p, "utf8");
      if (/\/Users\/julianolarte|\/tmp\/claude-|wamb|julian\.olarte@|datos\.org/.test(t)) hallazgos.push(`${p.replace(dest + "/", "")}: ruta o dato local`);
    }
  }
};
recorre(dest);
if (existsSync(join(dest, "referencias/privadas"))) hallazgos.push("referencias/privadas existe");
if (/privadas\//.test(readFileSync(hoja, "utf8"))) hallazgos.push("la hoja de contactos aún nombra privadas/");
if (hallazgos.length) {
  console.error("HALLAZGOS (no publicar así):\n  " + hallazgos.join("\n  "));
  process.exitCode = 1;
} else console.log("paquete listo en " + dest + " (sin imágenes privadas ni rutas locales)");
