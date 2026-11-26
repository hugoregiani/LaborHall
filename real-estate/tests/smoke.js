/* Teste de fumaça da Análise de Real Estate.
   Uso: node real-estate/tests/smoke.js [arquivo.html] [pasta-das-capturas]
   Abre o HTML no Chromium (WebGL por software), passa por todas as páginas, abre a planta 3D
   em tela cheia, seleciona uma área, testa o gráfico PSL × mês e confere os totais.
   Sai com código 1 se houver erro de JavaScript ou total divergente. */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const file = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'Analise_Real_Estate_Macae_2026-01_a_2026-10.html'));
  const shots = process.argv[3] ? path.resolve(process.argv[3]) : null;
  if (shots) fs.mkdirSync(shots, {recursive:true});
  const browser = await chromium.launch({args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1600, height:1000}});
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const shot = async n => { if (shots) await page.screenshot({path:path.join(shots, n + '.png')}); };
  await page.goto('file://' + file);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(700);
  for (const v of ['home', 'mes', 'psl', 'areas', 'base', 'planta']){
    await page.evaluate(v => { RealEstate.state.view = v; RealEstate.render(); }, v);
    await page.waitForTimeout(v === 'planta' ? 4000 : 500); await shot('p_' + v);
  }
  const tot = await page.evaluate(() => { const A = RealEstate.agg(); return {tot:A.tot, meses:A.ks.length, out:A.byM['2026-10'] ? A.byM['2026-10'].tot : null}; });
  await page.evaluate(() => { RealEstate.state.ui.fs = true; RealEstate.render(true); }); await page.waitForTimeout(4000); await shot('fs');
  await page.evaluate(() => RealEstate.select3d('R008015|B34', true)); await page.waitForTimeout(2500); await shot('fs_b34');
  const sel = await page.evaluate(() => [RealEstate.state.ui.fs, RealEstate.state.ui.sel3d, document.querySelectorAll('.v3-map canvas').length]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  await page.evaluate(() => { RealEstate.state.view = 'home'; RealEstate.state.ui.sel3d = null; RealEstate.render(); }); await page.waitForTimeout(600);
  const trend = await page.evaluate(() => ({segs:document.querySelectorAll('.tr-seg').length, curvas:document.querySelectorAll('g.tr-s').length}));
  await browser.close();
  console.log(JSON.stringify({arquivo:file, totais:tot, telaCheia:sel, graficoPSL:trend}, null, 1));
  // referência: planilha 900204_RES Macaé 2026 V02 (jan–out/26)
  const ok = Math.abs(tot.tot - 8501011.59) < 1 && Math.abs(tot.out - 803124.92) < 1 && sel[0] && sel[1] === 'R008015|B34' && sel[2] === 1 && trend.segs > 0 && trend.curvas > 0;
  if (errs.length) console.log('ERROS:\n' + errs.join('\n'));
  if (errs.length || !ok){ console.log('FALHOU'); process.exit(1); }
  console.log('OK');
})();
