// Construye la página del modelo desmontable del SNC.
//   node build.mjs            → snc.html (tema oscuro)
//   node build.mjs --light    → snc-light.html (claro, el que se muestra)
//   --quick (pintado grueso), --audit (auditoría por vista), --view=<clave>[+<clave>]
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run, k, B, SHARE_SRC, projectionOf } from "./lib/assembly.mjs";
import { VIAS } from "./modelo/vias.mjs";
import { PIECES as ALL_PIECES, CORD_BOTTOM_AT } from "./modelo/piezas.mjs";
import { W, Wd } from "./modelo/marco.mjs";
import { ES, FICHAS, SISTEMAS, CORTOS, CAPAS } from "./textos.mjs";
import { creditOf, thumbnail } from "./lib/referencias.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";

// --solo=a,b,c construye y audita solo esas piezas (sin peana), para iterar en minutos sobre un grupo de pares trabados. Los procesos
// hijos heredan la lista por el entorno. La página que sale es de prueba: se escribe en snc-solo.html y no sustituye a la completa.
const soloArg = process.argv.find((a) => a.startsWith("--solo="));
if (soloArg) process.env.SNC_SOLO = soloArg.slice(7);
const SOLO = process.env.SNC_SOLO ? process.env.SNC_SOLO.split(",") : null;
if (SOLO) {
  const known = new Set(ALL_PIECES.map((p) => p.name));
  const bad = SOLO.filter((n) => !known.has(n));
  if (bad.length) throw new Error(`--solo: piezas desconocidas: ${bad.join(", ")}`);
}
const PIECES = SOLO ? ALL_PIECES.filter((p) => SOLO.includes(p.name)) : ALL_PIECES;

