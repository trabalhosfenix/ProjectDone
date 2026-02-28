# Avaliação de migração: `frappe-gantt` → `react-gantt-chart`

## Resposta objetiva às perguntas

### 1) Qual a possibilidade de criar templates usando esta biblioteca?
A possibilidade de criar templates com `react-gantt-chart` é **alta no nível visual** (layout, render custom, componentes), mas **média no nível funcional** para o cenário atual do ProjectDone.

- **Ponto forte:** a proposta da biblioteca é ser altamente customizável e com baixo bundle.
- **Limite crítico para o nosso caso:** recursos avançados que hoje já estão adaptados no fluxo atual (edição de datas/progresso integrada, sincronização de painel, comportamento de split-view, popup/ações) exigem validação prática de paridade.

### 2) Qual o nível de criticidade desta mudança?
A criticidade é **alta**.

A troca da engine de Gantt impacta:
- UX central do módulo de cronograma.
- Comportamentos já ajustados na implementação atual (`on_date_change`, `on_progress_change`, sincronização de painel lateral, edição explícita).
- Custo de regressão visual e funcional em cenários de projeto reais.

### 3) Se for 100% viável, devemos migrar agora?
**Não neste momento**. Pelas informações da própria biblioteca, ela **não está production ready ainda**. Logo, não é possível classificar como “100% viável” para migração imediata em produção.

---

## Evidências no projeto atual

O módulo atual está acoplado a um fluxo já consolidado com `frappe-gantt`:

- Dependência já instalada e utilizada em produção do app. 
- Gatilhos de atualização de datas/progresso conectados à API existente (`PATCH /api/projects/[id]/items/[itemId]`).
- Comportamentos específicos já tratados: atualização otimista, sincronização de rolagem no split, edição por ação explícita.

Trocar engine agora exige revalidar tudo isso com risco de regressão.

---

## Matriz de decisão (resumida)

### Opção A — Permanecer com `frappe-gantt` e evoluir por template interno (recomendado agora)
**Prós**
- Menor risco imediato.
- Reaproveita toda integração atual de regras de negócio.
- Time-to-value rápido para melhorias visuais e de usabilidade.

**Contras**
- Alguns limites estruturais do `frappe-gantt` continuam existindo.

### Opção B — Migrar já para `react-gantt-chart`
**Prós**
- Potencial de customização moderna em React.
- API aparentemente amigável para templates.

**Contras (críticos)**
- Biblioteca declarada como não pronta para produção.
- Risco alto de regressão no módulo mais sensível do planejamento.
- Custos de retrabalho caso APIs internas da lib mudem no amadurecimento.

---

## Recomendação prática

1. **Curto prazo (produção):** manter `frappe-gantt` e consolidar o template interno já criado no sistema.
2. **Médio prazo (P&D):** criar uma rota laboratório com `react-gantt-chart` atrás de feature flag (sem trocar a rota oficial).
3. **Critério de go-live futuro:** só considerar migração quando houver estabilidade comprovada da lib + paridade funcional total nos fluxos atuais.

---

## Conclusão

- **Possibilidade de template com `react-gantt-chart`:** alta (UI), média (paridade funcional total no nosso contexto).
- **Criticidade da mudança de engine agora:** alta.
- **Decisão recomendada hoje:** **não migrar em produção** enquanto a lib não for production ready; continuar evoluindo o template no `frappe-gantt` e manter PoC paralela.
