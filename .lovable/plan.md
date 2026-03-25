

# Botão "Cronograma" na Tabela de Projetos

## Objetivo
Mover a visualização do cronograma do Dashboard para um botão na tabela de listagem de projetos (`ProjectList`). Cada linha terá um botão "Cronograma" ao lado da coluna "Soluções" que, ao ser clicado, abre um popover/dialog mostrando a timeline de fases daquele projeto específico.

## Mudanças

### 1. `src/pages/ProjectList.tsx`
- Adicionar nova coluna **"Cronograma"** no `TableHeader`, após "Soluções"
- Em cada `TableRow`, adicionar um botão com ícone `CalendarClock` (lucide) e texto "Cronograma"
- Ao clicar, abre um **Popover** inline mostrando o componente `ProjectTimeline` com o status e nome da empresa daquele projeto
- Importar `ProjectTimeline`, `Popover`, `PopoverTrigger`, `PopoverContent` e o ícone

### 2. `src/pages/Dashboard.tsx`
- Remover a seção "Cronograma dos Projetos" que foi adicionada anteriormente, já que agora a visualização será feita individualmente na listagem

### 3. `src/components/ProjectTimeline.tsx`
- Sem alterações — o componente já suporta o modo necessário

## Resultado visual

```text
EMPRESA | LOCALIZAÇÃO | STATUS | GERENTE | FROTA | SOLUÇÕES | CRONOGRAMA |  
--------|-------------|--------|---------|-------|----------|------------|--
Empresa | Itajaí/SC   | Plan.  | Ana     | 45    | Telem.   | [📅 Crono] | 👁 🗑
                                                               ↓ (click)
                                                    ┌──────────────────────┐
                                                    │ Empresa ABC          │
                                                    │ [Plan]─[Impl]─[Enc]─[Susp] │
                                                    │   ●◌                 │
                                                    └──────────────────────┘
```

## Arquivos alterados
| Arquivo | Ação |
|---|---|
| `src/pages/ProjectList.tsx` | Adicionar coluna + botão com Popover |
| `src/pages/Dashboard.tsx` | Remover seção de cronograma |

Sem alterações no banco de dados.

