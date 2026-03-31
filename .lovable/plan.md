

## Plano: Adicionar seção "Instalação Embarcada" no cadastro de projeto

### Contexto
Adicionar um novo card/seção logo abaixo do card "Piloto" na página de novo projeto. O objetivo é registrar quantas instalações foram feitas pela Transmobile e quantas pelo Cliente, permitindo controle de cobrança.

### O que será feito

**1. Migração de banco de dados**
Adicionar 2 novas colunas na tabela `projects`:
- `installation_transmobile` (integer, default 0) — quantidade de instalações feitas pela Transmobile
- `installation_client` (integer, default 0) — quantidade de instalações feitas pelo Cliente

**2. Atualizar formulário `src/pages/NewProject.tsx`**
Adicionar um novo card "Instalação Embarcada" logo abaixo do card "Piloto" com:
- Duas linhas, cada uma com um label e um campo numérico editável:
  - **Transmobile** — input numérico (min 0)
  - **Cliente** — input numérico (min 0)
- Texto auxiliar explicando que os valores representam a quantidade de instalações realizadas por cada parte

**3. Atualizar `src/pages/ProjectDetail.tsx`**
Exibir os campos de instalação embarcada na visualização/edição do projeto, mantendo o mesmo layout.

### Layout visual

```text
┌─────────────────────────────────────────┐
│ Instalação Embarcada                    │
│ Quantidade de instalações por responsável│
│                                         │
│  Transmobile   [ 0        ]             │
│  Cliente       [ 0        ]             │
└─────────────────────────────────────────┘
```

### Arquivos alterados
- **Migração SQL** — adicionar colunas `installation_transmobile` e `installation_client`
- `src/pages/NewProject.tsx` — novo card + estados + inclusão no insert
- `src/pages/ProjectDetail.tsx` — exibir/editar os novos campos

