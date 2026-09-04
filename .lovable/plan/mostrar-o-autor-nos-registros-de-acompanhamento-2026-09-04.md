# Mostrar o autor nos registros de Acompanhamento

## O que está acontecendo

O sistema **grava sim** quem escreveu cada registro: todos os acompanhamentos têm o usuário vinculado. O problema é na hora de exibir: o nome vem de um cadastro de perfis que hoje está **vazio** (0 registros para 8 usuários), então a tela mostra apenas "Usuário".

Além disso, o cadastro automático de perfil no momento em que uma pessoa é criada **não está ativo**, então novos usuários continuariam sem nome.

## O que será feito

1. Preencher os perfis dos 8 usuários existentes com nome e e-mail já cadastrados no acesso.
2. Reativar a criação automática de perfil sempre que um novo usuário for criado.
3. Na tela do projeto, se ainda faltar o nome, exibir o e-mail do autor em vez de "Usuário" genérico.
4. Conferir na tela que os registros antigos passam a mostrar o nome de quem inseriu.

## Detalhes técnicos

- Migração: backfill de `public.profiles` a partir de `auth.users` (`full_name` de `raw_user_meta_data->>'full_name'` com fallback para o e-mail), e recriação do gatilho `on_auth_user_created` chamando `public.handle_new_user()`.
- `handle_new_user()` também insere papel padrão; usar `ON CONFLICT DO NOTHING` para não duplicar papéis já atribuídos.
- Frontend (`src/pages/ProjectDetail.tsx`, `loadNotes`): manter a busca em `profiles`, com fallback de rótulo quando o nome estiver ausente.
