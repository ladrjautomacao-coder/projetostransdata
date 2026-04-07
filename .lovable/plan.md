

## Plano: Destaque visual do card "Venda Complementar" no Kanban

### O que sera feito

Aplicar borda lateral e fundo sutil nos cards de projetos com Venda Complementar, usando **emerald (verde)** — cor já presente no badge do card e que combina com a paleta tecnológica (laranja para Piloto, verde para V. Complementar).

### Alteracao

**`src/components/kanban/KanbanCard.tsx`**

Adicionar classe condicional quando `p.complementary_sale === true`:
- `border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10`

Quando o projeto for **Piloto E Venda Complementar** ao mesmo tempo, manter prioridade do Piloto (amber) para evitar conflito visual.

### Resultado visual

```text
Card normal:        fundo branco, sem borda lateral
Card Piloto:        borda amber + fundo amber suave
Card V. Compl.:     borda emerald + fundo emerald suave
Card ambos:         borda amber (Piloto prevalece)
```

### Arquivo alterado
- `src/components/kanban/KanbanCard.tsx` (1 linha de classes condicionais)

