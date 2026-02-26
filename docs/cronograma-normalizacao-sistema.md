# Análise da versão atual e cronograma de normalização

## Resumo executivo
A versão atual apresenta riscos operacionais em três frentes: **(1) baixa reprodutibilidade do ambiente**, **(2) dívida técnica elevada em tipagem/qualidade**, e **(3) inconsistências de estrutura do front-end**. O efeito combinado é aumento de falhas em deploy, baixa previsibilidade de testes e maior custo de manutenção.

## Evidências técnicas observadas

### 1) Ambiente não reprodutível para CI/CD
- `npm ci` falha porque `package.json` e `package-lock.json` estão fora de sincronização (ex.: `vitest` existe no `package.json`, mas não no lock).
- Isso impede pipeline determinístico e atrasa correções de bug.

**Evidência no código:**
- Dependência `vitest` declarada em `devDependencies` no `package.json`.
- Ausência de entradas de `vitest` no `package-lock.json`.

### 2) Instalação de dependências com bloqueio em pacote crítico
- Durante atualização de lock/install, o pacote `@tailwindcss/oxide-wasm32-wasi` retorna `403 Forbidden` no registro.
- Sem política clara de mirror/proxy, a esteira de build fica frágil e sujeita a indisponibilidade externa.

**Evidência no lock:**
- `package-lock.json` referencia explicitamente `@tailwindcss/oxide-wasm32-wasi` e URL do tarball.

### 3) Bug estrutural no front-end (arquivo com nome inválido e duplicidade de página)
- Existe um arquivo `src/components/dashboard/import/page,tsx` (vírgula no nome), com conteúdo de página Next.
- Já existe a rota correta em `src/app/dashboard/import/page.tsx`.
- Isso aumenta risco de confusão, import incorreto e manutenção duplicada.

### 4) Alto acoplamento com `any` e supressão de regras
- Há uso extensivo de `any` em áreas críticas (admin, testes, dashboards).
- Em `src/components/admin/admin-panel.tsx` há desativação global da regra `no-explicit-any`.
- Isso reduz segurança de tipos e aumenta incidência de regressões silenciosas.

## Priorização de correção (ordem recomendada)
1. **P0 – Build/Instalação previsível** (bloqueia todas as demais frentes).
2. **P0 – Higiene de estrutura Next.js** (eliminar ambiguidade de rotas/arquivos).
3. **P1 – Baseline de qualidade** (lint, testes de segurança, checks de tipagem).
4. **P1/P2 – Redução de `any` por domínio** (admin > projetos > dashboards).
5. **P2 – Endurecimento de observabilidade e governança de release**.

## Cronograma de normalização (6 semanas)

### Semana 1 — Estabilização de build (P0)
- Sincronizar `package-lock.json` com `package.json` em ambiente controlado.
- Definir estratégia para `403` de dependências (registry interno/mirror/cache do CI).
- Congelar versões críticas (Node/NPM) e documentar baseline.
- **Entregáveis:** build local reproduzível + pipeline de instalação sem erro.

### Semana 2 — Higiene estrutural e rotas (P0)
- Remover/arquivar `src/components/dashboard/import/page,tsx`.
- Validar unicidade de páginas em `src/app/**/page.tsx`.
- Adicionar verificação automatizada de nomes inválidos (ex.: vírgula em `.tsx`).
- **Entregáveis:** árvore de rotas limpa e sem duplicidade ambígua.

### Semana 3 — Qualidade mínima obrigatória (P1)
- Tornar `npm run lint` e `npm run test:security` gates obrigatórios de merge.
- Criar check de integridade do lockfile no CI.
- Publicar checklist de PR (build, lint, testes, rollback).
- **Entregáveis:** PR só entra com qualidade mínima aprovada.

### Semana 4 — Tipagem e contratos (P1)
- Remover `eslint-disable` amplo de `admin-panel` e trocar por exceções pontuais.
- Migrar `any` de maior risco para tipos explícitos (ações, payloads e listas administrativas).
- Criar tipos compartilhados para respostas de API internas.
- **Entregáveis:** redução mensurável de `any` e melhor rastreabilidade de falhas.

