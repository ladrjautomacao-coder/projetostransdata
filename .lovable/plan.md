

## Plano: Subfases dentro das colunas do Kanban

### Contexto
Adicionar subdivisões verticais dentro de cada coluna do Kanban. Começando pela coluna "Planejamento" com 6 subfases ordenadas. Cada subfase funciona como uma zona de drop independente, permitindo ao gerente posicionar o card na etapa correta do processo.

### O que será feito

**1. Migração de banco de dados**
Adicionar coluna `sub_phase` (text, nullable, default null) na tabela `projects`. Essa coluna armazena o identificador da subfase em que o projeto se encontra dentro do seu status atual.

**2. Definir subfases por status (front-end)**
Criar um mapa de subfases por status. Inicialmente apenas "Planejamento" terá subfases:

```text
planejamento:
  1. reuniao_handover      → "Reunião de Handover"
  2. reuniao_kickoff       → "Reunião de Kick-off"
  3. reuniao_proj_executivo → "Reunião Projeto Executivo"
  4. levantamento_materiais → "Levantamento de Materiais"
  5. aquisicao_materiais   → "Aquisição de Materiais"
  6. cronograma_visita     → "Cronograma de Visita Técnica"

implantacao / encerrado / suspenso: sem subfases (comportamento atual)
```

**3. Alterar o Kanban (`src/pages/ProjectManagement.tsx`)**

- Dentro de cada coluna, se o status tiver subfases definidas, renderizar seções visuais separadas (subtítulos com separadores) — cada uma sendo um `Droppable` independente com ID composto (ex: `planejamento::reuniao_handover`).
- Colunas sem subfases mantêm o Droppable único atual.
- Os cards são agrupados e renderizados dentro da subfase correspondente ao valor de `sub_phase` do projeto.
- Cards sem `sub_phase` definida aparecem na primeira subfase por padrão.

**4. Atualizar lógica de drag-and-drop**

- No `onDragEnd`, parsear o `droppableId` do destino:
  - Se contém `::`, extrair status e subfase (ex: `planejamento::reuniao_kickoff`)
  - Se não contém, manter lógica atual (apenas status)
- Atualizar tanto `status` quanto `sub_phase` no banco ao mover o card.
- Mover entre colunas diferentes reseta ou define a subfase adequadamente.

**5. Layout visual da coluna com subfases**

```text
┌─ Planejamento (6) ──────────────────┐
│                                      │
│  ── 1° Reunião de Handover ────────  │
│  [Card A]  [Card B]                  │
│                                      │
│  ── 2° Reunião de Kick-off ───────   │
│  [Card C]                            │
│                                      │
│  ── 3° Reunião Projeto Executivo ──  │
│  (vazio)                             │
│                                      │
│  ── 4° Levantamento de Materiais ──  │
│  [Card D]                            │
│                                      │
│  ── 5° Aquisição de Materiais ─────  │
│  (vazio)                             │
│                                      │
│  ── 6° Cronograma Visita Técnica ──  │
│  [Card E]                            │
└──────────────────────────────────────┘
```

Cada subfase terá um cabeçalho discreto (texto pequeno + número ordinal + linha separadora sutil) e uma área mínima de drop para permitir soltar cards mesmo quando vazia.

### Arquivos alterados
- **Migração SQL** — adicionar coluna `sub_phase` em `projects`
- `src/pages/ProjectManagement.tsx` — mapa de subfases, droppables compostos, agrupamento visual, lógica de drag atualizada
- `src/pages/ProjectDetail.tsx` — (opcional) exibir/editar subfase atual do projeto

### Extensibilidade
O modelo permite adicionar subfases para as outras colunas (Implantação, etc.) futuramente, bastando incluir as entradas no mapa de subfases — sem mudança estrutural.

