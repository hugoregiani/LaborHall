(function(){
'use strict';
/* Fonte do próprio arquivo, capturada antes de qualquer renderização: base do "Exportar HTML". */
var SEED_TAG = '<script id="re-data" type="application/json">';
var SRC = null;
try{
  var seedEl = document.getElementById('re-data'), full = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
  var so = seedEl ? seedEl.outerHTML : '', at = so ? full.indexOf(so) : -1;
  if (at >= 0) SRC = [full.slice(0, at), full.slice(at + so.length)];
}catch(e){}

/* ═════════════════════════════════════════════════════════════
   1. Utilidades
   ═════════════════════════════════════════════════════════════ */
var LOGO = '__LOGO__';
function $(s, r){ return (r || document).querySelector(s); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function strip(s){ return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function norm(s){ return strip(s).toUpperCase().replace(/\s+/g, ' ').trim(); }
function compact(s){ return norm(s).replace(/[^A-Z0-9$]/g, ''); }
function num(v){
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (v == null || v === '') return 0;
  var raw = String(v).trim(), neg = /^\(.*\)$/.test(raw);
  var s = raw.replace(/[^\d,.\-]/g, '');
  if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.indexOf(',') >= 0) s = s.replace(',', '.');
  var n = parseFloat(s); return isFinite(n) ? (neg ? -Math.abs(n) : n) : 0;
}
function pad(n){ return (n < 10 ? '0' : '') + n; }
function r2(n){ return Math.round(n * 100) / 100; }
function sum(a){ var t = 0; for (var i = 0; i < a.length; i++) t += a[i]; return t; }
function median(a){ var b = a.slice().sort(function(x, y){ return x - y; }), n = b.length; if (!n) return 0; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
var NF0 = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:0});
var NF1 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits:1, maximumFractionDigits:1});
var NF2 = new Intl.NumberFormat('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
function fUS(v){ var n = Math.round(v); return (n < 0 ? '−' : '') + 'US$ ' + NF0.format(Math.abs(n)); }
function fUSk(v){
  var a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e6) return s + 'US$ ' + NF2.format(a / 1e6) + ' mi';
  if (a >= 1e4) return s + 'US$ ' + NF1.format(a / 1e3) + ' mil';
  return s + 'US$ ' + NF0.format(a);
}
function fUSkH(v){ // para os cards de KPI: unidades em corpo menor
  var a = Math.abs(v), sg = v < 0 ? '−' : '', n, u = '';
  if (a >= 1e6){ n = NF2.format(a / 1e6); u = 'mi'; } else if (a >= 1e4){ n = NF1.format(a / 1e3); u = 'mil'; } else n = NF0.format(a);
  return '<small class="pre">US$</small>' + sg + n + (u ? '<small>' + u + '</small>' : '');
}
function fUSs(v){ // compacto, para rótulos de barras
  var a = Math.abs(v), s = v < 0 ? '−' : '';
  if (a >= 1e6) return s + NF1.format(a / 1e6) + ' mi';
  if (a >= 1e3) return s + NF1.format(a / 1e3) + ' mil';
  return s + NF0.format(a);
}
function fUSd(v){ return (v > 0.5 ? '+' : '') + fUS(v); }
function fM2u(v){ return isFinite(v) && v ? 'US$ ' + NF2.format(v) : '—'; } // US$ por m²
function fM2(v){ return NF0.format(v) + ' m²'; }
function fN(v){ return NF0.format(v); }
function fPct(v){ return isFinite(v) ? NF1.format(v * 100) + '%' : '—'; }
var MES_C = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
var MES_L = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
function mLbl(k){ if (!k) return '—'; var p = k.split('-'); return MES_C[+p[1] - 1] + '/' + p[0].slice(2); }
function mLong(k){ if (!k) return '—'; var p = k.split('-'); return MES_L[+p[1] - 1] + ' ' + p[0]; }
var PAL = ['#CC0000','#43494E','#961B24','#A8AFB5','#720F1A','#7F878D','#D71F34','#2A2F30','#6D757A','#BEC4C9'];
var OUTROS = '#D4DADD';

