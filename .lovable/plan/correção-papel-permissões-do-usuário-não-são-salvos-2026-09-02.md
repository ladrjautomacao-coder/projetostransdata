# Correção: papel/permissões do usuário não são salvos

## O que está acontecendo

Ao escolher uma área (Diretoria, Projetos, Suporte Técnico, Relacionamento, Implantação, Produtos, Desenvolvimento, Comercial etc.) na tela de Gerenciamento de Usuários, o valor não é gravado.

Causa confirmada: a função de backend `admin-users` (ação `toggle_role`) só aceita a lista antiga de papéis — `user, admin, super_admin, gerente_projetos, executivo, comercial, leitor`. Qualquer papel fora dessa lista é silenciosamente convertido para `user`. Por isso a operação diz "sucesso", mas o banco grava `user`.

Consequência visual: como `user` não existe mais na lista de opções da tela, o seletor aparece **em branco** (exatamente como no anexo). Hoje existem 3 usuários gravados como `user` no banco.

## O que será feito

1. Backend: alinhar a lista de papéis aceitos em `toggle_role` com os papéis oficiais do sistema (Super Admin, Admin, as 8 áreas e Integração), rejeitando com mensagem clara qualquer papel inválido em vez de trocar por `user` em silêncio.
2. Frontend: exibir um rótulo de fallback no seletor quando o usuário estiver com papel legado (`user` etc.), para nunca aparecer campo vazio.
3. Ajustar os 3 usuários hoje com papel legado `user` — eles precisarão receber a área correta. Após o ajuste do backend, basta selecionar a área na tela; nenhum papel será alterado automaticamente sem sua escolha.

## Detalhes técnicos

- `supabase/functions/admin-users/index.ts`: substituir o array `allowed` pela lista derivada do enum `app_role` atual (`super_admin`, `admin`, `diretoria`, `comercial`, `projetos`, `suporte_tecnico`, `relacionamento`, `implantacao`, `produtos`, `desenvolvimento`, `integration`); retornar 400 quando o papel não estiver na lista. Redeploy da função.
- `src/pages/UserManagement.tsx`: `SelectValue` com `placeholder` e rótulo para papéis legados não presentes em `AVAILABLE_ROLES`.
- Sem mudanças de schema.

## Verificação

- Alterar a área de um usuário de teste para "Projetos" e confirmar no banco que `user_roles.role = 'projetos'` após recarregar a tela.
