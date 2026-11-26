
/* ═════════════════════════════════════════════════════════════
   4. Componentes visuais (cards, pílulas, gráficos)
   ═════════════════════════════════════════════════════════════ */
var IC = {
  grid:'<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1"/><rect x="8" y="1" width="5" height="5" rx="1"/><rect x="1" y="8" width="5" height="5" rx="1"/><rect x="8" y="8" width="5" height="5" rx="1"/></svg>',
  up:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5V4M7.2 8.6 12 4l4.8 4.6"/><path d="M4 15v3.4A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.6V15"/></svg>',
  exp:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 15.5v2.7A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-2.7"/></svg>',
  html:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5"/></svg>',
  upS:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15.5v2.7A1.8 1.8 0 0 0 5.8 20h12.4a1.8 1.8 0 0 0 1.8-1.8v-2.7"/></svg>',
  listS:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/></svg>',
  pin:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
  cube:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 20 7.5M12 12v9M12 12 4 7.5"/></svg>'
};
var VIEWS = {
  home:{label:'Visão geral'}, mes:{label:'Evolução mensal'}, psl:{label:'PSLs'}, planta:{label:'Planta 3D'},
  areas:{label:'Áreas e espaços'}, base:{label:'Base de dados'}
};
var XP = {}; // exportações Excel registradas por card
function xlsBtn(key, fn){ XP[key] = fn; return '<button class="ana-xls" data-act="xls" data-k="' + key + '">⬇ Excel</button>'; }
function card(span, ttl, body, opt){
  opt = opt || {};
  var right = (opt.tools || '') + (opt.xls ? xlsBtn(opt.xls[0], opt.xls[1]) : '');
  return '<div class="ana-card ' + span + '"><div class="ana-card-title"><span>' + ttl + '</span>' + (opt.small ? '<small>' + opt.small + '</small>' : '') +
    (right ? '<span class="act-r">' + right + '</span>' : '') + '</div>' + body + (opt.hint ? '<div class="ana-hint">' + opt.hint + '</div>' : '') + '</div>';
}
function seg(act, cur, opts){
  return '<span class="fc-seg sm" role="group">' + opts.map(function(x){
    return '<button type="button" data-act="' + act + '" data-k="' + x[0] + '" class="' + (cur === x[0] ? 'on' : '') + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</span>';
}
function kpi(val, lbl, sub, cls){
  return '<div class="kpi-tile ' + (cls || '') + '"><div class="kpi-val">' + val + '</div><div class="kpi-lbl">' + lbl + '</div>' + (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + '</div>';
}
function delta(cur, prev, invert){
  if (prev == null || !isFinite(prev) || prev === 0) return '';
  var d = (cur - prev) / Math.abs(prev), up = d > 0.0005, dn = d < -0.0005;
  var cls = invert ? (up ? 'dn' : dn ? 'up' : '') : (up ? 'up' : dn ? 'dn' : '');
  return '<span class="delta ' + cls + '">' + (up ? '▲ ' : dn ? '▼ ' : '') + fPct(Math.abs(d)) + '</span>';
}
/* Barras verticais (empilhadas, com suporte a negativos). cols: [{k,label,parts:[{v,c,n}],total}] */
function vbars(cols, opt){
  opt = opt || {};
  if (!cols.length) return '<div class="empty-state"><div class="sub">Sem dados no período.</div></div>';
  var maxP = 0, maxN = 0;
  cols.forEach(function(c){ var p = 0, n = 0; c.parts.forEach(function(x){ if (x.v > 0) p += x.v; else n -= x.v; }); c._p = p; c._n = n; maxP = Math.max(maxP, p); maxN = Math.max(maxN, n); });
  if (maxP + maxN === 0) maxP = 1;
  var H = maxP + maxN, z = maxN / H * 100, fmt = opt.fmt || fUSs;
  var h = '<div class="vb' + (opt.mini ? ' mini' : '') + '"><div class="vb-plot">';
  [0.25, 0.5, 0.75, 1].forEach(function(t){ h += '<div class="vb-gl" style="bottom:' + (z + (100 - z) * t * 0.86) + '%"></div>'; });
  if (maxN > 0) h += '<div class="vb-zero" style="bottom:' + z + '%"></div>';
  h += '<div class="vb-cols">';
  cols.forEach(function(c){
    var up = z, dn = z, segs = '';
    var pos = c.parts.filter(function(x){ return x.v > 0; }), neg = c.parts.filter(function(x){ return x.v < 0; });
    pos.forEach(function(x, i){ var hh = x.v / H * 86; segs += '<div class="vb-seg' + (i === pos.length - 1 ? ' top' : '') + '" style="bottom:' + up + '%;height:' + hh + '%;background:' + x.c + '" title="' + esc((x.n ? x.n + ' · ' : '') + c.label + ': ' + (opt.full || fUS)(x.v)) + '"></div>'; up += hh; });
    neg.forEach(function(x, i){ var hh = -x.v / H * 86; dn -= hh; segs += '<div class="vb-seg' + (i === neg.length - 1 ? ' bot' : '') + '" style="bottom:' + dn + '%;height:' + hh + '%;background:' + x.c + ';opacity:.55" title="' + esc((x.n ? x.n + ' · ' : '') + c.label + ': ' + (opt.full || fUS)(x.v)) + '"></div>'; });
    var tot = c.total != null ? c.total : sum(c.parts.map(function(x){ return x.v; }));
    var lblPos = tot >= 0 ? up : dn;
    var vlab = '<div class="vb-v" style="' + (tot >= 0 || c._p > 0 ? 'bottom:calc(' + Math.max(up, z) + '% + 4px)' : 'bottom:calc(' + lblPos + '% - 17px)') + '">' + esc(fmt(tot)) + '</div>';
    var act = opt.act ? ' data-act="' + opt.act + '" data-k="' + esc(c.k) + '" tabindex="0" role="button"' : '';
    h += '<div class="vb-col' + (opt.act ? ' click' : '') + (opt.on === c.k ? ' on' : '') + '"' + act + ' title="' + esc(c.label + ' — total ' + (opt.full || fUS)(tot)) + '">' + segs + vlab + '</div>';
  });
  h += '</div></div><div class="vb-x">' + cols.map(function(c){ return '<span>' + esc(c.label) + '</span>'; }).join('') + '</div>';
  if (opt.legend && opt.legend.length) h += '<div class="lgd">' + opt.legend.map(function(l){ return '<span><i style="background:' + l.c + '"></i>' + esc(l.n) + '</span>'; }).join('') + '</div>';
  return h + '</div>';
}
/* Barras horizontais. items: [{id,label,v,sub,c}] */
function hbars(items, opt){
  opt = opt || {};
  if (!items.length) return '<div class="empty-state"><div class="sub">Sem dados no recorte.</div></div>';
  var max = Math.max.apply(null, items.map(function(i){ return Math.abs(i.v); })) || 1, fmt = opt.fmt || fUS;
  return '<div class="hb' + (opt.wide ? ' wide' : '') + (opt.stack ? ' stack' : '') + '">' + items.map(function(it){
    var w = Math.abs(it.v) / max * 100, neg = it.v < 0;
    var act = opt.act ? ' data-act="' + opt.act + '" data-k="' + esc(it.id) + '" tabindex="0" role="button"' : '';
    return '<div class="hb-row' + (opt.act ? ' click' : '') + (it.on ? ' on' : '') + '"' + act + ' title="' + esc(it.label + ': ' + fmt(it.v)) + '">' +
      '<div class="hb-lbl">' + (it.sw ? '<span class="sw" style="background:' + it.sw + '"></span>' : '') + esc(it.label) + (it.tag ? '<em>' + esc(it.tag) + '</em>' : '') + '</div>' +
      '<div class="hb-trk"><div class="hb-bar" style="width:' + w + '%;background:' + (neg ? (opt.negC || '#A8AFB5') : (it.c || opt.c || '#CC0000')) + '"></div></div>' +
      '<div class="hb-val">' + esc(fmt(it.v)) + (it.sub ? '<em>' + esc(it.sub) + '</em>' : '') + '</div></div>';
  }).join('') + '</div>';
}
function donut(items, opt){
  opt = opt || {};
  var tot = sum(items.map(function(i){ return Math.max(0, i.v); })), fmt = opt.fmt || fUSs;
  if (!tot) return '<div class="empty-state"><div class="sub">Sem dados no recorte.</div></div>';
  var R = 52, C = 2 * Math.PI * R, off = 0, svg = '<svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label="' + esc(opt.aria || '') + '"><g transform="rotate(-90 75 75)">';
  svg += '<circle cx="75" cy="75" r="' + R + '" fill="none" stroke="rgba(42,47,48,.06)" stroke-width="20"/>';
  items.forEach(function(it){ var len = Math.max(0, it.v) / tot * C; if (len <= 0) return;
    svg += '<circle cx="75" cy="75" r="' + R + '" fill="none" stroke="' + it.c + '" stroke-width="20" stroke-dasharray="' + Math.max(0, len - 1.5) + ' ' + (C - Math.max(0, len - 1.5)) + '" stroke-dashoffset="' + (-off) + '"><title>' + esc(it.label + ': ' + fUS(it.v)) + '</title></circle>'; off += len; });
  svg += '</g><text x="75" y="75" text-anchor="middle" font-size="' + (opt.cfs || 22) + '" font-weight="300" fill="#000" font-family="Arial">' + esc(opt.center || fmt(tot)) + '</text>' +
    '<text x="75" y="93" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1.4" fill="#6D757A" font-family="Arial">' + esc(opt.centerLbl || 'TOTAL') + '</text></svg>';
  var lg = '<div class="dn-lg">' + items.map(function(it){
    return '<button type="button"' + (opt.act ? ' data-act="' + opt.act + '" data-k="' + esc(it.id) + '"' : '') + ' class="' + (it.on ? 'on' : '') + '"><i style="background:' + it.c + '"></i><span>' + esc(it.label) + '</span><b>' + esc(fmt(it.v)) + '</b><em>' + fPct(it.v / tot) + '</em></button>';
  }).join('') + '</div>';
  return '<div class="dn-wrap">' + svg + lg + '</div>';
}
function sortRows(id, rows, cols, defKey, defDir){
  var st = S.ui.sort[id] || {k:defKey, d:defDir || -1};
  var col = cols.filter(function(c){ return c.k === st.k; })[0] || cols[0];
  var getter = col.sv || col.v;
  rows.sort(function(a, b){ var x = getter(a), y = getter(b);
    if (typeof x === 'string' || typeof y === 'string') return String(x || '').localeCompare(String(y || ''), 'pt-BR') * st.d;
    return ((x || 0) - (y || 0)) * st.d; });
  return st;
}
function table(id, rows, cols, opt){
  opt = opt || {};
  var st = sortRows(id, rows, cols, opt.defKey || cols[0].k, opt.defDir);
  var h = '<div class="tbl-scroll' + (opt.tall === false ? '' : ' tall') + '"><table class="db-table"><thead><tr>' + cols.map(function(c){
    return '<th class="sort' + (c.num ? ' num' : '') + (st.k === c.k ? ' sorted' : '') + '" data-act="sort" data-t="' + id + '" data-k="' + c.k + '">' + esc(c.label) + (st.k === c.k ? (st.d > 0 ? ' ▲' : ' ▼') : '') + '</th>';
  }).join('') + '</tr></thead><tbody>';
  rows.forEach(function(r){
    h += '<tr' + (opt.rowAct ? ' class="click" tabindex="0" data-act="' + opt.rowAct + '" data-k="' + esc(opt.rowKey(r)) + '"' : '') + '>' + cols.map(function(c){
      var v = c.v(r), cls = (c.num ? 'num' : '') + (c.cls ? ' ' + (typeof c.cls === 'function' ? c.cls(r) : c.cls) : '');
      return '<td class="' + cls + '">' + (c.html ? c.html(r) : esc(c.f ? c.f(v) : v)) + '</td>';
    }).join('') + '</tr>';
  });
  h += '</tbody>';
  if (opt.foot) h += '<tfoot><tr>' + opt.foot.map(function(x, i){ return '<td class="' + (cols[i] && cols[i].num ? 'num' : '') + '">' + esc(x) + '</td>'; }).join('') + '</tr></tfoot>';
  return h + '</table></div>';
}

/* ═════════════════════════════════════════════════════════════
   5. Moldura: faixa, navegação, filtros
   ═════════════════════════════════════════════════════════════ */
function header(){
  var ks = M.keys;
  return '<div class="hdr"><div class="cobrand"><div class="cobrand-hal"><img src="' + LOGO + '" alt="Halliburton"/></div><div class="cobrand-rule" aria-hidden="true"></div>' +
    '<div class="cobrand-app"><span class="app-word">ANÁLISE DE REAL ESTATE</span></div></div><div class="hdr-sp"></div>' +
    (ks.length ? '<span class="hstat opt">Base Macaé · ' + ks.length + (ks.length === 1 ? ' mês' : ' meses') + ' · ' + mLbl(ks[0]) + ' – ' + mLbl(ks[ks.length - 1]) + '</span>' : '') +
    (LOCAL ? '<span class="hstat btn" data-act="go" data-k="base" title="Base atualizada neste navegador">Base atualizada</span>' : '') + '</div>';
}
function perLbl(){ var ks = PK(); if (!ks.length) return '—'; return ks.length === 1 ? mLong(ks[0]) : mLbl(ks[0]) + ' – ' + mLbl(ks[ks.length - 1]) + ' · ' + ks.length + ' meses'; }
function navbar(){
  var v = S.view, cur = VIEWS[v], has = M.keys.length > 0, dis = has ? '' : ' disabled';
  var h = '<div class="navbar"><button class="nav-back-btn" data-act="back" title="Voltar"' + (v === 'home' && !S.hist.length ? ' disabled' : '') + '>←</button>' +
    '<div class="crumbs"><button class="crumb crumb-hub" data-act="go" data-k="home" title="Visão geral">' + IC.grid + '</button>' +
    '<button class="nav-chip" data-act="go" data-k="home" title="Visão geral · período selecionado"><span class="nav-chip-ic">' + IC.pin + '</span><b>Real Estate · Macaé</b>' +
    (has ? '<i>·</i><span class="nc-per">' + esc(perLbl()) + '</span>' : '') + '</button>';
  if (v !== 'home') h += '<span class="crumb-sep">/</span><span class="crumb current">' + esc(cur.label) + '</span>';
  h += '</div><div class="nav-tools">' +
    '<button class="nav-btn" data-act="exp-xlsx" title="Exportar para Excel as linhas do recorte (período e filtros)"' + dis + '>' + IC.exp + '<span>Exportar Excel</span></button>' +
    '<button class="nav-btn" data-act="exp-html" title="Exportar HTML com a base atual embutida"' + dis + '>' + IC.html + '<span>Exportar HTML</span></button>' +
    '<button class="nav-act" data-act="go" data-k="base" title="Atualizar a base com uma nova versão da planilha">⬆ <span>Atualizar base</span></button></div></div>';
  return h;
}
function modsHTML(){
  return '<span class="fb-mods">' + [['areas', IC.listS, 'Espaços'], ['base', IC.upS, 'Base']].map(function(x){
    return '<button class="chip mod' + (S.view === x[0] ? ' on' : '') + '" data-act="go" data-k="' + x[0] + '" title="' + esc(VIEWS[x[0]].label) + '">' + x[1] + '<span class="ml">' + esc(VIEWS[x[0]].label) + '</span><span class="ms">' + x[2] + '</span></button>';
  }).join('') + '</span>';
}
function miniBar(){
  var ks = M.keys;
  return '<div class="filter-bar mini"><div class="fb-row"><span class="fb-lbl">Base</span><span class="fb-i mini-i">' +
    (ks.length ? ks.length + (ks.length === 1 ? ' mês' : ' meses') + ' · ' + mLbl(ks[0]) + ' – ' + mLbl(ks[ks.length - 1]) + ' · ' + esc(DATA.src || '') : 'nenhuma planilha carregada') +
    '</span><span class="fb-srch"></span>' + modsHTML() + '</div></div>';
}
function filterBar(){
  var f = S.f, ks = M.keys, n = activeFilters();
  var opts = function(sel){ return ks.map(function(k){ return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + mLbl(k) + '</option>'; }).join(''); };
  var last = ks[ks.length - 1];
  var q = [['last', 'Último mês', f.from === last && f.to === last], ['3m', '3 meses', f.to === last && f.from === from3(ks) && ks.length > 3], ['all', 'Tudo', f.from === ks[0] && f.to === last]];
  var tipL = 'Clique para ver só esta facility · Ctrl + clique para somar';
  var h = '<div class="filter-bar' + (S.ui.fbOpen ? ' open' : '') + '"><div class="fb-row">' +
    '<div class="fb-grp"><span class="fb-lbl">Período</span><select class="sel" data-chg="from">' + opts(f.from) + '</select><i class="fb-i">até</i><select class="sel" data-chg="to">' + opts(f.to) + '</select></div>' +
    '<div class="fc-seg">' + q.map(function(x){ return '<button data-act="per" data-k="' + x[0] + '" class="' + (x[2] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<span class="fb-sep"></span><div class="fb-grp"><span class="fb-lbl" title="' + tipL + '">Facility</span><button class="chip' + (!f.facs.length ? ' on' : '') + '" data-act="fac" data-k="">Todas</button>' +
    M.facs.map(function(l){ return '<button class="chip' + (f.facs.indexOf(l) >= 0 ? ' on' : '') + '" data-act="fac" data-k="' + esc(l) + '" title="' + tipL + '">' + esc(facName(l)) + '</button>'; }).join('') + '</div>' +
    '<span class="fb-sum">' + esc(mLbl(f.from) + (f.from !== f.to ? ' – ' + mLbl(f.to) : '')) + ' · ' + esc(f.facs.length ? f.facs.map(facName).join(', ') : 'todas as facilities') + (f.psls.length ? ' · ' + esc(f.psls.join(', ')) : '') + '</span>' +
    '<button class="chip fb-toggle' + (n ? ' on' : '') + '" data-act="fbt">' + (S.ui.fbOpen ? 'Fechar ▴' : 'Filtros' + (n ? ' <em>' + n + '</em>' : '') + ' ▾') + '</button>' +
    '<span class="fb-srch"></span>' + modsHTML() +
    '<input type="search" class="srch" data-inp="q" placeholder="Buscar código ou descrição" value="' + esc(f.q) + '"/></div>';
  var pl = f.psls.length ? (f.psls.length === 1 ? f.psls[0] : f.psls.length + ' PSLs') : 'Todos';
  h += '<div class="fb-row fb-more"><div class="fb-grp msel"><span class="fb-lbl">PSL</span><button class="chip' + (f.psls.length ? ' on' : '') + '" data-act="pslt">' + esc(pl) + ' ▾</button>' + (S.ui.pslOpen ? pslPop() : '') + '</div>' +
    '<span class="fb-sep"></span><div class="fb-grp"><span class="fb-lbl">Tipo de espaço</span><select class="sel" data-chg="st"><option value="">Todos</option>' + M.sts.map(function(t){ return '<option value="' + esc(t) + '"' + (f.st === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>' +
    (f.psls.length ? '<span class="fb-sep"></span><div class="fb-grp">' + f.psls.map(function(p){ return '<button class="chip sm on" data-act="pslx" data-k="' + esc(p) + '" title="Remover">' + esc(p) + ' ✕</button>'; }).join('') + '</div>' : '') +
    (n ? '<button class="chip sm fb-clr" data-act="clr">✕ Limpar filtros (' + n + ')</button>' : '') + '</div></div>';
  return h;
}
function pslPop(){
  var ref = S.f.to, counts = {};
  (DATA.rows[ref] || []).forEach(function(r){ var p = DATA.T.psl[r[1]]; counts[p] = (counts[p] || 0) + r[3]; });
  var q = norm(S.ui.pslQ);
  return '<div class="msel-pop"><input class="srch" data-inp="pslq" placeholder="Filtrar PSLs" value="' + esc(S.ui.pslQ) + '"/><div class="msel-l">' +
    M.psls.map(function(p){ var on = S.f.psls.indexOf(p) >= 0, nm = M.pslName[p] || '';
      return '<label class="' + (on ? 'on' : '') + '" data-psl="' + esc(p + ' ' + nm) + '"' + (q && norm(p + ' ' + nm).indexOf(q) < 0 ? ' hidden' : '') + '><input type="checkbox" data-act="psl" data-k="' + esc(p) + '"' + (on ? ' checked' : '') + '/><span>' + esc(p) + (nm ? ' <em>' + esc(nm) + '</em>' : '') + '</span><em>' + (counts[p] ? fUSk(counts[p]) : '') + '</em></label>'; }).join('') +
    '</div><div class="msel-ft"><button class="chip sm" data-act="pslclr">Limpar</button><button class="chip sm on" data-act="pslt">Fechar</button></div></div>';
}

/* ═════════════════════════════════════════════════════════════
   6. Páginas
   ═════════════════════════════════════════════════════════════ */
function pgHead(ttl, sub){
  return '<div class="pg-head"><h1 class="pg-title">' + esc(ttl) + '</h1>' + (sub ? '<p class="pg-sub">' + sub + '</p>' : '') + '</div>';
}
/* Os próprios cards de indicador são a navegação entre módulos; o aberto fica em vermelho. */
function navCards(){
  var A = agg(), ref = A.ref, pk = prevKey(ref), v = S.view, ks = A.ks, m = A.byM[ref] || {tot:0, area:0, n:0, psl:{}};
  var prev = monthTot(pk);
  var pslRef = Object.keys(m.psl).filter(function(p){ return m.psl[p] > 0.5; }).sort(function(a, b){ return m.psl[b] - m.psl[a]; });
  var items = [
    {id:'home', val:fUSkH(A.tot), lbl:'Custo de real estate · período', sub:'média mensal ' + fUSk(ks.length ? A.tot / ks.length : 0) + ' · anualizado ' + fUSk(ks.length ? A.tot / ks.length * 12 : 0)},
    {id:'mes', val:fUSkH(m.tot), lbl:'Evolução mensal · ' + mLbl(ref), sub:prev != null ? delta(m.tot, prev) + ' vs ' + mLbl(pk) + ' (' + fUSk(prev) + ')' : 'mês de referência do recorte'},
    {id:'psl', val:fN(pslRef.length), lbl:'PSLs com custo · ' + mLbl(ref), sub:pslRef.length ? 'maior: <b>' + esc(pslRef[0]) + '</b> · ' + fPct(m.psl[pslRef[0]] / (m.tot || 1)) : '—'},
    {id:'planta', val:NF0.format(m.area) + '<small>m²</small>', lbl:'Planta 3D · área ocupada', sub:fM2u(m.area ? m.tot / m.area : 0) + ' por m² em ' + mLbl(ref)},
    {id:'areas', val:fN(m.n), lbl:'Áreas e espaços', sub:'objetos de reserva em ' + mLbl(ref)}
  ];
  return '<nav class="kpi-row k5 navcards" aria-label="Indicadores">' + items.map(function(it){
    var on = v === it.id, nm = VIEWS[it.id].label;
    return '<button type="button" class="kpi-tile nav' + (on ? ' hero' : '') + '" data-act="go" data-k="' + it.id + '"' + (on ? ' aria-current="page"' : '') + ' title="' + esc(on ? nm + ' (aberto)' : 'Abrir ' + nm) + '">' +
      '<span class="kpi-go" aria-hidden="true">' + (on ? '●' : '→') + '</span><span class="kpi-val">' + it.val + '</span><span class="kpi-lbl">' + it.lbl + '</span><span class="kpi-sub">' + it.sub + '</span></button>';
  }).join('') + '</nav>';
}
function noData(){
  return '<div class="ana-card s12"><div class="empty-state"><div class="msg">Nenhum mês na base</div><div class="sub">Carregue a planilha de custos de real estate (.xlsx) para compilar os indicadores.</div><div class="actbar" style="justify-content:center"><button class="btn-r" data-act="go" data-k="base">⬆ Carregar planilha</button></div></div></div>';
}
function emptyCut(){ return '<div class="ana-grid"><div class="ana-card s12"><div class="empty-state"><div class="msg">Nada no recorte</div><div class="sub">Nenhuma linha atende aos filtros escolhidos.</div><div class="actbar" style="justify-content:center"><button class="btn-o" data-act="clr">✕ Limpar filtros</button></div></div></div></div>'; }
function onMonth(){ return S.f.from === S.f.to ? S.f.from : null; }
function facLegend(){ return M.facs.map(function(f, i){ return {c:facCol(f, i), n:facName(f)}; }); }
function topKeys(obj, n){ return Object.keys(obj).filter(function(k){ return Math.abs(obj[k]) > 0.005; }).sort(function(a, b){ return obj[b] - obj[a]; }).slice(0, n || 1e9); }

/* Pontos de atenção: leituras automáticas do recorte */
function insights(A){
  var out = [], ks = A.ks; if (!ks.length) return out;
  var first = ks[0], last = A.ref, T = DATA.T;
  if (ks.length > 1){
    var tots = ks.map(function(k){ return A.byM[k].tot; }), mx = tots.indexOf(Math.max.apply(null, tots)), mn = tots.indexOf(Math.min.apply(null, tots));
    var mdT = median(tots);
    out.push({c:'k', t:'Maior custo em <b>' + mLbl(ks[mx]) + '</b> (' + fUSk(tots[mx]) + ', ' + fPct(tots[mx] / mdT - 1) + ' acima da mediana) e menor em <b>' + mLbl(ks[mn]) + '</b> (' + fUSk(tots[mn]) + ').',
      s:'Mediana mensal de ' + fUSk(mdT) + '; média de ' + fUSk(A.tot / ks.length) + '.'});
    // meses fora do padrão por facility
    M.facs.forEach(function(f){
      var vals = ks.map(function(k){ return A.byM[k].fac[f] || 0; }), pos = vals.filter(function(v){ return v > 0; });
      if (pos.length < 3) return;
      var md = median(pos), mdA = median(ks.map(function(k){ return A.byM[k].facA[f] || 0; }).filter(function(v){ return v > 0; }));
      ks.forEach(function(k, i){ var v = vals[i], ar = A.byM[k].facA[f] || 0; if (md > 0 && (v < md * 0.5 || v > md * 1.6)){
        var sameA = mdA && Math.abs(ar - mdA) / mdA < 0.15;
        out.push({c:'r', t:'<b>' + esc(facName(f)) + '</b> em <b>' + mLbl(k) + '</b>: ' + fUS(v) + ' — mediana do período ' + fUSk(md) + '.',
          s:(v < md ? 'Muito abaixo do usual' : 'Muito acima do usual') + (sameA ? ' com área semelhante (' + fM2(ar) + '): mudança no custo do site ou alocação incompleta — vale conferir com Real Estate.' : ': área ocupada também mudou (' + fM2(ar) + ' vs mediana ' + fM2(mdA) + ').')}); } });
    });
    // facility: primeiro → último
    var fc = M.facs.map(function(f){ var a = A.byM[first].fac[f] || 0, b = A.byM[last].fac[f] || 0; return {f:f, a:a, b:b, d:b - a}; }).filter(function(x){ return x.a > 0 && Math.abs(x.d) / x.a > 0.1; })
      .sort(function(x, y){ return Math.abs(y.d) - Math.abs(x.d); });
    fc.slice(0, 2).forEach(function(x){ out.push({c:x.d > 0 ? 'r' : 'g', t:'<b>' + esc(facName(x.f)) + '</b>: ' + (x.d > 0 ? 'alta' : 'queda') + ' de ' + fPct(Math.abs(x.d) / x.a) + ' entre ' + mLbl(first) + ' e ' + mLbl(last) + '.',
      s:fUSk(x.a) + ' → ' + fUSk(x.b) + ' (' + fUSd(x.d) + ' por mês).'}); });
    // PSLs que mais variaram
    var pv = Object.keys(A.psl).map(function(p){ var a = A.byM[first].psl[p] || 0, b = A.byM[last].psl[p] || 0; return {p:p, a:a, b:b, d:b - a}; }).sort(function(x, y){ return Math.abs(y.d) - Math.abs(x.d); });
    if (pv.length && Math.abs(pv[0].d) > 1) out.push({c:pv[0].d > 0 ? 'r' : 'g', t:'PSL com maior variação mensal: <b>' + esc(pv[0].p) + '</b> (' + fUSd(pv[0].d) + ', ' + mLbl(first) + ' → ' + mLbl(last) + ').',
      s:pv.slice(1, 4).filter(function(x){ return Math.abs(x.d) > 1; }).map(function(x){ return x.p + ' ' + fUSd(x.d); }).join(' · ')});
    // realocações de PSL e objetos novos/encerrados
    var rl = reallocs(ks);
    if (rl.length){ var mm = {}; rl.forEach(function(x){ var k = x.from + ' → ' + x.to; mm[k] = (mm[k] || 0) + 1; });
      var tk = topKeys(mm, 2);
      out.push({c:'k', t:'<b>' + fN(rl.length) + '</b> ' + (rl.length === 1 ? 'espaço mudou' : 'espaços mudaram') + ' de PSL no período.', s:tk.map(function(k){ return k + ' (' + mm[k] + ')'; }).join(' · ') + ' — ver em <a href="#" data-act="go" data-k="psl">PSLs</a>.'}); }
    var o1 = {}, o2 = {}; DATA.rows[first].forEach(function(r){ if (pass(r)) o1[r[0]] = r; }); DATA.rows[last].forEach(function(r){ if (pass(r)) o2[r[0]] = r; });
    var nw = Object.keys(o2).filter(function(i){ return !o1[i]; }), gone = Object.keys(o1).filter(function(i){ return !o2[i]; });
    if (nw.length || gone.length) out.push({c:'g', t:'<b>' + nw.length + '</b> ' + (nw.length === 1 ? 'espaço novo' : 'espaços novos') + ' e <b>' + gone.length + '</b> ' + (gone.length === 1 ? 'encerrado' : 'encerrados') + ' entre ' + mLbl(first) + ' e ' + mLbl(last) + '.',
      s:nw.slice(0, 3).map(function(i){ return DATA.objs[i][0].split('-').slice(2).join('-') + ' ' + fUSk(o2[i][3]); }).join(' · ')});
  }
  var m = A.byM[last];
  if (m && m.area){
    var fu = M.facs.filter(function(f){ return m.facA[f]; }).map(function(f){ return {f:f, u:m.fac[f] / m.facA[f]}; }).sort(function(a, b){ return b.u - a.u; });
    out.push({c:'k', t:'Custo unitário em ' + mLbl(last) + ': <b>' + fM2u(m.tot / m.area) + '/m²</b> no recorte.', s:fu.map(function(x){ return facName(x.f) + ' ' + fM2u(x.u); }).join(' · ')});
  }
  return out;
}
function reallocs(ks){
  var T = DATA.T, last = {}, out = [];
  ks.forEach(function(k){ DATA.rows[k].forEach(function(r){ if (!pass(r)) return; var p = T.psl[r[1]], pr = last[r[0]];
    if (pr && pr.p !== p) out.push({oi:r[0], k:k, from:pr.p, to:p, fromK:pr.k, d:T.desc[r[2]], c:r[3]});
    last[r[0]] = {p:p, k:k}; }); });
  return out;
}
function insList(items){
  if (!items.length) return '<div class="empty-state"><div class="sub">Sem leituras para o recorte.</div></div>';
  return '<ul class="ins-l">' + items.map(function(x){ return '<li><i class="' + (x.c || '') + '"></i><div>' + x.t + (x.s ? '<small>' + x.s + '</small>' : '') + '</div></li>'; }).join('') + '</ul>';
}

function pageHome(){
  var h = pgHead('Real Estate', 'Custos de ocupação de espaço (space allocation) da base de Macaé · valores em <b>US$</b> (coluna <b>Actual Cost</b>) por mês, facility, PSL e área. Clique num card para abrir o indicador; clique num mês, facility ou PSL para filtrar.');
  if (!M.keys.length) return h + '<div class="ana-grid">' + noData() + '</div>';
  var A = agg(); h += navCards();
  if (!A.tot && !sum(A.ks.map(function(k){ return A.byM[k].n; }))) return h + emptyCut();
  var ks = A.ks;
  var cols = ks.map(function(k){ return {k:k, label:mLbl(k), parts:M.facs.map(function(f, i){ return {v:A.byM[k].fac[f] || 0, c:facCol(f, i), n:facName(f)}; })}; });
  var pk2 = topKeys(A.psl);
  var divs = topKeys(A.div), DC = {'Completion & Production':'#CC0000', 'Drilling & Evaluation':'#43494E', 'Ancillary Support':'#A8AFB5'};
  var sts = topKeys(A.st);
  h += '<div class="ana-grid">' +
    card('s8', 'Custo de real estate por mês', vbars(cols, {act:'month', on:onMonth(), legend:facLegend()}),
      {xls:['h-m', function(){ return {name:'real_estate_por_mes', rows:[['Mês'].concat(M.facs.map(facName)).concat(['Total (US$)', 'Área (m²)', 'US$/m²'])].concat(ks.map(function(k){ var b = A.byM[k]; return [mLbl(k)].concat(M.facs.map(function(f){ return r2(b.fac[f] || 0); })).concat([r2(b.tot), r2(b.area), b.area ? r2(b.tot / b.area) : '']); }))}; }],
       hint:'Barras empilhadas por facility. Clique num mês para ver só ele; clique de novo para voltar ao período inteiro.'}) +
    card('s4', 'Por facility · período', donut(M.facs.filter(function(f){ return A.fac[f]; }).map(function(f){ return {id:f, label:facName(f), v:A.fac[f], c:facCol(f, M.facs.indexOf(f)), on:S.f.facs.indexOf(f) >= 0}; }), {act:'fac', centerLbl:'NO PERÍODO'}),
      {hint:'Clique numa facility para filtrar.'}) +
    '</div><div class="ana-grid">' + trendCard(A, 'h') +
    '</div><div class="ana-grid">' +
    card('s6', 'Por PSL · período', hbars(pk2.map(function(p){ return {id:p, label:p, tag:M.pslName[p], v:A.psl[p], on:S.f.psls.indexOf(p) >= 0, sub:fPct(A.psl[p] / (A.tot || 1))}; }), {act:'psl'}),
      {xls:['h-psl', function(){ return {name:'real_estate_por_psl', rows:[['PSL', 'Nome', 'Divisão', 'US$ no período', '%']].concat(pk2.map(function(p){ return [p, M.pslName[p], M.pslDiv[p], r2(A.psl[p]), r2(A.psl[p] / A.tot * 100)]; }))}; }],
       hint:'Clique num PSL para filtrar · Ctrl + clique para somar PSLs. Detalhes na página <a href="#" data-act="go" data-k="psl">PSLs</a>.'}) +
    card('s6', 'Pontos de atenção', insList(insights(A)), {hint:'Leituras automáticas do recorte: meses fora do padrão (abaixo de 50% ou acima de 160% da mediana da facility), variações e mudanças de PSL.'}) +
    '</div><div class="ana-grid">' +
    card('s6', 'Por tipo de espaço · período', hbars(sts.map(function(t){ return {id:t, label:t, v:A.st[t], on:S.f.st === t, c:'#43494E', sub:fPct(A.st[t] / (A.tot || 1))}; }), {act:'st'}), {hint:'Classificação "Space Type" da planilha; pátios (L01) não têm tipo no relatório e aparecem como <b>Pátio (terreno)</b>. Clique para filtrar.'}) +
    card('s6', 'Por divisão · período', donut(divs.map(function(d, i){ return {id:d, label:d, v:A.div[d], c:DC[d] || PAL[(i + 5) % PAL.length]}; }), {centerLbl:'NO PERÍODO'}), {hint:'Divisão de cada PSL conforme o centro de custo (PSL CC) dos relatórios de jan a set.'}) +
    '</div>';
  return h;
}

function pageMes(){
  var h = pgHead('Evolução mensal', 'Custo, área e custo por m² mês a mês · ' + esc(perLbl()) + '.');
  if (!M.keys.length) return h + '<div class="ana-grid">' + noData() + '</div>';
  var A = agg(), ks = A.ks; h += navCards();
  var tots = ks.map(function(k){ return A.byM[k].tot; });
  if (!sum(tots)) return h + emptyCut();
  var first = ks[0], last = A.ref, mx = tots.indexOf(Math.max.apply(null, tots)), mn = tots.indexOf(Math.min.apply(null, tots));
  var d = A.byM[last].tot - A.byM[first].tot;
  h += '<div class="kpi-row k4">' +
    kpi(fUSkH(tots[mx]), 'Maior mês · ' + mLbl(ks[mx]), fPct(tots[mx] / (A.tot / ks.length) - 1) + ' acima da média') +
    kpi(fUSkH(tots[mn]), 'Menor mês · ' + mLbl(ks[mn]), fPct(1 - tots[mn] / (A.tot / ks.length)) + ' abaixo da média') +
    kpi(fUSkH(Math.abs(d)).replace('</small>', '</small>' + (d > 0 ? '+' : d < 0 ? '−' : '')),'Variação ' + mLbl(first) + ' → ' + mLbl(last), delta(A.byM[last].tot, A.byM[first].tot) + ' no período') +
    kpi('<small class="pre">US$</small>' + NF2.format(A.byM[last].area ? A.byM[last].tot / A.byM[last].area : 0) + '<small>/m²</small>', 'Custo por m² · ' + mLbl(last), 'em ' + mLbl(first) + ': ' + fM2u(A.byM[first].area ? A.byM[first].tot / A.byM[first].area : 0)) + '</div>';
  // série empilhada por dimensão escolhida
  var dim = S.ui.evo, keysD, colOf, nameOf, getV;
  if (dim === 'psl'){ var tp = topKeys(A.psl), top = tp.slice(0, 8), rest = tp.slice(8);
    keysD = top.concat(rest.length ? ['_o'] : []); colOf = function(x, i){ return x === '_o' ? OUTROS : PAL[i % PAL.length]; }; nameOf = function(x){ return x === '_o' ? 'Outros (' + rest.length + ')' : x; };
    getV = function(k, x){ return x === '_o' ? sum(rest.map(function(p){ return A.byM[k].psl[p] || 0; })) : (A.byM[k].psl[x] || 0); }; }
  else if (dim === 'st'){ var ts = topKeys(A.st), t7 = ts.slice(0, 7), r7 = ts.slice(7);
    keysD = t7.concat(r7.length ? ['_o'] : []); colOf = function(x, i){ return x === '_o' ? OUTROS : PAL[i % PAL.length]; }; nameOf = function(x){ return x === '_o' ? 'Outros (' + r7.length + ')' : x; };
    getV = function(k, x){ return x === '_o' ? sum(r7.map(function(p){ return A.byM[k].st[p] || 0; })) : (A.byM[k].st[x] || 0); }; }
  else { keysD = M.facs; colOf = function(x, i){ return facCol(x, i); }; nameOf = facName; getV = function(k, x){ return A.byM[k].fac[x] || 0; }; }
  var cols = ks.map(function(k){ return {k:k, label:mLbl(k), total:A.byM[k].tot, parts:keysD.map(function(x, i){ return {v:getV(k, x), c:colOf(x, i), n:nameOf(x)}; })}; });
  var dimN = {fac:'facility', psl:'PSL', st:'tipo de espaço'}[dim];
  h += '<div class="ana-grid">' + card('s12', 'Custo por mês e ' + dimN, vbars(cols, {act:'month', on:onMonth(), legend:keysD.map(function(x, i){ return {c:colOf(x, i), n:nameOf(x)}; })}),
    {tools:seg('evo', dim, [['fac', 'Facility'], ['psl', 'PSL'], ['st', 'Tipo de espaço']]),
     xls:['m-d', function(){ return {name:'custo_por_mes_' + dim, rows:[[dimN].concat(ks.map(mLbl)).concat(['Total'])].concat(keysD.map(function(x){ return [nameOf(x)].concat(ks.map(function(k){ return r2(getV(k, x)); })).concat([r2(sum(ks.map(function(k){ return getV(k, x); })))]); }))}; }],
     hint:'Escolha a quebra em <b>Facility</b>, <b>PSL</b> (8 maiores + outros) ou <b>Tipo de espaço</b>. Clique num mês para ver só ele.'}) + '</div>';
  var aCols = ks.map(function(k){ return {k:k, label:mLbl(k), parts:M.facs.map(function(f, i){ return {v:A.byM[k].facA[f] || 0, c:facCol(f, i), n:facName(f)}; })}; });
  var uCols = ks.map(function(k){ var b = A.byM[k]; return {k:k, label:mLbl(k), parts:[{v:b.area ? b.tot / b.area : 0, c:'#961B24', n:'US$/m²'}]}; });
  h += '<div class="ana-grid">' +
    card('s6', 'Área ocupada por mês (m²)', vbars(aCols, {fmt:function(v){ return fUSs(v).replace(' mil', ' mil'); }, full:fM2, act:'month', on:onMonth(), legend:facLegend()}), {hint:'Soma da coluna <b>Occupied Area M²</b>. Área estável com custo variando indica mudança de preço unitário (rateio do custo total do site).'}) +
    card('s6', 'Custo por m² por mês', vbars(uCols, {fmt:function(v){ return NF2.format(v); }, full:fM2u, act:'month', on:onMonth()}), {hint:'Custo do mês ÷ área ocupada, no recorte.'}) + '</div>';
  // variação por PSL
  var pv = Object.keys(A.psl).map(function(p){ var a = A.byM[first].psl[p] || 0, b = A.byM[last].psl[p] || 0; return {p:p, a:a, b:b, d:b - a}; }).filter(function(x){ return Math.abs(x.d) > 0.5; }).sort(function(x, y){ return y.d - x.d; });
  h += '<div class="ana-grid">' + card('s12', 'Variação por PSL · ' + mLbl(first) + ' → ' + mLbl(last), hbars(pv.map(function(x){ return {id:x.p, label:x.p, tag:M.pslName[x.p], v:x.d, c:'#CC0000', on:S.f.psls.indexOf(x.p) >= 0, sub:fUSk(x.a) + ' → ' + fUSk(x.b)}; }), {act:'psl', wide:true, fmt:fUSd, negC:'#7F878D'}),
    {hint:'Vermelho: aumento de custo mensal; cinza: redução. Compara o primeiro e o último mês do período.'}) + '</div>';
  // matriz PSL × mês
  var rows = topKeys(A.psl).map(function(p){ var o = {p:p, m:{}, tot:A.psl[p]}; ks.forEach(function(k){ o.m[k] = A.byM[k].psl[p] || 0; }); o.d = A.byM[first].psl[p] ? (o.m[last] - o.m[first]) / o.m[first] : null; return o; });
  var cols2 = [{k:'p', label:'PSL', v:function(r){ return r.p; }, cls:'strong'}, {k:'dv', label:'Divisão', v:function(r){ return M.pslDiv[r.p]; }}]
    .concat(ks.map(function(k){ return {k:'m' + k, label:mLbl(k), v:function(r){ return r.m[k]; }, f:function(v){ return v ? fUS(v) : '—'; }, num:true}; }))
    .concat([{k:'tot', label:'Total', v:function(r){ return r.tot; }, f:fUS, num:true, cls:'strong'}, {k:'d', label:'Δ ' + mLbl(first) + '→' + mLbl(last), v:function(r){ return r.d == null ? -1e9 : r.d; }, num:true, html:function(r){ return r.d == null ? '—' : delta(r.m[last], r.m[first]); }}]);
  var foot = ['Total', ''].concat(ks.map(function(k){ return fUS(A.byM[k].tot); })).concat([fUS(A.tot), '']);
  h += '<div class="ana-grid">' + card('s12', 'PSL × mês', table('m-pm', rows, cols2, {defKey:'tot', defDir:-1, foot:foot, rowAct:'psl', rowKey:function(r){ return r.p; }}),
    {xls:['m-pm', function(){ return {name:'psl_por_mes', rows:[['PSL', 'Divisão'].concat(ks.map(mLbl)).concat(['Total'])].concat(rows.map(function(r){ return [r.p, M.pslDiv[r.p]].concat(ks.map(function(k){ return r2(r.m[k]); })).concat([r2(r.tot)]); }))}; }],
     hint:'Clique num PSL para filtrar o app inteiro por ele.'}) + '</div>';
  return h;
}

function pagePSL(){
  var h = pgHead('PSLs', 'Quanto cada PSL paga de real estate, quanto ocupa e quanto custa o m² · ' + esc(perLbl()) + '. O mês de referência é o último do período.');
  if (!M.keys.length) return h + '<div class="ana-grid">' + noData() + '</div>';
  var A = agg(), ks = A.ks, ref = A.ref, m = A.byM[ref], pk = prevKey(ref); h += navCards();
  if (!A.tot) return h + emptyCut();
  var prevPsl = {}; if (pk) (DATA.rows[pk] || []).forEach(function(r){ if (pass(r)){ var p = DATA.T.psl[r[1]]; prevPsl[p] = (prevPsl[p] || 0) + r[3]; } });
  var ps = topKeys(A.psl);
  var uu = ps.filter(function(p){ return m.pslA[p] > 0; }).map(function(p){ return {p:p, u:m.psl[p] / m.pslA[p]}; }).sort(function(a, b){ return b.u - a.u; });
  var top = ps[0];
  h += '<div class="kpi-row k4">' +
    kpi(esc(top || '—'), 'Maior custo no período', top ? fUS(A.psl[top]) + ' · ' + fPct(A.psl[top] / A.tot) : '') +
    kpi(fN(ps.length), 'PSLs com custo no período', 'divisões: ' + topKeys(A.div).length) +
    kpi(uu.length ? esc(uu[0].p) : '—', 'Maior US$/m² · ' + mLbl(ref), uu.length ? fM2u(uu[0].u) + ' por m²' : '') +
    kpi(uu.length ? esc(uu[uu.length - 1].p) : '—', 'Menor US$/m² · ' + mLbl(ref), uu.length ? fM2u(uu[uu.length - 1].u) + ' por m²' : '') + '</div>';
  h += '<div class="ana-grid">' + trendCard(A, 'p') + '</div>';
  h += '<div class="ana-grid">' +
    card('s7', 'Custo por PSL · período', hbars(ps.map(function(p){ return {id:p, label:p, tag:M.pslName[p], v:A.psl[p], on:S.f.psls.indexOf(p) >= 0, sub:fPct(A.psl[p] / A.tot)}; }), {act:'psl', wide:true}),
      {hint:'Clique num PSL para filtrar · Ctrl + clique para somar.'}) +
    card('s5', 'Custo por m² · ' + mLbl(ref), hbars(uu.map(function(x){ return {id:x.p, label:x.p, v:x.u, c:'#961B24', on:S.f.psls.indexOf(x.p) >= 0, sub:fM2(m.pslA[x.p])}; }), {act:'psl', fmt:fM2u, stack:true}),
      {hint:'Custo do mês ÷ área ocupada do PSL. Escritórios e laboratórios custam mais por m² que pátios e tendas (fator de preço e tipo de espaço).'}) + '</div>';
  var rows = ps.map(function(p){ return {p:p, a:m.pslA[p] || 0, c:m.psl[p] || 0, pv:prevPsl[p] || 0, t:A.psl[p]}; });
  var cols = [
    {k:'p', label:'PSL', v:function(r){ return r.p; }, cls:'strong'},
    {k:'nm', label:'Nome', v:function(r){ return M.pslName[r.p] || '—'; }},
    {k:'dv', label:'Divisão', v:function(r){ return M.pslDiv[r.p]; }},
    {k:'a', label:'Área · ' + mLbl(ref), v:function(r){ return r.a; }, f:fM2, num:true},
    {k:'c', label:'US$ · ' + mLbl(ref), v:function(r){ return r.c; }, f:fUS, num:true},
    {k:'u', label:'US$/m²', v:function(r){ return r.a ? r.c / r.a : 0; }, f:fM2u, num:true},
    {k:'d', label:'vs ' + mLbl(pk), v:function(r){ return r.pv ? (r.c - r.pv) / r.pv : 0; }, num:true, html:function(r){ return r.pv ? delta(r.c, r.pv) : '—'; }},
    {k:'t', label:'US$ no período', v:function(r){ return r.t; }, f:fUS, num:true, cls:'strong'},
    {k:'s', label:'% do período', v:function(r){ return r.t / A.tot; }, f:fPct, num:true}
  ];
  h += '<div class="ana-grid">' + card('s12', 'Resumo por PSL', table('p-r', rows, cols, {defKey:'t', defDir:-1, rowAct:'psl', rowKey:function(r){ return r.p; },
      foot:['Total (' + rows.length + ')', '', '', fM2(m.area), fUS(m.tot), fM2u(m.area ? m.tot / m.area : 0), '', fUS(A.tot), '100%']}),
    {xls:['p-r', function(){ return {name:'resumo_por_psl', rows:[cols.map(function(c){ return c.label; })].concat(rows.map(function(r){ return [r.p, M.pslName[r.p], M.pslDiv[r.p], r2(r.a), r2(r.c), r.a ? r2(r.c / r.a) : '', r.pv ? r2((r.c - r.pv) / r.pv * 100) : '', r2(r.t), r2(r.t / A.tot * 100)]; }))}; }],
     hint:'Clique num PSL para filtrar o app inteiro por ele.'}) + '</div>';
  var rl = reallocs(ks);
  var rcols = [
    {k:'k', label:'Mês', v:function(r){ return r.k; }, f:mLbl},
    {k:'id', label:'Espaço', v:function(r){ return DATA.objs[r.oi][0]; }, cls:'strong'},
    {k:'ar', label:'Prédio / pátio', v:function(r){ return areaLabel(M.okey[r.oi]); }},
    {k:'fr', label:'De', v:function(r){ return r.from; }},
    {k:'to', label:'Para', v:function(r){ return r.to; }, cls:'strong'},
    {k:'d', label:'Descrição atual', v:function(r){ return r.d; }},
    {k:'c', label:'US$ no mês', v:function(r){ return r.c; }, f:fUS, num:true}
  ];
  h += '<div class="ana-grid">' + card('s12', 'Mudanças de PSL no período', rl.length ? table('p-rl', rl, rcols, {defKey:'k', defDir:1, tall:true, rowAct:'obj', rowKey:function(r){ return r.oi; }}) : '<div class="empty-state"><div class="sub">Nenhum espaço mudou de PSL no período.</div></div>',
    {small:rl.length ? fN(rl.length) + ' mudanças' : '', xls:rl.length ? ['p-rl', function(){ return {name:'mudancas_de_psl', rows:[['Mês', 'Espaço', 'Prédio / pátio', 'De', 'Para', 'Descrição', 'US$']].concat(rl.map(function(r){ return [mLbl(r.k), DATA.objs[r.oi][0], areaLabel(M.okey[r.oi]), r.from, r.to, r.d, r2(r.c)]; }))}; }] : null,
     hint:'Espaço (objeto de reserva) cujo PSL no mês é diferente do mês anterior em que apareceu. Clique numa linha para ver o histórico do espaço.'}) + '</div>';
  return h;
}
