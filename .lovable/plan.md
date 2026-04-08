

## Plano: Edição rápida de "Acompanhamento do Projeto" direto no Kanban

### O que sera feito

Adicionar um icone de lapis no canto superior direito de cada card do Kanban. Ao clicar, abre um Popover com um Textarea para digitar a observacao. Ao salvar, o texto e automaticamente prefixado com a data/hora (ex: `[08/04/2026 14:30] Texto digitado pelo gerente`) e concatenado ao conteudo existente do campo `observations`, sem sobrescrever o historico anterior.

### Como funciona

```text
┌─ Card Kanban ─────────────────── ✏️ ┐
│ 🏢 Empresa ABC         [Piloto]     │
│ 📍 Cidade/UF                        │
│ ...                                  │
└──────────────────────────────────────┘
         │ click no lapis
         ▼
  ┌─ Popover ──────────────────────┐
  │  Acompanhamento do Projeto     │
  │  ┌────────────────────────┐    │
  │  │ (textarea)             │    │
  │  └────────────────────────┘    │
  │              [Salvar]          │
  └────────────────────────────────┘
```

Ao salvar, o campo `observations` no banco recebe:

```text
[08/04/2026 14:30] Nova observacao digitada
--- conteudo anterior (se existia) ---
```

O texto mais recente fica sempre no topo.

### Alteracoes

**1. `src/pages/ProjectManagement.tsx`**
- Adicionar `observations` na query de projetos e no tipo `ProjectRow`
- Criar callback `onUpdateObservations(projectId, newText)` que:
  - Busca o `observations` atual do projeto
  - Concatena `[dd/MM/yyyy HH:mm] newText\n` + conteudo anterior
  - Faz `update` no banco
  - Recarrega os projetos
- Passar o callback para `KanbanCard`

**2. `src/components/kanban/KanbanCard.tsx`**
- Adicionar icone `Pencil` no canto superior direito do card
- Ao clicar no lapis, abre `Popover` com Textarea + botao Salvar
- O click no lapis faz `e.stopPropagation()` para nao navegar ao detalhe
- Ao salvar, chama o callback recebido via props
- Fechar o popover apos salvar

**3. `src/components/kanban/KanbanColumn.tsx`**
- Repassar o callback `onUpdateObservations` para cada `KanbanCard`

### Arquivos alterados
- `src/pages/ProjectManagement.tsx` (tipo + query + callback)
- `src/components/kanban/KanbanColumn.tsx` (repasse de prop)
- `src/components/kanban/KanbanCard.tsx` (icone + popover + save)

