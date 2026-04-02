

## Plano: Destacar projetos piloto no Kanban

### O que será feito

**1. Incluir `is_pilot` na query do Kanban (`src/pages/ProjectManagement.tsx`)**
- Adicionar `is_pilot` ao select da query e ao tipo `ProjectRow`

**2. Estilizar card de projeto piloto**
- Quando `is_pilot === true`, aplicar uma borda lateral esquerda laranja (`border-l-4 border-l-[#e8781e]`) e um fundo sutil (`bg-orange-50/50` / dark: `bg-orange-950/10`)
- Adicionar um `Badge` "Piloto" com estilo laranja no topo do card, junto ao nome da empresa

### Layout do card piloto

```text
┌──────────────────────────────┐
│▌ 🏢 Empresa ABC  [Piloto]   │  ← borda laranja à esquerda + badge
│  📍 Cidade/UF               │
│  👤 Gerente                  │
│  📅 D-zero: 01/01/2026      │
│  [Badge1] [Badge2]          │
└──────────────────────────────┘
```

### Arquivos alterados
- `src/pages/ProjectManagement.tsx` — query, tipo, estilo condicional do card e badge "Piloto"