/* ═════════════════════════════════════════════════════════════
   2. Base embutida (planilha 900204_RES Macaé 2026) e geometria da planta
   ═════════════════════════════════════════════════════════════ */
var DATA = JSON.parse(($('#re-data') || {}).textContent || 'null');
var GEO = JSON.parse(($('#re-geo') || {}).textContent || 'null');
var EMBED_AT = DATA && DATA.exportedAt || '';
var LS_DATA = 'laborhall.re.macae.data', UI_KEY = 'laborhall.re.macae.ui';
var LOCAL = false;
try{
  var lsd = JSON.parse(localStorage.getItem(LS_DATA) || 'null');
  if (lsd && lsd.rows && lsd.savedAt && lsd.savedAt > EMBED_AT){ DATA = lsd; LOCAL = true; }
}catch(e){}

var SITE = {
  R008015:{fac:'Macae Field Camp', name:'Base Cavaleiros'},
  R007520:{fac:'Macae Field Camp Parking', name:'Área alugada (Parking)'},
  R007522:{fac:'Macae Bunker', name:'Bunker'},
  R010713:{fac:'Porto do Açu', name:'Porto do Açu'}
};
var FAC_NAME = {'Macae Field Camp':'Macaé Field Camp', 'Macae Field Camp Parking':'Field Camp Parking', 'Macae Bunker':'Macaé Bunker', 'Porto do Açu':'Porto do Açu'};
var FAC_COL = {'Macae Field Camp':'#CC0000', 'Porto do Açu':'#43494E', 'Macae Bunker':'#961B24', 'Macae Field Camp Parking':'#A8AFB5'};
function facName(f){ return FAC_NAME[f] || f; }
function facCol(f, i){ return FAC_COL[f] || PAL[(i + 4) % PAL.length]; }

/* Cores da legenda da planta R008015 (quadro de áreas de pátio) */
var PLAN = {
  'Baroid':{c:'#FFFF7F', n:'BAROID'}, 'CMTG':{c:'#B85C73', n:'CMT'}, 'HCT':{c:'#FF962E', n:'HCT'}, 'IEM':{c:'#C16EDD', n:'IEM'},
  'L&T':{c:'#FF7F7F', n:'PML · L&T'}, 'PE':{c:'#FFC78F', n:'PE'}, 'TSS':{c:'#FF007F', n:'TSS'}, 'WLP':{c:'#7FFFFF', n:'WP · WLP'},
  'HDBS':{c:'#DDB1C9', n:'HDBS'}, 'SDS':{c:'#7F9FFF', n:'SPERRY · SDS'}, 'HPS':{c:'#DDA56E', n:'HPS · FlexTubo'},
  'HPS-N2':{c:'#4D8F7E', n:'HPS · Nitrogênio'}, 'Quality':{c:'#356010', n:'SQ · Quality'}, 'PPS':{c:'#0000FF', n:'PPS'},
  'DME Maintenance':{c:'#BF7FFF', n:'DME'},
  'BD':{c:'#B9BEC2', n:'BD', sup:1}, 'CPM':{c:'#A7AEB3', n:'CPM', sup:1}, 'F&A - Tax':{c:'#C9CDD0', n:'F&A - Tax', sup:1}, 'HR':{c:'#B0B6BA', n:'HR', sup:1},
  'HSE':{c:'#9DA4A9', n:'HSE', sup:1}, 'IT':{c:'#C1C6C9', n:'IT', sup:1}, 'P&M':{c:'#959CA1', n:'P&M', sup:1}, 'VP':{c:'#D2D6D8', n:'VP', sup:1}
};
var NODATA = '#F4F5F6';
function ckOf(psl, desc){ return psl === 'HPS' && /NITRO/i.test(desc || '') ? 'HPS-N2' : psl; }
function planCol(ck){ return (PLAN[ck] || {c:'#DBDBDB'}).c; }
function planName(ck){ return (PLAN[ck] || {n:ck}).n; }

