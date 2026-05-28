## Objetivo
Quando o usuário clicar no sino de alertas (badge vermelho com número), os alertas atuais devem ser marcados como "vistos" e o badge deve sumir, parando de alertar até que novos alertas surjam.

## Comportamento proposto
- Ao abrir o popover do sino, registrar localmente (localStorage por usuário) os IDs dos alertas atualmente exibidos como "vistos".
- O badge vermelho com contador só conta alertas que ainda NÃO foram vistos.
- Se novos projetos entrarem em estado de alerta depois (ex: novo D-zero vencendo, novo retorno de Implementado), o badge volta a aparecer apenas para esses novos.
- A lista dentro do popover continua mostrando todos os alertas ativos (vistos ou não), para que o usuário ainda consiga consultá-los.

## Alterações técnicas
Arquivo: `src/components/AlertsBell.tsx`
- Criar uma chave em `localStorage` por usuário, ex: `alerts:seen:<userId>`, contendo um conjunto de chaves `"${categoria}:${projectId}"`.
- Computar `unseenTotal` = alertas atuais cuja chave não está no conjunto de vistos. O badge usa `unseenTotal` em vez de `total`.
- No `onOpenChange` do Popover, quando abrir, salvar todas as chaves atuais como vistas e atualizar o estado.
- Limpar do conjunto de vistos as chaves que não estão mais ativas (para evitar crescimento infinito).

Sem mudanças de backend, sem mudanças em outras telas.