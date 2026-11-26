
/* ── Custo de real estate por PSL por mês: barras empilhadas + curva de tendência de cada PSL ── */
var TRD = {}, TRH = {ch:null, p:null};
function lineCol(hex){ return lumHex(hex) > .62 ? mixHex(hex, '#000000', .4) : hex; }
function niceMax(v){ if (!(v > 0)) return 1; var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e, st = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for (var i = 0; i < st.length; i++) if (f <= st[i] + 1e-9) return st[i] * e; return 10 * e; }
function linreg(v){
  var n = v.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (var i = 0; i < n; i++){ sx += i; sy += v[i]; sxx += i * i; sxy += i * v[i]; }
  var d = n * sxx - sx * sx, b = d ? (n * sxy - sx * sy) / d : 0, a = (sy - b * sx) / (n || 1), my = sy / (n || 1), ssT = 0, ssR = 0;
  for (var j = 0; j < n; j++){ var f = a + b * j; ssT += (v[j] - my) * (v[j] - my); ssR += (v[j] - f) * (v[j] - f); }
  return {a:a, b:b, r2:ssT ? 1 - ssR / ssT : 0, mean:my};
}
/* curva suave e monotônica (Fritsch–Carlson) — não inventa picos entre os meses */
function monoPath(P){
  var n = P.length; if (!n) return ''; if (n === 1) return 'M' + P[0][0] + ' ' + P[0][1];
  var d = [], m = [], i;
  for (i = 0; i < n - 1; i++) d[i] = (P[i + 1][1] - P[i][1]) / (P[i + 1][0] - P[i][0]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (i = 0; i < n - 1; i++){ if (d[i] === 0){ m[i] = m[i + 1] = 0; continue; } var a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9){ var t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
  var p = 'M' + P[0][0].toFixed(2) + ' ' + P[0][1].toFixed(2);
  for (i = 0; i < n - 1; i++){ var h = (P[i + 1][0] - P[i][0]) / 3;
    p += 'C' + (P[i][0] + h).toFixed(2) + ' ' + (P[i][1] + m[i] * h).toFixed(2) + ' ' + (P[i + 1][0] - h).toFixed(2) + ' ' + (P[i + 1][1] - m[i + 1] * h).toFixed(2) + ' ' + P[i + 1][0].toFixed(2) + ' ' + P[i + 1][1].toFixed(2); }
  return p;
}
function trendChart(A, id){
  var ks = A.ks, n = ks.length;
  if (!n || !A.tot) return '<div class="empty-state"><div class="sub">Sem dados no recorte.</div></div>';
  var hide = S.ui.trHide || {}, mode = S.ui.trMode === 'lin' ? 'lin' : 'val';
  var ps = topKeys(A.psl), vis = ps.filter(function(p){ return !hide[p]; });
  var ser = {};
  ps.forEach(function(p){ var v = ks.map(function(k){ return A.byM[k].psl[p] || 0; }), c = planCol(p); ser[p] = {v:v, lr:linreg(v), c:c, lc:lineCol(c), tot:A.psl[p]}; });
  var tot = ks.map(function(k, i){ return sum(vis.map(function(p){ return ser[p].v[i]; })); });
  var maxL = niceMax(Math.max.apply(null, tot.concat([1])));
  var rv = [1]; vis.forEach(function(p){ var s = ser[p]; rv = rv.concat(s.v); if (mode === 'lin') rv.push(s.lr.a, s.lr.a + s.lr.b * (n - 1)); });
  var maxR = niceMax(Math.max.apply(null, rv));
  TRD[id] = {ks:ks, ser:ser, maxL:maxL, maxR:maxR, tot:tot, mode:mode};
  var H = 86, X = function(i){ return (i + .5) / n * 1000; }, YR = function(v){ return 100 - Math.max(0, v) / maxR * H; };
  var ticks = function(max){ return [0, .25, .5, .75, 1].map(function(t){ return '<span style="bottom:' + (t * H) + '%">' + esc(fUSs(max * t)) + '</span>'; }).join(''); };
  var h = '<div class="tr" data-tr="' + id + '"><div class="tr-wrap"><div class="tr-ax l" title="Custo mensal empilhado (todos os PSLs visíveis)">' + ticks(maxL) + '</div><div class="tr-plot">';
  [.25, .5, .75, 1].forEach(function(t){ h += '<div class="vb-gl" style="bottom:' + (t * H) + '%"></div>'; });
  h += '<div class="tr-cols">';
  ks.forEach(function(k, i){
    var up = 0, segs = '';
    vis.forEach(function(p){ var v = ser[p].v[i]; if (v <= 0) return; var hh = v / maxL * H;
      segs += '<div class="tr-seg" data-trp="' + esc(p) + '" data-tri="' + i + '" data-act="psl" data-k="' + esc(p) + '" style="bottom:' + up + '%;height:' + hh + '%;background:' + ser[p].c + '"></div>'; up += hh; });
    h += '<div class="tr-col' + (onMonth() === k ? ' on' : '') + '">' + segs + '<div class="tr-tot" style="bottom:calc(' + up + '% + 4px)">' + esc(fUSs(tot[i])) + '</div></div>';
  });
  h += '</div><svg class="tr-svg" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">';
  vis.slice().reverse().forEach(function(p){
    var s = ser[p], pts = s.v.map(function(v, i){ return [X(i), YR(v)]; }), d;
    if (mode === 'lin') d = 'M' + X(0).toFixed(2) + ' ' + YR(s.lr.a).toFixed(2) + 'L' + X(n - 1).toFixed(2) + ' ' + YR(s.lr.a + s.lr.b * (n - 1)).toFixed(2);
    else d = monoPath(pts);
    var dots = pts.map(function(q){ return 'M' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + 'l0 0'; }).join('');
    h += '<g class="tr-s" data-trp="' + esc(p) + '"><path class="tr-halo" d="' + d + '"/><path class="tr-ln' + (mode === 'lin' ? ' dash' : '') + '" d="' + d + '" style="stroke:' + s.lc + '"/>' +
      '<path class="tr-dot" d="' + dots + '" style="stroke:' + s.lc + '"/><path class="tr-hit" d="' + d + '" data-trp="' + esc(p) + '" data-act="psl" data-k="' + esc(p) + '"/></g>';
  });
  h += '</svg></div><div class="tr-ax r" title="Custo mensal de cada PSL (curvas)">' + ticks(maxR) + '</div></div>';
  h += '<div class="tr-x">' + ks.map(function(k){ return '<span>' + esc(mLbl(k)) + '</span>'; }).join('') + '</div>';
  h += '<div class="tr-cap"><span><i class="bar"></i>Barras: custo do mês empilhado por PSL (eixo à esquerda)</span><span><i class="ln' + (mode === 'lin' ? ' dash' : '') + '"></i>' + (mode === 'lin' ? 'Retas: tendência linear de cada PSL' : 'Curvas: custo de cada PSL') + ' (eixo à direita)</span></div>';
  h += '<div class="lgd plan tr-lg">' + ps.map(function(p){ return '<button type="button" class="' + (hide[p] ? 'off' : '') + '" data-act="trhide" data-k="' + esc(p) + '" data-trp="' + esc(p) + '" title="Mostrar ou ocultar ' + esc(p) + '"><i class="sw" style="background:' + ser[p].c + '"></i>' + esc(p) + '</button>'; }).join('') +
    '<button type="button" data-act="trall" title="Mostrar todos os PSLs">Todos</button><button type="button" data-act="trnone" title="Ocultar todos os PSLs">Nenhum</button></div>';
  return h + '<div class="tr-tip"></div></div>';
}
function trendCard(A, id, span){
  var mode = S.ui.trMode === 'lin' ? 'lin' : 'val';
  return card(span || 's12', 'Custo de real estate por PSL por mês', trendChart(A, id),
    {tools:seg('trmode', mode, [['val', 'Curvas'], ['lin', 'Tendência linear']]),
     xls:['tr-' + id, function(){ var D = TRD[id]; if (!D) return null; return {name:'custo_psl_por_mes_tendencia', rows:[['PSL'].concat(D.ks.map(mLbl)).concat(['Total', 'Tendência US$/mês', 'R²'])].concat(Object.keys(D.ser).map(function(p){ var s = D.ser[p]; return [p].concat(s.v.map(r2)).concat([r2(s.tot), r2(s.lr.b), r2(s.lr.r2)]); }))}; }],
     hint:'Passe o mouse numa <b>barra</b>, numa <b>curva</b> ou na legenda para destacar o PSL e ver o valor do mês e a tendência; clique para filtrar o app por ele (Ctrl + clique soma PSLs). Clique na legenda para ocultar ou mostrar PSLs. <b>Tendência linear</b> troca as curvas pela reta de mínimos quadrados de cada PSL.'});
}
function trHi(ch, p){
  ch.classList.toggle('hi', !!p);
  ch.querySelectorAll('[data-trp]').forEach(function(el){ el.classList.toggle('on', !!p && el.getAttribute('data-trp') === p); });
  if (p){ var g = ch.querySelector('g.tr-s.on'); if (g) g.parentNode.appendChild(g); }
}
function trTip(ch, p, i, ev){
  var tip = ch.querySelector('.tr-tip'), D = TRD[ch.getAttribute('data-tr')];
  if (!tip || !D || !p || !D.ser[p]){ if (tip) tip.style.display = 'none'; return; }
  var s = D.ser[p], k = D.ks[i], v = s.v[i], mt = D.tot[i] || 0, lr = s.lr;
  tip.innerHTML = '<b><i style="background:' + s.c + '"></i>' + esc(p) + (M.pslName[p] ? ' <em>' + esc(M.pslName[p]) + '</em>' : '') + '</b>' +
    '<span>' + esc(mLbl(k)) + ': <b>' + esc(fUS(v)) + '</b>' + (mt ? ' · ' + fPct(v / mt) + ' do mês' : '') + '</span>' +
    (i > 0 ? '<span>vs ' + esc(mLbl(D.ks[i - 1])) + ': ' + esc(fUSd(v - s.v[i - 1])) + '</span>' : '') +
    '<span>Tendência: ' + esc(fUSd(lr.b)) + ' por mês (' + (lr.mean ? (lr.b >= 0 ? '+' : '') + NF1.format(lr.b / lr.mean * 100) + '% da média' : '—') + ') · R² ' + NF2.format(lr.r2) + '</span>' +
    '<span>No período: ' + esc(fUS(s.tot)) + '</span>';
  tip.style.display = 'block';
  var r = ch.getBoundingClientRect(), x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
  if (x + tip.offsetWidth > r.width - 6) x = ev.clientX - r.left - tip.offsetWidth - 12;
  if (y + tip.offsetHeight > r.height - 6) y = ev.clientY - r.top - tip.offsetHeight - 12;
  tip.style.transform = 'translate(' + x + 'px,' + y + 'px)';
}
document.addEventListener('mousemove', function(ev){
  var t = ev.target, ch = t.closest && t.closest('.tr');
  if (!ch){ if (TRH.ch){ trHi(TRH.ch, null); trTip(TRH.ch, null); TRH.ch = null; TRH.p = null; } return; }
  var el = t.closest('[data-trp]'), p = el ? el.getAttribute('data-trp') : null;
  if (ch !== TRH.ch || p !== TRH.p){ if (TRH.ch && TRH.ch !== ch) trHi(TRH.ch, null); trHi(ch, p); TRH.ch = ch; TRH.p = p; }
  var plot = ch.querySelector('.tr-plot'), D = TRD[ch.getAttribute('data-tr')];
  if (!p || !plot || !D || el.closest('.tr-lg')){ trTip(ch, null); return; }
  var r = plot.getBoundingClientRect(), i = el.hasAttribute('data-tri') ? +el.getAttribute('data-tri') : Math.max(0, Math.min(D.ks.length - 1, Math.floor((ev.clientX - r.left) / r.width * D.ks.length)));
  trTip(ch, p, i, ev);
});
