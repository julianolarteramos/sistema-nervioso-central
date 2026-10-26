// Controles del modelo desmontable. Lee los atributos que emite lib/assembly.mjs: data-part, data-k (clave de pintor
// en reposo), data-l (cuánto sube la clave con el despiece), data-mx/data-my (desplazamiento en pantalla con la pieza
// fuera del todo). El orden de pintor en cada fotograma es k + l × fracción, igual que en la auditoría.
const D = __DATA__;
const READOUT = __READOUT__;
const PASO = __PASO__;
const POSCOR = __POSCOR__;
const POSAX = __POSAX__;
const NS = "http://www.w3.org/2000/svg";
const T = D.text;
const stage = document.querySelector(".snc-stage");
const svgs = [...stage.querySelectorAll("svg[data-view]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const names = Object.keys(D.pieces);
const views = svgs.map((svg) => {
  const items = [...svg.querySelectorAll(":scope > g.pz")].map((g) => ({ g, part: g.dataset.part ?? null, k: +g.dataset.k, l: +g.dataset.l, mx: +g.dataset.mx, my: +g.dataset.my, at: "" }));
  return { svg, items, order: items.slice(), box: "" };
});
const state = { corteIdx: 0, labels: "ninguno", vias: new Set(), viaCard: null, peel: 0, view: 0, hidden: new Set(), opacity: Object.fromEntries(names.map((n) => [n, 1])), isolated: null, selected: null, s: 0, target: 0, v: 0 };
// Capas superpuestas en cada vista: las vías (flujo animado) y los rótulos con su línea de guía. Van dentro del svg, así que siguen el encuadre.
views.forEach((v, i) => {
  v.vias = document.createElementNS(NS, "g");
  v.vias.setAttribute("class", "snc-vias");
  v.vias.setAttribute("pointer-events", "none");
  for (const via of D.vias) {
    const g = document.createElementNS(NS, "g");
    g.dataset.viaId = via.id;
    g.style.display = "none";
    g.style.setProperty("--via", via.color);
    for (const cls of ["snc-via-halo", "snc-via-flow"]) {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("class", cls);
      path.setAttribute("d", via.paths[i]);
      g.appendChild(path);
    }
    v.vias.appendChild(g);
  }
  v.plano = document.createElementNS(NS, "polygon");
  v.plano.setAttribute("class", "snc-plano");
  v.plano.setAttribute("pointer-events", "none");
  v.plano.style.display = "none";
  v.labels = document.createElementNS(NS, "g");
  v.labels.setAttribute("class", "snc-labels");
  v.labels.setAttribute("pointer-events", "none");
  v.svg.append(v.vias, v.plano, v.labels);
});
let frame = 0;
let last = 0;

const shares = () => Object.fromEntries(names.map((n) => [n, shareAt(D.pieces[n].stage, state.s)]));
const visible = (name) => !state.hidden.has(name) && (!state.isolated || state.isolated === name);

function layout() {
  const v = views[state.view];
  const sh = shares();
  // Desplazamiento y orden de pintor.
  for (const it of v.items) {
    const f = it.part ? sh[it.part] : 0;
    const at = f ? `translate(${(it.mx * f).toFixed(2)} ${(it.my * f).toFixed(2)})` : "";
    if (at !== it.at) {
      if (at) it.g.setAttribute("transform", at);
      else it.g.removeAttribute("transform");
      it.at = at;
    }
    it.key = it.k + it.l * f;
  }
  const sorted = v.items.slice().sort((a, b) => a.key - b.key);
  if (sorted.some((it, i) => it !== v.order[i])) {
    const frag = document.createDocumentFragment();
    for (const it of sorted) frag.appendChild(it.g);
    v.svg.insertBefore(frag, v.vias);
    v.order = sorted;
  }
  // El cuadro se abre con el despiece para que nada salga de la tarjeta.
  const meta = D.views[state.view];
  const e = state.s;
  const pad = 14;
  // Tabla de cajas por posición del deslizador (26): interpola entre las dos vecinas; la recta reposo-despiece dejaba fuera piezas.
  let box;
  if (meta.boxes) {
    const t = Math.min(Math.max(e, 0), 1) * (meta.boxes.length - 1);
    const k = Math.min(Math.floor(t), meta.boxes.length - 2);
    const f = t - k;
    box = meta.boxes[k].map((v, i) => v + (meta.boxes[k + 1][i] - v) * f);
  } else box = meta.rest.map((r, i) => r + (meta.apart[i] - r) * e);
  // Con rótulos el cuadro se ensancha a cada lado para que el texto no tape la figura.
  const bw = box[2] - box[0];
  const padX = state.labels === "ninguno" ? pad : pad + (bw / 55) * 10.5;
  const vb = `${(box[0] - padX).toFixed(1)} ${(box[1] - pad).toFixed(1)} ${(bw + 2 * padX).toFixed(1)} ${(box[3] - box[1] + 2 * pad).toFixed(1)}`;
  if (vb !== v.box) {
    v.svg.setAttribute("viewBox", vb);
    v.box = vb;
  }
  decorate(v, { x: box[0] - padX, y: box[1] - pad, w: bw + 2 * padX, h: box[3] - box[1] + 2 * pad, fs: bw / 55 }, sh);
}

// Vías y rótulos de la vista visible.
function decorate(v, vb, sh) {
  // Vías: solo con el modelo armado (al despiece las piezas se separan de su recorrido); el resto de piezas se atenúa.
  const on = state.vias.size > 0;
  const showVias = on && state.s < 0.03;
  v.svg.toggleAttribute("data-vias", showVias);
  v.vias.style.display = showVias ? "" : "none";
  for (const g of v.vias.children) g.style.display = state.vias.has(g.dataset.viaId) ? "" : "none";
  if (v === views[state.view]) document.querySelector("[data-via-aviso]").hidden = !(on && !showVias);
  // Plano del visor de cortes sobre el modelo (solo armado, como las vías).
  const planoOn = (corte.id === "coronal" || corte.id === "axial") && D.cortes && state.s < 0.03;
  v.plano.style.display = planoOn ? "" : "none";
  if (planoOn) {
    const af = D.views[views.indexOf(v)].afin;
    const val = D.cortes[corte.id].valores[state.corteIdx];
    const pl = D.planos[corte.id];
    const pts = corte.id === "coronal" ? [[pl.x[0], val, pl.z[0]], [pl.x[1], val, pl.z[0]], [pl.x[1], val, pl.z[1]], [pl.x[0], val, pl.z[1]]] : [[pl.x[0], pl.y[0], val], [pl.x[1], pl.y[0], val], [pl.x[1], pl.y[1], val], [pl.x[0], pl.y[1], val]];
    v.plano.setAttribute("points", pts.map(([x, y, z]) => `${(af.o[0] + x * af.X[0] + y * af.Y[0] + z * af.Z[0]).toFixed(1)},${(af.o[1] + x * af.X[1] + y * af.Y[1] + z * af.Z[1]).toFixed(1)}`).join(" "));
  }
  // Rótulos.
  const mode = state.labels;
  if (mode === "ninguno") {
    if (v.labels.firstChild) v.labels.replaceChildren();
    return;
  }
  const rects = new Map();
  for (const it of v.items) {
    if (!it.part || !D.cortos[it.part] || !visible(it.part)) continue;
    if (mode === "seleccion" && it.part !== state.selected) continue;
    if (!it.bb) {
      const b = it.g.getBBox();
      if (!b.width) continue;
      it.bb = b;
    }
    const f = sh[it.part];
    const tx = it.mx * f;
    const ty = it.my * f;
    const r = rects.get(it.part) ?? { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    r.x0 = Math.min(r.x0, it.bb.x + tx);
    r.y0 = Math.min(r.y0, it.bb.y + ty);
    r.x1 = Math.max(r.x1, it.bb.x + it.bb.width + tx);
    r.y1 = Math.max(r.y1, it.bb.y + it.bb.height + ty);
    rects.set(it.part, r);
  }
  const cx = vb.x + vb.w / 2;
  const membrana = (n) => n === "dura" || n === "aracnoides";
  const anchors = [...rects].map(([part, r]) => ({ part, ax: (r.x0 + r.x1) / 2, ay: membrana(part) ? r.y0 + (r.y1 - r.y0) * 0.1 : (r.y0 + r.y1) / 2 }));
  const lh = vb.fs * 1.55;
  const out = [];
  for (const side of ["L", "R"]) {
    const col = anchors.filter((a) => (side === "L" ? a.ax < cx : a.ax >= cx)).sort((a, b) => a.ay - b.ay);
    const ys = col.map((a) => a.ay);
    const top = vb.y + lh;
    const bottom = vb.y + vb.h - lh * 0.6;
    for (let i = 0; i < ys.length; i++) ys[i] = Math.max(ys[i], i ? ys[i - 1] + lh : top);
    for (let i = ys.length - 1; i >= 0; i--) ys[i] = Math.min(ys[i], i < ys.length - 1 ? ys[i + 1] - lh : bottom);
    col.forEach((a, i) => {
      const x = side === "L" ? vb.x + vb.fs * 0.8 : vb.x + vb.w - vb.fs * 0.8;
      const gx = side === "L" ? x + (D.cortos[a.part].length * vb.fs * 0.5 + vb.fs * 0.5) : x - (D.cortos[a.part].length * vb.fs * 0.5 + vb.fs * 0.5);
      out.push(`<g class="snc-label"><line x1="${gx.toFixed(1)}" y1="${(ys[i] - vb.fs * 0.3).toFixed(1)}" x2="${a.ax.toFixed(1)}" y2="${a.ay.toFixed(1)}"/><circle cx="${a.ax.toFixed(1)}" cy="${a.ay.toFixed(1)}" r="${(vb.fs * 0.2).toFixed(2)}"/><text x="${x.toFixed(1)}" y="${ys[i].toFixed(1)}" text-anchor="${side === "L" ? "start" : "end"}" font-size="${vb.fs.toFixed(2)}">${esc(D.cortos[a.part])}</text></g>`);
    });
  }
  v.labels.innerHTML = out.join("");
}

function paintState() {
  for (const v of views)
    for (const it of v.items) {
      if (!it.part) continue;
      const on = visible(it.part);
      it.g.style.display = on ? "" : "none";
      const op = state.opacity[it.part];
      it.g.style.opacity = op < 1 ? String(op) : "";
      if (op < 0.6) it.g.setAttribute("data-ghost", "");
      else it.g.removeAttribute("data-ghost");
      if (state.selected === it.part) it.g.setAttribute("data-sel", "");
      else it.g.removeAttribute("data-sel");
    }
  for (const input of document.querySelectorAll("[data-show]")) input.checked = !state.hidden.has(input.dataset.show);
  for (const s of D.systems) {
    const box = document.querySelector(`[data-sys="${s.id}"]`);
    const on = s.piezas.filter((n) => !state.hidden.has(n)).length;
    box.checked = on === s.piezas.length;
    box.indeterminate = on > 0 && on < s.piezas.length;
  }
  for (const b of document.querySelectorAll("[data-iso]")) {
    const on = state.isolated === b.dataset.iso;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.textContent = on ? T.quitarAislar : T.aislar;
  }
  for (const row of document.querySelectorAll("[data-row]")) {
    if (state.selected === row.dataset.row) row.setAttribute("data-sel", "");
    else row.removeAttribute("data-sel");
    if (!visible(row.dataset.row)) row.setAttribute("data-off", "");
    else row.removeAttribute("data-off");
  }
  say();
  if (state.labels !== "ninguno") layout();
  if (corte.id === "coronal" || corte.id === "axial") drawSection();
}

function say() {
  const n = names.filter(visible).length;
  const text = READOUT(n, names.length);
  if (readout.textContent !== text) readout.textContent = text;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function card() {
  const box = document.querySelector("[data-ficha]");
  const via = state.viaCard && D.vias.find((x) => x.id === state.viaCard);
  if (via) {
    box.innerHTML = `<div class="snc-ficha"><h3><i class="snc-swatch" style="background:${via.color}" aria-hidden="true"></i>${esc(via.nombre)}<button type="button" class="snc-x" data-close aria-label="${esc(T.cerrar)}">×</button></h3><p><strong>${esc(T.viasRuta)}.</strong> ${esc(via.ruta)}</p><p><strong>${esc(T.viasFuncion)}.</strong> ${esc(via.funcion)}</p></div>`;
    return;
  }
  const f = state.selected && D.fichas[state.selected];
  if (!f) {
    box.innerHTML = `<p class="snc-empty">${esc(T.fichaVacia)}</p>`;
    return;
  }
  const c = f.credito;
  box.innerHTML = `<div class="snc-ficha"><h3>${esc(f.nombre)}<button type="button" class="snc-x" data-close aria-label="${esc(T.cerrar)}">×</button></h3><figure><img src="${f.img}" alt="${esc(f.nombre)}: imagen de referencia" width="180"><figcaption>${esc(T.credito)}: ${esc(c.autor)} · ${esc(c.licencia)} · <a href="${esc(c.fuente)}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure><p><b>${esc(T.queEs)}.</b> ${esc(f.que)}</p><p><b>${esc(T.conecta)}.</b> ${esc(f.conecta)}</p></div>`;
}

function select(name) {
  state.selected = name;
  if (name) {
    state.viaCard = null;
    abrirSeccion?.("ficha");
  }
  paintState();
  card();
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
  last = now;
  if (still.matches) {
    state.s = state.target;
    state.v = 0;
  } else {
    // Muelle críticamente amortiguado hacia el valor del deslizador (0,18 s).
    const w = 1 / 0.18;
    for (let i = 0; i < 4; i++) {
      const h = dt / 4;
      state.v += (w * w * (state.target - state.s) - 2 * w * state.v) * h;
      state.s += state.v * h;
    }
    if (Math.abs(state.target - state.s) < 1e-4 && Math.abs(state.v) < 1e-4) (state.s = state.target), (state.v = 0);
  }
  state.s = Math.min(1, Math.max(0, state.s));
  layout();
  frame = state.s !== state.target ? requestAnimationFrame(tick) : 0;
}
const wake = () => {
  if (!frame) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
};

function show(index) {
  state.view = (index + views.length) % views.length;
  views.forEach((v, i) => {
    if (i === state.view) v.svg.setAttribute("data-on", "");
    else v.svg.removeAttribute("data-on");
    v.svg.setAttribute("aria-hidden", i === state.view ? "false" : "true");
  });
  document.querySelectorAll(".snc-dot").forEach((dot, i) => (i === state.view ? dot.setAttribute("aria-current", "true") : dot.removeAttribute("aria-current")));
  layout();
}

// ---- Controles ------------------------------------------------------------------------------------------------------
// Ningún control se queda con las flechas: al soltar un deslizador o un botón con el puntero, el foco vuelve a quedar
// libre, y ← → giran el modelo siempre que el foco no esté en un deslizador elegido con el teclado.
const release = (el) => el.addEventListener("pointerup", () => setTimeout(() => el.blur(), 0));
const explode = document.getElementById("snc-explode");
explode.addEventListener("input", () => {
  state.target = +explode.value;
  wake();
});
release(explode);
for (const input of document.querySelectorAll("[data-show]"))
  input.addEventListener("change", () => {
    if (input.checked) state.hidden.delete(input.dataset.show);
    else state.hidden.add(input.dataset.show);
    if (state.isolated && state.hidden.has(state.isolated)) state.isolated = null;
    paintState();
  });
for (const input of document.querySelectorAll("[data-sys]"))
  input.addEventListener("change", () => {
    const sys = D.systems.find((s) => s.id === input.dataset.sys);
    for (const n of sys.piezas) input.checked ? state.hidden.delete(n) : state.hidden.add(n);
    paintState();
  });
for (const input of document.querySelectorAll("[data-op]")) {
  input.addEventListener("input", () => {
    state.opacity[input.dataset.op] = +input.value;
    paintState();
  });
  release(input);
}
for (const b of document.querySelectorAll("[data-iso]")) {
  b.addEventListener("click", () => {
    const n = b.dataset.iso;
    state.isolated = state.isolated === n ? null : n;
    if (state.isolated) state.hidden.delete(n), (state.selected = n);
    paintState();
    card();
  });
  release(b);
}
for (const b of document.querySelectorAll("[data-pick]")) {
  b.addEventListener("click", () => select(state.selected === b.dataset.pick ? null : b.dataset.pick));
  release(b);
}
document.querySelector("[data-all]").addEventListener("click", () => {
  state.hidden.clear();
  state.isolated = null;
  for (const n of names) state.opacity[n] = 1;
  for (const input of document.querySelectorAll("[data-op]")) input.value = "1";
  if (corte.id !== "ninguno") setCorte("ninguno");
  setPeel(0);
});
document.querySelector("[data-ficha]").addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) {
    state.viaCard = null;
    select(null);
  }
});
// Cortes. El sagital medio no necesita geometría nueva: las piezas de la línea media son mitades izquierdas con una cara plana de corte,
// y la mitad derecha del encéfalo es una pieza aparte. Se quita esa mitad y las meninges y se gira a la vista lateral derecha, desde la que
// se ve de frente la cara plana. Volver a «sin corte» devuelve las piezas y la vista de antes.
let corte = { id: "ninguno", vistaAntes: 0 };
const CORTE_SAGITAL = { quita: ["hemisferio-der", "dura", "aracnoides", "hoz", "tienda"], vista: "az165" };
const seccion = document.querySelector("[data-seccion]");
const posBox = document.querySelector("[data-corte-pos]");
const posInput = document.getElementById("snc-corte-pos");
function setCorte(id) {
  if (id === corte.id) return;
  const antes = corte;
  // Deshacer el corte anterior.
  if (antes.id === "sagital") {
    for (const n of CORTE_SAGITAL.quita) state.hidden.delete(n);
    show(antes.vistaAntes);
  }
  corte = { id: "ninguno", vistaAntes: antes.id === "sagital" ? 0 : antes.vistaAntes };
  if (id === "sagital") {
    corte = { id, vistaAntes: state.view };
    state.target = 0;
    explode.value = "0";
    for (const n of CORTE_SAGITAL.quita) state.hidden.add(n);
    state.isolated = null;
    show(D.views.findIndex((v) => v.key === CORTE_SAGITAL.vista));
  } else if (id === "coronal" || id === "axial") {
    corte = { id, vistaAntes: state.view };
    state.target = 0;
    explode.value = "0";
    const vals = D.cortes?.[id]?.valores ?? [];
    posInput.max = String(Math.max(0, vals.length - 1));
    state.corteIdx = Math.max(0, vals.reduce((best, v, i) => (Math.abs(v) < Math.abs(vals[best]) ? i : best), 0));
    posInput.value = String(state.corteIdx);
  }
  const visor = corte.id === "coronal" || corte.id === "axial";
  seccion.hidden = !visor;
  document.querySelector(".snc-plate").toggleAttribute("data-visor", visor);
  posBox.hidden = !visor;
  document.querySelector("[data-corte-dice]").textContent = corte.id === "sagital" ? D.text.corteSagitalDice : visor ? D.text.corteVisorDice : "";
  document.querySelector("[data-corte-dice]").hidden = corte.id === "ninguno";
  document.querySelectorAll("[data-corte]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.corte === corte.id ? "true" : "false"));
  if (visor) drawSection();
  wake();
  layout();
  paintState();
}
posInput.addEventListener("input", () => {
  state.corteIdx = +posInput.value;
  drawSection();
  layout();
});
release(posInput);
document.querySelector("[data-sec-cerrar]").addEventListener("click", () => setCorte("ninguno"));
seccion.addEventListener("click", (event) => {
  const p = event.target.closest?.("path[data-part]");
  if (p && !D.fichas[p.dataset.part]) return;
  select(p ? (state.selected === p.dataset.part ? null : p.dataset.part) : null);
});

// Sección del plano elegido: los contornos precalculados (scripts/cortes.mjs → modelo/cortes.json), de las piezas que están a la vista.
function drawSection() {
  if (corte.id !== "coronal" && corte.id !== "axial") return;
  const plano = D.cortes?.[corte.id];
  if (!plano) return;
  const val = plano.valores[state.corteIdx];
  const [x, y, w, h] = plano.viewBox;
  const svg = seccion.querySelector("svg");
  svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  const membrana = (n) => n === "dura" || n === "aracnoides" || n === "hoz" || n === "tienda";
  const orden = plano.cortes[state.corteIdx].filter((p) => p.p === "sustancia-blanca" || visible(p.p)).sort((a, b) => Number(membrana(b.p)) - Number(membrana(a.p)));
  svg.querySelector(".snc-sec-g").innerHTML = orden
    .map((p) => `<path d="${p.d}" fill-rule="evenodd" data-part="${p.p}" data-tissue="${D.mats[p.p]}"${state.selected === p.p ? " data-sel" : ""}${membrana(p.p) ? ' class="snc-sec-veil"' : ""}><title>${esc(D.cortos[p.p])}</title></path>`)
    .join("");
  svg.querySelector(".snc-sec-ejes").innerHTML = `<text x="${x + 2}" y="${y + h / 2}" font-size="7" class="snc-sec-lado">${esc(D.text.corteDerecha)}</text><text x="${x + w - 2}" y="${y + h / 2}" font-size="7" text-anchor="end" class="snc-sec-lado">${esc(D.text.corteIzquierda)}</text>`;
  const label = corte.id === "coronal" ? POSCOR(val) : POSAX(val);
  document.querySelector("[data-corte-pos-label]").textContent = label;
  seccion.querySelector("[data-sec-nombre]").textContent = state.selected && D.cortos[state.selected] ? D.cortos[state.selected] : "";
}
document.querySelectorAll("[data-corte]").forEach((b) => {
  b.addEventListener("click", () => setCorte(b.dataset.corte));
  release(b);
});

// Pelado por capas: de afuera hacia adentro, en el orden del dossier. El deslizador manda sobre las piezas de las capas (las oculta o las
// vuelve a poner); ocultar a mano una pieza suelta sigue funcionando entre un paso y otro.
const peel = document.getElementById("snc-peel");
function setPeel(p) {
  state.peel = p;
  peel.value = String(p);
  D.capas.forEach((c, i) => {
    for (const n of c.piezas) p > i ? state.hidden.add(n) : state.hidden.delete(n);
  });
  if (state.isolated && state.hidden.has(state.isolated)) state.isolated = null;
  document.querySelector("[data-peel-label]").textContent = p ? `${T.peladoQuita} ${D.capas[p - 1].nombre} (${PASO(p, D.capas.length)})` : T.peladoCero;
  paintState();
  layout();
}
peel.addEventListener("input", () => setPeel(+peel.value));
release(peel);
document.querySelector("[data-labels]").addEventListener("change", (event) => {
  state.labels = event.target.value;
  layout();
});
for (const input of document.querySelectorAll("[data-via]"))
  input.addEventListener("change", () => {
    if (input.checked) {
      state.vias.add(input.dataset.via);
      state.viaCard = input.dataset.via;
      abrirSeccion("ficha");
    } else {
      state.vias.delete(input.dataset.via);
      if (state.viaCard === input.dataset.via) state.viaCard = null;
    }
    layout();
    card();
  });
document.querySelectorAll(".snc-step").forEach((b) => b.addEventListener("click", () => show(state.view + Number(b.dataset.step))));
document.querySelectorAll(".snc-dot").forEach((b) => b.addEventListener("click", () => show(Number(b.dataset.go))));

// Clic o toque en una pieza: la selecciona. Arrastrar en horizontal gira.
let press = null;
stage.addEventListener("pointerdown", (event) => {
  press = { x: event.clientX, y: event.clientY, from: state.view, moved: false };
});
stage.addEventListener("pointermove", (event) => {
  if (!press) return;
  const dx = event.clientX - press.x;
  if (Math.abs(dx) > 6 || Math.abs(event.clientY - press.y) > 6) press.moved = true;
  const steps = Math.trunc(dx / 70);
  if (views.length > 1 && press.from + steps !== state.view) show(press.from + steps);
});
addEventListener("pointerup", (event) => {
  if (press && !press.moved && stage.contains(event.target)) {
    const g = event.target.closest?.("g.pz[data-part]");
    select(g ? (state.selected === g.dataset.part ? null : g.dataset.part) : null);
  }
  press = null;
});
addEventListener("keydown", (event) => {
  const el = document.activeElement;
  const busy = el && el.matches?.('input[type="range"], input[type="text"], textarea, select');
  if (event.key === "Escape") {
    if (state.isolated || state.selected) {
      state.isolated = null;
      select(null);
    }
    return;
  }
  if (busy) return;
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (!step || views.length < 2) return;
  event.preventDefault();
  show(state.view + step);
});
still.addEventListener?.("change", wake);

// Secciones plegables del panel: cada título lleva un botón con una flecha; el estado se recuerda en este navegador (si el almacenamiento
// no está disponible, la página funciona igual). Al elegir una pieza se despliega la ficha.
const PLEGADO = "snc.panel";
let plegado = {};
try {
  plegado = JSON.parse(localStorage.getItem(PLEGADO) ?? "{}");
} catch {}
const porDefecto = { vias: true };
const secciones = {};
document.querySelectorAll(".snc-panel > .snc-box[data-fold]").forEach((box) => {
  const id = box.dataset.fold;
  const h2 = box.querySelector(":scope > h2");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "snc-fold";
  btn.title = T.plegar;
  while (h2.firstChild && !(h2.firstChild.nodeType === 1 && h2.firstChild.tagName === "BUTTON")) btn.appendChild(h2.firstChild);
  h2.prepend(btn);
  const poner = (cerrada, guardar = true) => {
    box.toggleAttribute("data-cerrado", cerrada);
    btn.setAttribute("aria-expanded", String(!cerrada));
    if (guardar) {
      plegado[id] = cerrada;
      try {
        localStorage.setItem(PLEGADO, JSON.stringify(plegado));
      } catch {}
    }
  };
  poner(plegado[id] ?? porDefecto[id] ?? false, false);
  btn.addEventListener("click", () => poner(!box.hasAttribute("data-cerrado")));
  release(btn);
  secciones[id] = { box, poner };
});
const abrirSeccion = (id) => secciones[id]?.box.hasAttribute("data-cerrado") && secciones[id].poner(false);

show(0);
paintState();
card();
window.__snc = { state, layout, paintState, select, show, wake, views, secciones };