const PALETTES = {
  cortex: { light: ["#cdb3a8", "#d6bfb5", "#dfccc3", "#e8d9d1", "#f1e7e1"], dark: ["#40322d", "#473833", "#4f3e39", "#57453f", "#604c46"] },
  cerebellum: { light: ["#c7a59a", "#d0b1a7", "#d9beb4", "#e2cbc2", "#ebd8d0"], dark: ["#3d2d29", "#44332e", "#4b3833", "#533e38", "#5b443e"] },
  stem: { light: ["#d9c9b9", "#e0d2c4", "#e7dbcf", "#eee4da", "#f5ede5"], dark: ["#46403a", "#4d4640", "#544c46", "#5b534c", "#635a52"] },
  callosum: { light: ["#e6ddcc", "#ebe3d4", "#f0e9dc", "#f4eee3", "#f9f5ed"], dark: ["#50493b", "#575042", "#5e5749", "#655e50", "#6c6557"] },
  septum: { light: ["#e9dfd6", "#eee5dd", "#f2eae3", "#f6f0ea", "#faf6f1"], dark: ["#4e463f", "#554d46", "#5c544d", "#635b54", "#6a625b"] },
  fornix: { light: ["#e2d8c4", "#e8dfcd", "#eee6d7", "#f3ece0", "#f8f3ea"], dark: ["#4d4636", "#544d3d", "#5b5444", "#625b4b", "#696252"] },
  pineal: { light: ["#c7a89d", "#d0b2a8", "#d9bcb3", "#e2c6be", "#ebd1ca"], dark: ["#44322d", "#4b3934", "#52403b", "#594742", "#604e49"] },
  ventricle: { light: ["#b7c6d4", "#c1cfdb", "#cbd7e2", "#d5dfe9", "#dfe7f0"], dark: ["#2f3a46", "#36414d", "#3d4854", "#444f5b", "#4b5662"] },
  hippocampus: { light: ["#c8a9a0", "#d1b3aa", "#dabdb4", "#e3c7bf", "#ecd2cb"], dark: ["#43322e", "#4a3935", "#51403c", "#584743", "#5f4e4a"] },
  amygdala: { light: ["#c9a38f", "#d2ad9a", "#dbb7a5", "#e4c1b0", "#edccbb"], dark: ["#45312a", "#4c3831", "#533f38", "#5a463f", "#614d46"] },
  olfactory: { light: ["#d3c19a", "#dacaa7", "#e1d3b4", "#e8dcc1", "#efe5ce"], dark: ["#4a4030", "#514737", "#584e3e", "#5f5545", "#665c4c"] },
  optic: { light: ["#e0cf8c", "#e6d79d", "#ecdfae", "#f1e7bf", "#f6eed0"], dark: ["#544b2c", "#5b5233", "#62593a", "#696041", "#706748"] },
  dura: { light: ["#c9b9d1", "#d1c3d8", "#d9cddf", "#e1d7e6", "#e9e1ed"], dark: ["#3b3342", "#423a49", "#494150", "#504857", "#574f5e"] },
  graymatter: { light: ["#a9a3a1", "#b2acaa", "#bbb5b3", "#c4bebc", "#cdc7c5"], dark: ["#34312f", "#3b3836", "#423f3d", "#494644", "#504d4b"] },
  root: { light: ["#e8dfa8", "#ede5b5", "#f1ebc2", "#f5f0cf", "#f9f5dc"], dark: ["#554f2b", "#5c5632", "#635d39", "#6a6440", "#716b47"] },
  ganglion: { light: ["#d9cf9a", "#dfd6a7", "#e5ddb4", "#ebe4c1", "#f1ebce"], dark: ["#4f492a", "#565031", "#5d5738", "#645e3f", "#6b6546"] },
  putamen: { light: ["#c9a79a", "#d2b1a5", "#dbbbb0", "#e4c6bb", "#edd2c9"], dark: ["#42302b", "#493731", "#503e38", "#57453f", "#5e4c46"] },
  pallidus: { light: ["#d8c4b8", "#e0cdc2", "#e8d7cc", "#f0e0d6", "#f7eae1"], dark: ["#4a3f38", "#51463f", "#584d46", "#5f544d", "#665b54"] },
  caudate: { light: ["#b9a79d", "#c3b2a8", "#cdbdb3", "#d7c8be", "#e1d3ca"], dark: ["#38312d", "#3f3834", "#463f3b", "#4d4642", "#544d49"] },
  white: { light: ["#e4dcc9", "#e9e2d1", "#eee8da", "#f3eee3", "#f8f4ec"], dark: ["#4d4a40", "#545046", "#5b574d", "#625e53", "#6a6559"] },
  insula: { light: ["#c9b0a6", "#d2bab0", "#dbc4ba", "#e4cec5", "#edd9d1"], dark: ["#3d2e2a", "#443530", "#4b3c37", "#52433e", "#5a4a44"] },
  thalamus: { light: ["#c4bcb6", "#cdc6c0", "#d6d0ca", "#dfdad4", "#e8e4df"], dark: ["#3a3835", "#41403c", "#484744", "#4f4e4b", "#565552"] },
  hypothalamus: { light: ["#d1b9a9", "#dac3b4", "#e3cdbf", "#ecd7ca", "#f4e2d7"], dark: ["#44352c", "#4b3c33", "#52433a", "#594a41", "#605148"] },
  pituitary: { light: ["#c58f86", "#cf9b92", "#d9a79e", "#e3b3ab", "#edc0b9"], dark: ["#5a3430", "#613b37", "#68423e", "#6f4945", "#76504c"] },
  cord: { light: ["#ddd2bd", "#e3d9c7", "#e9e0d1", "#efe8db", "#f5f0e6"], dark: ["#47423a", "#4e4840", "#554f46", "#5c564c", "#645d53"] },
  sel: { light: ["#e0a441", "#e8b45c", "#efc479", "#f5d498", "#fae4b9"], dark: ["#8a5a12", "#9a6718", "#aa7420", "#ba822a", "#c99036"] },
};
const TISSUE = Object.fromEntries(Object.keys(PALETTES).map((n) => [n, n]));

// Vistas de giro: 8 cada 45° a 22° de elevación (la primera, la lateral izquierda de siempre), más la superior y la inferior.
// Nombres que ve el usuario, de mirar las capturas de cada vista (2026-10-25). Se aplican al armar la página, en `page()`. NO deben estar en
// la definición de las vistas: el objeto entero de cada vista entra en la clave de la caché del plan de cortes, y cambiar un nombre
// invalidó horas de cálculo.
const NOMBRES = { "lat-izq": "Lateral izquierda", az075: "Anterior", az120: "Anterior derecha", az165: "Lateral derecha", az210: "Posterior derecha", az255: "Posterior", az300: "Posterior izquierda", az345: "Posterolateral izquierda", sup: "Superior", inf: "Inferior" };
const RING = [30, 75, 120, 165, 210, 255, 300, 345].map((az) => ({ key: `az${String(az).padStart(3, "0")}`, nombre: `Vista ${az}°`, azimuth: az, elevation: 22 }));
const VIEWS = [
  { ...RING[0], key: "lat-izq", nombre: "Lateral izquierda" },
  // az210 (casi de espaldas): el lóbulo temporal ya tiene 4 cortes, el tope, y el par temporal con puente quedaba sin resolver (643 px²);
  // con 6 puede partirse una vez más por la sombra del puente.
  ...RING.slice(1).map((v) => (v.key === "az210" ? { ...v, maxCuts: 6 } : v)),
  { key: "sup", nombre: "Superior", azimuth: 30, elevation: 78 },
  { key: "inf", nombre: "Inferior", azimuth: 30, elevation: -55, base: false },
].map((v) => (SOLO ? { ...v, base: false } : v));
const POST = W(CORD_BOTTOM_AT);

