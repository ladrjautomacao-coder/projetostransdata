# Plano: remover o fundo quadriculado do Kanban

## Contexto
O padrão de fundo quadriculado (classe `.tech-grid`) está aplicado no container global de conteúdo, em `src/components/AppLayout.tsx`. Ele afeta todas as páginas — incluindo a tela de Gestão de Projetos (Kanban) — e dá um ar mais "tecno"/jogo de tabuleiro, que no contexto de gestão de projetos pode parecer menos profissional.

## Objetivo
Remover o fundo quadriculado da área do Kanban e deixar a superfície limpa, profissional e alinhada ao restante do sistema.

## Mudanças propostas

### 1. Remover o padrão `.tech-grid` do layout global
- Arquivo: `src/components/AppLayout.tsx`
- Ação: retirar a classe `tech-grid` do `<div>` que envolve `<Outlet />`.
- Resultado: todas as telas passam a usar o fundo padrão do design system (`bg-background`), um cinza muito clido e neutro.

### 2. Fundo limpo no Kanban
- Arquivo: `src/pages/ProjectManagement.tsx`
- Ação: garantir que a página de gestão use `bg-background` e que as colunas do Kanban fiquem sobre cards/cards-leves (`bg-card` ou `bg-background/80`) para manter a separação visual sem depender do grid.

### 3. Manter a identidade visual
- As cores das colunas por status (azul, roxo, âmbar, verde, vermelho) continuam com os tons translúcidos atuais.
- O badge de contagem, os avatares e os indicadores SLA permanecem inalterados.
- Se necessário, adicionar uma borda sutil ou sombra leve nas colunas para reforçar a delimitação sem recarregar a tela.

### 4. Verificação
- Abrir `/projetos/gestao` no preview e confirmar que o fundo quadriculado sumiu.
- Navegar rapidamente em outras páginas para garantir que a remoção global não quebrou o visual delas.

## Decisão pendente
Você mencionou "talvez um fundo branco básico". O design system atual usa `bg-background` (cinza bem claro, `#F8F7FA` aproximadamente no tema claro). Podemos seguir com ele — mais suave e moderno — ou forçar branco puro (`bg-white`) no Kanban. Qual prefere?
