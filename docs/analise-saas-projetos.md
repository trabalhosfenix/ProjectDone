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
