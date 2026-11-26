
/* ── Planta 3D ── */
var SCENES = {base:{n:'Base Cavaleiros', sub:'R008015 + área alugada R007520 · planta rev. 28/11/2024'}, R007522:{n:'Macaé Bunker', sub:'R007522 · esquemático (sem planta)'}, R010713:{n:'Porto do Açu', sub:'R010713 · esquemático (sem planta)'}};
function sceneOfKey(key){ var a = AREA[key]; return a ? a.scene : null; }
function keyPass(key, A){ return !!(A.byM[A.ref] && A.byM[A.ref].key[key]); }
function pagePlanta(){
  var A = agg(), ref = A.ref;
  var h = pgHead('Planta 3D', 'Prédios e pátios da planta da base com o custo de <b>' + esc(mLong(ref)) + '</b> (último mês do período). Cores da legenda da planta; prédios compartilhados aparecem divididos por PSL na proporção da área ocupada. Clique numa área ou escolha na lista para destacá-la.');
  if (!M.keys.length) return h + '<div class="ana-grid">' + noData() + '</div>';
  h += navCards();
  var sc = S.ui.scene, info = areaInfo(ref);
  // legenda (cores da planta) a partir do que existe na cena
  var cks = {};
  Object.keys(AREA).forEach(function(k){ if (AREA[k].scene !== sc || !info[k]) return; Object.keys(info[k].ck).forEach(function(c){ cks[c] = (cks[c] || 0) + info[k].ck[c].a; }); });
  var ckList = Object.keys(cks).sort(function(a, b){ var sa = PLAN[a] && PLAN[a].sup ? 1 : 0, sb = PLAN[b] && PLAN[b].sup ? 1 : 0; return sa - sb || cks[b] - cks[a]; });
  var lg = planLegend(info, sc, ckList, ref);
  var tools = seg('scene', sc, [['base', 'Base Cavaleiros'], ['R007522', 'Bunker'], ['R010713', 'Porto do Açu']]) + seg('c3d', S.ui.color3d, [['psl', 'PSL'], ['usd', 'US$/m²']]);
  var body = '<div class="v3d" id="v3d">' + (S.ui.fs ? '<div class="v3d-nogl">Planta aberta em tela cheia · <a href="#" data-act="fsclose">voltar para cá</a></div>' : '') + '</div>' + lg;
  h += '<div class="ana-grid">' +
    card('s8', 'Planta 3D · ' + SCENES[sc].n, body, {tools:tools,
      hint:'<b>' + esc(SCENES[sc].sub) + '.</b> <b>Clique na planta para abrir em tela cheia</b>, com indicadores, detalhe da área e mapa para navegar. Arraste para girar · roda do mouse para zoom · botão direito (ou Shift + arrastar) para mover. Passe o mouse para ver o valor. Filtros de facility, PSL e busca destacam as áreas correspondentes. Alturas são ilustrativas.' + (sc !== 'base' ? ' <b>Esta facility não está na planta enviada</b>: blocos dimensionados pela área ocupada.' : '')}) +
    card('s4', 'Área selecionada', detailPanel(A, info)) + '</div>';
  // tabela das áreas da cena
  var pk = prevKey(ref), infoP = pk ? areaInfo2(pk) : {};
  var rows = Object.keys(AREA).filter(function(k){ return AREA[k].scene === sc && info[k] && keyPass(k, A); }).map(function(k){
    var i = info[k], ps = Object.keys(i.psl).sort(function(a, b){ return i.psl[b] - i.psl[a]; });
    return {k:k, a:AREA[k], c:i.tot, ar:i.area, ps:ps, n:i.rows.length, pv:infoP[k] ? infoP[k] : null, fc:A.byM[ref].key[k] || 0};
  });
  var cols = [
    {k:'lb', label:'Área', v:function(r){ return areaShort(r.k); }, cls:'strong'},
    {k:'nm', label:'Nome', v:function(r){ return r.a.name; }},
    {k:'tp', label:'Tipo', v:function(r){ return r.a.kind === 'y' ? 'Pátio' : 'Edificação'; }},
    {k:'ps', label:'PSL principal', v:function(r){ return r.ps[0]; }, html:function(r){ var i = info[r.k], top = Object.keys(i.ck).sort(function(a, b){ return i.ck[b].c - i.ck[a].c; })[0]; return '<span class="sw" style="background:' + planCol(top) + '"></span>' + esc(r.ps[0]) + (r.ps.length > 1 ? ' <span class="tag">+' + (r.ps.length - 1) + '</span>' : ''); }},
    {k:'n', label:'Espaços', v:function(r){ return r.n; }, f:fN, num:true},
    {k:'ar', label:'Área m²', v:function(r){ return r.ar; }, f:fM2, num:true},
    {k:'c', label:'US$ · ' + mLbl(ref), v:function(r){ return r.c; }, f:fUS, num:true, cls:'strong'},
    {k:'u', label:'US$/m²', v:function(r){ return r.ar ? r.c / r.ar : 0; }, f:fM2u, num:true},
    {k:'d', label:'vs ' + mLbl(pk), v:function(r){ return r.pv ? (r.c - r.pv) / r.pv : 0; }, num:true, html:function(r){ return r.pv ? delta(r.c, r.pv) : '—'; }}
  ];
  var tt = sum(rows.map(function(r){ return r.c; })), ta = sum(rows.map(function(r){ return r.ar; }));
  h += '<div class="ana-grid">' + card('s12', 'Áreas · ' + SCENES[sc].n + ' · ' + mLbl(ref), rows.length ? table('pl-a', rows, cols, {defKey:'c', defDir:-1, rowAct:'sel3d', rowKey:function(r){ return r.k; },
      foot:['Total (' + rows.length + ')', '', '', '', fN(sum(rows.map(function(r){ return r.n; }))), fM2(ta), fUS(tt), fM2u(ta ? tt / ta : 0), '']}) : '<div class="empty-state"><div class="sub">Nenhuma área desta cena no recorte.</div></div>',
    {xls:['pl-a', function(){ return {name:'areas_planta_' + ref, rows:[['Área', 'Código', 'Nome', 'Tipo', 'PSLs', 'Espaços', 'Área m²', 'US$', 'US$/m²']].concat(rows.map(function(r){ return [areaShort(r.k), r.a.code, r.a.name, r.a.kind === 'y' ? 'Pátio' : 'Edificação', r.ps.join(', '), r.n, r2(r.ar), r2(r.c), r.ar ? r2(r.c / r.ar) : '']; }))}; }],
     hint:'Valores completos de cada área no mês (sem os filtros de PSL e busca, que só definem quais áreas aparecem). Clique numa linha para destacá-la na planta.'}) + '</div>';
  return h;
}
function areaInfo2(k){ var map = {}; (DATA.rows[k] || []).forEach(function(r){ var key = M.okey[r[0]]; map[key] = (map[key] || 0) + r[3]; }); return map; }
function detailPanel(A, info){
  var ref = A.ref, sc = S.ui.scene, key = S.ui.sel3d && sceneOfKey(S.ui.sel3d) === sc ? S.ui.sel3d : null;
  var keys = Object.keys(AREA).filter(function(k){ return AREA[k].scene === sc; });
  var opt = function(k){ var i = info[k]; return '<option value="' + esc(k) + '"' + (k === key ? ' selected' : '') + '>' + esc(areaLabel(k) + (i ? ' — ' + fUSk(i.tot) : ' — sem custo')) + '</option>'; };
  var srt = function(a, b){ return (info[b] ? info[b].tot : -1) - (info[a] ? info[a].tot : -1); };
  var bl = keys.filter(function(k){ return AREA[k].kind === 'b'; }).sort(srt), yl = keys.filter(function(k){ return AREA[k].kind === 'y'; }).sort(srt);
  var h = '<div class="det-pick"><select class="sel" data-chg="sel3d" aria-label="Selecionar área"><option value="">Selecionar área…</option><optgroup label="Edificações">' + bl.map(opt).join('') + '</optgroup><optgroup label="Pátios">' + yl.map(opt).join('') + '</optgroup></select>' +
    (key ? '<button class="chip sm" data-act="sel3d" data-k="" title="Limpar seleção">✕</button>' : '') + '</div>';
  if (!key){
    var top = keys.filter(function(k){ return info[k] && keyPass(k, A); }).sort(srt).slice(0, 12);
    return h + '<div class="note">Clique numa edificação ou pátio da planta para ver <b>a quem pertence</b> (PSL), a <b>descrição</b> e o <b>valor pago</b> em ' + esc(mLong(ref)) + '.</div>' +
      '<div class="det-sec">Maiores custos · ' + mLbl(ref) + '</div>' +
      hbars(top.map(function(k){ var i = info[k], c = Object.keys(i.ck).sort(function(a, b){ return i.ck[b].c - i.ck[a].c; })[0]; return {id:k, label:areaLabel(k), v:i.tot, c:'#CC0000', sw:planCol(c)}; }), {act:'sel3d', stack:true});
  }
  var a = AREA[key], i = info[key];
  h += '<div class="det-h"><span class="det-code">' + esc(areaShort(key)) + '</span><div><b>' + esc(a.name) + '</b><small>' + esc(a.site + ' · ' + a.code + ' · ' + facName(SITE[a.site].fac)) + '</small></div></div>';
  if (!i) return h + '<div class="det-note">Sem custo alocado no relatório de <b>' + esc(mLong(ref)) + '</b> para esta ' + (a.kind === 'y' ? 'área' : 'edificação') + ' (área comum, guarita, subestação ou estrutura sem rateio).</div>';
  var pk = prevKey(ref), pv = pk ? areaInfo2(pk)[key] : null;
  h += '<div class="attr-grid k2">' +
    '<div class="attr"><span>Valor pago · ' + mLbl(ref) + '</span><b>' + fUS(i.tot) + '</b></div>' +
    '<div class="attr"><span>vs ' + mLbl(pk) + '</span><b>' + (pv ? delta(i.tot, pv) + '<small>' + fUSk(pv) + '</small>' : '—') + '</b></div>' +
    '<div class="attr"><span>Área ocupada</span><b>' + fM2(i.area) + '</b></div>' +
    '<div class="attr"><span>Custo por m²</span><b>' + fM2u(i.area ? i.tot / i.area : 0) + '</b></div></div>';
  if (a.kind === 'y' && a.parts.length > 1 && S.ui.patch) h += '<div class="det-note">Trecho clicado: <b>' + esc(S.ui.patch) + '</b> — o lote ' + esc(a.code) + ' soma ' + fM2(i.area) + ' em ' + a.parts.length + ' trechos da planta, todos destacados.</div>';
  var cks = Object.keys(i.ck).sort(function(x, y){ return i.ck[y].c - i.ck[x].c; });
  var ckT = cks.slice(0, 8), ckR = cks.slice(8);
  h += '<div class="det-sec">A quem pertence · PSL' + (cks.length > 1 ? ' · ' + cks.length : '') + '</div>' + hbars(ckT.map(function(c){ var x = i.ck[c]; return {id:x.psl, label:planName(c), tag:M.pslName[x.psl] || '', v:x.c, c:'#CC0000', sw:planCol(c), sub:fM2(x.a) + ' · ' + fPct(x.c / i.tot)}; }), {act:'psl', stack:true}) +
    (ckR.length ? '<div class="note" style="margin-top:6px">+ ' + ckR.length + ' PSLs menores: ' + esc(ckR.map(function(c){ return planName(c) + ' ' + fUSk(i.ck[c].c); }).join(' · ')) + '</div>' : '');
  // descrições (centro de custo)
  var ds = {};
  i.rows.forEach(function(r){ var d = DATA.T.desc[r[2]], p = DATA.T.psl[r[1]], k2 = p + '¦' + d, x = ds[k2] || (ds[k2] = {p:p, d:d, c:0, a:0, n:0}); x.c += r[3]; x.a += r[4]; x.n++; });
  var dl = Object.keys(ds).map(function(k2){ return ds[k2]; }).sort(function(x, y){ return y.c - x.c; });
  h += '<div class="det-sec">Descrição (centro de custo)</div><div class="tbl-scroll" style="max-height:230px"><table class="db-table"><thead><tr><th>Descrição</th><th>PSL</th><th class="num">m²</th><th class="num">US$</th></tr></thead><tbody>' +
    dl.map(function(x){ return '<tr><td class="wrap">' + esc(x.d) + (x.n > 1 ? '<span class="sub-t">' + x.n + ' espaços</span>' : '') + '</td><td>' + esc(x.p) + '</td><td class="num">' + NF0.format(x.a) + '</td><td class="num strong">' + fUS(x.c) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  var hk = A.ks.length > 1 ? A.ks : M.keys, hist = keyHist(key, hk);
  h += '<div class="det-sec">Histórico mensal</div>' + vbars(hk.map(function(k){ return {k:k, label:MES_C[+k.slice(5) - 1], parts:[{v:hist[k].c, c:k === ref ? '#CC0000' : '#A8AFB5', n:areaShort(key)}]}; }), {mini:true});
  h += '<div class="actbar"><button class="btn-o" data-act="keytab" data-k="' + esc(key) + '">' + IC.listS + ' Ver os ' + fN(i.rows.length) + ' espaços</button></div>';
  return h;
}

function pageAreas(){
  var h = pgHead('Áreas e espaços', 'Cada objeto de reserva (sala, galpão, tenda, pátio) com o custo mês a mês · ' + esc(perLbl()) + '. Clique numa linha para ver o histórico do espaço.');
  if (!M.keys.length) return h + '<div class="ana-grid">' + noData() + '</div>';
  var A = agg(), ks = A.ks, T = DATA.T; h += navCards();
  var rows = Object.keys(A.obj).map(function(i){ return A.obj[i]; });
  if (!rows.length) return h + emptyCut();
  var cols = [
    {k:'id', label:'Código', v:function(r){ return DATA.objs[r.oi][0]; }, cls:'strong'},
    {k:'ar', label:'Prédio / pátio', v:function(r){ return areaLabel(M.okey[r.oi]); }, cls:'nm'},
    {k:'fc', label:'Facility', v:function(r){ return facName(DATA.objs[r.oi][2]); }},
    {k:'p', label:'PSL', v:function(r){ return T.psl[r.last[1]]; }},
    {k:'d', label:'Descrição', v:function(r){ return T.desc[r.last[2]]; }, cls:'nm'},
    {k:'st', label:'Tipo', v:function(r){ return T.st[r.last[5]] || '—'; }},
    {k:'a', label:'m²', v:function(r){ return r.last[4]; }, f:function(v){ return NF1.format(v); }, num:true}
  ].concat(ks.map(function(k){ return {k:'m' + k, label:mLbl(k), v:function(r){ return r.m[k] || 0; }, f:function(v){ return v ? fUS(v) : '—'; }, num:true}; }))
   .concat([{k:'tot', label:'Total', v:function(r){ return r.tot; }, f:fUS, num:true, cls:'strong'}]);
  var foot = ['Total (' + fN(rows.length) + ')', '', '', '', '', '', ''].concat(ks.map(function(k){ return fUS(A.byM[k].tot); })).concat([fUS(A.tot)]);
  h += '<div class="ana-grid">' + card('s12', 'Espaços no recorte', table('a-l', rows, cols, {defKey:'tot', defDir:-1, foot:foot, rowAct:'obj', rowKey:function(r){ return r.oi; }}),
    {small:fN(rows.length) + ' espaços',
     xls:['a-l', function(){ return {name:'espacos_real_estate', rows:[cols.map(function(c){ return c.label; })].concat(rows.map(function(r){ return cols.map(function(c){ var v = c.v(r); return typeof v === 'number' ? r2(v) : v; }); }))}; }],
     hint:'PSL, descrição, tipo e m² são os do último mês em que o espaço aparece no período.'}) + '</div>';
  return h;
}

function pageBase(){
  var h = pgHead('Base de dados', 'Meses compilados a partir da planilha de custos de real estate. Para atualizar, carregue uma nova versão da planilha (.xlsx): cada aba de mês (ex.: <b>nov-26</b>) é lida pelos nomes das colunas e substitui o mês, se já existir.');
  h += '<label class="drop" id="drop"><span class="drop-ic">' + IC.up + '</span><h3>Arraste a planilha aqui</h3><p>ou selecione o arquivo — o nome de cada aba indica o mês (jan-26, fev-26…). Colunas obrigatórias: <b>Ext. ID Reserv. Obj.</b>, <b>Facility Name</b>, <b>PSL</b>, <b>Actual Cost</b> e <b>Occupied Area M²</b>.</p>' +
    '<span class="btn-r" role="button">⬆ Selecionar planilha</span><input type="file" id="fileIn" accept=".xlsx,.xlsm,.xls" hidden/></label>';
  if (S.busy) h += '<div class="actbar"><span class="busy"><span class="spin"></span>Lendo a planilha…</span></div>';
  if (S.pending.length) h += S.pending.map(function(p){ return '<div class="' + (p.err ? 'err-bar' : 'ok-bar') + '" style="margin-top:10px">' + esc(p.msg) + '</div>'; }).join('');
  var rows = M.keys.map(function(k){ var R = DATA.rows[k], c = 0, a = 0; R.forEach(function(r){ c += r[3]; a += r[4]; }); return {k:k, mi:M.mInfo[k] || {}, n:R.length, c:c, a:a}; });
  var cols = [
    {k:'k', label:'Mês', v:function(r){ return r.k; }, f:mLbl, cls:'strong'},
    {k:'sh', label:'Aba', v:function(r){ return r.mi.sheet || '—'; }},
    {k:'pe', label:'Período (coluna Period)', v:function(r){ return r.mi.period || '—'; }},
    {k:'n', label:'Linhas', v:function(r){ return r.n; }, f:fN, num:true},
    {k:'a', label:'Área m²', v:function(r){ return r.a; }, f:fM2, num:true},
    {k:'c', label:'US$', v:function(r){ return r.c; }, f:fUS, num:true, cls:'strong'},
    {k:'u', label:'US$/m²', v:function(r){ return r.a ? r.c / r.a : 0; }, f:fM2u, num:true}
  ];
  h += '<div class="ana-grid" style="margin-top:16px">' + card('s12', 'Meses na base', table('b-m', rows, cols, {defKey:'k', defDir:1, tall:false}),
    {small:esc(DATA.src || ''), hint:(LOCAL ? '<b>Base atualizada neste navegador</b> (salva localmente). <a href="#" data-act="reset-base">Voltar à base embutida no arquivo</a>. ' : 'Base embutida no arquivo HTML. ') +
      'Use <b>Exportar HTML</b> para gerar uma cópia deste app com a base atual embutida, para enviar a outras pessoas.'}) + '</div>';
  return h;
}

/* ── modais ── */
function objModal(oi){
  var o = DATA.objs[oi]; if (!o) return '';
  var T = DATA.T, key = M.okey[oi], hist = [];
  M.keys.forEach(function(k){ DATA.rows[k].forEach(function(r){ if (r[0] === oi) hist.push({k:k, r:r}); }); });
  var last = hist[hist.length - 1], r = last ? last.r : null;
  var body = hist.map(function(x){ var r = x.r; return '<tr><td class="strong">' + mLbl(x.k) + '</td><td>' + esc(T.psl[r[1]]) + '</td><td>' + esc(T.desc[r[2]]) + '</td><td>' + esc(T.st[r[5]] || '—') + '</td><td class="num">' + NF2.format(r[7]) + '</td><td class="num">' + NF1.format(r[4]) + '</td><td class="num strong">' + fUS(r[3]) + '</td><td class="num">' + fM2u(r[4] ? r[3] / r[4] : 0) + '</td></tr>'; }).join('');
  var a = AREA[key], cc = r ? DATA.cc[T.cc[r[6]]] : null;
  return '<div class="overlay" data-act="mclose"><div class="modal" role="dialog" aria-modal="true" data-stop="1"><div class="modal-title"><div>' + esc(o[0]) + '<small>' + esc(areaLabel(key) + ' · ' + facName(o[2]) + ' · ' + o[3]) + '</small></div><button class="modal-close" data-act="mclose" aria-label="Fechar">✕</button></div>' +
    '<div class="attr-grid"><div class="attr"><span>Facility · site</span><b>' + esc(facName(o[2]) + ' · ' + o[1]) + '</b></div><div class="attr"><span>Prédio / pátio</span><b>' + esc(codeOf(o)) + (o[4] !== 'L01' ? ' · pav. ' + esc(o[5]) : '') + '</b></div>' +
    '<div class="attr"><span>PSL · ' + mLbl(last && last.k) + '</span><b>' + esc(r ? T.psl[r[1]] : '—') + '</b></div><div class="attr"><span>Divisão</span><b>' + esc(cc ? cc.div : (r ? M.pslDiv[T.psl[r[1]]] : '—')) + '</b></div>' +
    '<div class="attr"><span>Centro de custo (PSL CC)</span><b>' + esc(r ? T.cc[r[6]] : '—') + '</b></div><div class="attr"><span>Área ocupada</span><b>' + (r ? fM2(r[4]) : '—') + '</b></div></div>' +
    '<div class="tbl-scroll"><table class="db-table"><thead><tr><th>Mês</th><th>PSL</th><th>Descrição</th><th>Tipo de espaço</th><th class="num">Fator</th><th class="num">m²</th><th class="num">US$</th><th class="num">US$/m²</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
    (a ? '<div class="actbar"><button class="btn-g" data-act="see3d" data-k="' + esc(key) + '">' + IC.cube + ' Ver na planta 3D</button></div>' : '') + '</div></div>';
}
function keyModal(key){
  var A = agg(), ref = A.ref, T = DATA.T, rows = (DATA.rows[ref] || []).filter(function(r){ return M.okey[r[0]] === key; });
  var cols = [
    {k:'id', label:'Espaço', v:function(r){ return DATA.objs[r[0]][0].split('-').slice(2).join('-'); }, cls:'strong'},
    {k:'fl', label:'Pav.', v:function(r){ return DATA.objs[r[0]][5]; }},
    {k:'p', label:'PSL', v:function(r){ return T.psl[r[1]]; }, html:function(r){ return '<span class="sw" style="background:' + planCol(ckOf(T.psl[r[1]], T.desc[r[2]])) + '"></span>' + esc(T.psl[r[1]]); }},
    {k:'d', label:'Descrição', v:function(r){ return T.desc[r[2]]; }},
    {k:'st', label:'Tipo', v:function(r){ return T.st[r[5]] || '—'; }},
    {k:'a', label:'m²', v:function(r){ return r[4]; }, f:function(v){ return NF1.format(v); }, num:true},
    {k:'c', label:'US$', v:function(r){ return r[3]; }, f:fUS, num:true, cls:'strong'}
  ];
  return '<div class="overlay" data-act="mclose"><div class="modal" role="dialog" aria-modal="true" data-stop="1"><div class="modal-title"><div>' + esc(areaLabel(key)) + '<small>' + fN(rows.length) + ' espaços · ' + esc(mLong(ref)) + ' · ' + fUS(sum(rows.map(function(r){ return r[3]; }))) + '</small></div><button class="modal-close" data-act="mclose" aria-label="Fechar">✕</button></div>' +
    table('k-l', rows, cols, {defKey:'c', defDir:-1, rowAct:'obj', rowKey:function(r){ return r[0]; }}) + '</div></div>';
}

function sceneCks(info, sc){
  var cks = {};
  Object.keys(AREA).forEach(function(k){ if (AREA[k].scene !== sc || !info[k]) return; Object.keys(info[k].ck).forEach(function(c){ cks[c] = (cks[c] || 0) + info[k].ck[c].a; }); });
  return Object.keys(cks).sort(function(a, b){ var sa = PLAN[a] && PLAN[a].sup ? 1 : 0, sb = PLAN[b] && PLAN[b].sup ? 1 : 0; return sa - sb || cks[b] - cks[a]; });
}
function planLegend(info, sc, ckList, ref){
  ckList = ckList || sceneCks(info, sc);
  if (S.ui.color3d === 'usd'){
    var r = V3range(info, sc);
    return '<div class="scale-bar"><span>US$/m² · ' + mLbl(ref) + '</span><b>' + fM2u(r[0]) + '</b><span class="g" style="background:linear-gradient(90deg,' + HEAT.join(',') + ')"></span><b>' + fM2u(r[1]) + '</b><span><i class="sw" style="background:#c9cdd0"></i>sem custo no relatório</span></div>';
  }
  return '<div class="lgd plan">' + ckList.map(function(c){ var p = c === 'HPS-N2' ? 'HPS' : c, on = S.f.psls.indexOf(p) >= 0, off = S.f.psls.length && !on;
    return '<button type="button" data-act="psl" data-k="' + esc(p) + '" class="' + (on ? 'on' : off ? 'off' : '') + '" title="Filtrar ' + esc(p) + ' · Ctrl + clique para somar"><i class="sw" style="background:' + planCol(c) + '"></i>' + esc(planName(c)) + '</button>'; }).join('') +
    '<button type="button" style="cursor:default"><i class="sw" style="background:#c9cdd0"></i>Sem custo no relatório</button></div>';
}
/* Tela cheia: barra de comando, indicadores sobrepostos, detalhe da área, legenda e minimapa */
function fsOverlay(){
  var A = agg(), ref = A.ref, sc = S.ui.scene, info = areaInfo(ref), m = A.byM[ref] || {tot:0, area:0, n:0, key:{}}, pk = prevKey(ref), prev = monthTot(pk);
  var keysSc = Object.keys(AREA).filter(function(k){ return AREA[k].scene === sc; });
  var scT = 0, scA = 0, scN = 0; keysSc.forEach(function(k){ if (m.key[k]){ scT += m.key[k]; scA += m.keyA[k] || 0; scN++; } });
  var kp = function(val, lbl, sub, cls){ return '<div class="kpi-tile v3fs-kpi ' + (cls || '') + '"><div class="kpi-val">' + val + '</div><div class="kpi-lbl">' + lbl + '</div>' + (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + '</div>'; };
  var h = '<div class="v3fs" role="dialog" aria-label="Planta 3D em tela cheia"><div class="v3fs-stage" id="v3fs"></div>' +
    '<div class="v3fs-bar"><button type="button" class="v3fs-x" data-act="fsclose" title="Fechar a tela cheia (Esc)">✕ <span>Fechar 3D</span></button>' +
    '<div class="v3fs-t"><b>Base Macaé em 3D</b><small>Real Estate · ' + esc(mLong(ref)) + ' · ' + esc(SCENES[sc].n) + '</small></div>' +
    '<div class="v3fs-pills">' + seg('scene', sc, [['base', 'Base Cavaleiros'], ['R007522', 'Bunker'], ['R010713', 'Porto do Açu']]) + seg('c3d', S.ui.color3d, [['psl', 'PSL'], ['usd', 'US$/m²']]) + '</div>' +
    '<span class="v3fs-sp"></span>' +
    '<button type="button" class="chip' + (S.ui.labels ? ' on' : '') + '" data-act="lbl" title="Mostrar ou ocultar as etiquetas de valor">Etiquetas</button>' +
    '<button type="button" class="chip" data-act="fstop" title="Ver de cima">Vista de topo</button>' +
    '<button type="button" class="chip" data-act="fsreset" title="Voltar à visão geral da base">⌂ <span>Visão geral</span></button></div>' +
    '<div class="v3fs-kpis">' +
      kp(fUSkH(m.tot), 'Custo · ' + mLbl(ref), prev != null ? delta(m.tot, prev) + ' vs ' + mLbl(pk) : 'no recorte', 'hero') +
      kp(fUSkH(scT), SCENES[sc].n, fN(scN) + ' áreas com custo') +
      kp(NF0.format(m.area) + '<small>m²</small>', 'Área ocupada', 'no recorte · ' + mLbl(ref)) +
      kp('<small class="pre">US$</small>' + NF2.format(m.area ? m.tot / m.area : 0) + '<small>/m²</small>', 'Custo por m²', scA ? 'nesta cena: ' + fM2u(scT / scA) : '') +
      kp(fUSkH(A.tot), 'Período · ' + A.ks.length + (A.ks.length === 1 ? ' mês' : ' meses'), 'média ' + fUSk(A.ks.length ? A.tot / A.ks.length : 0) + '/mês') +
    '</div>' +
    '<div class="v3fs-side' + (S.ui.sel3d && sceneOfKey(S.ui.sel3d) === sc ? ' has' : '') + '"><div class="ana-card-title"><span>Área selecionada</span></div>' + detailPanel(A, info) + '</div>' +
    '<div class="v3fs-legend">' + planLegend(info, sc, null, ref) + '</div>' +
    '<div class="v3fs-map" id="v3map"></div></div>';
  return h;
}