### Semana 5 — Regressão e segurança funcional (P1/P2)
- Expandir suíte `tests/security` para casos de borda (tenant, permissões e escopos).
- Cobrir fluxos críticos de importação e administração.
- **Entregáveis:** cobertura de regressão nos fluxos com maior impacto de negócio.

### Semana 6 — Operação e governança (P2)
- Definir playbook de incidente (triagem, severidade, rollback, comunicação).
- Criar indicadores de release: taxa de falha de deploy, MTTR, regressões por módulo.
- Ritual de revisão quinzenal de dívida técnica.
- **Entregáveis:** processo sustentável para evitar retorno ao estado atual.

## KPIs recomendados para acompanhar a normalização
- **Build success rate** (meta: > 95% em 2 semanas).
- **Tempo médio de restauração (MTTR)** (meta: queda de 30% em 6 semanas).
- **Falhas por regressão em produção** (meta: queda contínua semanal).
- **Ocorrências de `any` em módulos críticos** (meta: -40% em 6 semanas).
- **Tempo de ciclo de PR** com gates habilitados (meta: estabilizar sem sacrificar qualidade).

## Riscos e mitigação
- **Risco:** lockfile continuar divergente por múltiplos ambientes.
  - **Mitigação:** padronizar versão de Node/NPM e regenerar lock somente em job oficial.
- **Risco:** backlog funcional competir com correções estruturais.
  - **Mitigação:** reservar capacidade fixa (20–30%) por sprint para estabilização.
- **Risco:** correções de tipagem gerarem quebra não percebida.
  - **Mitigação:** rollout por domínio + smoke tests antes do merge.

## Plano tático detalhado para frente (1): baixa reprodutibilidade do ambiente

### Objetivo da frente
Garantir que qualquer desenvolvedor e o CI obtenham o **mesmo resultado** para instalação e build, com falha rápida quando o lockfile estiver inconsistente.

### Ações imediatas (D+1 a D+3)
1. **Gate de lockfile local e no CI**
   - Script `npm run check:lockfile` validando se todas as chaves de `dependencies`/`devDependencies` do `package.json` existem no `package-lock.json`.
   - Falha obrigatória antes de merge quando houver divergência.
2. **Padronizar runtime**
   - Definir versão oficial de Node/NPM para time e pipelines.
   - Publicar essa versão no README e no job de CI.
3. **Instalação determinística**
   - Executar `npm ci` como instalação padrão em CI.
   - Bloquear uso de `npm install` no pipeline principal (permitir apenas em job de atualização de lock).

### Ações de curto prazo (Semana 1)
1. **Pipeline de lockfile dedicado**
   - Job exclusivo para regenerar lock e abrir PR automático (sem alteração manual difusa).
2. **Estratégia para dependências com 403**
   - Configurar mirror/cache de registry (Nexus/Artifactory/verdaccio/cache nativo do CI).
   - Adicionar fallback documentado para incidentes de pacote indisponível.
3. **Observabilidade de instalação**
   - Métrica de taxa de sucesso de `npm ci` por branch.
   - Alertas quando falha por dependência externa superar limiar.

### Critérios de pronto (Definition of Done)
- `check:lockfile` obrigatório em PR e `main`.
- `npm ci` executa sem erros em ambiente limpo.
- Tempo de instalação estável (variação <= 15% na semana).
- Processo de atualização de lock documentado e ownership definido.

## Operação executada nesta frente (reprodutibilidade)
- Padronização de runtime com `.nvmrc` (Node `22.21.1`).
- Padronização de comportamento do npm com `.npmrc` (`engine-strict`, `save-exact`, lockfile obrigatório e redução de variabilidade local).
- Novo gate de runtime: `npm run check:runtime`.
- Novo comando agregado de validação de ambiente: `npm run validate:env`.
