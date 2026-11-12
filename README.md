# LaborHall
Revisão de custos de Pessoal — Cementing (CMT).

`LaborHall.html` — **Análise de Head Count** (tela inicial "Pessoal") — é um app de arquivo único (abre
direto no navegador, funciona offline) com o mesmo padrão visual do EARL. Ele compila os relatórios
mensais de folha e mostra:

- **Head Count** — pessoas no quadro, por local, função, ano de admissão, tempo de casa e tempo na função.
- **Horas Extras**, **Compra de Folgas** e **Bônus** — custo por mês, evento, local, função e colaborador.

## Como usar
1. Abra `LaborHall.html` no Chrome ou Edge.
2. Clique em **Carregar relatório** e selecione um ou mais `.xlsx` mensais (ou arraste os arquivos).
3. Confira o mês identificado na pré-visualização e clique em **Compilar**.
4. Os cards (Head count, Horas Extras, Compra de Folgas, Bônus, Custo total) abrem cada indicador.

- **Local**: um clique mostra só aquele local; **Ctrl + clique** (⌘ no Mac) soma locais.
- **Exportar HTML** gera uma cópia do app já com a base atualizada embutida — quem abrir vê tudo sem carregar nada.
- **Exportar .json / Importar .json** levam só a base de um navegador para outro (meses iguais são atualizados).

A base fica salva no navegador (IndexedDB). Carregar de novo um mês substitui o anterior. Meses
faltando no meio do período aparecem hachurados nos gráficos, com aviso.

## Regras de leitura
- As colunas são localizadas **pelo nome do cabeçalho**, em qualquer ordem e em qualquer aba
  (CHAPA, FUNCIONARIO, DATA ADMISSÃO, FILIAL, SITUACAO, FUNCAODESCRICAO, TIPOEVENTO, EVENTO, REFERENCIA…).
- O valor usado é sempre a coluna **«MÊS US$»** (ex.: `JAN US$`, `SEPT US$`); o mês sai desse cabeçalho e
  o ano do cabeçalho em R$ ou do nome do arquivo (`CMT_MMAAAA`).
- Eventos são comparados sem acento, sem diferença de maiúsculas e sem prefixo de lote
  (`FP0220260000 PROVISAO FOLGAS` = `PROVISÃO FOLGAS`). A tela **Eventos e categorias** permite ajustar
  quais eventos compõem cada indicador.
- **Head count** = colaboradores com lançamento no mês e situação diferente de `D`. Quem aparece só com
  estornos/reclassificações (ex.: desligado no mês anterior) não entra.
- **3 meses** = os três últimos meses do calendário (um mês sem relatório não é trocado por outro mais antigo).
- **Tempo na função** conta da mudança de função detectada entre os relatórios; sem mudança detectada,
  conta desde a admissão.
