# Análise da área de **Testes** e **Cutover**

## 1) Visão geral funcional

### Testes (cenários + dashboard)
- O módulo de testes possui CRUD de cenários, importação via Excel e um dashboard com KPIs (total, concluídos, pendentes, bloqueados, falhas), visão por responsável, por status e evolução diária/acumulada.
- A modelagem de `TestScenario` está aderente ao processo de homologação (cenário, tarefa, sequência, responsável, DOC BEO, status, datas).
- A atualização de status possui checagem específica de permissão (`testsStatusUpdate` / `testsAdmin`) para usuários não-admin.

### Cutover (plano de go-live)
- O módulo de cutover possui CRUD de tarefas, dashboard de distribuição por status, importação Excel, exportação para XLSX e ordenação por campo `order`.
- A modelagem de `CutoverTask` cobre atributos operacionais importantes (atividade, predecessora, transação, duração, datas, horários, % concluído e % planejado).
- Há proteção explícita de acesso ao projeto em todas as operações de ação de servidor (`requireProjectAccess`).

---

## 2) Pontos fortes identificados

1. **Boa separação entre UI e regras de dados**
   - As regras de persistência ficam em `src/app/actions/*`, com componentes focados em renderização/interação.

2. **Importação prática para operação**
   - Ambos os módulos aceitam Excel e fazem parsing tolerante de cabeçalhos e formatos de data.

3. **Revalidação de rotas após mutação**
   - O uso de `revalidatePath(...)` reduz inconsistência visual após CRUD/import.

4. **Escopo multi-tenant já existente no núcleo do projeto**
   - O projeto já tem infraestrutura de escopo por tenant/projeto (`access-scopes` + `access-control`) que pode ser reaproveitada para endurecer o módulo de testes.

---

## 3) Riscos e lacunas (prioridade alta)

### A. Controle de acesso inconsistente entre módulos
- **Cutover** usa `requireProjectAccess(projectId)` em leitura e escrita.
- **Testes** atualmente não chama `requireProjectAccess` nas ações de CRUD/listagem/estatísticas/importação.
- Isso gera risco de acesso indevido caso alguém invoque server actions com `projectId` válido de outro escopo.

**Impacto:** segurança e isolamento por conta.

### B. Cobertura automatizada insuficiente para Testes/Cutover
- Há suíte Vitest focada em escopos/permissões gerais, mas **não há testes automatizados específicos** para:
  - regras de negócio de status de teste;
  - cálculos de dashboard de testes;
  - parsing/importação Excel de testes e cutover;
  - mapeamento/inferência de status de cutover.

**Impacto:** risco de regressão silenciosa em cálculos e importações.

### C. Falta de validação de entrada tipada
- As ações usam `any` e fazem `parseFloat/new Date` direto.
- Em cenários de payload incompleto/malformado, há risco de persistir dados incoerentes (`NaN`, datas inválidas, campos vazios que deveriam ser obrigatórios).

**Impacto:** integridade de dados e previsibilidade de relatórios.

### D. Importação sem estratégia transacional/observabilidade forte
- Na importação linha a linha, erros são contabilizados e o processo continua (bom para tolerância), mas:
  - não há opção de “all-or-nothing” (transação);
  - não há relatório detalhado por linha para auditoria (apenas contagem + `console.error`).

**Impacto:** dificuldade de suporte quando usuário precisa rastrear exatamente quais linhas falharam e por quê.

---

## 4) Recomendações objetivas (ordem sugerida)

### Fase 1 — Segurança e consistência (curto prazo)
1. **Aplicar `requireProjectAccess` em todas as actions de `project-tests.ts`**
   - `createTestScenario`, `updateTestScenario`, `deleteTestScenario`, `getTestScenarios`, `getTestDashboardStats`, `importTestScenarios`.
2. **Validar ownership da entidade no update/delete**
   - Similar ao padrão de cutover (`findUnique` + comparação `projectId`).

### Fase 2 — Robustez de dados
3. **Introduzir schema de validação (ex.: Zod)**
   - Um schema para payload de cenário de teste e outro para tarefa de cutover.
4. **Normalizar status por enum/mapa central**
   - Evitar strings soltas e reduzir divergência entre UI, importação e analytics.

### Fase 3 — Testes automatizados direcionados
5. **Criar testes unitários para funções puras**
   - Extraindo helpers de cálculo do dashboard e parsing de status/datas para módulos testáveis.
6. **Adicionar testes de integração (server actions)**
   - Com mocks de Prisma/session para validar: autorização, sucesso/erro e mensagens.
7. **Adicionar fixtures de Excel mínimas**
   - Casos felizes + casos com cabeçalhos alternativos + datas numéricas + linhas inválidas.

### Fase 4 — Operação e suporte
8. **Melhorar retorno da importação**
   - Retornar estrutura com `processed`, `imported`, `failed` e lista resumida de erros por linha.
9. **Logs estruturados**
   - Padronizar logging para facilitar troubleshooting em produção.

---

## 5) Diagnóstico final

- O módulo **Cutover** está mais maduro em segurança de acesso e pronto para evolução incremental.
- O módulo **Testes** tem boa entrega funcional e dashboard rico, porém precisa de reforço em controle de acesso e cobertura automatizada.
- A maior alavanca de risco/benefício imediato é: **padronizar autorização de Testes no mesmo nível do Cutover** e **adicionar testes automatizados para importação e métricas**.