var M = {ver:0};
function codeOf(o){ var b = o[4]; if (b === 'L01') return 'L01.' + o[5]; if (b === 'C01') return 'C01.' + o[6]; return b; }
function rebuild(){
  var T = DATA.T;
  M.ver++;
  M.keys = DATA.months.map(function(m){ return m.k; }).filter(function(k){ return DATA.rows[k]; }).sort();
  M.mInfo = {}; DATA.months.forEach(function(m){ M.mInfo[m.k] = m; });
  M.okey = DATA.objs.map(function(o){ return o[1] + '|' + codeOf(o); });
  var facT = {}, pslT = {}, stT = {}, pslDiv = {}, pslName = {};
  M.keys.forEach(function(k){ DATA.rows[k].forEach(function(r){
    var o = DATA.objs[r[0]], p = T.psl[r[1]];
    facT[o[2]] = (facT[o[2]] || 0) + r[3]; pslT[p] = (pslT[p] || 0) + r[3];
    var st = T.st[r[5]] || 'Não informado'; stT[st] = (stT[st] || 0) + r[3];
    var cc = DATA.cc[T.cc[r[6]]];
    if (cc){ var d = pslDiv[p] || (pslDiv[p] = {}); d[cc.div] = (d[cc.div] || 0) + 1; var n = pslName[p] || (pslName[p] = {}); n[cc.pn] = (n[cc.pn] || 0) + 1; }
  }); });
  var byV = function(o){ return Object.keys(o).sort(function(a, b){ return o[b] - o[a]; }); };
  M.facs = byV(facT); M.psls = byV(pslT); M.sts = byV(stT); M.pslT = pslT;
  var top = function(o){ return o ? byV(o)[0] : ''; };
  M.pslDiv = {}; M.pslName = {};
  M.psls.forEach(function(p){ M.pslDiv[p] = top(pslDiv[p]) || 'Não informado'; M.pslName[p] = top(pslName[p]) || ''; });
  // texto de busca por objeto
  M.hay = DATA.objs.map(function(o, i){ var a = AREA[M.okey[i]]; return norm(o[0] + ' ' + o[3] + ' ' + (a ? a.lbl + ' ' + a.name : '')); });
  M.descN = T.desc.map(norm);
  if (S.f.from && M.keys.indexOf(S.f.from) < 0) S.f.from = '';
  if (S.f.to && M.keys.indexOf(S.f.to) < 0) S.f.to = '';
  if (!S.f.from) S.f.from = M.keys[0];
  if (!S.f.to) S.f.to = M.keys[M.keys.length - 1];
  S.f.facs = S.f.facs.filter(function(f){ return facT[f] != null; });
  S.f.psls = S.f.psls.filter(function(p){ return pslT[p] != null; });
  AG = null;
}

