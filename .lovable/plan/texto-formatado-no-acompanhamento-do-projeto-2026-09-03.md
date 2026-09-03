# Texto formatado no Acompanhamento do Projeto

Hoje o campo de acompanhamento aceita apenas texto puro e é exibido sem formatação. A proposta é permitir formatação simples nos registros.

## O que muda

- Barra de ferramentas acima do campo de escrita com: **negrito**, *itálico*, lista com marcadores, lista numerada, título e link.
- Ao clicar num botão, a marcação é aplicada ao trecho selecionado (ou inserida no cursor).
- Atalhos de teclado: Ctrl/Cmd+B (negrito) e Ctrl/Cmd+I (itálico).
- Os registros já salvos e os novos passam a ser exibidos com a formatação aplicada (negrito, itálico, listas, links clicáveis, quebras de linha preservadas).
- Registros antigos em texto simples continuam aparecendo normalmente.

## Detalhes técnicos

- Editor: manter o `Textarea` atual e adicionar uma toolbar que insere marcação Markdown na seleção (helper simples de manipulação de `selectionStart/End`).
- Renderização: usar `ReactMarkdown` + `remark-gfm` (já usados em `AssistantChat.tsx`) no lugar do `<p className="whitespace-pre-wrap">` da lista de notas em `src/pages/ProjectDetail.tsx`, com as classes `prose` no mesmo padrão do assistente e `breaks` para preservar quebras de linha.
- Sem mudança de banco: o conteúdo continua salvo como texto na mesma coluna/tabela.
- Componente novo `src/components/MarkdownNoteEditor.tsx` (toolbar + textarea) para reuso; a exibição pode virar um pequeno `NoteContent` no mesmo arquivo.
- Sanitização: `ReactMarkdown` não renderiza HTML bruto por padrão, então o conteúdo permanece seguro.
