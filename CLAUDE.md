# LaborHall · instruções para o Claude

Projeto do usuário: painéis de custos em HTML único, no padrão visual Halliburton/LaborHall. Converse e escreva em **português do Brasil**.

## Análise de Real Estate (Macaé)

- Fonte em `real-estate/src`. O HTML da raiz é gerado: **não edite** `Analise_Real_Estate_Macae_2026-01_a_2026-10.html` à mão.
- Para montar o HTML: `python3 real-estate/tools/assemble.py`
- Para testar: `node real-estate/tests/smoke.js` (Playwright + Chromium, WebGL por software). Rode depois de toda mudança.
- Detalhes da estrutura, dos dados e do mapeamento planta ↔ planilha estão em `real-estate/README.md`.
- O visual deve seguir exatamente a *Análise de Head Count* (`src/ref.css`). A planta 3D segue a base em 3D do *Flowchain Pátio*, mantendo as cores da legenda de PSL da planta.

## Regras permanentes do usuário

1. **Prompt de continuidade:** sempre que houver qualquer alteração no projeto, atualize `PROMPT_CONTINUIDADE.md` (estado atual, decisões, pendências) e **envie o prompt ao usuário** no fim da resposta: o arquivo e o texto pronto para colar.
2. Ao terminar uma mudança, monte o HTML, rode o teste de fumaça, faça commit e push na branch de trabalho e envie o HTML ao usuário.
