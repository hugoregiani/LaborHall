
/* ═════════════════════════════════════════════════════════════
   7. Motor 3D (Three.js r128 embutido) — mesmo visual da base em 3D do Flowchain Pátio:
      céu com névoa, grama, mapa da base como chão, prédios com faixas e telhados de duas águas,
      código no telhado, árvores, postes, silos e alambrado. Cores dos PSLs pela legenda da planta.
   ═════════════════════════════════════════════════════════════ */
var V3 = {ok:null, groups:{}, items:[], pick:{}, labels:[], sig:'', curScene:null, raf:0, w:0, h:0, hover:null, dirty:true, bounds:{}};
var HEAT = ['#F6DADA', '#E99393', '#D71F34', '#961B24', '#4E0A12'];
var CTX = GEO && GEO.ctx || null;
var GROUND_IMG = (function(){ var el = document.getElementById('re-ground'); return el ? el.getAttribute('data-src') : ''; })();
function hex2(n){ var s = Math.max(0, Math.min(255, Math.round(n))).toString(16); return s.length < 2 ? '0' + s : s; }
function mixHex(a, b, f){ var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  return '#' + hex2(((pa >> 16) & 255) * (1 - f) + ((pb >> 16) & 255) * f) + hex2(((pa >> 8) & 255) * (1 - f) + ((pb >> 8) & 255) * f) + hex2((pa & 255) * (1 - f) + (pb & 255) * f); }
function lumHex(a){ var p = parseInt(a.slice(1), 16); return (0.299 * ((p >> 16) & 255) + 0.587 * ((p >> 8) & 255) + 0.114 * (p & 255)) / 255; }
function heatCol(t){ t = Math.max(0, Math.min(1, isFinite(t) ? t : 0)); var n = HEAT.length - 1, i = Math.min(n - 1, Math.floor(t * n)); return mixHex(HEAT[i], HEAT[i + 1], t * n - i); }
function V3range(info, sc){
  var us = [];
  Object.keys(AREA).forEach(function(k){ if (AREA[k].scene === sc && info[k] && info[k].area > 0) us.push(info[k].tot / info[k].area); });
  us.sort(function(a, b){ return a - b; });
  if (!us.length) return [0, 1];
  var q = function(p){ return us[Math.min(us.length - 1, Math.max(0, Math.round(p * (us.length - 1))))]; };
  var lo = q(0.05), hi = q(0.95); if (hi <= lo) hi = lo + 1;
  return [lo, hi];
}
function v3Supported(){
  if (V3.ok != null) return V3.ok;
  try{ var c = document.createElement('canvas'); V3.ok = typeof THREE !== 'undefined' && !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }catch(e){ V3.ok = false; }
  return V3.ok;
}
/* ── geometria 2D ── */
function polyArea(p){ var a = 0; for (var i = 0, n = p.length; i < n; i++){ var q = p[i], r = p[(i + 1) % n]; a += q[0] * r[1] - r[0] * q[1]; } return a / 2; }
function clipHalf(poly, ax, ay, c, keepGE){
  var out = [], n = poly.length;
  for (var i = 0; i < n; i++){
    var P = poly[i], Q = poly[(i + 1) % n], dp = P[0] * ax + P[1] * ay - c, dq = Q[0] * ax + Q[1] * ay - c;
    if (!keepGE){ dp = -dp; dq = -dq; }
    var inP = dp >= 0, inQ = dq >= 0;
    if (inP) out.push(P);
    if (inP !== inQ){ var t = dp / (dp - dq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
  }
  return out;
}
function cleanPoly(p){
  var q = [];
  p.forEach(function(v){ var l = q[q.length - 1]; if (!l || Math.hypot(v[0] - l[0], v[1] - l[1]) > 0.05) q.push(v); });
  if (q.length > 1 && Math.hypot(q[0][0] - q[q.length - 1][0], q[0][1] - q[q.length - 1][1]) <= 0.05) q.pop();
  var changed = true;
  while (changed && q.length > 3){ changed = false;
    for (var i = 0; i < q.length; i++){ var a = q[(i + q.length - 1) % q.length], b = q[i], c = q[(i + 1) % q.length];
      var cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
      if (Math.abs(cr) / L < 0.02){ q.splice(i, 1); changed = true; break; } } }
  return q;
}
function slab(poly, ax, ay, a, b){ return cleanPoly(clipHalf(clipHalf(poly, ax, ay, a, true), ax, ay, b, false)); }
function sliceParts(parts, ax, ay, weights){
  var tmin = Infinity, tmax = -Infinity;
  parts.forEach(function(p){ p.forEach(function(q){ var t = q[0] * ax + q[1] * ay; if (t < tmin) tmin = t; if (t > tmax) tmax = t; }); });
  var tot = sum(parts.map(function(p){ return Math.abs(polyArea(p)); })), W = sum(weights) || 1, cuts = [tmin], acc = 0;
  var areaTo = function(t){ return sum(parts.map(function(p){ return Math.abs(polyArea(slab(p, ax, ay, tmin - 1, t))); })); };
  for (var i = 0; i < weights.length - 1; i++){
    acc += weights[i] / W * tot;
    var lo = cuts[cuts.length - 1], hi = tmax;
    for (var it = 0; it < 30; it++){ var mid = (lo + hi) / 2; if (areaTo(mid) < acc) lo = mid; else hi = mid; }
    cuts.push((lo + hi) / 2);
  }
  cuts.push(tmax);
  return weights.map(function(w, i){ return parts.map(function(p){ return slab(p, ax, ay, cuts[i], cuts[i + 1]); }).filter(function(q){ return q.length >= 3 && Math.abs(polyArea(q)) > 0.02; }); });
}
function centroidOf(polys){
  var A = 0, X = 0, Z = 0;
  polys.forEach(function(p){ for (var i = 0, n = p.length; i < n; i++){ var q = p[i], r = p[(i + 1) % n], c = q[0] * r[1] - r[0] * q[1]; A += c; X += (q[0] + r[0]) * c; Z += (q[1] + r[1]) * c; } });
  if (Math.abs(A) < 1e-6){ var pp = polys[0][0]; return [pp[0], pp[1]]; }
  return [X / (3 * A), Z / (3 * A)];
}
function inPoly(x, z, p){ var r = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++){ var a = p[i], b = p[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) r = !r; } return r; }
/* maior círculo inscrito aproximado (ponto para o código no telhado) */
function innerPt(p){
  var x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  p.forEach(function(q){ x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); });
  var best = {x:(x0 + x1) / 2, z:(z0 + z1) / 2, r:0};
  for (var i = 0; i < 18; i++) for (var j = 0; j < 18; j++){
    var x = x0 + (i + .5) / 18 * (x1 - x0), z = z0 + (j + .5) / 18 * (z1 - z0); if (!inPoly(x, z, p)) continue;
    var d = Infinity;
    for (var k = 0, n = p.length; k < n; k++){ var a = p[k], b = p[(k + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L)); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); }
    if (d > best.r) best = {x:x, z:z, r:d};
  }
  return best;
}
/* retângulo (4 vértices, ângulos ~retos)? */
function rectInfo(p){
  if (p.length !== 4) return null;
  for (var i = 0; i < 4; i++){ var a = p[i], b = p[(i + 1) % 4], c = p[(i + 2) % 4], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]];
    if (Math.abs(u[0] * v[0] + u[1] * v[1]) / ((Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1])) || 1) > 0.08) return null; }
  return true;
}
/* ── tipos de edificação (cores de parede e telhado como no Flowchain) ── */
var WALL = {galpao:'#d6dbdf', escritorio:'#eceeef', tenda:'#f3f4f0', conteiner:'#c9cdd0', guarita:'#eceeef', tecnico:'#c3c8cc', outro:'#d8dbdd'};
var ROOF = {galpao:'#aab3ba', escritorio:'#7d8890', tenda:'#fafaf6', conteiner:'#8f969c', guarita:'#56616b', tecnico:'#8c959c', outro:'#9aa3aa'};
var WIN = '#3c5366', BASEB = '#a7abad';
function tipoOf(a){
  var n = norm(a.name), c = a.code;
  if (/^CT\d/.test(a.lbl)) return 'conteiner';
  if (/TENDA/.test(n) || (a.site === 'R007520' && /^B0/.test(c))) return 'tenda';
  if (/GUARITA|PORTARIA/.test(n)) return 'guarita';
  if (/SUBESTACAO|BOMBA|ETDI/.test(n)) return 'tecnico';
  if (/ESCRITORIO|EDIFICIO|LABORATORIO|VESTIARIO|LAZER/.test(n)) return 'escritorio';
  if (/GALPAO|ALMOXARIFADO|SHOP|LAVADOR|SILOS|RESIDUO|EDIFICACAO/.test(n)) return 'galpao';
  return 'outro';
}
function tagName(k){ var a = AREA[k]; if (!a) return k; return a.kind === 'y' && !a.schem ? a.name.replace(/^Pátio /, 'Pátio ') : areaShort(k); }
function roofCode(a){ if (a.schem) return a.code; return /^\d+$/.test(a.lbl) ? 'B' + a.lbl : a.lbl; }
/* faixas de parede: [y0, y1, cor] — cor da faixa principal = PSL (legenda da planta) */
function bands(tipo, h, c, wall){
  var w = mixHex(wall, c, 0.2);
  switch (tipo){
    case 'galpao': return [[0, 1, BASEB], [1, Math.max(1.2, h - 2.1), w], [Math.max(1.2, h - 2.1), h - 0.35, c], [h - 0.35, h, w]];
    case 'escritorio': case 'guarita':
      return h >= 6 ? [[0, .9, w], [.9, 2.2, WIN], [2.2, 3.9, w], [3.9, 5.2, WIN], [5.2, h - 0.8, w], [h - 0.8, h, c]] : [[0, .9, w], [.9, 2.1, WIN], [2.1, h - 0.6, w], [h - 0.6, h, c]];
    case 'tenda': return [[0, .45, '#b9bdb9'], [.45, h - 1.3, w], [h - 1.3, h - 0.3, c], [h - 0.3, h, w]];
    case 'conteiner': return [[0, h, c]];
    default: return [[0, h - 0.7, w], [h - 0.7, h, c]];
  }
}
function floorBands(fh, c){ var w = mixHex('#eceeef', c, 0.35); return [[0, .9, w], [.9, 2.2, WIN], [2.2, fh, w]]; }
/* ── texturas procedurais ── */
function canvasTex(w, h, draw){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }
function stripes(n, dark, light){
  var t = canvasTex(128, 128, function(g, w, h){ g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); var s = w / n; for (var x = 0; x < w; x += s){ g.fillStyle = 'rgba(0,0,0,' + dark + ')'; g.fillRect(x, 0, s * .22, h); g.fillStyle = 'rgba(255,255,255,' + light + ')'; g.fillRect(x + s * .4, 0, s * .16, h); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
/* ── montagem de malhas ── */
function Acc(){ this.pos = []; this.col = []; this.uv = []; }
Acc.prototype.tri = function(a, b, c, uv, col){ this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (var i = 0; i < 3; i++){ this.uv.push(uv[i][0], uv[i][1]); this.col.push(col.r, col.g, col.b); } };
Acc.prototype.quad = function(a, b, c, d, uv, col){ this.tri(a, b, c, [uv[0], uv[1], uv[2]], col); this.tri(a, c, d, [uv[0], uv[2], uv[3]], col); };
Acc.prototype.geo = function(){ var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); return g; };
var TMPC = null;
function ccol(hex){ TMPC = TMPC || new THREE.Color(); return TMPC.set(hex).clone(); }
/* paredes por faixas ao longo do perímetro (CCW visto de cima) */
function addWalls(acc, poly, y0, bandList){
  var p = polyArea(poly) > 0 ? poly.slice().reverse() : poly, u = 0;
  for (var i = 0; i < p.length; i++){
    var a = p[i], b = p[(i + 1) % p.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue;
    bandList.forEach(function(bd){ if (bd[1] - bd[0] < 0.02) return; var c = ccol(bd[2]), lo = y0 + bd[0], hi = y0 + bd[1];
      acc.quad([a[0], lo, a[1]], [b[0], lo, b[1]], [b[0], hi, b[1]], [a[0], hi, a[1]], [[u, lo], [u + L, lo], [u + L, hi], [u, hi]], c); });
    u += L;
  }
}
function addFlatRoof(acc, poly, y, hex){
  var p = polyArea(poly) > 0 ? poly : poly.slice().reverse(), c = ccol(hex);
  var tris = THREE.ShapeUtils.triangulateShape(p.map(function(q){ return new THREE.Vector2(q[0], q[1]); }), []);
  tris.forEach(function(t){ var A = p[t[0]], B = p[t[1]], C = p[t[2]];
    if ((B[1] - A[1]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[1] - A[1]) < 0){ var tmp = B; B = C; C = tmp; }
    acc.tri([A[0], y, A[1]], [B[0], y, B[1]], [C[0], y, C[1]], [[A[0], A[1]], [B[0], B[1]], [C[0], C[1]]], c); });
}
/* telhado de duas águas: cumeeira paralela ao eixo ax, na linha média (u0..u1) do prédio original */
function addGable(roofAcc, wallAcc, poly, y, ax, uRange, g, roofHex, wallHex){
  var cr = ccol(roofHex), cw = ccol(wallHex), n = [-ax[1], ax[0]], um = (uRange[0] + uRange[1]) / 2;
  var P = function(q){ return [q[0] * ax[0] + q[1] * ax[1], q[0] * n[0] + q[1] * n[1]]; };
  var W = function(t, u, yy){ return [ax[0] * t + n[0] * u, yy, ax[1] * t + n[1] * u]; };
  var tt = poly.map(function(q){ return P(q)[0]; }), t0 = Math.min.apply(null, tt), t1 = Math.max.apply(null, tt);
  var hU = function(u){ return y + g * (1 - Math.abs(u - um) / ((uRange[1] - uRange[0]) / 2 || 1)); };
  var e0 = [W(t0, uRange[0], y), W(t1, uRange[0], y)], e1 = [W(t0, uRange[1], y), W(t1, uRange[1], y)], r0 = W(t0, um, y + g), r1 = W(t1, um, y + g);
  var cen = new THREE.Vector3(ax[0] * (t0 + t1) / 2 + n[0] * um, y, ax[1] * (t0 + t1) / 2 + n[1] * um);
  var face = function(acc, a, b, c, col){ var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), C = new THREE.Vector3().fromArray(c);
    var nn = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)), m = new THREE.Vector3().addVectors(A, B).add(C).multiplyScalar(1 / 3).sub(cen);
    var uv = [a, b, c].map(function(v){ return [v[0] + v[2], v[1]]; });
    if (nn.dot(m) < 0) acc.tri(a, c, b, [uv[0], uv[2], uv[1]], col); else acc.tri(a, b, c, uv, col); };
  face(roofAcc, e0[0], e0[1], r1, cr); face(roofAcc, e0[0], r1, r0, cr);
  face(roofAcc, e1[0], e1[1], r1, cr); face(roofAcc, e1[0], r1, r0, cr);
  face(wallAcc, e0[0], e1[0], r0, cw); face(wallAcc, e0[1], e1[1], r1, cw);
  return {t0:t0, t1:t1, um:um, n:n, hU:hU};
}
/* ── cena ── */
function v3Init(){
  if (V3.renderer) return true;
  if (!v3Supported()) return false;
  var wrap = document.createElement('div'); wrap.className = 'v3d-wrap';
  var R;
  try{ R = new THREE.WebGLRenderer({antialias:true}); }catch(e){ V3.ok = false; return false; }
  R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  wrap.appendChild(R.domElement);
  var lbls = document.createElement('div'); lbls.className = 'v3d-lbls'; wrap.appendChild(lbls);
  var tip = document.createElement('div'); tip.className = 'v3d-tip'; wrap.appendChild(tip);
  var ctl = document.createElement('div'); ctl.className = 'v3d-ctl';
  ctl.innerHTML = '<button type="button" class="chip sm on" data-v3="fs" title="Abrir a planta 3D em tela cheia">⛶ Tela cheia</button><button type="button" class="chip sm" data-v3="reset" title="Voltar à visão geral">⟲ Visão geral</button><button type="button" class="chip sm" data-v3="top" title="Ver de cima, como a planta">Vista de topo</button><button type="button" class="chip sm" data-v3="lbl" title="Mostrar ou ocultar as etiquetas de valor">Etiquetas</button>';
  wrap.appendChild(ctl);
  var hint = document.createElement('div'); hint.className = 'v3d-hint'; hint.textContent = 'Clique para abrir em tela cheia · arraste para girar · roda = zoom · botão direito = mover'; wrap.appendChild(hint);
  // minimapa (fica no canto inferior direito da tela cheia)
  var mm = document.createElement('div'); mm.className = 'v3-map';
  mm.innerHTML = '<canvas></canvas><span>Mapa · clique para ir</span>';
  var scene = new THREE.Scene();
  var horizon = new THREE.Color('#dbe6ee');
  scene.background = horizon; scene.fog = new THREE.Fog(horizon, 1100, 3000);
  var sky = new THREE.Mesh(new THREE.SphereGeometry(3200, 32, 16), new THREE.ShaderMaterial({side:THREE.BackSide, depthWrite:false, fog:false,
    uniforms:{top:{value:new THREE.Color('#6fa6dc')}, horizon:{value:horizon}},
    vertexShader:'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader:'uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float t = pow(max(vP.y,0.0), 0.55); gl_FragColor = vec4(mix(horizon, top, t), 1.0); }'}));
  sky.renderOrder = -1; scene.add(sky);
  var cam = new THREE.PerspectiveCamera(34, 1.6, 2, 9000);
  var ctrls = new THREE.OrbitControls(cam, R.domElement);
  ctrls.enableDamping = true; ctrls.dampingFactor = 0.09; ctrls.maxPolarAngle = Math.PI * 0.46; ctrls.minDistance = 18; ctrls.maxDistance = 1500;
  ctrls.screenSpacePanning = false; ctrls.zoomSpeed = 0.9; ctrls.rotateSpeed = 0.7;
  scene.add(new THREE.HemisphereLight(0xd7e7f7, 0x7d7462, 0.52));
  var sun = new THREE.DirectionalLight(0xfff3df, 0.6);
  sun.position.set(170, 300, 130); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  var scam = sun.shadow.camera; scam.left = -340; scam.right = 340; scam.top = 230; scam.bottom = -230; scam.near = 40; scam.far = 900;
  sun.shadow.bias = -0.0005;
  scene.add(sun); scene.add(sun.target);
  Object.assign(V3, {renderer:R, wrap:wrap, lbls:lbls, tip:tip, ctl:ctl, mm:mm, mmc:mm.querySelector('canvas'), scene:scene, cam:cam, ctrls:ctrls, sun:sun,
    ray:new THREE.Raycaster(), mv:new THREE.Vector2(), tv:new THREE.Vector3(),
    wallTex:stripes(4, .07, .25), roofTex:stripes(5, .12, .3)});
  V3.wallTex.__shared = V3.roofTex.__shared = true;
  V3.wallTex.repeat.set(1 / 1.2, 1 / 1.2); V3.roofTex.repeat.set(1 / 1.2, 1 / 1.2);
  ctrls.addEventListener('change', function(){ V3.dirty = true; });
  var dom = R.domElement;
  dom.addEventListener('pointerdown', function(e){ V3.down = {x:e.clientX, y:e.clientY, b:e.button}; V3.tw = null; });
  dom.addEventListener('pointerup', function(e){
    var d = V3.down; V3.down = null;
    if (!d || d.b !== 0 || Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 6) return;
    var m = v3Pick(e);
    if (!S.ui.fs){ S.ui.fs = true; if (m){ S.ui.sel3d = m.userData.key; S.ui.patch = m.userData.patch || ''; } v3Tip(null); render(true); return; }
    if (m){ var k = m.userData.key; S.ui.patch = m.userData.patch || ''; S.ui.sel3d = (S.ui.sel3d === k && !m.userData.patch) ? null : k; }
    else { S.ui.sel3d = null; S.ui.patch = ''; }
    v3Tip(null); render(true);
  });
  dom.addEventListener('pointermove', function(e){
    if (e.buttons){ v3Tip(null); return; }
    var m = v3Pick(e), k = m ? m.userData.key : null;
    if (k !== V3.hover){ V3.hover = k; v3Apply(); }
    dom.style.cursor = m ? 'pointer' : (S.ui.fs ? '' : 'zoom-in');
    v3Tip(m, e);
  });
  dom.addEventListener('pointerleave', function(){ if (V3.hover){ V3.hover = null; v3Apply(); } v3Tip(null); });
  ctl.addEventListener('click', function(e){
    var b = e.target.closest('[data-v3]'); if (!b) return;
    var a = b.getAttribute('data-v3');
    if (a === 'fs'){ S.ui.fs = true; render(true); }
    else if (a === 'reset') v3Fit(S.ui.scene, false, true);
    else if (a === 'top') v3Fit(S.ui.scene, true, true);
    else if (a === 'lbl'){ S.ui.labels = !S.ui.labels; saveUI(); v3Apply(); render(true); }
  });
  V3.mmc.addEventListener('click', function(e){
    var r = V3.mmc.getBoundingClientRect(), B = V3.bounds[S.ui.scene]; if (!B) return;
    var x = B.x0 + (e.clientX - r.left) / r.width * (B.x1 - B.x0), z = B.z0 + (e.clientY - r.top) / r.height * (B.z1 - B.z0);
    var t = new THREE.Vector3(x, 0, z), off = V3.cam.position.clone().sub(V3.ctrls.target);
    v3Go(t, t.clone().add(off), true);
  });
  return true;
}
function v3Clear(){
  V3.scene.traverse(function(o){ if (o.userData && o.userData.keep) return; });
  Object.keys(V3.groups).forEach(function(k){ var g = V3.groups[k]; V3.scene.remove(g); g.traverse(function(o){ if (o.geometry) o.geometry.dispose(); if (o.material){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){ if (m.map && !m.map.__shared) m.map.dispose(); m.dispose(); }); } }); });
  V3.groups = {}; V3.items = []; V3.pick = {};
  V3.labels.forEach(function(l){ l.el.remove(); }); V3.labels = [];
}
function stdMat(opts){ var m = new THREE.MeshStandardMaterial(opts); m.userData.base = {op:1}; return m; }
/* cenário fixo da base: grama, via norte, mapa da base, silos, alambrado, postes e árvores */
function v3Context(g){
  var C = CTX, Pd = C.Pd;
  var grass = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), new THREE.MeshStandardMaterial({color:'#67844e', roughness:1, metalness:0}));
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.3; grass.receiveShadow = true; g.add(grass);
  var road = new THREE.Mesh(new THREE.PlaneGeometry(7000, 30), new THREE.MeshStandardMaterial({color:'#5b5e63', roughness:.95}));
  road.rotation.x = -Math.PI / 2; road.position.set(0, -0.12, -172); road.receiveShadow = true; g.add(road);
  if (GROUND_IMG){
    var tex = new THREE.TextureLoader().load(GROUND_IMG, function(){ V3.dirty = true; });
    tex.anisotropy = 8; tex.__shared = true;
    var gp = new THREE.Mesh(new THREE.PlaneGeometry(Pd.x1 - Pd.x0, Pd.z1 - Pd.z0), new THREE.MeshStandardMaterial({map:tex, roughness:.92, metalness:0}));
    gp.rotation.x = -Math.PI / 2; gp.position.set((Pd.x0 + Pd.x1) / 2, 0, (Pd.z0 + Pd.z1) / 2); gp.receiveShadow = true; g.add(gp);
  }
  var steel = new THREE.MeshStandardMaterial({color:'#d3d7da', roughness:.45, metalness:.55}), dark = new THREE.MeshStandardMaterial({color:'#4a5056', roughness:.6, metalness:.4});
  (C.Ud || []).forEach(function(s){
    var body = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r, 9.5, 24), steel); body.position.set(s.x, 10.25, s.z);
    var cone = new THREE.Mesh(new THREE.CylinderGeometry(.35, s.r, 1.1, 24), steel); cone.position.set(s.x, 15.55, s.z);
    var hop = new THREE.Mesh(new THREE.CylinderGeometry(s.r, .25, 2.2, 24), steel); hop.position.set(s.x, 4.4, s.z);
    [body, cone, hop].forEach(function(m){ m.castShadow = m.receiveShadow = true; g.add(m); });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(o){ var l = new THREE.Mesh(new THREE.BoxGeometry(.18, 4.4, .18), dark); l.position.set(s.x + o[0] * s.r * .62, 2.2, s.z + o[1] * s.r * .62); l.castShadow = true; g.add(l); });
  });
  // alambrado: postes e travessas ao longo do limite da base própria
  var posts = [], rails = [];
  if (C.Id) for (var i = 0; i < C.Id.length; i++){
    var a = C.Id[i], b = C.Id[(i + 1) % C.Id.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < .2) continue;
    var n = Math.max(1, Math.round(L / 3));
    for (var k = 0; k <= n; k++) posts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    rails.push({x:(a[0] + b[0]) / 2, z:(a[1] + b[1]) / 2, L:L, r:Math.atan2(b[0] - a[0], b[1] - a[1])});
  }
  var fm = new THREE.MeshStandardMaterial({color:'#7d8790', roughness:.5, metalness:.6}), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
  var mk = function(x, y, z, sx, sy, sz, ry){ E.set(0, ry || 0, 0); Q.setFromEuler(E); return M4.compose(V1.set(x, y, z), Q, V2.set(sx, sy, sz)).clone(); };
  var inst = function(geo, mat, mats, cast){ if (!mats.length) return; var im = new THREE.InstancedMesh(geo, mat, mats.length); mats.forEach(function(m, i){ im.setMatrixAt(i, m); }); im.castShadow = !!cast; im.receiveShadow = true; g.add(im); return im; };
  inst(new THREE.CylinderGeometry(.045, .045, 2.5, 6), fm, posts.map(function(p){ return mk(p[0], 1.25, p[1], 1, 1, 1); }), false);
  var rl = []; rails.forEach(function(r){ rl.push(mk(r.x, .15, r.z, 1, 1, r.L, r.r)); rl.push(mk(r.x, 2.4, r.z, 1, 1, r.L, r.r)); });
  inst(new THREE.BoxGeometry(.04, .04, 1), fm, rl, false);
  var mesh = canvasTex(64, 64, function(c, w, h){ c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(160,168,176,1)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w / 2, 0); c.lineTo(w, h / 2); c.lineTo(w / 2, h); c.closePath(); c.stroke(); });
  mesh.wrapS = mesh.wrapT = THREE.RepeatWrapping;
  var fa = new Acc(), fu = 0, white = ccol('#ffffff');
  rails.forEach(function(r){ var dx = Math.sin(r.r) * r.L / 2, dz = Math.cos(r.r) * r.L / 2, a = [r.x - dx, r.z - dz], b = [r.x + dx, r.z + dz];
    fa.quad([a[0], .1, a[1]], [b[0], .1, b[1]], [b[0], 2.4, b[1]], [a[0], 2.4, a[1]], [[fu / 1.2, 0], [(fu + r.L) / 1.2, 0], [(fu + r.L) / 1.2, 2], [fu / 1.2, 2]], white); fu += r.L; });
  if (fa.pos.length){ var fmesh = new THREE.Mesh(fa.geo(), new THREE.MeshStandardMaterial({map:mesh, alphaTest:.4, side:THREE.DoubleSide, roughness:.5, metalness:.5})); g.add(fmesh); }
  // postes de iluminação
  var rnd = (function(s){ return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(17);
  var poles = [], arms = [], refl = [];
  (C.Gd || []).forEach(function(p){ var r = rnd() * Math.PI * 2, c = Math.cos(r), s = Math.sin(r);
    poles.push(mk(p[0], 6, p[1], 1, 1, 1, r)); arms.push(mk(p[0], 11.8, p[1], 1, 1, 1, r));
    [-.75, .75].forEach(function(o){ refl.push(mk(p[0] + s * o, 11.75, p[1] + c * o, 1, 1, 1, r)); }); });
  inst(new THREE.CylinderGeometry(.1, .16, 12, 8), steel, poles, true);
  inst(new THREE.BoxGeometry(.1, .1, 1.6), steel, arms, false);
  inst(new THREE.BoxGeometry(.6, .18, .4), dark, refl, false);
  // árvores: as da planta e o entorno de grama
  var trunks = [], crowns = [], cols = ['#5d8247', '#557a40', '#6a8f4e', '#4f7139', '#729653'], ccs = [];
  var tr = (function(s){ return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(99);
  var tree = function(x, z, s){ trunks.push(mk(x, 1.5 * s, z, s, s, s)); crowns.push(mk(x, 4.2 * s, z, s * (.9 + tr() * .3), s * (.9 + tr() * .25), s * (.9 + tr() * .3), tr() * 6)); ccs.push(cols[Math.floor(tr() * cols.length)]); };
  (C.Kd || []).forEach(function(t){ tree(t[0], t[1], t[2]); });
  var areas = [C.Id, C.Ld, C.Rd].filter(Boolean), near = function(x, z){ for (var i = 0; i < areas.length; i++) for (var dx = -8; dx <= 8; dx += 8) for (var dz = -8; dz <= 8; dz += 8) if (inPoly(x + dx, z + dz, areas[i])) return true; return false; };
  var roadBand = function(x, z){ return (z < -150 && z > -190) || (z > 90 && z < 108 && x > -215 && x < 150) || (x > 58 && x < 80 && z < -36); };
  for (var t = 0, placed = 0; t < 4000 && placed < 420; t++){ var x = (tr() * 2 - 1) * 650, z = -430 + tr() * 840; if (roadBand(x, z) || near(x, z)) continue; tree(x, z, .8 + tr() * .7); placed++; }
  inst(new THREE.CylinderGeometry(.2, .3, 3, 6), new THREE.MeshStandardMaterial({color:'#6b5137', roughness:1}), trunks, true);
  var cm = inst(new THREE.IcosahedronGeometry(2.4, 0), new THREE.MeshStandardMaterial({color:'#ffffff', roughness:1, flatShading:true}), crowns, true);
  if (cm){ ccs.forEach(function(c, i){ cm.setColorAt(i, ccol(c)); }); cm.instanceColor.needsUpdate = true; }
}
/* chão e pátios pintados das áreas sem planta (layout esquemático) */
function yardPaint(g, poly, hex, text, sub){
  var x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  poly.forEach(function(q){ x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); });
  var W = Math.max(64, Math.min(1024, Math.round((x1 - x0) * 12))), H = Math.max(64, Math.min(1024, Math.round((z1 - z0) * 12)));
  var tex = canvasTex(W, H, function(c, w, h){
    c.fillStyle = mixHex(hex, '#ffffff', .35); c.fillRect(0, 0, w, h);
    c.globalAlpha = .18; c.fillStyle = '#000'; for (var i = 0; i < w * h / 90; i++) c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); c.globalAlpha = 1;
    c.strokeStyle = mixHex(hex, '#000000', .25); c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
    var fs = Math.min(h * .32, w / Math.max(4, text.length) * 1.5); c.font = '800 ' + fs + 'px Inter, "Segoe UI", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = fs * .14; c.strokeStyle = 'rgba(0,0,0,.35)'; c.strokeText(text, w / 2, h / 2 - (sub ? fs * .25 : 0)); c.fillStyle = '#ffffff'; c.fillText(text, w / 2, h / 2 - (sub ? fs * .25 : 0));
    if (sub){ c.font = '700 ' + fs * .42 + 'px Inter, Arial, sans-serif'; c.fillText(sub, w / 2, h / 2 + fs * .55); }
  });
  var m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({map:tex, roughness:.92}));
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .03, (z0 + z1) / 2); m.receiveShadow = true; g.add(m);
}
function v3Build(){
  var A = agg(), ref = A.ref, sig = ref + '|' + M.ver;
  if (V3.sig === sig) return;
  V3.sig = sig; v3Clear();
  var info = areaInfo(ref);
  ['base', 'R007522', 'R010713'].forEach(function(sc){
    var g = new THREE.Group(); g.visible = sc === S.ui.scene; V3.scene.add(g); V3.groups[sc] = g;
    var keys = Object.keys(AREA).filter(function(k){ return AREA[k].scene === sc; });
    var off = [0, 0];
    if (sc === 'base' && CTX){ v3Context(g); V3.bounds.base = {x0:CTX.Pd.x0, x1:CTX.Pd.x1, z0:CTX.Pd.z0, z1:CTX.Pd.z1}; }
    else {
      var x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      keys.forEach(function(k){ AREA[k].parts.forEach(function(pt){ pt.polys.forEach(function(pg){ pg.forEach(function(p){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }); }); }); });
      off = [(x0 + x1) / 2, (z0 + z1) / 2];
      var hx = (x1 - x0) / 2 + 14, hz = (z1 - z0) / 2 + 14;
      var grass = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({color:'#67844e', roughness:1})); grass.rotation.x = -Math.PI / 2; grass.position.y = -.3; grass.receiveShadow = true; g.add(grass);
      var pad = new THREE.Mesh(new THREE.PlaneGeometry(hx * 2, hz * 2), new THREE.MeshStandardMaterial({color:'#5f6368', roughness:.95})); pad.rotation.x = -Math.PI / 2; pad.position.y = 0; pad.receiveShadow = true; g.add(pad);
      V3.bounds[sc] = {x0:-hx - 30, x1:hx + 30, z0:-hz - 30, z1:hz + 30};
    }
    keys.forEach(function(k){
      var a = AREA[k], inf = info[k], tipo = tipoOf(a);
      var pof = function(pt){ return pt.polys.map(function(pg){ return pg.map(function(p){ return [p[0] - off[0], p[1] - off[1]]; }); }); };
      var all = []; a.parts.forEach(function(pt){ all = all.concat(pof(pt)); });
      all = all.map(cleanPoly).filter(function(p){ return p.length >= 3; });
      var item = {key:k, sc:sc, kind:a.kind, tipo:tipo, nodata:!inf, meshes:[], polys:all};
      V3.items.push(item);
      var reg = function(m, ud){ ud.key = k; ud.kind = a.kind; m.userData = ud; item.meshes.push(m); (V3.pick[sc] || (V3.pick[sc] = [])).push(m); };
      if (a.kind === 'y'){
        var ck = inf ? Object.keys(inf.ck).sort(function(x, y){ return inf.ck[y].a - inf.ck[x].a; })[0] : null;
        a.parts.forEach(function(pt){ pof(pt).forEach(function(pg){
          if (a.schem) yardPaint(g, pg, ck ? planCol(ck) : '#c9cdd0', ck ? planName(ck) : a.code, inf ? fM2(inf.area) : '');
          var shp = new THREE.Shape(pg.map(function(q){ return new THREE.Vector2(q[0], -q[1]); }));
          var geo = new THREE.ShapeGeometry(shp); geo.rotateX(-Math.PI / 2); geo.translate(0, .09, 0);
          var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color:'#ffffff', transparent:true, opacity:0, depthWrite:false}));
          m.renderOrder = 1; g.add(m);
          reg(m, {ck:ck, psl:ck ? inf.ck[ck].psl : null, patch:pt.lbl, ov:true, poly:pg});
        }); });
        item.ck = ck; item.top = .4;
      } else {
        var H = a.h || 6, ax = a.parts[0].ax || [1, 0];
        var wAcc = {}, rAcc = {}, sl = [];
        var pieces = [];
        var addSl = function(CK, y0, hh, floors){
          var cks = Object.keys(CK).sort(function(x, y){ return CK[y].a - CK[x].a; });
          var parts = cks.length > 1 ? sliceParts(all, ax[0], ax[1], cks.map(function(c){ return Math.max(CK[c].a, 0.01); })) : [all];
          cks.forEach(function(c, i){ (parts[i] || []).forEach(function(pg){ pieces.push({poly:pg, ck:c, psl:CK[c].psl, y0:y0, h:hh, floor:floors}); }); });
        };
        if (!inf) all.forEach(function(pg){ pieces.push({poly:pg, ck:null, psl:null, y0:0, h:H}); });
        else if (a.code === 'B34' && a.site === 'R008015'){
          var fls = Object.keys(inf.fl).sort(), nF = Math.max(4, fls.length), fh = H / nF;
          for (var fi = 0; fi < nF; fi++){
            if (fls[fi]) addSl(inf.fl[fls[fi]], fi * fh, fh, true);
            else all.forEach(function(pg){ pieces.push({poly:pg, ck:null, psl:null, y0:fi * fh, h:fh, floor:true}); });
          }
        } else addSl(inf.ck, 0, H, false);
        // telhado de duas águas para galpões e tendas retangulares (cumeeira no eixo do prédio)
        var rect = (tipo === 'galpao' || tipo === 'tenda') && all.length === 1 && rectInfo(all[0]);
        var uR = null, gH = 0;
        if (rect){ var nn = [-ax[1], ax[0]], us = all[0].map(function(q){ return q[0] * nn[0] + q[1] * nn[1]; }); uR = [Math.min.apply(null, us), Math.max.apply(null, us)];
          var shortW = uR[1] - uR[0]; gH = tipo === 'tenda' ? Math.min(shortW * .28, 5) : Math.min(shortW * .1, 3); }
        var topY = 0, labelInfo = null;
        pieces.forEach(function(p){
          var col = p.ck ? planCol(p.ck) : '#5f6b76', wall = WALL[tipo], roof = p.ck ? mixHex(planCol(p.ck), ROOF[tipo], 0.45) : ROOF[tipo];
          var wa = new Acc(), ra = new Acc();
          addWalls(wa, p.poly, p.y0, p.floor ? floorBands(p.h, p.ck ? planCol(p.ck) : '#eceeef') : bands(tipo, p.h, col, wall));
          var isTop = !p.floor || p.y0 + p.h >= H - 0.01;
          if (rect && !p.floor && rectInfo(p.poly)){ var gi = addGable(ra, wa, p.poly, p.y0 + p.h, ax, uR, gH, roof, wall); if (!labelInfo) labelInfo = {gable:gi, y:p.y0 + p.h}; }
          else if (isTop || true) addFlatRoof(ra, p.poly, p.y0 + p.h, roof);
          topY = Math.max(topY, p.y0 + p.h + (rect ? gH : 0));
          var wm = new THREE.Mesh(wa.geo(), stdMat({vertexColors:true, map:V3.wallTex, roughness:.62, metalness:.18}));
          var rm = new THREE.Mesh(ra.geo(), stdMat({vertexColors:true, map:V3.roofTex, roughness:.5, metalness:.3}));
          [wm, rm].forEach(function(m){ m.castShadow = m.receiveShadow = true; g.add(m); reg(m, {ck:p.ck, psl:p.psl, part:m === wm ? 'w' : 'r', nodata:!p.ck}); });
        });
        item.top = topY; item.eave = H;
        // código no telhado
        var code = roofCode(a), big = all.slice().sort(function(x, y){ return Math.abs(polyArea(y)) - Math.abs(polyArea(x)); })[0];
        if (rect && labelInfo){ var gi2 = labelInfo.gable, hw = (uR[1] - uR[0]) / 2, slope = Math.hypot(hw, gH);
          var side = gi2.n[1] >= 0 ? 1 : -1, uMid = gi2.um + side * hw / 2;
          var c3 = new THREE.Vector3(ax[0] * (gi2.t0 + gi2.t1) / 2 + gi2.n[0] * uMid, labelInfo.y + gH / 2 + .08, ax[1] * (gi2.t0 + gi2.t1) / 2 + gi2.n[1] * uMid);
          var right = new THREE.Vector3(ax[0], 0, ax[1]); var up = new THREE.Vector3(-gi2.n[0] * side * hw, gH, -gi2.n[1] * side * hw).normalize();
          if (new THREE.Vector3().crossVectors(right, up).y < 0) right.negate();
          item.roofLbl = {code:code, c:c3, right:right, up:up, hMax:slope * .55, wMax:(gi2.t1 - gi2.t0) * .8};
        } else { var ip = innerPt(big); item.roofLbl = {code:code, c:new THREE.Vector3(ip.x, topY + .06, ip.z), right:new THREE.Vector3(1, 0, 0), up:new THREE.Vector3(0, 0, -1), hMax:ip.r * .9, wMax:ip.r * 1.7}; }
      }
      var c = centroidOf(all), el = document.createElement('div');
      el.className = 'v3d-lbl'; el.style.display = 'none';
      V3.lbls.appendChild(el);
      V3.labels.push({el:el, key:k, sc:sc, kind:a.kind, nodata:!inf, pos:new THREE.Vector3(c[0], (item.top || 6) + 1.5, c[1]), vis:false, lit:true, html:''});
      a.c3 = [c[0], c[1], item.top || 6, Math.sqrt(Math.abs(sum(all.map(polyArea))))];
      a.mm = all; a.off = off;
    });
    v3RoofLabels(g, V3.items.filter(function(it){ return it.sc === sc && it.roofLbl; }));
  });
  V3.labels.sort(function(a, b){ return (info[b.key] ? info[b.key].tot : 0) - (info[a.key] ? info[a.key].tot : 0); });
  V3.curScene = S.ui.scene;
  V3.needFit = true; V3.mmSig = '';
}
/* atlas com os códigos pintados nos telhados (como no Flowchain) */
function v3RoofLabels(g, list){
  if (!list.length) return;
  var per = 8, rows = Math.ceil(list.length / per), W = 2048, H = 88 * rows, wid = [];
  var tex = canvasTex(W, H, function(c){ c.clearRect(0, 0, W, H); c.font = '800 62px Inter, "Segoe UI", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    list.forEach(function(it, i){ var x = i % per * 256 + 128, y = Math.floor(i / per) * 88 + 47; wid[i] = Math.min(248, c.measureText(it.roofLbl.code).width + 18);
      c.lineWidth = 8; c.strokeStyle = 'rgba(255,255,255,0.55)'; c.strokeText(it.roofLbl.code, x, y); c.fillStyle = '#12344D'; c.fillText(it.roofLbl.code, x, y); }); });
  tex.anisotropy = 8;
  var acc = new Acc(), white = ccol('#ffffff');
  list.forEach(function(it, i){ var L = it.roofLbl, asp = wid[i] / 88, s = Math.max(1.1, Math.min(L.hMax, 7)); if (s * asp > L.wMax) s = Math.max(.9, L.wMax / asp);
    var w = s * asp, nrm = new THREE.Vector3().crossVectors(L.right, L.up).normalize(), cc = L.c.clone().addScaledVector(nrm, .08);
    var P = function(a, b){ var v = cc.clone().addScaledVector(L.right, a * w / 2).addScaledVector(L.up, b * s / 2); return [v.x, v.y, v.z]; };
    var cx = i % per * 256 + 128, cy = Math.floor(i / per) * 88, u0 = (cx - wid[i] / 2) / W, u1 = (cx + wid[i] / 2) / W, v1 = 1 - cy / H, v0 = 1 - (cy + 88) / H;
    acc.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], white);
    it.lblIdx = i; });
  var m = new THREE.Mesh(acc.geo(), new THREE.MeshStandardMaterial({map:tex, transparent:true, depthWrite:false, roughness:.8, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2}));
  m.renderOrder = 2; g.add(m); V3.roofMesh = V3.roofMesh || {}; V3.roofMesh[g.uuid] = m;
}
function v3Apply(){
  if (!V3.renderer) return;
  var A = agg(), info = areaInfo(A.ref), sel = S.ui.sel3d, f = S.f, filt = f.facs.length || f.psls.length || f.st || f.q;
  var mode = S.ui.color3d, rg = mode === 'usd' ? V3range(info, S.ui.scene) : null, refM = A.byM[A.ref] || {key:{}};
  V3.items.forEach(function(it){
    var i = info[it.key], isSel = sel && it.key === sel, isHov = V3.hover && it.key === V3.hover;
    var heat = i && mode === 'usd' ? heatCol((i.tot / (i.area || 1) - rg[0]) / (rg[1] - rg[0])) : null;
    it.meshes.forEach(function(m){
      var u = m.userData, lit = true;
      if (filt){ lit = !!refM.key[it.key] && !it.nodata; if (lit && f.psls.length && u.psl && f.psls.indexOf(u.psl) < 0) lit = false; }
      if (u.ov){ // sobreposição dos pátios (o chão já é pintado)
        var col = '#ffffff', op = 0;
        if (isSel){ col = '#CC0000'; op = .45; }
        else if (sel || (filt && !lit)){ col = '#1c2226'; op = .42; }
        else if (heat){ col = heat; op = .82; }
        else if (isHov){ col = '#ffffff'; op = .32; }
        if (isHov && !isSel && op < .3){ col = '#ffffff'; op = .32; }
        m.material.color.set(col); m.material.opacity = op; return;
      }
      var op2 = sel ? (isSel ? 1 : .16) : (lit ? 1 : .14);
      m.material.opacity = op2; m.material.transparent = op2 < 1; m.material.depthWrite = op2 >= 1;
      if (heat){ m.material.vertexColors = false; m.material.color.set(u.part === 'r' ? mixHex(heat, '#ffffff', .12) : heat); }
      else { m.material.vertexColors = true; m.material.color.set('#ffffff'); }
      m.material.emissive.setHex(isSel ? 0x1E0000 : isHov ? 0x222222 : 0x000000);
      m.material.needsUpdate = true;
      m.castShadow = op2 >= 1;
    });
  });
  if (V3.selLine){ V3.selLine.parent && V3.selLine.parent.remove(V3.selLine); V3.selLine.geometry.dispose(); V3.selLine = null; }
  var si = sel && V3.items.filter(function(it){ return it.key === sel; })[0];
  if (si){
    var pts = [], ys = si.kind === 'y' ? [.25] : [.12, (si.eave || 6) + .06];
    si.polys.forEach(function(p){ for (var j = 0; j < p.length; j++){ var a = p[j], b = p[(j + 1) % p.length]; ys.forEach(function(y){ pts.push(a[0], y, a[1], b[0], y, b[1]); }); } });
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    V3.selLine = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({color:0xCC0000, transparent:true, opacity:.95, depthTest:si.kind !== 'y'}));
    V3.selLine.renderOrder = 5; V3.groups[si.sc].add(V3.selLine);
  }
  V3.labels.forEach(function(L){
    L.lit = filt ? !!refM.key[L.key] : true;
    var isSel = L.key === sel, i2 = info[L.key];
    var html = '<i style="--dot:' + (i2 ? planCol(Object.keys(i2.ck).sort(function(a, b){ return i2.ck[b].c - i2.ck[a].c; })[0]) : '#999') + '"></i>' + esc(tagName(L.key)) + (i2 ? ' · ' + esc(fUSk(i2.tot)) : '');
    var cls = 'v3d-lbl' + (isSel ? ' sel' : '');
    if (html !== L.html || cls !== L.cls){ L.html = html; L.cls = cls; L.el.innerHTML = html; L.el.className = cls; }
  });
  var lb = V3.ctl && V3.ctl.querySelector('[data-v3="lbl"]'); if (lb) lb.classList.toggle('on', !!S.ui.labels);
  var fsb = V3.ctl && V3.ctl.querySelector('[data-v3="fs"]'); if (fsb) fsb.style.display = S.ui.fs ? 'none' : '';
  V3.mmSig = ''; V3.dirty = true;
}
function v3Labels(){
  var w = V3.w, h = V3.h, v = V3.tv, sel = S.ui.sel3d, filt = S.f.facs.length || S.f.psls.length || S.f.st || S.f.q, boxes = [];
  V3.labels.forEach(function(L){
    var show = L.sc === S.ui.scene && (L.key === sel || (S.ui.labels && !L.nodata && (L.lit || !filt) && (!sel || L.key === sel)));
    var x = 0, y = 0;
    if (show){ v.copy(L.pos).project(V3.cam); if (v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) show = false; }
    if (show){
      x = (v.x + 1) / 2 * w; y = (1 - v.y) / 2 * h;
      var bw = L.el.textContent.length * 6.6 + 26, bx = [x - bw / 2, y - 26, x + bw / 2, y - 4];
      if (L.key !== sel) for (var i = 0; i < boxes.length; i++){ var o = boxes[i]; if (bx[0] < o[2] && bx[2] > o[0] && bx[1] < o[3] && bx[3] > o[1]){ show = false; break; } }
      if (show) boxes.push(bx);
    }
    if (!show){ if (L.vis){ L.el.style.display = 'none'; L.vis = false; } return; }
    if (!L.vis){ L.el.style.display = ''; L.vis = true; }
    L.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-110%)';
  });
}
function v3Pick(ev){
  var r = V3.renderer.domElement.getBoundingClientRect();
  V3.mv.x = (ev.clientX - r.left) / r.width * 2 - 1; V3.mv.y = -(ev.clientY - r.top) / r.height * 2 + 1;
  V3.ray.setFromCamera(V3.mv, V3.cam);
  var hits = V3.ray.intersectObjects(V3.pick[S.ui.scene] || [], false);
  return hits.length ? hits[0].object : null;
}
function v3Tip(m, ev){
  var t = V3.tip; if (!t) return;
  if (!m){ t.style.display = 'none'; return; }
  var u = m.userData, i = areaInfo(agg().ref)[u.key], a = AREA[u.key];
  var h = '<b>' + esc(areaLabel(u.key)) + '</b>';
  if (!i) h += '<span>Sem custo alocado no relatório</span>';
  else {
    if (u.ck && i.ck[u.ck]) h += '<span><i style="background:' + planCol(u.ck) + '"></i>' + esc(planName(u.ck)) + ' · ' + esc(fUS(i.ck[u.ck].c)) + ' · ' + esc(fM2(i.ck[u.ck].a)) + '</span>';
    h += '<span>Total da área: ' + esc(fUS(i.tot)) + ' · ' + esc(fM2(i.area)) + '</span>';
    if (u.kind === 'y' && a.parts.length > 1) h += '<span>Trecho: ' + esc(u.patch) + '</span>';
  }
  if (!S.ui.fs) h += '<span class="tip-k">Clique para abrir em tela cheia</span>';
  t.innerHTML = h; t.style.display = 'block';
  var r = V3.wrap.getBoundingClientRect(), x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
  if (x + t.offsetWidth > r.width - 8) x = ev.clientX - r.left - t.offsetWidth - 12;
  if (y + t.offsetHeight > r.height - 8) y = ev.clientY - r.top - t.offsetHeight - 12;
  t.style.transform = 'translate(' + x + 'px,' + y + 'px)';
}
function v3Fit(sc, top, anim){
  var g = V3.groups[sc]; if (!g || !V3.w) return;
  var B = V3.bounds[sc], c, sx, sz;
  if (sc === 'base' && CTX){ var I = CTX.Id.concat(CTX.Ld), xs = I.map(function(p){ return p[0]; }), zs = I.map(function(p){ return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    c = new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2 + 6); sx = x1 - x0; sz = z1 - z0; }
  else { c = new THREE.Vector3((B.x0 + B.x1) / 2, 0, (B.z0 + B.z1) / 2); sx = B.x1 - B.x0 - 40; sz = B.z1 - B.z0 - 40; }
  var tv = Math.tan(V3.cam.fov * Math.PI / 360), effW = V3.w - (S.ui.fs && V3.w > 1180 ? 414 : 0), effH = V3.h - (S.ui.fs ? (V3.w > 1180 ? 190 : 120) : 0);
  var dist = Math.max(sx / 2 * V3.h / (tv * effW), sz / 2 * (top ? 1 : .78) * V3.h / (tv * effH)) * (top ? 1.04 : 1.1);
  var pos = top ? new THREE.Vector3(c.x, dist, c.z + 0.01) : new THREE.Vector3(c.x - dist * .04, dist * .64, c.z + dist * .77);
  var R = Math.max(sx, sz) / 2 + 60, sc2 = V3.sun.shadow.camera;
  sc2.left = -R; sc2.right = R; sc2.top = R * .7; sc2.bottom = -R * .7; sc2.updateProjectionMatrix();
  V3.sun.position.set(c.x + 170, 300, c.z + 130); V3.sun.target.position.copy(c); V3.sun.target.updateMatrixWorld();
  v3Go(c, pos, anim);
}
function v3Go(target, pos, anim){
  if (!anim){ V3.ctrls.target.copy(target); V3.cam.position.copy(pos); V3.ctrls.update(); V3.dirty = true; return; }
  V3.tw = {t0:performance.now(), d:650, ft:V3.ctrls.target.clone(), fp:V3.cam.position.clone(), tt:target.clone(), tp:pos.clone()};
}
function v3Fly(key){
  var a = AREA[key]; if (!a || !a.c3) return;
  var t = new THREE.Vector3(a.c3[0], a.c3[2] * 0.4, a.c3[1]);
  var d = Math.max(80, a.c3[3] * 3.2 + a.c3[2] * 3);
  var dir = V3.cam.position.clone().sub(V3.ctrls.target).normalize();
  if (dir.y < 0.35){ dir.y = 0.55; dir.normalize(); }
  v3Go(t, t.clone().add(dir.multiplyScalar(d)), true);
}
/* ── minimapa: mapa de cima, área selecionada, campo de visão da câmera; clique para ir ── */
function v3MapBase(){
  var sc = S.ui.scene, B = V3.bounds[sc], cv = V3.mmc; if (!B || !cv) return null;
  var W = cv.width, H = cv.height, base = V3.mmBase || (V3.mmBase = document.createElement('canvas')); base.width = W; base.height = H;
  var c = base.getContext('2d'), X = function(x){ return (x - B.x0) / (B.x1 - B.x0) * W; }, Z = function(z){ return (z - B.z0) / (B.z1 - B.z0) * H; };
  c.fillStyle = '#67844e'; c.fillRect(0, 0, W, H);
  if (sc === 'base' && V3.gImg && V3.gImg.complete && V3.gImg.naturalWidth) c.drawImage(V3.gImg, 0, 0, W, H);
  else { c.fillStyle = '#5f6368'; var p = 30; c.fillRect(X(B.x0 + p), Z(B.z0 + p), X(B.x1 - p) - X(B.x0 + p), Z(B.z1 - p) - Z(B.z0 + p)); }
  var A = agg(), info = areaInfo(A.ref), sel = S.ui.sel3d, f = S.f, filt = f.facs.length || f.psls.length || f.st || f.q, refM = A.byM[A.ref] || {key:{}};
  var rg = S.ui.color3d === 'usd' ? V3range(info, sc) : null;
  V3.items.filter(function(it){ return it.sc === sc; }).forEach(function(it){
    var i = info[it.key], lit = !filt || (!!refM.key[it.key] && !it.nodata);
    if (it.kind === 'y' && !(sel === it.key) && !(rg && i)) return;
    var col = !i ? '#c9cdd0' : rg ? heatCol((i.tot / (i.area || 1) - rg[0]) / (rg[1] - rg[0])) : planCol(Object.keys(i.ck).sort(function(a, b){ return i.ck[b].a - i.ck[a].a; })[0]);
    c.globalAlpha = sel ? (sel === it.key ? 1 : .35) : (lit ? .95 : .3);
    it.polys.forEach(function(p){ c.beginPath(); p.forEach(function(q, j){ j ? c.lineTo(X(q[0]), Z(q[1])) : c.moveTo(X(q[0]), Z(q[1])); }); c.closePath(); c.fillStyle = col; c.fill();
      c.lineWidth = sel === it.key ? 2.5 : .6; c.strokeStyle = sel === it.key ? '#CC0000' : 'rgba(20,23,24,.45)'; c.stroke(); });
  });
  c.globalAlpha = 1;
  return base;
}
function v3MapDraw(){
  var cv = V3.mmc; if (!cv || !cv.isConnected) return;
  var sc = S.ui.scene, B = V3.bounds[sc]; if (!B) return;
  var rect = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(rect.width * dpr), H = Math.round(rect.width * (B.z1 - B.z0) / (B.x1 - B.x0) * dpr);
  if (!W || !H) return;
  if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; cv.style.height = (H / dpr) + 'px'; V3.mmSig = ''; }
  var sig = sc + '|' + V3.sig + '|' + W;
  if (V3.mmSig !== sig || !V3.mmCache){ V3.mmCache = v3MapBase(); V3.mmSig = sig; }
  var c = cv.getContext('2d'); c.clearRect(0, 0, W, H); if (V3.mmCache) c.drawImage(V3.mmCache, 0, 0);
  var X = function(x){ return (x - B.x0) / (B.x1 - B.x0) * W; }, Z = function(z){ return (z - B.z0) / (B.z1 - B.z0) * H; };
  // campo de visão: cantos da tela projetados no chão
  var cam = V3.cam, pts = [], o = cam.position, d = new THREE.Vector3();
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(nd){
    d.set(nd[0], nd[1], .5).unproject(cam).sub(o).normalize();
    var t = d.y < -0.02 ? -o.y / d.y : 2200; t = Math.min(t, 2200);
    pts.push([o.x + d.x * t, o.z + d.z * t]);
  });
  c.beginPath(); pts.forEach(function(p, i){ i ? c.lineTo(X(p[0]), Z(p[1])) : c.moveTo(X(p[0]), Z(p[1])); }); c.closePath();
  c.fillStyle = 'rgba(255,255,255,.18)'; c.fill();
  var tg = V3.ctrls.target;
  c.beginPath(); c.moveTo(X(o.x), Z(o.z)); c.lineTo(X(tg.x), Z(tg.z)); c.lineWidth = 1.5 * dpr; c.strokeStyle = 'rgba(255,255,255,.9)'; c.setLineDash([4 * dpr, 3 * dpr]); c.stroke(); c.setLineDash([]);
  c.beginPath(); c.arc(X(tg.x), Z(tg.z), 4 * dpr, 0, Math.PI * 2); c.fillStyle = '#CC0000'; c.fill(); c.lineWidth = 2 * dpr; c.strokeStyle = '#fff'; c.stroke();
  c.beginPath(); c.arc(X(o.x), Z(o.z), 3 * dpr, 0, Math.PI * 2); c.fillStyle = '#141718'; c.fill();
}
function v3Loop(){
  if (!V3.wrap || !V3.wrap.isConnected){ V3.raf = 0; return; }
  V3.raf = requestAnimationFrame(v3Loop);
  var w = V3.wrap.clientWidth, h = V3.wrap.clientHeight;
  if (!w || !h) return;
  if (w !== V3.w || h !== V3.h){ V3.w = w; V3.h = h; V3.renderer.setSize(w, h, false); V3.cam.aspect = w / h;
    // na tela cheia, centraliza a base no espaço livre entre os painéis sobrepostos
    var ox = S.ui.fs && w > 1180 ? 207 : 0, oy = S.ui.fs ? (w > 1180 ? -48 : -24) : 0;
    if (ox || oy) V3.cam.setViewOffset(w, h, ox, oy, w, h); else V3.cam.clearViewOffset();
    V3.cam.updateProjectionMatrix(); V3.dirty = true; }
  if (V3.needFit){ V3.needFit = false; v3Fit(S.ui.scene, false, false); if (V3.flyKey){ v3Fly(V3.flyKey); V3.flyKey = null; } }
  if (V3.tw){
    var k = Math.min(1, (performance.now() - V3.tw.t0) / V3.tw.d), e = 1 - Math.pow(1 - k, 3);
    V3.ctrls.target.lerpVectors(V3.tw.ft, V3.tw.tt, e); V3.cam.position.lerpVectors(V3.tw.fp, V3.tw.tp, e);
    if (k >= 1) V3.tw = null;
    V3.dirty = true;
  }
  if (V3.ctrls.update()) V3.dirty = true;
  if (!V3.dirty) return;
  V3.dirty = false;
  V3.renderer.render(V3.scene, V3.cam);
  v3Labels();
  if (S.ui.fs) v3MapDraw();
}
function v3Mount(){
  var host = $(S.ui.fs ? '#v3fs' : '#v3d'); if (!host) return;
  if (!v3Init()){ host.innerHTML = '<div class="v3d-nogl">Este navegador não liberou WebGL (aceleração gráfica), necessário para a visualização 3D.<br>Abra o arquivo no Chrome ou no Edge atualizados.</div>'; return; }
  if (!V3.gImg && GROUND_IMG){ V3.gImg = new Image(); V3.gImg.onload = function(){ V3.mmSig = ''; V3.dirty = true; }; V3.gImg.src = GROUND_IMG; }
  if (V3.lastFs !== !!S.ui.fs){ if (V3.lastFs != null){ if (S.ui.sel3d && sceneOfKey(S.ui.sel3d) === S.ui.scene) V3.flyKey = S.ui.sel3d; else V3.needFit = true; } V3.lastFs = !!S.ui.fs; V3.w = 0; }
  host.appendChild(V3.wrap);
  var mh = $('#v3map'); if (mh && S.ui.fs) mh.appendChild(V3.mm);
  v3Build();
  if (V3.curScene !== S.ui.scene){
    Object.keys(V3.groups).forEach(function(k){ V3.groups[k].visible = k === S.ui.scene; });
    V3.curScene = S.ui.scene; V3.needFit = true;
  }
  v3Apply();
  if (V3.flyKey && !V3.needFit){ v3Fly(V3.flyKey); V3.flyKey = null; }
  V3.dirty = true;
  if (!V3.raf) V3.raf = requestAnimationFrame(v3Loop);
}
