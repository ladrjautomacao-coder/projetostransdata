# SLA por data do último acompanhamento

## O que muda

Hoje a cor do card (verde/amarelo/laranja/vermelho) é calculada pela data da última alteração do projeto (`updated_at`), o que muda quando o card é movido ou qualquer campo é editado.

Passará a ser calculada pela data do **último comentário registrado no Acompanhamento do Projeto**.

Regras:

- Se o projeto tem pelo menos um registro de acompanhamento, os dias contam a partir da data/hora desse último registro.
- Se o projeto ainda não tem nenhum registro, o card é marcado como "Sem acompanhamento" e recebe a cor crítica (vermelho), sinalizando que precisa de atualização.
- As faixas de dias continuam vindas das Configurações do sistema, e a legenda continua igual.
- Continua sem aplicar SLA nas colunas "Implementado" e "Outros".
- O tooltip passa a dizer "sem acompanhamento há X dias" em vez de "parado há X dias nesta etapa".

## Detalhes técnicos

- `src/components/kanban/KanbanCard.tsx`: usar `latestFollowUpNote(p.observations)` (de `src/lib/followUpNotes.ts`) para obter a data do último registro; usar essa data no cálculo de dias em vez de `p.updated_at`. Sem registro → nível `red` com rótulo "Sem acompanhamento".
- `observations` já vem na consulta do Kanban em `src/pages/ProjectManagement.tsx` — nenhuma mudança de consulta.
- Notas antigas sem o prefixo `[dd/MM/yyyy HH:mm • Autor]` não têm data; nesse caso o card cai no estado "Sem acompanhamento".
- Apenas frontend: sem alterações de banco, RLS ou permissões.
