# Templates oficiais do Frappe Gantt no ProjectDone

Este documento descreve o padrão adotado para evoluir o cronograma **sem trocar a biblioteca**.

## Objetivo
Permitir variações de visualização (template + densidade) mantendo:
- regras de negócio atuais;
- endpoints atuais;
- fluxo de edição já existente.

## Templates disponíveis
- `default`: equilíbrio geral para uso diário.
- `executive`: leitura mais macro (colunas maiores para visão gerencial).
- `planning`: visão mais densa para planejamento detalhado.

## Densidades disponíveis
- `compact`: mais informação por área.
- `comfortable`: mais espaçamento e legibilidade.

## Implementação técnica
A configuração central está em:
- `src/components/project/frappe-gantt-template.ts`

Cada template define:
- `columnWidth` por modo de visualização (`Day|Week|Month|Year`);
- `shellClassName` para variações de estilo;
- `barHeight` e `padding` por densidade.

## Como adicionar um novo template
1. Adicionar o novo modo no tipo `FrappeTemplateMode`.
2. Criar preset no mapa `byMode`.
3. Incluir opção em `FRAPPE_TEMPLATE_OPTIONS`.
4. (Opcional) complementar CSS em `src/styles/frappe-gantt.css`.

## Princípio de governança
Qualquer mudança em template deve ser não destrutiva e não alterar contratos de persistência.
