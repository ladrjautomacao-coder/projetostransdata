

## Plano: Badge "V. Complementar" no Card do Kanban

### O que sera feito

Exibir uma badge verde "V. Complementar" na mesma linha do nome da empresa e do badge "Piloto", ao lado direito do card. Se houver frota complementar > 0, exibir o numero entre parenteses.

### Alteracoes

**1. `src/pages/ProjectManagement.tsx`**
- Adicionar `complementary_sale` (boolean) e `complementary_fleet` (number) ao tipo `ProjectRow`
- Adicionar esses campos na string do `.select()`

**2. `src/components/kanban/KanbanCard.tsx`**
- Adicionar badge condicional ao lado do badge "Piloto" na linha do header:

```text
┌──────────────────────────────────┐
│ 🏢 Empresa ABC  [Piloto] [VC]   │
│ 📍 Cidade/UF                    │
│ 👤 Gerente                      │
│ 📅 D-zero: 01/01/2026           │
│ [Solução A] [Solução B]         │
└──────────────────────────────────┘

VC = Badge verde "V. Complementar (15)"
```

- Badge com estilo verde (emerald) para diferenciar do Piloto (amber)

### Arquivos alterados
- `src/pages/ProjectManagement.tsx` (tipo + query)
- `src/components/kanban/KanbanCard.tsx` (badge condicional)