/* Áreas da planta (prédios e pátios) por chave "site|código" */
var AREA = {}, SITE_NM = {R007522:'Macaé Bunker', R010713:'Porto do Açu'};
(function(){
  if (!GEO) return;
  var K = GEO.K, b = GEO.bounds, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
  GEO.cx = cx; GEO.cy = cy;
  /* planta (pontos do PDF) → metros no referencial do mapa da base (textura do chão): semelhança ajustada, erro médio 0,17 m */
  var xf = GEO.xf || {s:1, R:[[1, 0], [0, 1]], t:[0, 0]};
  var TR = function(p){ var x = (p[0] - cx) * K, z = (p[1] - cy) * K; return [r2(xf.s * (xf.R[0][0] * x + xf.R[0][1] * z) + xf.t[0]), r2(xf.s * (xf.R[1][0] * x + xf.R[1][1] * z) + xf.t[1])]; };
  GEO.TR = TR;
  GEO.items.forEach(function(it){
    var key = it.site + '|' + it.code, a = AREA[key] || (AREA[key] = {key:key, site:it.site, code:it.code, lbl:it.kind === 'y' ? it.code.replace('L01.', '') : it.lbl, name:it.name, kind:it.kind, h:it.h, parts:[], scene:'base'});
    a.parts.push({lbl:it.lbl, polys:it.poly.map(function(pg){ return pg.map(TR); }), ax:it.ax, am2:it.am2});
  });
  Object.keys(GEO.schem || {}).forEach(function(site){
    GEO.schem[site].forEach(function(it){
      var key = site + '|' + it.code;
      AREA[key] = {key:key, site:site, code:it.code, lbl:it.kind === 'y' ? it.code : it.code, name:(it.kind === 'y' ? 'Pátio · ' : 'Edificação ' + it.code + ' · ') + SITE_NM[site], kind:it.kind, h:it.h, scene:site, schem:true,
        parts:[{lbl:it.code, polys:[it.pm], ax:[1, 0]}]};
    });
  });
})();
function areaOfKey(key){ return AREA[key] || null; }
function areaLabel(key){
  var a = AREA[key]; if (!a) return key.split('|')[1];
  if (a.kind === 'y') return a.name + ' · ' + a.code;
  return a.name.indexOf(a.lbl + ' ') === 0 || a.schem ? a.name : a.lbl + ' · ' + a.name;
}
function areaShort(key){ var a = AREA[key]; return a ? (a.kind === 'y' ? a.code : a.lbl) : key.split('|')[1]; }

/* ═════════════════════════════════════════════════════════════
   3. Estado, filtros e agregações
   ═════════════════════════════════════════════════════════════ */
var S = {
  view:'home', hist:[], modal:null, toast:'', busy:false, pending:[],
  f:{from:'', to:'', facs:[], psls:[], st:'', q:''},
  ui:{sort:{}, pslOpen:false, pslQ:'', fbOpen:false, evo:'fac', sel3d:null, patch:'', color3d:'psl', scene:'base', labels:true, fs:false, trMode:'val', trHide:{}}
};
function saveUI(){ try{ localStorage.setItem(UI_KEY, JSON.stringify({view:S.view, f:S.f, ui:{evo:S.ui.evo, color3d:S.ui.color3d, scene:S.ui.scene, labels:S.ui.labels, trMode:S.ui.trMode}})); }catch(e){} }
function loadUI(){ try{ var o = JSON.parse(localStorage.getItem(UI_KEY) || 'null'); if (o){ if (o.f) Object.assign(S.f, o.f); if (o.view) S.view = o.view; if (o.ui) Object.assign(S.ui, o.ui); } }catch(e){} }

