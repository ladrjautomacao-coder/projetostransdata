

# Plano: Melhorar o Histórico de Alterações do Projeto

## Problema Atual
O histórico exibe dados brutos em JSON (ex: `{"city":"Campinas","state":"SP",...}`), sem identificar quem fez a alteração e sem detalhar o que mudou de forma legível.

## Solução Proposta

### 1. Melhorar os dados salvos no histórico (handleSave)
Atualmente o `old_values` e `new_values` salvam apenas alguns campos. Vamos:
- Comparar **todos os campos editáveis** (empresa, cidade, estado, status, tipo de projeto, frota, prazos, piloto, soluções, datas, equipe)
- Salvar apenas os campos que **realmente mudaram**, com valor anterior e novo
- Incluir **nomes legíveis** (ex: nome do gerente, nome do tipo de projeto) em vez de UUIDs

### 2. Buscar o nome de quem alterou
Na query do histórico, fazer join com a tabela `profiles` usando o campo `changed_by` para exibir o nome do usuário que fez a alteração.

### 3. Renderização humanizada do log
Criar um componente de renderização que:
- Exibe o **nome do usuário** que alterou
- Mostra cada campo alterado em formato: `Campo: valor anterior → novo valor`
- Traduz nomes de campos para português (ex: `company_name` → "Empresa")
- Usa ícones visuais diferenciados para "Criado" vs "Atualizado"
- Formata datas em PT-BR

### Detalhes Técnicos

**Mapeamento de labels dos campos:**
```text
company_name    → Empresa
city            → Cidade
state           → Estado
status          → Status
project_type    → Tipo de Projeto
fleet_size      → Frota Contratada
impl_deadline   → Prazo Implantação
contract_deadline → Prazo Contratual
is_pilot        → Piloto
executive       → Gerente Comercial
manager         → Gestor de Projetos
solutions       → Soluções
contract_date   → Data do Contrato
d_zero_date     → Data D-Zero
handover_date   → Data de Entrega
```

**Arquivos modificados:**
- `src/pages/ProjectDetail.tsx`:
  - Query do histórico com join em `profiles` para buscar `changed_by` → nome
  - Lógica do `handleSave` para comparar campo a campo e salvar diff granular
  - Nova renderização do histórico com cards legíveis mostrando: usuário, data, e lista de mudanças campo a campo

**Formato do log salvo (new_values/old_values):**
```json
{
  "changes": [
    { "field": "Empresa", "from": "Empresa A", "to": "Empresa B" },
    { "field": "Status", "from": "Planejamento", "to": "Implantação" },
    { "field": "Frota Contratada", "from": "50", "to": "80" }
  ]
}
```

**Visualização final:**
```text
┌─────────────────────────────────────────────────┐
│ 🟢 Atualizado · 25/02/2026 16:47               │
│ Por: João Silva                                 │
│                                                 │
│  Empresa: Empresa Antiga → Empresa Nova         │
│  Status: Planejamento → Implantação             │
│  Frota Contratada: 50 → 80                      │
├─────────────────────────────────────────────────┤
│ 🔵 Criado · 25/02/2026 14:48                   │
│ Por: Maria Souza                                │
│                                                 │
│  Projeto cadastrado com os dados iniciais       │
└─────────────────────────────────────────────────┘
```

Nenhuma alteração de banco de dados é necessária — a estrutura da tabela `project_history` já suporta `old_values` e `new_values` como JSONB.

