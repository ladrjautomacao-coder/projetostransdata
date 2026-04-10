

## Plano: Expandir Linha do Tempo com status "Implementado" e animação pulsante

### Problema
1. A timeline só tem 3 passos (Contratação, D-zero, Handover) — falta o passo "Implementado"
2. Projetos com status "encerrado" (Implementado) ficam parados no Handover
3. Não há indicação visual animada de qual é o passo atual do projeto

### Alterações

**`src/pages/ProjectDetail.tsx`**

- Adicionar 4º milestone na timeline: `{ label: "Implementado", date: null, done: currentStatusIndex >= 3 }`
- Identificar qual milestone é o **atual** (último "done" que ainda não foi superado) para aplicar animação
- Adicionar lógica `isCurrent` a cada item da timeline
- No círculo do milestone atual, aplicar animação pulsante com Framer Motion:
  - Anel externo pulsando (scale + opacity)
  - Glow com box-shadow animado na cor primária
- Manter os milestones concluídos com estilo sólido (sem animação)
- Milestones futuros permanecem com estilo "muted"

### Resultado visual
- Timeline: Contratação → D-zero → Handover → **Implementado**
- O passo correspondente ao status atual do projeto terá um efeito pulsante laranja, fácil de identificar

### Arquivo alterado
- `src/pages/ProjectDetail.tsx`

