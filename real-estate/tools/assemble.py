"""Monta o HTML único da Análise de Real Estate a partir de src/, vendor/ e data/.
Uso: python3 real-estate/tools/assemble.py [saída.html]
Padrão de saída: Analise_Real_Estate_Macae_2026-01_a_2026-10.html na raiz do repositório."""
import json, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, VEN, DAT = [os.path.join(ROOT, d) + os.sep for d in ('src', 'vendor', 'data')]
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(ROOT), 'Analise_Real_Estate_Macae_2026-01_a_2026-10.html')
css = open(SRC+'ref.css').read().strip()
assert css.startswith('<style>') and css.endswith('</style>')
css = css[len('<style>'):-len('</style>')]
css = css.replace('LaborHall — mesmo sistema visual do EARL (v115)', 'LaborHall · Real Estate — mesmo sistema visual da Análise de Head Count')
extra = open(SRC+'extra.css').read()
data = json.load(open(DAT+'data.json'))
data['exportedAt'] = '2026-11-26T12:00:00.000Z'
geo = json.load(open(DAT+'geo.json'))
ctxj = json.load(open(DAT+'ctx.json')); geo['xf'] = ctxj['xf']; geo['ctx'] = ctxj['ctx']
import base64
gimg = 'data:image/jpeg;base64,' + base64.b64encode(open(DAT+'ground.jpg','rb').read()).decode()
dj = json.dumps(data, ensure_ascii=False, separators=(',',':')).replace('</', '<\\/')
gj = json.dumps(geo, ensure_ascii=False, separators=(',',':')).replace('</', '<\\/')
app = ''.join(open(SRC+f).read() for f in ['app1.js','app2.js','app2b.js','app3.js','app4a.js','app4b.js'])
logo = open(VEN+'logo.txt').read().strip()
assert '__LOGO__' in app
app = app.replace("'__LOGO__'", "'" + logo + "'")
sheetjs = open(VEN+'sheetjs.html').read().strip()
three = open(VEN+'three.min.js').read()
orbit = open(VEN+'OrbitControls.js').read()
html = f'''<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#CC0000">
<title>Análise de Real Estate — Base Macaé</title>
<style>{css}
{extra}</style>
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px">Ative o JavaScript para usar a Análise de Real Estate.</p></noscript>
<!-- Base embutida: planilha 900204_RES Macaé 2026 (jan a out). "Exportar HTML" gera uma cópia com a base atual. -->
<script id="re-data" type="application/json">{dj}</script>
<!-- Geometria da planta R008015 (rev. 28/11/2024): polígonos em pontos do PDF; K = metros por ponto -->
<script id="re-geo" type="application/json">{gj}</script>
<!-- Mapa da base (chão do 3D), do Flowchain Pátio: 620 × 355 m, referencial do 3D -->
<script id="re-ground" type="text/plain" data-src="{gimg}"></script>
{sheetjs}
<script>/*! three.js r128 — MIT License — https://threejs.org */
{three}</script>
<script>/*! three.js OrbitControls r128 — MIT License */
{orbit}</script>
<script>
{app}</script>
</body></html>
'''
open(out, 'w').write(html)
print(out, len(html)//1024, 'KB')
