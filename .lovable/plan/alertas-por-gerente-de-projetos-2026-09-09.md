# Alertas por gerente de projetos

Hoje o sino de alertas mostra os mesmos alertas para todo mundo: ele carrega todos os projetos ativos e agrupa sem olhar quem está logado.

## O que muda

- Um gerente de projetos passa a ver no sino apenas alertas dos projetos em que ele é o gerente responsável.
- Administradores continuam vendo todos os alertas, de todos os gerentes.
- Para quem não é gerente nem administrador (comercial, diretoria etc.), nada muda: continuam com a visão atual.
- A categoria "Sem gestor designado" deixa de aparecer para o gerente de projetos, já que esses projetos não são dele; segue visível para administradores.
- A contagem no ícone do sino e a marcação de "já vistos" passam a refletir só os alertas que a pessoa realmente vê.

## Detalhes técnicos

Arquivo: `src/components/AlertsBell.tsx`

1. Obter o vínculo do usuário logado com a equipe via `supabase.rpc("get_my_manager_id")`, mesmo padrão já usado em `src/pages/ProjectManagement.tsx`.
2. Usar `isAdmin` / `isSuperAdmin` do `AuthContext` para decidir o escopo.
3. Aplicar o filtro na lista carregada antes do agrupamento: quando não for admin e houver `managerId`, manter apenas `p.manager_id === managerId`; senão manter tudo.
4. Pular a categoria `no_manager` quando o escopo estiver restrito ao gerente.
5. Nenhuma mudança de banco de dados: as regras de acesso existentes continuam valendo; este é só o recorte de exibição.