function tissueCss() {
  const names = ["--anatomy-shade-0", "--anatomy-shade-1", "--anatomy-shade-2", "--anatomy-shade-3", "--anatomy-top"];
  const tokens = (t) => Object.entries(PALETTES).map(([name, p]) => p[t].map((c, i) => `--tissue-${name}-${i}:${c}`).join(";")).join(";");
  return (
    `.iso{${tokens("dark")}}\n.iso[data-theme="light"]{${tokens("light")}}\n` +
    Object.keys(PALETTES).map((name) => `.iso [data-tissue="${name}"]{${names.map((n, i) => `${n}:var(--tissue-${name}-${i})`).join(";")}}`).join("\n") +
    `\n.iso .pz[data-sel] [data-tissue]{${names.map((n, i) => `${n}:var(--tissue-sel-${i})`).join(";")}}\n`
  );
}

// Suaviza una ruta de puntos 3D (RAS) con Catmull-Rom y la proyecta a una vista: devuelve el atributo `d` de un trazo SVG.
function viaPath(via, view) {
  const P = projectionOf(SPEC, view);
  const pts = via.pasos.map((p) => W(p));
  const n = pts.length;
  const at = (i) => (via.cerrada ? pts[(i + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]);
  const segs = via.cerrada ? n : n - 1;
  const out = [];
  for (let i = 0; i < segs; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let j = 0; j < 7; j++) {
      const t = j / 7;
      const q = [0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t * t + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t ** 3));
      out.push(k.iso(q, P));
    }
  }
  out.push(k.iso(via.cerrada ? pts[0] : pts[n - 1], P));
  return `${out.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join("")}${via.cerrada ? "Z" : ""}`;
}

// Secciones del visor de cortes (scripts/cortes.mjs). Si no existe el archivo, la página sale sin el visor.
const CORTES = existsSync(join(HERE, "modelo/cortes.json")) ? JSON.parse(readFileSync(join(HERE, "modelo/cortes.json"), "utf8")).planos : null;

// Cómo se proyecta un punto RAS a cada vista (la proyección es afín): origen y vectores de los ejes x, y, z. Sirve para dibujar el plano
// del visor de cortes sobre el modelo en la página sin volver a proyectar en el servidor.
function afin(view) {
  const P = projectionOf(SPEC, view);
  const o = k.iso(W([0, 0, 0]), P);
  const e = (v) => {
    const q = k.iso(W(v), P);
    return [Math.round((q[0] - o[0]) * 1e4) / 1e4, Math.round((q[1] - o[1]) * 1e4) / 1e4];
  };
  return { o: [Math.round(o[0] * 100) / 100, Math.round(o[1] * 100) / 100], X: e([1, 0, 0]), Y: e([0, 1, 0]), Z: e([0, 0, 1]) };
}

