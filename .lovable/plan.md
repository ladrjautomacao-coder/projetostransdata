## Mudanças solicitadas

### 1. Bloquear caracteres especiais no campo "Cidade"
- Em `src/pages/NewProject.tsx` e `src/pages/ProjectDetail.tsx`, alterar o `onChange` do input de Cidade para sanitizar em tempo real, permitindo apenas: letras (incluindo acentuadas), espaços, hífen e apóstrofo (ex.: "Mogi das Cruzes", "Embu-Guaçu", "Santa Bárbara d'Oeste").
- Regex aplicada: `/[^A-Za-zÀ-ÿ\s'-]/g` → removidos no momento da digitação.
- Sem mudança de schema; validação puramente client-side.

### 2. Popular "Tipo do Projeto" com as 6 opções fixas
Inserir via dados (não schema) na tabela `project_types` os registros abaixo, mantendo eles ativos. Antes de inserir, desativar (`active = false`) os tipos existentes que não estão na lista, para o select exibir somente os corretos:

- Implantação Data Center (DAT)
- Implantação Locação (PIL)
- Implantação Piloto (PIP)
- Implantação Venda (PIV)
- Venda Complementar (VCP)
- Serviços (SER)

A tela de cadastro já lê `project_types` dinamicamente, então nenhuma alteração de código é necessária para o select.

### 3. Novo campo "Projeto Executivo" (data)
- **Migração** adicionando coluna `executive_project_date date` (nullable) em `public.projects`.
- **Cadastro** (`src/pages/NewProject.tsx`): adicionar estado `executiveProjectDate` e renderizar um `<DatePicker label="Projeto Executivo" .../>` na seção "Projeto", seguindo o padrão visual dos demais campos de data (mesmo componente Popover/Calendar já usado). Incluir o valor no `insert` enviado ao Supabase.
- **Detalhe/edição** (`src/pages/ProjectDetail.tsx`): carregar o campo, exibir/editar com o mesmo `DatePicker`, incluir no `update` e no diff de histórico ("Projeto Executivo").
- Campo opcional — sem validação obrigatória.

## Detalhes técnicos

Sanitização da cidade (helper inline):
```ts
const sanitizeCity = (v: string) => v.replace(/[^A-Za-zÀ-ÿ\s'-]/g, "");
// <Input value={city} onChange={e => setCity(sanitizeCity(e.target.value))} ... />
```

Migração SQL:
```sql
ALTER TABLE public.projects
  ADD COLUMN executive_project_date date;
```

Seed dos tipos de projeto (via tool de dados): desativar os atuais fora da lista e fazer upsert por `name` dos 6 itens com `active = true`.
