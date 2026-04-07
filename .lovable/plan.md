

## Plano: Flag "Venda Complementar" + Frota Complementar

### O que sera feito

Adicionar dois novos campos logo abaixo da secao "Instalacao Embarcada":
1. **Flag "Venda Complementar"** - Switch (ligado/desligado)
2. **Frota Complementar** - Campo numerico para informar a quantidade de veiculos da venda complementar (visivel somente quando a flag estiver ativada)

### Alteracoes

**1. Migracao de banco de dados**
- Adicionar coluna `complementary_sale` (boolean, default false) na tabela `projects`
- Adicionar coluna `complementary_fleet` (integer, default 0) na tabela `projects`

**2. NewProject.tsx**
- Adicionar estados `complementarySale` e `complementaryFleet`
- Renderizar novo Card abaixo de "Instalacao Embarcada" com Switch + campo numerico condicional
- Incluir ambos os campos no payload de insert

**3. ProjectDetail.tsx**
- Carregar os dois novos campos do projeto
- Modo edicao: Switch + Input numerico condicional
- Modo visualizacao: exibir badge Sim/Nao + valor da frota quando aplicavel
- Incluir no payload de update

### Layout visual

```text
┌─ Instalação Embarcada ──────────────┐
│  Transmobile: [0]                    │
│  Cliente: [0]                        │
└──────────────────────────────────────┘

┌─ Venda Complementar ────────────────┐
│  Indica se o projeto possui          │
│  venda complementar                  │
│                                      │
│  [●====] Sim                         │
│                                      │
│  Frota Complementar                  │
│  [15]                                │
└──────────────────────────────────────┘
```

### Arquivos alterados
- Nova migracao SQL (2 colunas)
- `src/pages/NewProject.tsx`
- `src/pages/ProjectDetail.tsx`

