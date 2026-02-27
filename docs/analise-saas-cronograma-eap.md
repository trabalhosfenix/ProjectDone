# Análise focada do SaaS: datas automáticas, consolidação de progresso e predecessoras

## Escopo da análise
Esta análise foca exclusivamente nos três pontos solicitados:

1. **Cálculo automático de datas**
2. **Consolidação de % (atividade → tarefa)**
3. **Predecessoras com impacto real no cálculo**

Também considera o modelo **EAP/EDT** (tarefas-pai e atividades-filhas), onde o progresso das tarefas deve ser consolidado por média das atividades.

> **Alinhamento de nomenclatura com API backend (fonte de verdade):**
> - Tarefa: `TaskResponse` (`id`, `uid`, `name`, `outline_level`, `wbs`, `start`, `finish`, `duration_hours`, `percent_complete`, `is_summary`, etc.)
> - Dependência: `DependencyResponse` (`predecessor_id`, `successor_id`, `link_type`, `lag_hours`)
> - Gantt: `GanttTask.dependencies: list[str]` contendo **IDs das predecessoras** da tarefa.

---

## 1) Cálculo automático de datas

### Estado atual observado
- O sistema já possui motor de calendário (`calculateEndDate` e `calculateDuration`) para converter **início/fim/duração** em dias úteis/corridos.
- Esse cálculo é aplicado no `PATCH` de item quando o usuário altera manualmente datas planejadas ou duração.
- O recálculo hoje é **local ao item editado** (não há recálculo em cascata da estrutura EAP nem por dependência).

### Lacunas em relação ao requisito
- Falta uma regra transacional do tipo:
  - alterou duração/início da atividade A → recalcula fim de A;
  - recalcula sucessoras dependentes de A;
  - recalcula marcos agregados da tarefa-pai;
  - recalcula datas do projeto (min início / max fim).
- Não há distinção clara e persistida entre modo **manual** vs **automático** de duração/data por item.

### Recomendação objetiva (alinhada à API)
Implementar um **Scheduler Service** central (server-side) operando sobre os campos da API:
- `start` (início), `finish` (fim), `duration_hours` (duração em horas), `percent_complete`.
- Política explícita por tarefa:
  - `MANUAL_DURATION`: usuário informa `start + duration_hours` → sistema calcula `finish`.
  - `MANUAL_DATES`: usuário informa `start + finish` → sistema calcula `duration_hours`.
  - `AUTO`: `start/finish` derivados por predecessoras + calendário.

Esse serviço deve rodar em cadeia (ordem topológica da EAP + dependências), não apenas na tarefa alterada.

---

## 2) Consolidação de % (atividade → tarefa)

### Estado atual observado
- O progresso do projeto é calculado hoje por média simples de **todos os `ProjectItem`**.
- O sistema usa `metadata.progress` ou status final para inferir 100%.
- Não há consolidação hierárquica explícita por níveis da EAP (atividade -> tarefa -> pacote -> projeto).

### Lacunas em relação ao requisito
Para o requisito informado, o comportamento esperado é:
- **Atividade (folha)**: `%` inserido manualmente.
- **Tarefa (summary/pai)**: `%` calculado por média das atividades-filhas.

Hoje isso não está formalizado no domínio; a média é "achatada" no projeto, sem respeitar pai/filho.

### Recomendação objetiva (alinhada à API)
Usar os campos nativos da API para hierarquia e progresso:
- Hierarquia por `outline_level`, `wbs` e `is_summary`.
- Progresso por `percent_complete`.
- Cálculo bottom-up:
  1. folhas (`is_summary = false`) usam `% manual`;
  2. pai (`is_summary = true`) consolida média dos filhos diretos;
  3. repetir até os níveis superiores.

Regra inicial simples (alinhada ao pedido):
- `percent_complete(pai) = média aritmética de percent_complete(filhos diretos)`

> Opcional evolutivo: média ponderada por `duration_hours` quando houver necessidade de precisão física (esforço/tempo).

---

## 3) Predecessoras com impacto real no cálculo

