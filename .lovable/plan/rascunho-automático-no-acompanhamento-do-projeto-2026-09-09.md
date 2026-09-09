# Rascunho automático no acompanhamento do projeto

## Objetivo
Evitar retrabalho: se a pessoa estiver escrevendo um acompanhamento e sair da tela (ou fechar o navegador), o texto digitado continua lá ao voltar — igual ao rascunho do cadastro de projeto.

## Como vai funcionar
1. Enquanto a pessoa digita no campo de acompanhamento, o texto é salvo automaticamente no navegador (a cada ~800 ms, sem botão).
2. Ao retornar ao mesmo projeto, o campo volta preenchido com o texto pendente, com um pequeno aviso de "Rascunho restaurado de <data/hora>" e a opção de descartar.
3. Ao registrar o acompanhamento com sucesso, o rascunho é apagado.
4. O rascunho é por projeto e por usuário (fica só no navegador de quem digitou; nada vai para o banco).
5. Funciona nos dois lugares onde se escreve acompanhamento: o card do projeto no Kanban e a página de detalhes do projeto.

## Detalhes técnicos
- Reaproveitar o hook de rascunho usado no cadastro (`src/hooks/useFormDraft.ts`) ou criar um genérico com chave `transdata:note-draft:<user_id>:<project_id>`.
- Aplicar em:
  - `src/components/kanban/KanbanCard.tsx` — campo de nova nota do card.
  - `src/pages/ProjectDetail.tsx` — editor Markdown (`newNote`) da aba Acompanhamento.
- Limpar o rascunho após `onUpdateObservations` / `handleAddNote` terem sucesso.
- Sem mudanças no banco de dados.
