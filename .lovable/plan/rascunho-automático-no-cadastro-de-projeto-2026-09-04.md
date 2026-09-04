# Rascunho automático no cadastro de projeto

## Objetivo
Evitar retrabalho: se a pessoa preencher o formulário de "Cadastrar novo projeto" e sair da tela (ou fechar o navegador por engano), ao voltar os dados continuam lá.

## Como vai funcionar
1. Enquanto o formulário é preenchido, tudo o que foi digitado/selecionado é guardado automaticamente no próprio navegador (a cada poucos segundos, sem botão de salvar).
2. Ao abrir novamente a tela de cadastro, aparece um aviso no topo: "Encontramos um cadastro não finalizado de <data/hora>" com dois botões: **Restaurar** e **Descartar**.
3. Escolhendo Restaurar, todos os campos voltam preenchidos (empresa, país/cidade/UF, datas, executivo, gerente, tipo, seguimento, soluções, integrações, equipamentos e quantidades, frota, piloto, treinamento, link da Pasta do Projeto etc.).
4. Ao salvar o projeto com sucesso, ou ao clicar em Descartar, o rascunho é apagado.
5. O rascunho fica no navegador de quem preencheu (por usuário) e não é visível para outras pessoas nem enviado ao banco.

## Detalhes técnicos
- Alteração apenas em `src/pages/NewProject.tsx` (mais um pequeno hook auxiliar, ex.: `src/hooks/useFormDraft.ts`). Sem mudanças no banco.
- Persistência em `localStorage` com chave por usuário (`transdata:new-project-draft:<user_id>`), gravação com debounce (~800 ms).
- Datas serializadas em ISO e reconvertidas para `Date` na restauração.
- Não se salva o rascunho quando o formulário está vazio; o rascunho é limpo em `handleSubmit` após sucesso.
- Listas de apoio (executivos, gerentes, produtos etc.) continuam vindo do banco; o rascunho guarda só os valores escolhidos.