### Estado atual observado
- O domínio já possui entidade de dependência (`TaskLink`) com tipo (`link_type`: FS/SS/FF/SF) e atraso (`lag_hours`).
- O contrato de Gantt já define `dependencies: list[str]` como IDs de predecessoras.
- O fluxo de atualização atual ainda não garante recálculo automático e consistente das sucessoras em cadeia.

### Lacunas em relação ao requisito
Requisito declarado:
- "Predecessora significa que a atividade só pode iniciar após a atividade relacionada terminar"
- Isso deve **interferir no cálculo de início e fim**.

Logo, para `link_type = FS`, a restrição obrigatória é:
- `start(successor_id) >= finish(predecessor_id) + lag_hours`

### Recomendação objetiva (alinhada à API)
Implementar engine de dependências usando os nomes de campos da API:
- Entrada: vínculos `DependencyResponse` (`predecessor_id`, `successor_id`, `link_type`, `lag_hours`).
- Saída: atualizar `start`, `finish`, `duration_hours` em `Task`.
- Para múltiplas predecessoras da mesma tarefa:
  - usar a restrição mais restritiva (maior data mínima viável).
- Ao alterar qualquer tarefa:
  1. recalcular a própria tarefa;
  2. propagar para sucessoras (BFS/ordem topológica);
  3. persistir e auditar mudanças automáticas.

---

## Mapeamento explícito para evitar divergência de termos

### Dependências
- **Usar no documento e na implementação:**
  - `predecessor_id` (não `predecessorItemId`)
  - `successor_id` (não `successorItemId`)
  - `link_type` (não `type`)
  - `lag_hours` (não `lag` genérico)

### Datas e duração
- **Usar no contrato de task:**
  - `start` / `finish` (não `datePlanned` / `datePlannedEnd` quando a referência for API)
  - `duration_hours` (não duração implícita em dias)

### Progresso
- **Usar no contrato de task/gantt:**
  - `percent_complete` (não `metadata.progress` como fonte principal no contexto API)

### Gantt
- `GanttTask.dependencies` deve ser `list[str]` com IDs de tarefas predecessoras.

---

## Proposta de desenho funcional (MVP)

### Fluxo de recálculo sugerido
1. Usuário altera tarefa (data/duração/progresso).
2. API grava alteração base.
3. Chama `recalculate_project_schedule(project_id, changed_task_id)`:
   - recalcula dependências (`TaskLink`);
   - recalcula consolidação EAP (`percent_complete` de summaries).
4. Atualiza indicadores agregados do projeto ao final.

### Regras de negócio sugeridas
- Tarefa folha (`is_summary = false`): `percent_complete` manual permitido.
- Tarefa resumo (`is_summary = true`): `percent_complete` manual bloqueado (somente consolidado dos filhos).
- Dependências válidas apenas dentro do mesmo `project_id`.
- Detectar e bloquear ciclo em dependências (`predecessor_id → successor_id`).

---

## Critérios de aceite alinhados ao pedido
1. Ao alterar `duration_hours` de uma atividade, `finish` recalcula automaticamente.
2. Se houver predecessora FS, a sucessora nunca inicia antes do `finish` da predecessora + `lag_hours`.
3. O `percent_complete` de tarefa resumo muda automaticamente quando o `percent_complete` das atividades-filhas muda.
4. Edição manual de `percent_complete` em tarefa resumo com filhos deve ser bloqueada.
5. No Gantt/API, `dependencies` deve refletir vínculos reais de predecessoras (`list[str]` de IDs).

---

## Conclusão
A base já possui elementos importantes (calendário, tarefas e links de dependência), mas os três pontos críticos ainda estão **parcialmente implementados**: o cálculo está local por item, a consolidação de progresso não está plenamente hierárquica por EAP, e predecessoras ainda não governam o cronograma fim-a-fim com propagação completa.

Com uma engine única de scheduling + consolidação EAP usando os **campos canônicos da API** (`start`, `finish`, `duration_hours`, `percent_complete`, `predecessor_id`, `successor_id`, `link_type`, `lag_hours`), o comportamento fica aderente ao modelo esperado de planejamento e acompanhamento.
