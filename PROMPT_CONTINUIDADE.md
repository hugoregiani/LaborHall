# Prompt de continuidade · Análise de Real Estate (Macaé)

> Cole o texto abaixo numa nova conversa com o Claude, com o repositório `hugoregiani/LaborHall` conectado.
> Última atualização: 26/11/2026, depois da versão com 3D no estilo do Flowchain, tela cheia com minimapa e o gráfico PSL × mês.

---

Você vai continuar o projeto **Análise de Real Estate da base de Macaé (Halliburton)** no repositório `hugoregiani/LaborHall`. Responda em português do Brasil.

**Onde está o trabalho**
- A branch `claude/optimistic-johnson-m7yvum` tem tudo. Confira se ela já foi mesclada na `main`.
- Leia primeiro `CLAUDE.md` e `real-estate/README.md`.
- O entregável é o HTML único `Analise_Real_Estate_Macae_2026-01_a_2026-10.html`, na raiz. Ele funciona offline e tem a base embutida.
- Esse HTML é **gerado**: edite `real-estate/src/*`, monte com `python3 real-estate/tools/assemble.py` e teste com `node real-estate/tests/smoke.js`.

**Origem**
- Planilha `900204_RES__Maca__2026_V02.xlsx`: abas jan-26 a out-26, colunas Ext. ID Reserv. Obj., Facility Name, PSL, Actual Cost (US$), Occupied Area M², Space Type, Description e PSL CC.
- Totais de referência: US$ 8.501.011,59 de jan a out; US$ 803.124,92 em out/26; 725 espaços em out/26.
- Planta `R008015_MACAE_BASE_OPERACIONAL_Rev.28112024` (PDF vetorial do AutoCAD). A geometria foi extraída para `real-estate/data/geo.json`.
- Padrão visual obrigatório: arquivo *Análise de Head Count (CMT)*. O CSS foi copiado para `src/ref.css`: faixa HAL Red, barra de navegação e filtros em vidro, cards de indicador que também navegam, botões "⬇ Excel".
- O 3D segue o *Flowchain Pátio* (app do usuário): mapa da base como chão (`data/ground.jpg`), céu, grama, árvores, postes, silos, alambrado, telhados de duas águas e código pintado no telhado.

**O que o app faz hoje**
- **Filtros:** período (meses), facility, PSL (vários), tipo de espaço e busca.
- **Páginas:**
  - Visão geral: custo por mês por facility, custo por PSL por mês, PSL, pontos de atenção, tipo de espaço, divisão.
  - Evolução mensal.
  - PSLs: resumo, US$/m², mudanças de PSL.
  - Planta 3D.
  - Áreas e espaços: tabela por objeto com modal de histórico.
  - Base de dados: carregar nova planilha, que fica salva no navegador.
- **Exportações:** Excel por card e consolidado, e HTML com a base atual embutida.
- **Planta 3D:**
  - Cenas: Base Cavaleiros (R008015 + área alugada R007520), Bunker e Porto do Açu (esquemáticos).
  - Cores por PSL (legenda da planta) ou por US$/m².
  - Prédios com vários PSLs aparecem fatiados por área; o B34 tem 4 andares.
  - Os valores são do último mês do período (padrão: out/26).
  - Clique na planta abre a **tela cheia**: barra Fechar 3D, cenas, PSL ou US$/m², Etiquetas, Vista de topo e Visão geral; cards de indicadores sobrepostos; painel da área (PSL, descrição, valor, histórico); legenda clicável; **minimapa** no canto inferior direito (clique para ir).
- **Gráfico "Custo de real estate por PSL por mês":** barras empilhadas (eixo da esquerda) e curvas de cada PSL ou tendência linear (eixo da direita). Destaque e dica ao passar o mouse em barra, curva ou legenda; clique filtra o PSL; a legenda oculta ou mostra.

**Decisões já tomadas (não refazer)**
- Mapeamento da legenda: PML = L&T, SQ = Quality, WP = WLP, Sperry = SDS, CMT = CMTG; HPS dividido em FlexTubo e Nitrogênio pela descrição.
- R007520 B01/B02/B03 = tendas T23/T24/T25.
- Planta → mapa do Flowchain pela transformação `xf` em `data/ctx.json` (erro médio de 0,17 m).
- Pátios: o chão já vem pintado na imagem; uma camada transparente por cima só trata clique e destaque.

**Pendências e ideias**
- Bunker e Porto do Açu não têm planta: hoje são layouts esquemáticos. Trocar se o usuário enviar as plantas.
- O nome pintado no chão do pátio HDBS de 117 m² vem do Flowchain e não bate com a planilha (só o texto do chão).
- Pontos de atenção que convém validar com Real Estate: Bunker em jul/26 com US$ 754; Porto do Açu +177% de jan a out com área estável; outubro com reprecificação (pátios subiram e alguns prédios caíram).

**Regras permanentes**
- Toda mudança no projeto termina assim:
  1. monte o HTML e rode o teste de fumaça;
  2. faça commit e push na branch de trabalho;
  3. envie o HTML;
  4. atualize este `PROMPT_CONTINUIDADE.md` e **envie o prompt de continuidade ao usuário** (arquivo e texto).
- Não abra pull request sem pedido explícito.

**Próximo pedido do usuário:** (escreva aqui o que deseja)
