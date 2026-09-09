# Manter filtros do Kanban ao sair e voltar à tela

## Objetivo
Quando o gerente filtrar o Kanban (ex.: pelo próprio nome em "Gerente de Projetos") e sair da tela, ao retornar os filtros continuam aplicados — hoje eles se perdem porque ficam apenas na memória da sessão.

## Como vai funcionar
1. Toda alteração nos filtros do Kanban (Gerente, Empresa, UF/País, Cidade, Status) é salva automaticamente no navegador, por usuário.
2. Ao voltar ao Kanban (ou recarregar a página), os filtros salvos são reaplicados automaticamente.
3. O botão "Limpar" dos filtros apaga também o que estava salvo no navegador.
4. Vale por usuário e por navegador; nada vai para o banco de dados.

## Detalhes técnicos
- Alterar apenas `src/contexts/ProjectFiltersContext.tsx`:
  - Persistir `filters` em `localStorage` (chave `transdata:kanban-filters:<user_id>`, usando `useAuth`) a cada mudança.
  - Inicializar o estado lendo o valor salvo (com validação de formato).
  - `clearFilters` remove a chave do `localStorage`.
- Sem mudanças no banco de dados nem nas telas que consomem os filtros (Kanban e Dashboard herdam o comportamento automaticamente via contexto).
