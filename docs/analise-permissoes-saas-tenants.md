# Análise prática de permissões SaaS (tenants, contas, perfis e membros de projeto)

## 1) Panorama atual (o que está funcional)

### 1.1 Modelo multitenant e escopo
- O schema está preparado para multitenancy com `Tenant`, `User`, `Role` e restrições por `tenantId`.
- Usuário possui dois níveis de controle: `role` (string legado `ADMIN/USER`) e `roleId` (perfil customizado com `permissions` em JSON).
- Existe `@@unique([tenantId, email])`, o que evita colisão de e-mail entre contas.

### 1.2 Admin global já existe na prática
- A lógica de escopo considera **admin com `tenantId = null`** como visão global (todos os projetos).
- Testes de segurança já cobrem explicitamente este caso (“admin global vê todos os projetos”).
- Em tenants, `createTenant` só permite criação quando admin **não** está preso a tenant (`tenantId` nulo).

### 1.3 Operações de tenant
- `getTenants` retorna todos os tenants para admin global e apenas o próprio tenant para admin local.
- `updateTenantStatus` já restringe admin local para não alterar tenant de terceiros.

## 2) Gaps reais (o que falta para ficar completo)

### 2.1 Falta de papel explícito “ROOT/SUPER_ADMIN”
**Situação atual:**
- O comportamento de root existe implicitamente em `role === ADMIN && tenantId === null`.

**Risco:**
- Sem tipo de papel explícito, fica difícil governança/auditoria (quem é root? por política ou por ausência de vínculo?).

**Prático:**
- Viável e recomendado formalizar: `SUPER_ADMIN` (ou `ROOT`) no campo `role`, mantendo admin de tenant em `ADMIN`.

### 2.2 Inclusão de pessoas no projeto não está amarrada a permissão funcional
**Situação atual:**
- `addProjectMember/removeProjectMember/updateMemberAllocation` exigem apenas `requireProjectAccess`.
- `requireProjectAccess` permite USER membro/criador do projeto, então usuário comum consegue adicionar/remover envolvidos.

**Risco:**
- Escalação de privilégio operacional dentro do projeto sem gate de permissão.

**Prático:**
- Necessário gate adicional de autorização fina: ex. `project_members.manage` (ou `gerenciar_pessoas`).

### 2.3 Gestão de perfis em usuários já criados está incompleta na UI principal
**Situação atual:**
- Backend possui `assignRoleToUser(userId, roleId | null)`.
- UI de gestão de usuários lista perfil atual, mas não oferece ação de vincular/desvincular perfil em usuário existente.
- Hoje o perfil customizado entra no fluxo de criação do usuário; pós-criação é lacuna de UX/processo.

**Risco:**
- Admin não consegue corrigir acesso rapidamente sem editar dados via outro fluxo/backoffice.

**Prático:**
- Alta prioridade de produto: adicionar ação “Alterar Perfil” por linha do usuário.

### 2.4 Duplicidade de módulos de permissões/roles
**Situação atual:**
- Há duas trilhas: `actions/permissions.ts` e `actions/roles.ts`, além de componentes `role-management.tsx` e `roles-management.tsx`.

**Risco:**
- Divergência de regras, permissões e UX ao longo do tempo.

**Prático:**
- Consolidar em um único domínio de roles/permissões (ações + tela + contrato de chave).

### 2.5 Dicionário de permissões inconsistente
**Situação atual:**
- Existem chaves em `lib/permissions.ts` (ex.: `gerenciar_pessoas`) e outras em telas (`dashboard`, `kanban`, `perfis`) sem catálogo único versionado.

**Risco:**
- Permissão marcada na role não produzir efeito real (ou inverso).

**Prático:**
- Criar catálogo central tipado (source of truth) e validar no build.

## 3) Resposta direta às suas perguntas

### 3.1 “Existe possibilidade de um nível de usuário que cria contas?”
Sim. Hoje já é viável com o desenho atual usando **admin global** (`ADMIN` sem `tenantId`), pois ele consegue criar tenant e visualizar todos.

### 3.2 “Viabilidade de usuário root para administrar todos os tenants/contas?”
**Alta viabilidade** e baixo risco técnico, pois o comportamento já existe implicitamente.
O trabalho principal é de **formalização** (papel explícito + políticas + UI).

### 3.3 “Erro de user poder incluir pessoas no projeto deveria vir de permissões”
Procede. No estado atual, está baseado em acesso ao projeto e não em permissão fina de gestão de equipe.

### 3.4 “Não existe forma de vincular/desvincular perfil de usuário já criado”
Procede no fluxo principal de UI. O backend suporta, mas a operação não está exposta de forma adequada na tela de gestão de usuários.

## 4) Plano de execução objetivo (foco em resultado)

### Fase A — 2 a 3 dias (alto impacto)
1. Formalizar papel `SUPER_ADMIN`.
2. Gatear `add/remove member` por permissão de gestão de pessoas.
3. Expor “Alterar Perfil” na tabela de usuários (vincular e desvincular).

### Fase B — 3 a 5 dias (estabilização)
1. Consolidar módulos duplicados (`roles` vs `permissions`).
2. Criar catálogo único tipado de permissões.
3. Ajustar telas para usarem o catálogo central.

### Fase C — 2 dias (segurança/regressão)
1. Testes automatizados de autorização:
   - USER sem permissão não adiciona membro.
   - ADMIN tenant com permissão adiciona/remove membro.
   - SUPER_ADMIN administra tenants.
2. Checklist de auditoria: quem alterou perfil de quem e quando.

## 5) Critérios de pronto (DoD)
- Existe papel explícito `SUPER_ADMIN` com escopo global.
- Usuário comum sem permissão não consegue incluir/remover pessoas do projeto.
- Admin consegue vincular/desvincular perfil de qualquer usuário do próprio tenant pela UI.
- Não há duplicidade funcional entre módulos de role/permission.
- Testes de autorização cobrindo fluxos críticos passam no CI.
