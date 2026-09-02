# Correção: botão "Limpar" dos filtros do Kanban

## O que está acontecendo

O clique em "Limpar" realmente zera os filtros (a lista de cards é recalculada), mas os seletores de **Gerente**, **Estado**, **Cidade** e **Status** continuam exibindo o texto do último filtro escolhido — passando a impressão de que nada foi limpo.

Causa: em `src/components/kanban/KanbanFilters.tsx` cada seletor usa `value={filters.X || undefined}`. Ao limpar, o valor vira `undefined`, o que faz o componente de seleção deixar de ser controlado e manter na tela o último rótulo selecionado em vez de voltar para "Todos".

## O que será feito

1. Usar o valor sentinela `"all"` nos seletores quando não houver filtro, em vez de `undefined`, para que "Limpar" volte todos os campos para "Todos"/"Todas".
2. Aplicar o mesmo ajuste no painel Comercial, que reutiliza o mesmo componente de filtros e tem o mesmo comportamento.
3. Exibir o botão "Limpar" sempre (não só quando há filtro ativo) é opcional — mantido o comportamento atual.

## Detalhes técnicos

- `KanbanFilters.tsx`: trocar `value={filters.managerId || undefined}` por `value={filters.managerId || "all"}` nos quatro seletores (gerente, estado, cidade, status). O campo de texto "Nome do Projeto" já é controlado corretamente.
- Sem mudanças de banco de dados nem de lógica de filtragem.

## Verificação

- Em `/projetos/gestao`: aplicar filtros de gerente, estado, cidade e status, clicar em "Limpar" e confirmar que os quatro campos voltam a exibir "Todos"/"Todas" e o quadro mostra todos os projetos.
