# Campo "Treinamento de instalação embarcada"

## O que será feito

- Novo campo no cadastro de projetos indicando se houve **treinamento de instalação embarcada** ou se a implantação foi **sem treinamento**.
- Formato: seleção com duas opções — "Com treinamento de instalação embarcada" e "Sem treinamento de instalação embarcada". Por padrão vem em branco (obrigatório escolher antes de salvar? ver observação abaixo).
- Aparece na tela de **Cadastrar novo projeto** e na tela de **detalhe do projeto** (visualização e edição), no mesmo bloco onde hoje fica "Piloto".
- A troca desse campo entra no **histórico de alterações** do projeto, como os demais campos.
- Projetos já existentes ficam sem informação até que alguém edite e escolha uma das opções.

## Observação

O campo será opcional no salvamento (para não travar a edição dos projetos antigos). Se preferir torná-lo obrigatório no cadastro de novos projetos, é só avisar.

## Detalhes técnicos

- Migração: adicionar `projects.embedded_install_training boolean` (nulo permitido).
- Front-end: incluir o controle em `src/pages/NewProject.tsx` (bloco "Piloto") e em `src/pages/ProjectDetail.tsx` (edição + exibição), adicionando o rótulo no mapa de nomes de campos usado pelo histórico (`is_pilot`/`pilot_info` já estão lá).
- Nenhuma alteração em Kanban, filtros ou relatórios nesta etapa.
