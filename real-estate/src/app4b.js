/* ═════════════════════════════════════════════════════════════
   8. Renderização e eventos
   ═════════════════════════════════════════════════════════════ */
var FILTER_VIEWS = {home:1, mes:1, psl:1, planta:1, areas:1};
function pageHTML(){
  switch (S.view){
    case 'mes': return pageMes();
    case 'psl': return pagePSL();
    case 'planta': return pagePlanta();
    case 'areas': return pageAreas();
    case 'base': return pageBase();
    default: return pageHome();
  }
}
function modalHTML(){ if (!S.modal) return ''; return S.modal.t === 'obj' ? objModal(S.modal.k) : keyModal(S.modal.k); }
function render(keepScroll){
  AG = null; XP = {};
  var app = $('#app'), old = $('#content'), st = old ? old.scrollTop : 0, ae = document.activeElement, focusKey = ae && ae.getAttribute && ae.getAttribute('data-inp');
  var selS = ae && ae.selectionStart;
  app.innerHTML = '<div class="app">' + header() + navbar() + (FILTER_VIEWS[S.view] && M.keys.length ? filterBar() : miniBar()) +
    '<div class="content" id="content"><div class="wrap">' + pageHTML() + '</div></div></div>' + (S.ui.fs && S.view === 'planta' ? fsOverlay() : '') + modalHTML() + (S.toast ? '<div class="toast">' + esc(S.toast) + '</div>' : '');
  var c = $('#content'); if (keepScroll) c.scrollTop = st;
  if (focusKey){ var el = $('[data-inp="' + focusKey + '"]'); if (el){ el.focus(); try{ el.setSelectionRange(selS, selS); }catch(e){} } }
  if (S.view === 'planta') v3Mount();
  saveUI();
}
var toastT = null;
function toast(msg){ S.toast = msg; render(true); clearTimeout(toastT); toastT = setTimeout(function(){ S.toast = ''; var t = $('.toast'); if (t) t.remove(); }, 3600); }
function go(v){ if (v === S.view) return; S.hist.push(S.view); S.view = v; S.ui.pslOpen = false; S.modal = null; S.ui.fs = false; render(); }
function setPer(from, to){ S.f.from = from; S.f.to = to; render(true); }
function toggle(arr, v){ var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
function pickOne(arr, k, multi){ if (!k) return []; if (multi){ var c = arr.slice(); toggle(c, k); return c; } return (arr.length === 1 && arr[0] === k) ? [] : [k]; }
function select3d(k, fly){
  S.ui.sel3d = k || null; S.ui.patch = '';
  if (k){ var sc = sceneOfKey(k); if (sc && sc !== S.ui.scene) S.ui.scene = sc; if (fly) V3.flyKey = k; }
  S.modal = null;
  if (S.view !== 'planta'){ S.hist.push(S.view); S.view = 'planta'; render(); } else render(true);
}

document.addEventListener('click', function(ev){
  var t = ev.target;
  if (t.closest && t.closest('.v3d-wrap')) return;
  var a = t.closest('[data-act]');
  if (S.ui.pslOpen && !t.closest('.msel')){ S.ui.pslOpen = false; if (!a){ render(true); return; } }
  if (!a) return;
  var act = a.getAttribute('data-act'), k = a.getAttribute('data-k'), multi = ev.ctrlKey || ev.metaKey;
  if (act === 'mclose'){ if (t.closest('[data-stop]') && !t.closest('.modal-close')) return; S.modal = null; render(true); return; }
  if (a.tagName === 'A') ev.preventDefault();
  switch (act){
    case 'go': go(k); break;
    case 'back': S.view = S.hist.length ? S.hist.pop() : 'home'; S.ui.pslOpen = false; S.modal = null; render(); break;
    case 'per': var ks = M.keys, last = ks[ks.length - 1];
      if (k === 'last') setPer(last, last); else if (k === '3m') setPer(from3(ks), last); else setPer(ks[0], last);
      break;
    case 'month': if (S.f.from === k && S.f.to === k) setPer(M.keys[0], M.keys[M.keys.length - 1]); else setPer(k, k); break;
    case 'fac': S.f.facs = pickOne(S.f.facs, k, multi); render(true); break;
    case 'psl': if (a.tagName === 'INPUT') toggle(S.f.psls, k); else S.f.psls = pickOne(S.f.psls, k, multi); render(true); break;
    case 'pslx': toggle(S.f.psls, k); render(true); break;
    case 'pslt': S.ui.pslOpen = !S.ui.pslOpen; render(true); break;
    case 'pslclr': S.f.psls = []; render(true); break;
    case 'st': S.f.st = S.f.st === k ? '' : k; render(true); break;
    case 'fbt': S.ui.fbOpen = !S.ui.fbOpen; render(true); break;
    case 'clr': S.f.facs = []; S.f.psls = []; S.f.st = ''; S.f.q = ''; render(true); break;
    case 'sort': var id = a.getAttribute('data-t'), cur = S.ui.sort[id];
      S.ui.sort[id] = {k:k, d:cur && cur.k === k ? -cur.d : (/^(p|nm|dv|lb|tp|ps|id|ar|fc|d|st|k|sh|pe|fr|to|fl)$/.test(k) ? 1 : -1)}; render(true); break;
    case 'obj': S.modal = {t:'obj', k:+k}; render(true); break;
    case 'keytab': S.modal = {t:'key', k:k}; render(true); break;
    case 'see3d': select3d(k, true); break;
    case 'sel3d': select3d(k, true); break;
    case 'scene': if (S.ui.scene !== k){ S.ui.scene = k; S.ui.sel3d = null; render(true); } break;
    case 'c3d': S.ui.color3d = k; render(true); break;
    case 'evo': S.ui.evo = k; render(true); break;
    case 'fsclose': S.ui.fs = false; render(true); break;
    case 'fsreset': if (V3.renderer) v3Fit(S.ui.scene, false, true); break;
    case 'fstop': if (V3.renderer) v3Fit(S.ui.scene, true, true); break;
    case 'lbl': S.ui.labels = !S.ui.labels; render(true); break;
    case 'trmode': S.ui.trMode = k; render(true); break;
    case 'trhide': var hd = S.ui.trHide || (S.ui.trHide = {}); if (hd[k]) delete hd[k]; else hd[k] = 1; render(true); break;
    case 'trall': S.ui.trHide = {}; render(true); break;
    case 'trnone': S.ui.trHide = {}; Object.keys(agg().psl).forEach(function(p){ S.ui.trHide[p] = 1; }); render(true); break;
    case 'xls': var x = XP[k] && XP[k](); if (x) exportXlsx(x.name, x.rows); break;
    case 'exp-xlsx': exportConsolidado(); break;
    case 'exp-html': exportHTML(); break;
    case 'reset-base': if (confirm('Descartar a base atualizada neste navegador e voltar à base embutida no arquivo?')){ try{ localStorage.removeItem(LS_DATA); }catch(e){} location.reload(); } break;
  }
});
document.addEventListener('change', function(ev){
  var t = ev.target;
  if (t && t.id === 'fileIn'){ handleFiles(t.files); t.value = ''; return; }
  var c = t.getAttribute && t.getAttribute('data-chg'); if (!c) return;
  var v = t.value;
  if (c === 'from' || c === 'to'){ S.f[c] = v; if (S.f.from > S.f.to){ if (c === 'from') S.f.to = v; else S.f.from = v; } render(true); }
  else if (c === 'st'){ S.f.st = v; render(true); }
  else if (c === 'sel3d') select3d(v, true);
});
var inpT = null;
document.addEventListener('input', function(ev){
  var t = ev.target, k = t.getAttribute && t.getAttribute('data-inp'); if (!k) return;
  if (k === 'q'){ S.f.q = t.value; clearTimeout(inpT); inpT = setTimeout(function(){ render(true); }, 240); }
  else if (k === 'pslq'){ S.ui.pslQ = t.value; var q = norm(t.value); document.querySelectorAll('.msel-l label').forEach(function(l){ l.hidden = q && norm(l.getAttribute('data-psl')).indexOf(q) < 0; }); }
});
document.addEventListener('keydown', function(ev){
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target && ev.target.matches && ev.target.matches('[tabindex][data-act]')){ ev.preventDefault(); ev.target.click(); return; }
  if (ev.key === 'Escape'){ if (S.modal){ S.modal = null; render(true); } else if (S.ui.pslOpen){ S.ui.pslOpen = false; render(true); } else if (S.ui.fs){ S.ui.fs = false; render(true); } else if (S.ui.sel3d && S.view === 'planta'){ S.ui.sel3d = null; render(true); } }
});
window.addEventListener('dragover', function(e){ e.preventDefault(); var d = $('#drop'); if (d) d.classList.add('over'); });
window.addEventListener('dragleave', function(e){ if (e.target === document.documentElement || !e.relatedTarget){ var d = $('#drop'); if (d) d.classList.remove('over'); } });
window.addEventListener('drop', function(e){ e.preventDefault(); var d = $('#drop'); if (d) d.classList.remove('over'); if (S.view === 'base' && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });

/* ═════════════════════════════════════════════════════════════
   9. Atualização da base, exportações
   ═════════════════════════════════════════════════════════════ */
var MES_TOK = {JAN:1,FEB:2,FEV:2,MAR:3,APR:4,ABR:4,MAY:5,MAI:5,JUN:6,JUL:7,AUG:8,AGO:8,SEP:9,SET:9,OCT:10,OUT:10,NOV:11,DEC:12,DEZ:12};
function monthKey(s){
  var m = norm(s).match(/([A-Z]{3})[A-Z]*[\s\-_\/.']*(\d{2,4})/); if (!m || !MES_TOK[m[1]]) return null;
  var y = +m[2]; if (y < 100) y += 2000; return y + '-' + pad(MES_TOK[m[1]]);
}
var HDR = {EXTIDRESERVOBJ:'id', SITE:'site', CITY:'city', FACILITYNAME:'fac', ACTUALCOST:'cost', PSL:'psl', PSLCC:'cc', PRICEFACTOR:'pf', OCCUPIEDAREAM:'area', SPACETYPE:'st', DESCRIPTION:'desc', PERIOD:'per', DIVISIONNAME:'div', PSLNAME:'pn', SUBPSLNAME:'sub'};
function mapHdr(row){ var m = {}; (row || []).forEach(function(v, i){ if (v == null) return; var k = HDR[compact(v)]; if (k && m[k] == null) m[k] = i; }); return m; }
function parseWorkbook(buf){
  var wb = XLSX.read(buf, {type:'array'}), T = DATA.T, out = [];
  var idx = {}; Object.keys(T).forEach(function(t){ idx[t] = {}; T[t].forEach(function(v, i){ idx[t][v] = i; }); });
  var ti = function(t, v){ v = v == null ? '' : String(v).trim(); if (idx[t][v] == null){ idx[t][v] = T[t].length; T[t].push(v); } return idx[t][v]; };
  var oidx = {}; DATA.objs.forEach(function(o, i){ oidx[o[0]] = i; });
  wb.SheetNames.forEach(function(sn){
    var ws = wb.Sheets[sn]; if (!ws || !ws['!ref']) return;
    var aoa = XLSX.utils.sheet_to_json(ws, {header:1, raw:true, defval:null, blankrows:false});
    var hr = -1, mp = null;
    for (var i = 0; i < Math.min(15, aoa.length); i++){ var m = mapHdr(aoa[i]); if (m.id != null && m.cost != null && m.psl != null){ hr = i; mp = m; break; } }
    if (hr < 0) return;
    var mk = monthKey(sn);
    if (!mk){ out.push({err:1, msg:'Aba "' + sn + '": não reconheci o mês pelo nome (use, por exemplo, nov-26). Aba ignorada.'}); return; }
    var R = [], per = '';
    for (var j = hr + 1; j < aoa.length; j++){
      var row = aoa[j]; if (!row || row[mp.id] == null) continue;
      var eid = String(row[mp.id]).trim(), mm = eid.match(/^(R\d+)-(\d+)-([A-Z]+\d+)\.([^.]+)\.?(.*)$/); if (!mm) continue;
      if (!per && mp.per != null && row[mp.per]) per = String(row[mp.per]);
      if (oidx[eid] == null){ oidx[eid] = DATA.objs.length; DATA.objs.push([eid, mm[1], String(row[mp.fac] || '').trim(), String(mp.city != null ? row[mp.city] || '' : '').trim(), mm[3], mm[4], mm[5]]); }
      var st = mp.st != null && row[mp.st] != null ? String(row[mp.st]).trim() : ''; if (st === '#N/A') st = '';
      if (!st && (mm[3] === 'L01' || mm[3] === 'C01')) st = 'Pátio (terreno)';
      var ccv = mp.cc != null ? row[mp.cc] : null, cc = ccv == null ? '' : String(typeof ccv === 'number' ? Math.round(ccv) : ccv).trim();
      if (mp.pn != null && row[mp.pn]) DATA.cc[cc] = {div:String(row[mp.div] || '').trim(), pn:String(row[mp.pn] || '').trim(), sub:String(mp.sub != null ? row[mp.sub] || '' : '').trim()};
      R.push([oidx[eid], ti('psl', row[mp.psl]), ti('desc', String(row[mp.desc] || '').replace(/\s+/g, ' ').trim()), num(row[mp.cost]), num(row[mp.area]), ti('st', st), ti('cc', cc), mp.pf != null ? num(row[mp.pf]) : 1]);
    }
    if (!R.length) return;
    var existed = !!DATA.rows[mk];
    DATA.rows[mk] = R;
    DATA.months = DATA.months.filter(function(x){ return x.k !== mk; }).concat([{k:mk, sheet:sn, period:per, n:R.length}]).sort(function(a, b){ return a.k < b.k ? -1 : 1; });
    out.push({k:mk, msg:mLong(mk) + ' (aba "' + sn + '"): ' + fN(R.length) + ' linhas · ' + fUS(sum(R.map(function(r){ return r[3]; }))) + (existed ? ' — substituiu o mês da base' : ' — mês novo')});
  });
  return out;
}
function handleFiles(fl){
  var f = fl && fl[0]; if (!f) return;
  if (typeof XLSX === 'undefined'){ toast('Leitura de planilhas indisponível neste arquivo.'); return; }
  S.busy = true; S.pending = []; render(true);
  var rd = new FileReader();
  rd.onload = function(){
    var res = [];
    try{ res = parseWorkbook(new Uint8Array(rd.result)); }catch(e){ res = [{err:1, msg:'Não consegui ler "' + f.name + '": ' + e.message}]; }
    var ok = res.filter(function(x){ return !x.err; });
    if (!res.length) res = [{err:1, msg:'Nenhuma aba de "' + f.name + '" tem as colunas Ext. ID Reserv. Obj., PSL e Actual Cost.'}];
    if (ok.length){
      DATA.src = f.name; DATA.savedAt = new Date().toISOString();
      var saved = false; try{ localStorage.setItem(LS_DATA, JSON.stringify(DATA)); saved = true; }catch(e){}
      LOCAL = saved;
      if (!saved) res.push({err:1, msg:'O navegador não permitiu salvar a base: ela vale só até fechar a página. Use Exportar HTML para guardar uma cópia.'});
      S.f.from = ''; S.f.to = ''; rebuild(); V3.sig = '';
    }
    S.busy = false; S.pending = res; render(true);
  };
  rd.readAsArrayBuffer(f);
}
function download(name, blob){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function exportXlsx(name, rows){
  if (typeof XLSX === 'undefined'){ toast('Exportação para Excel indisponível.'); return; }
  var ws = XLSX.utils.aoa_to_sheet(rows), wb = XLSX.utils.book_new();
  ws['!cols'] = (rows[0] || []).map(function(h, i){ var w = String(h).length; rows.slice(1, 200).forEach(function(r){ w = Math.max(w, String(r[i] == null ? '' : r[i]).length); }); return {wch:Math.min(48, w + 2)}; });
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  XLSX.writeFile(wb, name + '.xlsx');
}
function exportConsolidado(){
  var A = agg(), T = DATA.T, rows = [['Mês', 'Ext. ID Reserv. Obj.', 'Site', 'Facility', 'Prédio / pátio', 'Nome da área', 'Pavimento', 'PSL', 'Divisão', 'Descrição', 'Tipo de espaço', 'Fator de preço', 'Área m²', 'US$', 'US$/m²']];
  A.ks.forEach(function(k){ DATA.rows[k].forEach(function(r){ if (!pass(r)) return; var o = DATA.objs[r[0]], a = AREA[M.okey[r[0]]];
    rows.push([mLbl(k), o[0], o[1], facName(o[2]), codeOf(o), a ? a.name : '', o[4] === 'L01' ? '' : o[5], T.psl[r[1]], M.pslDiv[T.psl[r[1]]], T.desc[r[2]], T.st[r[5]] || '', r[7], r2(r[4]), r2(r[3]), r[4] ? r2(r[3] / r[4]) : '']); }); });
  exportXlsx('real_estate_macae_' + S.f.from + '_a_' + S.f.to, rows);
}
function exportHTML(){
  if (!SRC){ toast('Não foi possível gerar o HTML a partir deste arquivo.'); return; }
  var d = {}; Object.keys(DATA).forEach(function(k){ d[k] = DATA[k]; }); d.exportedAt = new Date().toISOString(); delete d.savedAt;
  var html = SRC[0] + SEED_TAG + JSON.stringify(d).replace(/</g, '\\u003c') + '</' + 'script>' + SRC[1];
  download('Analise_Real_Estate_Macae_' + M.keys[0] + '_a_' + M.keys[M.keys.length - 1] + '.html', new Blob([html], {type:'text/html'}));
  toast('HTML exportado com ' + M.keys.length + ' meses embutidos.');
}

/* ═════════════════════════════════════════════════════════════
   10. Início
   ═════════════════════════════════════════════════════════════ */
function boot(){
  if (!DATA){ $('#app').innerHTML = '<div style="padding:24px">Base de dados não encontrada no arquivo.</div>'; return; }
  loadUI();
  if (!VIEWS[S.view]) S.view = 'home';
  if (!SCENES[S.ui.scene]) S.ui.scene = 'base';
  rebuild();
  render();
}
window.RealEstate = {state:S, data:function(){ return DATA; }, agg:agg, areaInfo:areaInfo, AREA:AREA, V3:V3, render:render, select3d:select3d, v3Fit:function(t){ v3Fit(S.ui.scene, t, false); }};
boot();
})();
