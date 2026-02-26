# Análise do Projeto ProjectDone (SaaS de Gestão de Projetos orientado a tarefas)

## Visão geral

O projeto é uma aplicação **Next.js (App Router)** com autenticação via **NextAuth**, persistência com **Prisma + PostgreSQL** e um modelo de dados amplo para gestão de projetos, tarefas, riscos, metas, testes, documentos e cutover.

Além do fluxo interno, há integração com uma API externa de MPP para importar/sincronizar cronogramas (tarefas e dados de Gantt), reforçando a proposta de mediação entre o mundo MS Project/MPP e o portal SaaS.

## Arquitetura observada

- Front-end e back-end unificados em Next.js (`src/app`, `src/components`).
- Camada de lógica de negócio em **Server Actions** (`src/app/actions/*`).
- Endpoints HTTP em rotas de API (`src/app/api/*`), incluindo namespace dedicado a MPP (`src/app/api/mpp/*`).
- Persistência relacional extensa no `prisma/schema.prisma`.
- Autenticação por credenciais com bcrypt e sessão JWT (`src/lib/auth.ts`).

## Fluxo principal do produto

1. **Autenticação**
   - Login por email/senha e autorização para área `/dashboard` via middleware.

2. **Cadastro e gestão de projetos**
   - CRUD de projetos em Server Actions.
   - Projeto como agregador de tarefas e demais entidades de governança.

3. **Gestão orientada a tarefas**
   - `ProjectItem` como núcleo operacional.
   - Menus e páginas estruturadas por ciclo de vida (planejar/executar/monitorar/encerrar).

4. **Importação de cronograma (Excel)**
   - Parser tolerante a variações de cabeçalho.
   - Conversão de datas/duração, tentativa de vincular recursos e reconexão de predecessoras.

5. **Integração com API MPP**
   - Cliente com fallback para múltiplas URLs e timeout.
   - Sincronização por modos `append`, `upsert`, `replace`.
   - Normalização de tarefas externas para o modelo local.

6. **Acompanhamento e execução**
   - Módulos de riscos, metas, questões, testes, kanban, documentos e cutover.

## Pontos fortes

- **Modelo de domínio robusto** para PMO/gestão de programas, com foco em ciclo completo do projeto.
- **Integração MPP bem pensada** (fallback de endpoint, paginação defensiva, normalização).
- **Abordagem orientada a tarefas** coerente com a proposta de valor do SaaS.
- **Múltiplos módulos de governança** além do cronograma (riscos, qualidade, testes, docs, etc.).

## Falhas e riscos técnicos percebidos

1. **Documentação insuficiente do produto**
   - README ainda genérico de template Next.js, sem visão funcional/arquitetural.

2. **Possível acoplamento excessivo entre UI, regras e acesso a dados**
   - Muitas Server Actions e rotas sem camada de serviço claramente padronizada.

3. **Escalabilidade e performance de sincronização**
   - Laços com upsert item a item podem degradar em projetos muito grandes.

4. **Importação Excel com logging verboso e parsing frágil em casos extremos**
   - Logs de debug em produção podem gerar ruído.
   - Parse de datas depende de formatos específicos e pode falhar silenciosamente para variações.

5. **Risco de inconsistências de nomenclatura/rotas**
   - Base possui mistura de rotas e convenções (ex.: `/api/projects/*`, `/api/projetos/*`, `/api/mpp/*`) que pode dificultar manutenção e observabilidade.

6. **Cobertura de testes não evidente no repositório**
   - Não há suíte clara de testes automatizados para regras críticas (importação, sync, permissões, cálculos de progresso).

## Melhorias recomendadas (priorizadas)

### Prioridade alta

1. **Refazer README e documentação de arquitetura**
   - Explicar domínio, setup, variáveis de ambiente, fluxos de importação/sync MPP e convenções.

2. **Criar camada de serviços para regras críticas**
   - Isolar importação/sincronização/cálculos em serviços reutilizáveis e testáveis.

3. **Adicionar testes automatizados focados em valor**
   - Unit: parse de datas, normalização de status, reconciliação de tarefas.
   - Integração: sync MPP (`append/upsert/replace`) e importação Excel com fixtures.

4. **Instrumentação e observabilidade**
   - Estruturar logs (requestId, projectId, externalId), métricas de sync (tempo/erro/volumetria).

### Prioridade média

5. **Hardening de segurança e autorização fina**
   - Reforçar RBAC/ABAC por ação sensível, não apenas por acesso ao dashboard.

6. **Padronização de rotas e nomenclatura**
   - Definir convenção única pt-BR ou en-US para endpoints e entidades públicas.

7. **Otimizar sincronizações volumosas**
   - Avaliar operações em lote, chunking, filas assíncronas e retentativas com backoff.

### Prioridade baixa

8. **Roadmap de features “Em breve”**
   - Tornar visível no produto quais módulos estão maduros vs. roadmap para evitar expectativa desalinhada.

