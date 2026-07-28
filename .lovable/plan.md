# Plano: Sistema de Permissões Granulares

## Objetivo
Substituir o modelo atual (admin / user / super_admin / integration binário) por um sistema flexível baseado em **papéis pré-definidos com overrides por usuário**, cobrindo módulos, ações, seções de projeto e escopo de dados.

## Papéis pré-definidos

| Papel | Descrição padrão |
|---|---|
| `super_admin` | Acesso total, gerencia papéis e permissões (mantém atual). |
| `admin` | Acesso total operacional (mantém atual). |
| `gerente_projetos` | Edita apenas projetos vinculados (escopo próprio); vê os demais em leitura. |
| `executivo` | Vê todos os projetos, edita seções comerciais (acompanhamento, observações). |
| `comercial` | Cria projetos e edita seções comerciais; leitura em implantação. |
| `leitor` | Somente visualização de tudo que tem acesso. |
| `integration` | Mantém como está (API somente leitura). |

Todos os papéis são **independentes** (sem herança). Cada um traz um preset de permissões que pode ser sobrescrito por usuário.

## Estrutura das permissões

Três dimensões combinadas:

1. **Módulo** — `dashboard`, `projects`, `implantacao`, `admin_team`, `admin_users`, `admin_settings`, `admin_manual`
2. **Ação** — `view`, `create`, `edit`, `delete`, `move_card` (Kanban)
3. **Seção de projeto** (quando ação = edit em `projects`) — `identificacao`, `datas`, `frota`, `solucoes`, `equipamentos`, `integracoes`, `acompanhamento`, `anexos`, `status_kanban`

**Escopo de dados** por papel: `all` (todos os projetos) ou `own` (apenas onde é gerente/executivo vinculado).

## Modelo de dados

```text
role_presets (papel → permissões padrão em JSON)
├─ role: app_role
├─ permissions: jsonb { modules: {...}, sections: {...}, scope: 'all'|'own' }

user_permission_overrides (sobrescreve preset por usuário)
├─ user_id
├─ permissions: jsonb (mesma estrutura, merge sobre o preset)
```

Função `get_effective_permissions(user_id)` retorna o merge de preset + overrides. Usada tanto em RLS quanto no frontend.

## Backend (migrations)

1. Novo enum values em `app_role`: `gerente_projetos`, `executivo`, `comercial`, `leitor`.
2. Tabelas `role_presets` e `user_permission_overrides` com GRANTs e RLS (admin gerencia, usuário lê o próprio).
3. Função `has_permission(_user_id, _module, _action, _section?)` SECURITY DEFINER.
4. Função `can_edit_project_section(_project_id, _section)` que combina escopo + seção.
5. Atualizar RLS de `projects` e tabelas filhas para usar `has_permission` no lugar de `can_write_project` (mantendo a lógica de escopo `own`).
6. Seed dos presets padrão de cada papel.

## Frontend

1. **Hook `usePermissions()`** — carrega permissões efetivas do usuário logado uma vez e expõe:
   - `can(module, action, section?)` → boolean
   - `scope` → `'all' | 'own'`
2. **`AppSidebar.tsx`** — esconde itens de módulo conforme `can(module, 'view')`.
3. **`AdminRoute` / novo `ModuleRoute`** — protege rotas por módulo+ação.
4. **`ProjectDetail.tsx`** — cada card/seção usa `can('projects', 'edit', 'acompanhamento')` para habilitar/desabilitar inputs e botões.
5. **`KanbanCard.tsx`** — `isDragDisabled` passa a usar `can('projects', 'move_card')` + escopo.
6. **`NewProject.tsx`** — bloqueia se sem `can('projects', 'create')`.
7. **Nova tela `/admin/permissoes`** (dentro de Administração):
   - Aba "Papéis": visualiza/edita presets de cada papel via matriz (linhas = módulos/seções, colunas = ações).
   - Aba "Usuários": lista usuários, permite aplicar override individual sobre o preset.
   - Componente `PermissionMatrix` reutilizável para as duas abas.
8. **`UserManagement.tsx`** — dropdown de papel passa a listar os 7 papéis; botão "Personalizar permissões" abre modal de override.

## Compatibilidade

- Usuários atuais mantêm papéis `admin`/`user`/`super_admin`/`integration` — `user` é migrado para `leitor` como default seguro, admin pode reatribuir.
- RPC `can_write_project` mantida como wrapper sobre `has_permission` para não quebrar código legado.
- Nenhum dado de projeto é alterado.

## Detalhes técnicos

- Merge de permissões: `deep_merge(preset, override)` com override tendo prioridade por chave.
- Cache: `usePermissions` usa React Query com `staleTime: 5min`; invalida no `onAuthStateChange`.
- Auditoria: alterações em `role_presets` e `user_permission_overrides` gravam em `project_history`-style próprio (`permission_history`) para rastreabilidade.
- Segurança: apenas `super_admin` e `admin` podem editar presets; apenas `super_admin` pode criar/editar override que concede permissões `admin_*`.

## Entregas em ordem

1. Migração: enum, tabelas, funções, RLS, seed dos presets.
2. Hook `usePermissions` + integração no `AuthContext`.
3. Refactor de rotas, sidebar e guards (`ModuleRoute`).
4. Aplicação das checagens em `ProjectDetail`, `NewProject`, `ProjectManagement`, `KanbanCard`.
5. Tela `/admin/permissoes` com matriz.
6. Ajustes em `UserManagement` para novos papéis e overrides.
