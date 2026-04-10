

## Plano: Campo "Frota Implementada" para projetos com Venda Complementar

### Problema
Quando um projeto com venda complementar retorna ao status "Comercial" para implementar mais frota, toda a frota (base + complementar) é contabilizada no status atual (ex: Comercial), quando na verdade parte dela já está implementada.

### Solução
Adicionar um campo `implemented_fleet` na tabela `projects` que indica quantos veículos da frota total já estão implementados. Este campo só é relevante quando `complementary_sale = true`. A frota restante (total - implementada) segue o status atual do card no Kanban.

### Alterações

**1. Migração de banco de dados**
- Adicionar coluna `implemented_fleet integer NOT NULL DEFAULT 0` à tabela `projects`

**2. `src/pages/ProjectDetail.tsx`**
- Adicionar estado `implementedFleet` para edição
- Na seção "Venda Complementar", exibir novo campo "Frota Implementada" (visível apenas quando `complementary_sale` está ativo)
- Incluir o campo no save e no carregamento do projeto
- Validar que `implemented_fleet <= fleet_size + complementary_fleet`

**3. `src/pages/Dashboard.tsx`**
- Alterar o cálculo de `fleetByStatus`: quando um projeto tem `complementary_sale` ativo e `implemented_fleet > 0`, distribuir `implemented_fleet` no status "encerrado" e o restante (`getProjectFleet(p) - implemented_fleet`) no status atual do card
- Atualizar `getProjectFleet` ou o loop de `fleetByStatus` para refletir essa divisão

**4. `src/components/kanban/KanbanCard.tsx`**
- Exibir no card, quando `complementary_sale` estiver ativo e `implemented_fleet > 0`, uma informação adicional como "X impl. / Y total" para dar visibilidade

**5. `src/pages/ProjectManagement.tsx`**
- Incluir `implemented_fleet` na query de projetos do Kanban
- Atualizar o tipo `ProjectRow` para incluir `implemented_fleet`

### Resultado
- O Dashboard contará corretamente a frota implementada separadamente da frota em andamento
- O card do Kanban mostrará a divisão de frota de forma clara
- O campo aparece na edição do projeto apenas quando venda complementar está ativa

