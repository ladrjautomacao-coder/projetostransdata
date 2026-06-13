## Objetivo

Transformar o card **Soluções / Escopo** em uma lista de soluções flegáveis (checkbox), igual ao padrão de "Equipamentos" — porém **sem quantidade**. A solução **AtlasMob** terá sub-características também flegáveis, exibidas fixas na visualização do projeto.

## Soluções (checkbox)

1. Bilhetagem
2. Its (legado)
3. Gestão de frota
4. Biometria facial
5. Carrier
6. Telemetria
7. ATM
8. Carteira Google
9. Pix por aproximação
10. AtlasMob *(ao marcar, abre sub-opções)*

### Sub-opções do AtlasMob (múltipla escolha)
- Personalizado
- Informativo ao usuário
- Cadastro e recadastro
- Carteira digital

## Banco de dados

1. **Seed `solutions`**: desativar (`active=false`) tudo fora da lista e inserir/ativar essas 10.
2. **Nova tabela `solution_features`** (catálogo de sub-características):
   - `solution_id` (FK → solutions), `name`, `sort_order`, `active`
3. **Nova tabela `project_solution_features`** (junção):
   - `project_id`, `solution_feature_id`
4. Seed das 4 features do AtlasMob.
5. GRANTs + RLS no mesmo padrão de `project_equipments` / `project_solutions`.

## Frontend

### `src/pages/NewProject.tsx`
- Substituir o input atual de Soluções por **lista de checkboxes** (de `solutions` ativas, ordenadas).
- Ao marcar **AtlasMob**, renderizar logo abaixo um bloco com as 4 features em checkbox.
- Estados: `selectedSolutions: string[]`, `selectedFeatures: string[]`.
- No submit: gravar em `project_solutions` e `project_solution_features`.

### `src/pages/ProjectDetail.tsx`
- **Edição**: mesmas checkboxes + sub-opções carregadas.
- **Visualização**: badges das soluções; quando AtlasMob estiver marcada, exibir as features escolhidas fixas ao lado (ex.: `AtlasMob — Personalizado, Carteira digital`).
- Save com delete-and-reinsert (igual `project_equipments`).
- Incluir no histórico ("Soluções" e "Características AtlasMob").

## Fora de escopo
- Não alterar `project_solutions` existente — só adicionar a nova tabela de features.
- Não tocar em Equipamentos, Produtos ou outros cards.
