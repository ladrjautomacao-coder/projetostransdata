

# Mover Análise de Dados para o Dashboard

## Resumo
Substituir o conteúdo atual do Dashboard (cards de módulos) pelo conteúdo completo da página de Análise de Dados (ProjectAnalytics), e remover a rota/card de "Análise de Dados" do módulo de Projetos.

## Alterações

### 1. `src/pages/Dashboard.tsx`
- Substituir todo o conteúdo atual (hero + cards de módulos) pelo conteúdo de `ProjectAnalytics.tsx` (todos os gráficos, filtros, drag-and-drop, tabelas expandíveis).
- Copiar integralmente o código de `ProjectAnalytics.tsx` para `Dashboard.tsx`, removendo apenas o botão "Voltar" (ArrowLeft / navigate back) que faz sentido apenas como sub-página.

### 2. `src/pages/Projects.tsx`
- Remover o card "Análise de Dados" do array `cards` (o que referencia `/projetos/analitico`).
- Remover import do ícone `BarChart3` que não será mais usado.

### 3. `src/App.tsx`
- Remover a rota `/projetos/analitico` e o import de `ProjectAnalytics`.

### 4. `src/components/AppSidebar.tsx`
- Nenhuma alteração necessária — o sidebar já aponta para `/` (Dashboard) e `/projetos`.

### 5. Limpeza (opcional)
- O arquivo `src/pages/ProjectAnalytics.tsx` pode ser mantido ou removido. Como não terá mais rota apontando para ele, será código morto.

## O que NÃO muda
- Toda a lógica de gráficos, filtros, drag-and-drop e persistência no localStorage permanece idêntica.
- As demais rotas e funcionalidades do sistema não são afetadas.

