# Edição e exclusão de comentários no acompanhamento

Permitir corrigir ou remover registros do acompanhamento sem perder a rastreabilidade, mantendo a autoria e o histórico completo das alterações.

## O que será feito

### 1. Ações em cada comentário
- Adicionar os botões de editar e excluir ao lado de cada comentário na página do projeto.
- Exibir essas ações somente para o autor do comentário ou para administradores e Super Admins.
- Manter os demais usuários apenas com visualização.

### 2. Edição
- Abrir o comentário no mesmo editor formatado já usado para novos acompanhamentos.
- Permitir salvar ou cancelar a alteração.
- Preservar a formatação Markdown existente.
- Exibir no comentário a indicação “Editado”, com data e hora da última alteração.

### 3. Exclusão
- Solicitar confirmação antes de excluir, identificando claramente o comentário afetado.
- Remover o comentário da lista após a confirmação.
- Atualizar imediatamente os dados derivados do último acompanhamento, como alertas de prazo, Kanban e Visão Comercial.

### 4. Histórico de auditoria
- Criar um histórico protegido para registrar cada edição e exclusão.
- Em uma edição, guardar conteúdo anterior, conteúdo novo, autor da ação e data/hora.
- Em uma exclusão, preservar no histórico o conteúdo removido, seu autor original, quem excluiu e quando.
- O histórico não poderá ser alterado ou apagado pela tela.

### 5. Segurança
- Reforçar no banco que somente o autor do comentário, Admin ou Super Admin pode editar ou excluir.
- Ignorar qualquer tentativa da tela de trocar o autor original.
- Validar que o comentário pertence a um projeto visível ao usuário.
- Manter criação, edição, exclusão e auditoria protegidas pelas regras de acesso do banco.

## Detalhes técnicos

- Adicionar `updated_at` em `project_notes` e atualizá-lo automaticamente somente quando o conteúdo mudar.
- Criar `project_note_history` com referência lógica ao comentário e ao projeto, ação (`updated` ou `deleted`), conteúdo anterior/novo, autor original, responsável pela ação e data.
- Usar trigger para gerar a auditoria no banco, inclusive se uma alteração não vier da interface.
- Aplicar `GRANT`, RLS e políticas de leitura compatíveis com `can_view_project`; sem INSERT, UPDATE ou DELETE direto no histórico para usuários comuns.
- Ajustar a política de UPDATE de `project_notes` para incluir `WITH CHECK`, preservando `created_by` e `project_id`.
- Atualizar `ProjectDetail.tsx` com edição em linha, confirmação de exclusão, estados de carregamento e mensagens de sucesso/erro.
- Manter os comentários atualizados na Visão Comercial e no cálculo do último acompanhamento após editar ou excluir.
- Validar com usuário autor, usuário não autor e administrador, incluindo confirmação dos registros de auditoria.
