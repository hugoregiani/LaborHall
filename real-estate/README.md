# Análise de Real Estate · Base Macaé

App em HTML único (abre offline no Chrome/Edge) com os custos de real estate da base de Macaé, de jan a out/26.
O arquivo final fica na raiz do repositório: `Analise_Real_Estate_Macae_2026-01_a_2026-10.html`.
Ele é **gerado**: não edite o HTML à mão. Edite `src/` e monte de novo.

## Montar e testar

```bash
python3 real-estate/tools/assemble.py
```

```bash
node real-estate/tests/smoke.js
```

O `assemble.py` junta `src/`, `vendor/` e `data/` num HTML só. O teste de fumaça usa o Playwright/Chromium, com WebGL por software, e falha se houver erro de JavaScript ou se o total divergir da planilha (US$ 8.501.011,59 em jan–out; US$ 803.124,92 em out/26).

## Estrutura

| Pasta / arquivo | O que é |
|---|---|
| `src/ref.css` | CSS copiado da *Análise de Head Count* (padrão visual obrigatório) |
| `src/extra.css` | CSS próprio: planta 3D, tela cheia, minimapa, gráfico PSL × mês |
| `src/app1.js` | utilidades, base embutida, cores da legenda (`PLAN`), áreas da planta (`AREA`), estado e agregações |
| `src/app2.js` | componentes (cards, barras, rosca, tabelas), moldura, filtros, páginas Visão geral, Evolução mensal e PSLs |
| `src/app2b.js` | gráfico **Custo por PSL por mês** (barras empilhadas + curvas/tendência, destaque e dica) |
| `src/app3.js` | página Planta 3D, painel da área, Áreas e espaços, Base de dados, modais, sobreposição da tela cheia |
| `src/app4a.js` | motor 3D (Three.js r128): cena no estilo do Flowchain, prédios fatiados por PSL, rótulos, minimapa |
| `src/app4b.js` | renderização, eventos, importação de planilha, exportações (Excel e HTML), início |
| `vendor/` | three.js r128 + OrbitControls (MIT), SheetJS 0.18.5 (Apache 2.0), logo Halliburton |
| `data/data.json` | base compacta extraída da planilha (gerada por `tools/prep_data.py`) |
| `data/geo.json` | polígonos de prédios e pátios extraídos do PDF da planta (gerados por `tools/plan/`) |
| `data/ctx.json` | do Flowchain Pátio: limites, estacionamento, silos, árvores, postes e a transformação `xf` planta → mapa |
| `data/ground.jpg` | mapa da base (chão do 3D), do Flowchain Pátio: 620 × 355 m, x −310…310, z −175…180 |
| `tools/plan/` | extração da geometria do PDF: `ext.py` → `raster.py` → `cells.py` → `geo.py` (precisa do PDF) |

## Atualizar os dados

- **Pelo próprio app:** em *Base de dados*, carregar a nova planilha. A base atualizada fica no navegador; *Exportar HTML* gera uma cópia com ela embutida.
- **No repositório:** rodar `python3 -I real-estate/tools/prep_data.py <planilha.xlsx>` dentro de `real-estate/data/` e montar de novo.

## Regras de mapeamento

- `Ext. ID Reserv. Obj.` = `SITE-001-PRÉDIO.PAVIMENTO.ESPAÇO`. A chave da área é `site|código`: `B34`, ou `L01.Lxx` para pátio.
- Sites: R008015 = Macae Field Camp (planta) · R007520 = Field Camp Parking (área alugada da planta; B01/B02/B03 = tendas T23/T24/T25) · R007522 = Macae Bunker e R010713 = Porto do Açu (sem planta, layout esquemático).
- Legenda da planta → PSL da planilha: PML = L&T, SQ = Quality, WP = WLP, Sperry = SDS, CMT = CMTG, DME = DME Maintenance. HPS vira FlexTubo ou Nitrogênio conforme a descrição. As funções de suporte usam tons de cinza.
- Prédios com vários PSLs são fatiados ao longo do eixo maior, na proporção da área de cada PSL. O B34 tem os andares empilhados.
- Escala do PDF: 1 pt = 0,5317 m. `xf` alinha a planta ao mapa do Flowchain com erro médio de 0,17 m.
