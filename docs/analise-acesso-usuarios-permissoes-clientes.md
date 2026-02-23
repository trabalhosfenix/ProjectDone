# Análise de política de acesso: tipos de usuários, permissões e clientes

## Resumo executivo

O projeto possui uma base de controle de acesso **híbrida**:

- **Papel global simples** no usuário (`role`: `ADMIN` ou `USER`), usado para gates administrativos.
- **Perfil granular opcional** via `roleId -> Role.permissions (JSON)`, com permissões por chave.
- **Escopo multi-tenant** por `tenantId` em entidades centrais.
- **Escopo de projeto por participação** (criador ou membro) para leitura/alteração de projetos.

Ao mesmo tempo, existem lacunas importantes:

1. **Inconsistência entre `role` (string) e `roleId/permissions` (JSON)**: muitos fluxos só verificam `role === "ADMIN"`.
2. **Isolamento por tenant não é uniforme em todas as actions** (há pontos sem filtro por tenant explícito).
3. **"Cliente" não é entidade própria**: hoje é um campo textual em `Project.client`, sem política de acesso específica.
4. **A sessão JWT carrega permissões**, mas parte relevante do backend não usa essas permissões para autorizar ações.

---

## 1) Tipos de usuários e modelo de identidade

### O que existe hoje

- `User` tem:
  - `role` (`String`, default `USER`) para controle global rápido.
  - `roleId` opcional, relacionado a `Role`.
  - `tenantId` opcional, relacionado a `Tenant`.
- `Role` guarda permissões em JSON (`permissions Json`).
- `Tenant` organiza usuários, perfis e projetos por conta/empresa.

### Interpretação prática

Na prática, o sistema trabalha com os seguintes perfis operacionais:

1. **Admin global** (`role=ADMIN` e sem `tenantId`): tende a ter visão ampla.
2. **Admin de tenant** (`role=ADMIN` com `tenantId`): administra seu tenant.
3. **Usuário padrão** (`role=USER`): atuação restrita por participação em projeto + tenant.
4. **Usuário com perfil granular** (`roleId` definido): permissões finas em nível funcional.

---

## 2) Autenticação, sessão e enforcement

### Fluxo de autenticação

- Login por `CredentialsProvider`.
- Senha validada com `bcrypt`.
- JWT inclui `id`, `role`, `tenantId` e `permissions`.
- Middleware protege `/dashboard/*` (usuário precisa estar autenticado).

### Enforcement de acesso no backend

Há uma camada central (`src/lib/access-control.ts`) com:

- `requireAuth()`
- `requireTenantAccess()`
- `buildProjectScope(user)`
- `requireProjectAccess(projectId)`

Essa camada aplica regras importantes:

- `ADMIN` com tenant: escopo por `tenantId`.
- `ADMIN` sem tenant: sem filtro (super-admin).
- `USER`: escopo por `tenantId` + participação (criador ou membro).

---

## 3) Permissões granulares

### O que está bem estruturado

- Catálogo de permissões em `src/lib/permissions.ts` (`PERMISSIONS`).
- Helpers para verificar permissão (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`).
- Painéis/actions para cadastro e manutenção de perfis/permissões.

### Principais problemas

1. **Governança duplicada de perfis**:
   - Existe `src/app/actions/roles.ts`.
   - Existe também `src/app/actions/permissions.ts`.
   - Ambas fazem operações parecidas (listar/criar/atualizar papéis).

2. **Autorização real ainda centrada em `role === ADMIN`**:
   - Em ações sensíveis (ex.: usuários, tenants, roles), o gate principal costuma ser admin global.
   - O JSON de permissões nem sempre participa da decisão final.

3. **Escopo por tenant nem sempre aplicado em roles/perfis**:
   - Alguns CRUDs de role não filtram por tenant, apesar de `Role` possuir `tenantId` no modelo.

---

## 4) Clientes: estado atual

### Como "cliente" aparece no domínio

- Hoje `Project` possui campo `client` (`String?`).
- Não há tabela `Client` dedicada com relacionamento, ownership, status e regras próprias.

### Impacto

- Não existe política explícita "usuário X pode ver clientes Y".
- Não há isolamento de cliente como dimensão de segurança (apenas tenant + projeto).
- Pode haver inconsistência de nomenclatura (texto livre), dificultando auditoria e filtros robustos.

---

## 5) Riscos e lacunas de segurança/autorização

1. **Risco de bypass por falta de padronização**:
   - Nem todo endpoint/action usa a mesma estratégia (`requireProjectAccess` / `hasPermission`).

2. **Risco de autorização heterogênea**:
   - Partes com RBAC granular coexistem com checagens simples de `ADMIN`.

3. **Risco de governança operacional**:
   - Duplicidade entre actions de papéis aumenta chance de drift entre regras.

4. **Risco de "cliente" sem governança**:
   - Sem entidade própria, não há trilha formal de controle por cliente.

---

## 6) Recomendações objetivas

1. **Unificar o mecanismo de autorização**
   - Criar uma única camada (`authorize(user, resource, action)`) e reutilizar em actions e rotas.

2. **Padronizar escopo obrigatório por tenant**
   - Toda query de dados sensíveis deve incluir tenant + regra contextual.

3. **Convergir `role` e `roleId`**
   - Tornar `role` apenas marcador de sistema (ou removê-lo gradualmente) e centralizar decisões em `Role.permissions`.

4. **Consolidar actions de perfil/permissão**
   - Manter apenas um módulo de CRUD e policy de roles.

5. **Modelar Cliente como entidade (`Client`)**
   - Relacionar `Project -> Client`.
   - Definir políticas: quem cria, quem vê, quem altera cliente.

6. **Adicionar matriz de autorização e testes de segurança**
   - Casos mínimos: cross-tenant, cross-project, permissão negada, admin de tenant vs admin global.

---

## 7) Conclusão

O projeto já tem pilares corretos para SaaS B2B (tenant, membership em projeto, sessão com permissões), mas a política de acesso ainda está **parcialmente centralizada** e **inconsistente** entre módulos. Para reduzir risco operacional e de segurança, o caminho é padronizar enforcement (tenant + permissão + contexto) e formalizar "cliente" como entidade de domínio com regras próprias.
