# GP Transdata

Crie um sistema web responsivo para gestão de projetos empresariais com as seguintes características:

🎯 Objetivo

Desenvolver um portal interno para gerenciamento de projetos da empresa, com estrutura organizada, visual profissional e possibilidade de expansão futura.

🖥️ Estrutura da Tela Inicial

A tela principal deve conter 3 quadrantes (cards grandes e clicáveis):

PROJETOS

IMPLANTAÇÃO

ACERVO TÉCNICO

Cada card deve conter:

Ícone representativo

Título

Pequena descrição

Indicador numérico (quando aplicável)

📁 MÓDULO 1 — PROJETOS

Ao clicar em PROJETOS, exibir duas opções:

Cadastrar Novo Projeto

Visualizar Projetos Existentes

➕ Cadastrar Novo Projeto

Criar formulário com os seguintes campos:

Dados Gerais

Nome da Empresa (campo texto)

Cidade (campo texto)

Estado (dropdown)

Data da contratação (date picker)

Data do D-zero (date picker)

Data do Handover (date picker)

Equipe

Executivo de Vendas (dropdown)

Gerente de Projetos (dropdown)

Comercial / Escopo

Produtos contratados (campo multi-seleção)

Todos os campos devem ser salvos em banco de dados.

Adicionar:

Campo de Status (Planejamento, Implantação, Encerrado, Suspenso)

Botão Salvar

Botão Cancelar

📊 Visualizar Projetos Existentes

Criar uma visualização em formato de tabela com:

Filtros:

Gerente de Projetos

Executivo de Vendas

Estado

Status

Período por Data de contratação

Colunas da Tabela:

Nome da Empresa

Cidade/Estado

Gerente de Projetos

Executivo de Vendas

Data D-zero

Data Handover

Status

Produtos contratados

Permitir:

Ordenação por coluna

Pesquisa por texto

Clique no projeto para abrir página de detalhes

📄 Tela de Detalhamento do Projeto

Ao clicar em um projeto, exibir:

Todos os dados cadastrados

Linha do tempo do projeto

Histórico de alterações

Botão Editar

Área para anexos

🚧 MÓDULO 2 — IMPLANTAÇÃO

Por enquanto exibir apenas:

"Módulo em construção. Em breve disponível."

Estrutura preparada para futura implementação de:

Kanban por fases

Controle de marcos

Indicadores de progresso

📚 MÓDULO 3 — ACERVO TÉCNICO

Por enquanto exibir apenas:

"Módulo em construção. Em breve disponível."

Preparar estrutura para:

Upload de documentos

Organização por produto

Controle de versões

Base de conhecimento

⚙️ Requisitos Técnicos

Sistema web responsivo

Banco de dados estruturado

Arquitetura escalável

Controle de usuários e permissões

Interface moderna e limpa

Preparado para crescimento futuro

🎨 Layout

Design profissional

Visual corporativo

Uso de cards

Menu lateral fixo

Dashboard com indicadores

Experiência simples e intuitiva

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://projetostransdata.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dc435e83-1e07-424d-952c-a66e45a342c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
