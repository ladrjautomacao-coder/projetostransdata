## Objetivo

Adicionar ao **Cadastrar Novo Projeto** (e à edição em Detalhes) o campo **Sistema**, com dois subcampos numéricos: **Urbano** e **Seccionado**. A soma dos dois precisa bater com a Frota Contratada.

## Banco de dados

Adicionar duas colunas em `projects`:
- `fleet_urbano integer not null default 0`
- `fleet_seccionado integer not null default 0`

Constraint opcional: `check (fleet_urbano >= 0 and fleet_seccionado >= 0)`.

Backfill do projeto existente: `fleet_urbano = fleet_size`, `fleet_seccionado = 0` (admin pode reajustar manualmente depois). Não exige nova tabela nem RLS — herda as políticas de `projects`.

## Frontend

### `src/pages/NewProject.tsx`
- Novo card **Sistema** (mesmo padrão visual de "Equipamentos" / "Soluções"), posicionado logo após o card de Frota.
- Dois inputs numéricos: **Urbano** e **Seccionado** (min=0).
- Linha-resumo abaixo dos inputs: `Soma: X / Frota Contratada: Y` em verde quando bate, vermelho quando diverge.
- Validação Zod no submit:
  - `fleet_urbano + fleet_seccionado === fleet_size` (mensagem: "A soma de Urbano e Seccionado deve ser igual à Frota Contratada").
  - Bloqueia o save com `toast` de erro.

### `src/pages/ProjectDetail.tsx`
- Bloco fixo **Sistema** dentro da seção de Frota (somente leitura para quem não pode editar; editável com os mesmos inputs/validação para gestor vinculado e admin).
- Exibição: `Urbano: X carros · Seccionado: Y carros`.

### Tipagem
`src/integrations/supabase/types.ts` é regenerado automaticamente após a migração.

## Fora de escopo (confirmado nas respostas)
- Não aparece no Kanban nem no Assistente de IA por enquanto.
- Não substitui Frota Contratada — é detalhamento com validação de soma.

## Pontos de atenção
- Se Frota Contratada for alterada depois, a validação roda no save e força o ajuste de Urbano/Seccionado.
- Projetos antigos ficam com `Seccionado = 0`; ao primeira edição o usuário será obrigado a redistribuir caso a soma não bata.