## Conclusão

A base técnica já está relativamente madura para um SaaS de gestão de projetos orientado a tarefas com integração MPP. O principal gap não parece ser falta de funcionalidades, mas sim **padronização, testabilidade e operacionalização em escala** (documentação, testes, observabilidade e consistência arquitetural).

Com ajustes nessas frentes, o produto tende a ganhar previsibilidade, facilidade de manutenção e confiança para crescer em volume de projetos e usuários.

---

## Análise SaaS Multi-tenant e Isolamento de Acesso

### 1) Multi-tenant: o que existe hoje vs. o que falta

#### O que existe

- A integração com MPP aceita tenant via header `x-tenant-id` no client HTTP (`src/lib/mpp-api.ts`).
- Rotas de integração/sync leem `x-tenant-id` e repassam para chamadas MPP (ex.: `src/app/api/mpp/sync-project/route.ts`).

#### O que falta (crítico)

- Não há entidade `Tenant` no schema Prisma e não há `tenantId` nas entidades centrais (`User`, `Project`, `ProjectItem`, `Role`, etc.) em `prisma/schema.prisma`.
- Sem `tenantId` persistido, não há como aplicar escopo estrutural obrigatório nas queries (`where: { tenantId: ... }`).

#### Conclusão

- Hoje existe multi-tenant **na integração MPP**.
- Ainda não existe multi-tenant **no produto/banco de dados do SaaS**.

### 2) Usuários estão isolados com seus projetos?

#### Estado atual

- Não de forma robusta.
- `getProjects()` e `getProjectById()` consultam projetos sem escopo por tenant e sem enforcement por membership (`src/app/actions/projects.ts`).
- Há consultas por ID em rotas/actions sem validação consistente de acesso por membro/dono no recurso.

#### Pontos positivos

- Existe modelagem de membership (`ProjectMember`) no schema (`prisma/schema.prisma`), que permite isolamento por projeto.

#### Gap principal

- A estrutura existe, mas o enforcement não é aplicado de forma transversal em todas as rotas/actions.

### 3) Tipos de usuário e acessos (estado atual)

#### Perfis e autenticação

- Usuário possui `role` (ex.: `ADMIN`, `USER`) e `roleId` opcional com permissões em JSON via `Role.permissions` (`prisma/schema.prisma`).
- Sessão JWT inclui `id`, `role` e `permissions` (`src/lib/auth.ts`).

#### Gate atual

- Middleware exige autenticação para `/dashboard/*` (`src/middleware.ts`).
- Fluxos administrativos exigem `role === "ADMIN"` em partes do sistema.

#### Lacunas de autorização

- A proteção no middleware não cobre automaticamente autorização por recurso em API routes.
- Há endpoints de integração/sync sem validação explícita e uniforme de sessão + autorização contextual (ex.: `src/app/api/mpp/sync-project/route.ts`).

### 4) O fluxo condiz com SaaS para empresas diferentes?

#### Parcialmente

- A autenticação funciona e há base de permissões.
- Para cenário B2B multiempresa com isolamento forte, o risco ainda é alto sem tenant no banco e sem autorização contextual padronizada.

#### Pilares que faltam

- Isolamento estrutural por tenant no banco e nas queries.
- Autorização por contexto (tenant + projeto + papel/permissão).
- Guardas homogêneas em API routes e Server Actions.
- Política única de autorização para evitar lógica espalhada.

### 5) Recomendação prática (ordem de implementação)

#### Fase 1 - Modelo de dados e migração

1. Criar `Tenant` no Prisma.
2. Adicionar `tenantId` em `User`, `Project`, `ProjectItem`, `Role`, `ImportedProject` e demais entidades de domínio.
3. Criar índices compostos com `tenantId` nas entidades críticas.

#### Fase 2 - Enforcement obrigatório

1. Introduzir guardas centrais:
   - `requireAuth()`
   - `requireTenantAccess()`
   - `requireProjectAccess(projectId, permission)`
2. Aplicar escopo obrigatório (`tenantId` + membership/permissão) em toda leitura/mutação sensível.
3. Fechar endpoints sem validação explícita de auth/autz.

#### Fase 3 - RBAC consistente

1. Centralizar interpretação de `Role.permissions` em uma camada única.
2. Remover checks ad hoc distribuídos pela aplicação.
3. Padronizar resposta de erro de autorização (`401/403`) e logging.

#### Fase 4 - Segurança e conformidade operacional

1. Testes de segurança multi-tenant (tentativas cross-tenant).
2. Testes de autorização por membership/permissão.
3. Auditoria contínua de rotas/actions para evitar regressão.

## Resumo executivo

- O sistema está pronto para evoluir para multi-tenant real, pois já tem boa base de domínio e membership.
- O principal risco atual é isolamento incompleto no plano de dados e autorização não homogênea.
- A prioridade deve ser: `Tenant + tenantId` no schema, seguido de enforcement centralizado de acesso em todas as entradas (API/actions).
