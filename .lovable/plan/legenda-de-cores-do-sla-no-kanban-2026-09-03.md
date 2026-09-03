# Legenda de cores do SLA no Kanban

## O que será feito

Adicionar uma legenda visual no cabeçalho do Kanban (à direita, ao lado do contador de projetos) explicando o significado das cores da barra/etiqueta de cada card.

A legenda mostrará quatro itens, cada um com o ponto colorido, o rótulo e a faixa de dias vinda das configurações do sistema:

- Verde — Em dia (até 7 dias sem atualização)
- Amarelo — Atenção (8 a 15 dias)
- Laranja — Atrasado (16 a 30 dias)
- Vermelho — Crítico (mais de 30 dias)

Os números não serão fixos: virão dos limites configurados em Configurações do sistema (SLA do Kanban), então a legenda acompanha automaticamente qualquer ajuste.

Também será incluída uma nota curta em tooltip informando que o SLA não se aplica a cards em "Implementado" e "Outros" (regra já existente no sistema).

## Detalhes técnicos

- Novo componente `src/components/kanban/KanbanLegend.tsx`, consumindo `useSettings()` para `slaGreenMaxDays`, `slaYellowMaxDays` e `slaOrangeMaxDays`.
- Reutiliza as mesmas classes de cor já usadas em `KanbanCard.tsx` (`bg-emerald-500`, `bg-yellow-500`, `bg-orange-500`, `bg-red-500`) e os mesmos rótulos (`Em dia`, `Atenção`, `Atrasado`, `Crítico`) para garantir consistência.
- Renderizado no cabeçalho de `src/pages/ProjectManagement.tsx`, na mesma linha do contador de projetos, com quebra responsiva em telas menores.
- Apenas apresentação: sem alterações de banco, RLS, permissões ou lógica de SLA.
