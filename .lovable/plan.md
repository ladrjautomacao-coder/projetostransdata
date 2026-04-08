

## Plano: Campo "Observações" logo abaixo da Linha do Tempo

### O que sera feito

Adicionar um card "Observações" logo abaixo da Linha do Tempo, com um campo de texto livre para o gerente de projetos registrar o andamento atual do projeto. O campo fica visivel em destaque no topo, acessivel sem scroll.

### Alteracoes

**1. Migracao SQL**
- Adicionar coluna `observations` (tipo `text`, nullable) na tabela `projects`

**2. `src/pages/ProjectDetail.tsx`**
- Adicionar state `observations` para o campo
- Carregar e salvar o campo na query/update existentes
- Registrar alteracoes no historico (buildChanges)
- Renderizar card "Observacoes" entre a Linha do Tempo e o grid de Dados Gerais:

```text
┌─ Linha do Tempo ─────────────────────┐
│  ① Contratação  ② D-zero  ③ Handover │
└──────────────────────────────────────┘

┌─ Observações ────────────────────────┐
│  Texto livre do gerente sobre o      │
│  andamento atual do projeto.         │
│                                      │
│  (em modo edicao: Textarea)          │
│  (em modo leitura: texto exibido)    │
└──────────────────────────────────────┘

┌─ Dados Gerais ──┐ ┌─ Equipe ────────┐
```

- Em modo leitura: exibe o texto ou "Nenhuma observacao registrada"
- Em modo edicao: Textarea com placeholder e limite de 2000 caracteres

### Arquivos alterados
- Nova migracao SQL (1 coluna)
- `src/pages/ProjectDetail.tsx` (state + query + save + render)