function page(rawViews) {
  const views = rawViews.map((v) => ({ ...v, view: { ...v.view, nombre: NOMBRES[v.key] ?? v.view.nombre } }));
  const T = ES;
  const SIS = SISTEMAS.map((s) => ({ ...s, piezas: PIECES.filter((p) => p.sys === s.id).map((p) => p.name) })).filter((s) => s.piezas.length);
  const stack = views.map((v, i) => v.svg.replace("__LABEL__", `${T.aria} Vista: ${v.view.nombre}.`).replace("<svg ", `<svg data-view="${i}"${i === 0 ? " data-on" : ""} aria-hidden="${i === 0 ? "false" : "true"}" `)).join("");
  const dots = views.map((v, i) => `<button type="button" class="snc-dot" data-go="${i}"${i === 0 ? ' aria-current="true"' : ""} aria-label="${v.view.nombre}"></button>`).join("");
  const byName = Object.fromEntries(PIECES.map((p) => [p.name, p]));
  const tree = SIS.map((s) => `<details class="snc-sys" open><summary><label class="snc-check"><input type="checkbox" data-sys="${s.id}" checked><span>${s.nombre}</span></label></summary><ul>${s.piezas.map((name) => `<li class="snc-row" data-row="${name}"><label class="snc-check"><input type="checkbox" data-show="${name}" checked aria-label="${T.mostrar}: ${FICHAS[name].nombre}"></label><button type="button" class="snc-name" data-pick="${name}">${FICHAS[name].nombre}</button><input type="range" class="snc-op" data-op="${name}" min="0.15" max="1" step="0.05" value="1" aria-label="${T.opacidad}: ${FICHAS[name].nombre}"><button type="button" class="snc-iso" data-iso="${name}" aria-pressed="false" title="${T.aislar}">${T.aislar}</button></li>`).join("")}</ul></details>`).join("");
  const fichas = Object.fromEntries(Object.entries(FICHAS).map(([name, f]) => [name, { ...f, img: thumbnail(f.imagen), credito: creditOf(f.imagen) }]));
  const data = {
    views: views.map((v) => ({ key: v.key, nombre: v.view.nombre, rest: v.boxRest, apart: v.boxApart, boxes: v.boxes, afin: afin(v.view) })),
    mats: { ...Object.fromEntries(PIECES.map((p) => [p.name, p.mat])), "sustancia-blanca": "white" },
    cortes: CORTES,
    planos: { coronal: { x: [-75, 75], z: [-135, 85] }, axial: { x: [-75, 75], y: [-108, 85] } },
    pieces: Object.fromEntries(PIECES.map((p) => [p.name, { stage: p.stage }])),
    systems: SIS,
    fichas,
    cortos: CORTOS,
    capas: CAPAS,
    vias: VIAS.map((v) => ({ id: v.id, nombre: v.nombre, color: v.color, ruta: v.ruta, funcion: v.funcion, paths: views.map((vw) => viaPath(v, vw.view)) })),
    text: { pelado: T.pelado, peladoCero: T.peladoCero, peladoQuita: T.peladoQuita, peladoPaso: null, corteCoronalPos: null, corteAxialPos: null, corteDerecha: T.corteDerecha, corteIzquierda: T.corteIzquierda, corteSagitalDice: T.corteSagitalDice, corteVisorDice: T.corteVisorDice, viasRuta: T.viasRuta, viasFuncion: T.viasFuncion, readout: null, fichaVacia: T.fichaVacia, queEs: T.queEs, conecta: T.conecta, credito: T.credito, aislar: T.aislar, quitarAislar: T.quitarAislar, armado: T.armado, desmontado: T.desmontado, cerrar: T.cerrar },
  };
  const live = SHARE_SRC + readFileSync(join(HERE, "lib/assembly-live.js"), "utf8").replace("__DATA__", JSON.stringify(data)).replace("__READOUT__", T.readout.toString()).replace("__PASO__", T.peladoPaso.toString()).replace("__POSCOR__", T.corteCoronalPos.toString()).replace("__POSAX__", T.corteAxialPos.toString());
  const css = B.FIELD_CSS + tissueCss() + readFileSync(join(HERE, "lib/assembly.css"), "utf8");
  const seccion = `<div class="snc-seccion" data-seccion hidden><svg viewBox="-75 -85 150 220" role="img" aria-label="${T.cortes}"><g class="snc-sec-g"></g><g class="snc-sec-ejes"></g></svg><p class="snc-sec-nombre" data-sec-nombre aria-live="polite"></p><button type="button" class="snc-x" data-sec-cerrar aria-label="${T.corteCerrar}">×</button></div>`;
  const plate = `<div class="iso-plate snc-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">SNC</span><span class="iso-plate-corner" data-corner="title">${T.subtitulo}</span><span class="iso-plate-corner" data-corner="hint">${T.pista}</span><span class="iso-plate-corner" data-corner="readout" data-readout></span></div><div class="iso-stage snc-stage" tabindex="0" role="group" aria-roledescription="modelo" aria-label="${T.aria}">${stack}</div><div class="snc-turn"${views.length < 2 ? " hidden" : ""}><button type="button" class="snc-step" data-step="-1" aria-label="Vista anterior">‹</button>${dots}<button type="button" class="snc-step" data-step="1" aria-label="Vista siguiente">›</button></div>${seccion}</div>`;
  const viasList = VIAS.map((v) => `<li><label class="snc-check"><input type="checkbox" data-via="${v.id}"><i class="snc-swatch" style="background:${v.color}" aria-hidden="true"></i><span>${v.nombre}</span></label></li>`).join("");
  const tools = `<section class="snc-box snc-tools" data-fold="cortes"><h2>${T.cortes}</h2><div class="snc-cortes" role="group" aria-label="${T.cortes}"><button type="button" data-corte="sagital">${T.corteSagital}</button><button type="button" data-corte="coronal">${T.corteCoronal}</button><button type="button" data-corte="axial">${T.corteAxial}</button><button type="button" data-corte="ninguno" aria-pressed="true">${T.corteNinguno}</button></div><div class="snc-corte-pos" data-corte-pos hidden><input type="range" id="snc-corte-pos" min="0" max="0" step="1" value="0" aria-label="${T.cortes}"><output data-corte-pos-label></output></div><p class="snc-cortedice" data-corte-dice hidden></p></section><section class="snc-box snc-tools" data-fold="pelado"><h2>${T.peladoRotulos}</h2><div class="snc-peel"><input type="range" id="snc-peel" min="0" max="${CAPAS.length}" step="1" value="0" aria-label="${T.pelado}"><output data-peel-label>${T.peladoCero}</output></div><div class="snc-opts"><label class="snc-select"><span>${T.rotulos}</span><select data-labels><option value="ninguno">${T.rotulosNinguno}</option><option value="seleccion">${T.rotulosSeleccion}</option><option value="todos">${T.rotulosTodos}</option></select></label></div></section><section class="snc-box snc-tools" data-fold="vias"><h2>${T.vias}</h2><ul class="snc-vias-list">${viasList}</ul><p class="snc-viaaviso" data-via-aviso hidden>${T.viasAviso}</p></section>`;
  const panel = `<aside class="snc-panel" aria-label="Controles"><section class="snc-box" data-fold="despiece"><h2>${T.despiece}</h2><div class="snc-explode"><span>${T.armado}</span><input type="range" id="snc-explode" min="0" max="1" step="0.01" value="0" aria-label="${T.despiece}"><span>${T.desmontado}</span></div></section>${tools}<section class="snc-box snc-tree" data-fold="piezas"><h2>${T.piezas}<button type="button" class="snc-all" data-all>${T.todas}</button></h2>${tree}</section><section class="snc-box snc-card" data-fold="ficha" aria-live="polite"><h2>${T.ficha}</h2><div data-ficha><p class="snc-empty">${T.fichaVacia}</p></div></section></aside>`;
  const body = `<style>${css}</style><header class="snc-head"><h1>${T.titulo}</h1><p>${T.subtitulo}</p></header><div class="snc-grid">${plate}${panel}</div><p class="snc-caption">${T.leyenda}</p>`;
  const html = k.pageHtml({ title: T.titulo, theme, body, script: live, width: 1280 }).replace('<html lang="en">', '<html lang="es">');
  return [{ file: `snc${SOLO ? "-solo" : ""}${theme === "light" ? "-light" : ""}.html`, html }];
}

