# Visão Comercial — quadrantes clicáveis e ocultar "Implementado" por padrão

## Comportamento

### 1. Quadrantes (KPIs) viram filtros clicáveis
- Cada card do topo (Total, Comercial, Planejamento, Implantação, Implementado, Outros, e o card de "+N dias sem atualização") passa a ser clicável.
- Clicar em um quadrante de status filtra a lista abaixo por aquele status; o card fica visualmente marcado como ativo (borda/realce).
- Clicar de novo no mesmo quadrante desmarca e volta à visão padrão.
- "Total" limpa o filtro de status e mostra todos os projetos, inclusive os Implementados.
- O card "+N dias sem atualização" filtra apenas projetos parados há mais que o limite configurado.
- Os quadrantes ficam sincronizados com o filtro Status da barra lateral: mudar um reflete no outro.

### 2. Regra de exibição padrão
- Ao abrir Visão Comercial, a lista mostra todos os projetos **exceto** os de status "Implementado" (`encerrado`).
- Os projetos Implementados aparecem somente quando o usuário clica no quadrante "Implementado", seleciona esse status no filtro lateral, ou clica em "Total".
- Os contadores dos quadrantes continuam mostrando os números reais de todos os projetos (incluindo Implementado), para não perder a visão geral.
- O contador de "projetos" abaixo da busca reflete o que está sendo listado.

## Detalhes técnicos
- `src/pages/VisaoComercial.tsx`:
  - Novo estado derivado: quando `filters.status` está vazio, aplicar `.neq("status", "encerrado")` na consulta paginada; quando "Total" for acionado explicitamente, usar um modo `showAll` que não aplica o `neq`.
  - Estado `staleOnly` para o card de atraso: filtro aplicado no cliente sobre a página carregada, usando `latestFollowUpNote`/`daysSince` (mesma regra do `loadSummary`).
  - KPIs transformados em `<button>` acessíveis (role/aria-pressed), com estilo ativo usando `statusColors` de `ProjectManagement`.
  - Clique em quadrante de status chama `setFilter("status", ...)` do `ProjectFiltersContext`, reaproveitando a lógica de filtro já existente e o reset de paginação.
- `loadSummary` permanece sem o `neq`, para os contadores continuarem globais.
- Sem mudanças de banco, RLS ou permissões.