function PK(){ return M.keys.filter(function(k){ return k >= S.f.from && k <= S.f.to; }); }
function prevKey(k){ var i = M.keys.indexOf(k); return i > 0 ? M.keys[i - 1] : null; }
function from3(ks){ return ks[Math.max(0, ks.length - 3)]; }
function activeFilters(){ var f = S.f; return (f.facs.length ? 1 : 0) + (f.psls.length ? 1 : 0) + (f.st ? 1 : 0) + (f.q ? 1 : 0); }
var QN = '';
function pass(r){
  var f = S.f, o = DATA.objs[r[0]], T = DATA.T;
  if (f.facs.length && f.facs.indexOf(o[2]) < 0) return false;
  if (f.psls.length && f.psls.indexOf(T.psl[r[1]]) < 0) return false;
  if (f.st && (T.st[r[5]] || 'Não informado') !== f.st) return false;
  if (QN && M.hay[r[0]].indexOf(QN) < 0 && M.descN[r[2]].indexOf(QN) < 0 && norm(T.psl[r[1]]) !== QN) return false;
  return true;
}
/* Agregado do recorte (período + filtros), recalculado uma vez por renderização */
var AG = null;
function agg(){
  if (AG) return AG;
  QN = norm(S.f.q);
  var T = DATA.T, ks = PK(), A = {ks:ks, ref:ks[ks.length - 1], byM:{}, tot:0, fac:{}, psl:{}, st:{}, div:{}, key:{}, obj:{}};
  ks.forEach(function(k){
    var m = {tot:0, area:0, n:0, fac:{}, psl:{}, st:{}, facA:{}, pslA:{}, key:{}, keyA:{}};
    DATA.rows[k].forEach(function(r){
      if (!pass(r)) return;
      var o = DATA.objs[r[0]], p = T.psl[r[1]], st = T.st[r[5]] || 'Não informado', key = M.okey[r[0]], c = r[3], a = r[4];
      m.tot += c; m.area += a; m.n++;
      m.fac[o[2]] = (m.fac[o[2]] || 0) + c; m.facA[o[2]] = (m.facA[o[2]] || 0) + a;
      m.psl[p] = (m.psl[p] || 0) + c; m.pslA[p] = (m.pslA[p] || 0) + a;
      m.st[st] = (m.st[st] || 0) + c;
      m.key[key] = (m.key[key] || 0) + c; m.keyA[key] = (m.keyA[key] || 0) + a;
      A.fac[o[2]] = (A.fac[o[2]] || 0) + c; A.psl[p] = (A.psl[p] || 0) + c; A.st[st] = (A.st[st] || 0) + c;
      var dv = M.pslDiv[p] || 'Não informado'; A.div[dv] = (A.div[dv] || 0) + c;
      A.key[key] = (A.key[key] || 0) + c;
      var ob = A.obj[r[0]] || (A.obj[r[0]] = {oi:r[0], m:{}, tot:0, last:null, lastK:''});
      ob.m[k] = (ob.m[k] || 0) + c; ob.tot += c; ob.last = r; ob.lastK = k;
    });
    A.byM[k] = m; A.tot += m.tot;
  });
  AG = A;
  return A;
}
/* Total de um mês fora do período (para comparar com o mês anterior), com os mesmos filtros */
function monthTot(k){ if (!k || !DATA.rows[k]) return null; QN = norm(S.f.q); var t = 0; DATA.rows[k].forEach(function(r){ if (pass(r)) t += r[3]; }); return t; }
/* Informação completa de uma área (sem filtros) num mês */
var INFO = {};
function areaInfo(k){
  var sig = k + '|' + M.ver; if (INFO.sig === sig) return INFO.map;
  var T = DATA.T, map = {};
  (DATA.rows[k] || []).forEach(function(r){
    var key = M.okey[r[0]], o = DATA.objs[r[0]], p = T.psl[r[1]], d = T.desc[r[2]], ck = ckOf(p, d);
    var a = map[key] || (map[key] = {key:key, rows:[], tot:0, area:0, ck:{}, fl:{}, psl:{}});
    a.rows.push(r); a.tot += r[3]; a.area += r[4];
    var c = a.ck[ck] || (a.ck[ck] = {ck:ck, psl:p, c:0, a:0}); c.c += r[3]; c.a += r[4];
    var fl = o[5], F = a.fl[fl] || (a.fl[fl] = {}), cf = F[ck] || (F[ck] = {ck:ck, psl:p, c:0, a:0}); cf.c += r[3]; cf.a += r[4];
    a.psl[p] = (a.psl[p] || 0) + r[3];
  });
  INFO = {sig:sig, map:map};
  return map;
}
function keyHist(key, ks){ var out = {}; ks.forEach(function(k){ var t = 0, a = 0, n = 0; (DATA.rows[k] || []).forEach(function(r){ if (M.okey[r[0]] === key){ t += r[3]; a += r[4]; n++; } }); out[k] = {c:t, a:a, n:n}; }); return out; }
