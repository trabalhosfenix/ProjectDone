# Estudo de viabilidade — template Bryntum Gantt (React) no ProjectDone

## Objetivo
Avaliar a possibilidade de adotar o template **Bryntum Gantt React (advanced)** como base para a página de cronograma, sem alterar regras de negócio existentes.

## Diagnóstico do cenário atual
- A página de Gantt atual usa componente próprio com `frappe-gantt` e callbacks para edição de datas/progresso. 
- O fluxo já está conectado à API interna (`PATCH /api/projects/[id]/items/[itemId]`) e atualiza o estado local para refletir mudanças imediatas.
- A tela já possui filtros, paginação e abertura de edição por `TaskEntitySheet`, portanto a substituição deve preservar esse contrato de interação.

## Viabilidade técnica
**Viável**, com ressalvas importantes:

1. **Licenciamento**
   - Bryntum Gantt é comercial; o template pode ser demonstrativo, mas uso em produção depende de licença válida.
   - Recomendação: validar aquisição e modelo de distribuição antes de começar implementação.

2. **Compatibilidade com stack atual (Next.js App Router)**
   - O template de referência usa React + Vite; no ProjectDone a base é Next.js.
   - A integração é possível via componente **client-only** (`'use client'`) e import dinâmico para evitar conflitos SSR.

3. **Mapeamento de dados**
   - Hoje o modelo de tarefa já contém campos equivalentes (`id`, `name`, `start`, `end`, `progress`, `dependencies`, `wbs`, `responsible`).
   - Será necessário um adapter fino de serialização para o formato esperado pelo Bryntum (incluindo dependências e campos opcionais).

4. **Eventos e regras existentes**
   - Os pontos de integração já estão claros: alteração de datas e progresso, abertura explícita de edição, sincronização com painel lateral.
   - A adoção do template pode manter as regras de negócio se a camada de persistência permanecer na página atual.

## Estratégia recomendada (baixo risco)
1. **PoC isolada (1 rota de laboratório)**
   - Criar rota interna de teste (ex.: `/dashboard/projetos/[id]/gantt-bryntum-lab`) sem substituir o Gantt atual.
   - Reaproveitar o mesmo endpoint de leitura de tarefas.

2. **Adapter de dados e eventos**
   - Implementar função `mapToBryntumTasks(tasks)` e `mapFromBryntumUpdate(event)`.
   - Encaminhar alterações para os mesmos handlers já existentes de `datePlanned`, `datePlannedEnd` e `progress`.

3. **Paridade mínima de UX antes de troca**
   - Confirmar: edição explícita (sem clique acidental), alinhamento visual em split-view, atualização em tempo real do painel esquerdo e filtros essenciais.

4. **Feature flag para rollout**
   - Expor alternância por flag (ex.: variável de ambiente) para liberar gradualmente por ambiente/cliente.

## Riscos e mitigação
- **Risco legal/comercial (licença)** → Mitigar com validação de contrato antes do desenvolvimento.
- **Risco de SSR/hidratação** → Mitigar com client boundary + dynamic import e render condicional.
- **Risco de regressão funcional** → Mitigar com checklist de paridade e testes manuais orientados ao fluxo atual.
- **Risco de aumento de bundle** → Mitigar com code-splitting na rota de Gantt.

## Estimativa inicial
- **PoC técnica**: 2–4 dias.
- **Paridade funcional principal**: 5–8 dias.
- **Hardening + rollout controlado**: 2–4 dias.

## Conclusão
A implementação do template Bryntum no sistema é **tecnicamente possível** e tende a melhorar recursos avançados de planejamento, desde que:
- licenciamento seja aprovado;
- integração seja feita em modo client-only no Next.js;
- migração siga abordagem incremental com PoC e feature flag.
