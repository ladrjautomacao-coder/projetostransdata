

# Drag and Drop para Quadrantes de Gráficos

## Objetivo
Permitir reordenar os 6 blocos de gráficos (Status, Soluções, Evolução da Frota, Evolução por Solução, Estado, Gerente) via drag and drop, persistindo a ordem no `localStorage`.

## Abordagem

Usar **HTML5 nativo drag and drop** (sem biblioteca externa) para manter o projeto leve.

### Alterações em `src/pages/ProjectAnalytics.tsx`

1. **Criar um mapa de painéis**: Cada bloco de gráfico + sua tabela expandível será registrado em um objeto/mapa com IDs: `status`, `solucoes`, `frota`, `solucao-timeline`, `estado`, `gerente`.

2. **Estado `chartOrder`**: Array de IDs controlando a ordem de renderização. Valor padrão: `["status", "solucoes", "frota", "solucao-timeline", "estado", "gerente"]`. Ao montar, carregar do `localStorage` (key: `analytics-chart-order`).

3. **Renderização dinâmica**: Em vez de 3 rows fixas com pares hardcoded, mapear `chartOrder` em pares de 2 e renderizar cada gráfico + tabela expandível na ordem definida pelo usuário, mantendo o grid `lg:grid-cols-2`.

4. **Drag and Drop nativo**:
   - Cada `GlowCard` terá `draggable` e um ícone de "grip" (6 pontos) no header para indicar que é arrastável.
   - Handlers: `onDragStart` (salvar índice), `onDragOver` (permitir drop), `onDrop` (reordenar array e salvar no `localStorage`).
   - Feedback visual: highlight/borda durante o drag.

5. **Botão "Resetar ordem"**: Um pequeno botão para restaurar a ordem padrão.

### Detalhes técnicos
- Sem dependências externas novas — apenas HTML5 drag API
- Persistência via `localStorage` key `analytics-chart-order`
- Cada bloco será extraído para uma função de renderização indexada pelo ID, evitando duplicação de código
- As tabelas expandíveis continuam renderizando imediatamente abaixo do grid de cada par

