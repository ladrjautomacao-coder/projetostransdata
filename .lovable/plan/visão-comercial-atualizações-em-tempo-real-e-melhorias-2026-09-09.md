# Visão Comercial: atualizações em tempo real e melhorias

## O que está errado hoje (verificado)

1. **Os acompanhamentos não aparecem.** A tela lê o texto do campo antigo de observações do projeto. Hoje existem 49 registros de acompanhamento gravados na nova lista de notas e **zero** no campo antigo. Resultado: todo card mostra "sem acompanhamento", e o cálculo de "dias sem atualização" cai para a data genérica do projeto.
2. **A atualização automática nunca dispara.** A tela está inscrita para receber avisos de mudança do banco, mas nenhuma tabela está publicada para envio dessas notificações. Por isso, ao atualizar um projeto em outra tela, a Visão Comercial só muda se a pessoa clicar em "Atualizar" ou recarregar.

## Correções

- Publicar as tabelas de projetos e de acompanhamentos para envio de mudanças ao vivo.
- Passar a ler os acompanhamentos da lista de notas (com autor e data/hora reais), usando o campo antigo apenas como reserva para projetos legados.
- Recalcular "última atualização", ordenação "mais tempo sem atualização" e o contador de projetos parados com base na data da última nota.
- Ouvir também novas notas: ao registrar um acompanhamento no Kanban ou na tela do projeto, o card correspondente na Visão Comercial atualiza sozinho.
- Atualizar em tempo real apenas o projeto alterado (sem recarregar a lista inteira), evitando piscadas e perda da rolagem.

## Melhorias propostas para a página

- **Aviso de mudança**: destaque discreto no card que acabou de mudar e etiqueta "atualizado há X" com horário da última sincronização.
- **Semáforo de acompanhamento**: verde/amarelo/vermelho por tempo sem nota, igual ao Kanban, com legenda.
- **Resumo por gerente**: bloco opcional mostrando quantos projetos cada gerente tem e quantos estão parados.
- **Exportar CSV** da lista filtrada, para uso do time comercial.
- **Prévia melhor no card**: mostrar as 2 últimas notas em vez de 1, com autor e data.
- **Persistir busca e ordenação** por usuário, como já ocorre com os filtros do Kanban.
- **Atalho para o projeto**: botão "Abrir projeto" no painel lateral.

## Detalhes técnicos

- Migração: `ALTER PUBLICATION supabase_realtime ADD TABLE public.projects, public.project_notes;` e `REPLICA IDENTITY FULL` nas duas tabelas.
- `src/pages/VisaoComercial.tsx`: buscar as notas mais recentes por projeto (consulta em `project_notes` filtrada pelos ids da página + agregada para o resumo), mesclar no objeto `FollowUpProject` como `latest_note`.
- `src/lib/followUpNotes.ts`: nova função que aceita nota estruturada ou texto legado.
- `src/components/comercial/ProjectFollowUpCard.tsx` e `ProjectFollowUpDrawer.tsx`: consumir `latest_note`/lista de notas do banco.
- Canal realtime único assinando `projects` e `project_notes`, com atualização pontual por `id` e recarga do resumo com debounce.
- Ordenação "stale" passa a ser feita sobre a data efetiva de acompanhamento; para manter paginação no servidor, ordenar por `updated_at` no banco e reordenar a página carregada pelo valor efetivo.

Sem mudanças de permissão: a tela continua somente leitura.