const SPEC = {
  self: fileURLToPath(import.meta.url),
  here: HERE,
  cache: join(HERE, ".cache"),
  width: 640,
  height: 640,
  pad: 20,
  pieces: PIECES,
  autoSplit: true,
  // Tolerancia del orden de pintor (px²): un solape de hasta 4 px² (2×2 píxeles de la figura de 640, unos 3×3 en pantalla) no cuenta. El
  // kit usa 0,25 (menos de una celda de la rejilla); con ese umbral las vistas de giro daban cientos de filas que eran el mismo trocito
  // en cada posición del deslizador. Decidido con Julián el 2026-10-25. La vista lateral izquierda pasa con 0 incluso sin tolerancia.
  orderLeast: 4,
  // Excepciones conocidas del orden de pintor, por vista (pares con comodín «*» para los trozos). Son solapes reales mayores que la
  // tolerancia que no se resolvieron partiendo piezas; cada uno se midió y está documentado en DECISIONES.md.
  allowOrder: [
    { view: "inf", pair: ["caudado-izq*", "hipocampo-izq*"] }, // 134 px², hasta 8,8 mm, en 54 estados: la cola del caudado se entrelaza con el hipocampo
    { view: "sup", pair: ["olfatorio-izq*", "temporal-izq*"] }, // 28 px², hasta 7,8 mm, en un estado
    { view: "az255", pair: ["cuerpo-calloso*", "molde-ventricular-izq*"] }, // 40 px², hasta 18,9 mm, en un estado
    { view: "az210", pair: ["puente-izq*", "temporal-izq*"] }, // 417 px² (antes del tronco continuo, 643), hasta 18,5 mm, en 41 estados: el temporal envuelve la ala del puente; ni con 6 cortes se resolvió
  ],
  views: VIEWS,
  toWorld: Wd,
  tissue: TISSUE,
  paint: { jump: 5, toneSmooth: 2.5, lineSmooth: 0.2, smooth: 0.5 },
  mount: { plinth: { r: 46, h: 9 }, post: { at: [POST[0], POST[1]], r: 3.4, sink: 6 }, on: SOLO && !SOLO.includes("medula") ? undefined : "medula" },
  page,
};
await run(SPEC);
