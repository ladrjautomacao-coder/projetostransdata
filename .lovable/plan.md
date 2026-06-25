
## Objetivo

Adicionar ao cadastro de projetos o campo **Código do Projeto** (ex.: `1PIVARU02289`), gerado automaticamente seguindo a regra de negócio enviada, e popular retroativamente os projetos já existentes.

## Anatomia do código (12 caracteres)

```
1   PIV    ARU    02289
│   │      │      │
│   │      │      └─ Sequencial de 5 dígitos
│   │      └──────── Sigla da cidade (3 letras)
│   └─────────────── Sigla do Tipo de Projeto (3 letras, exceto UPGRADE = 6)
└─────────────────── Constante "1"
```

### Sigla da cidade (regra)
- **1 nome** → 3 primeiras letras (`OLIMPIA → OLI`). Colisão: tenta letras subsequentes (`OLINDA → OLN`).
- **2 nomes** → 1ª letra do 1º nome + 2 primeiras letras do 2º nome (`CAMPINA GRANDE → CGR`, `CAMPO GRANDE → CGA`). Colisão: avança letras do 2º nome.
- **3+ nomes** → 1ª letra de cada um dos 3 primeiros nomes (`NOSSA SENHORA DOS NAVEGANTES → NSN`, `SANTA BÁRBARA D'OESTE → SBO`). Colisão: avança letras dos nomes adicionais.
- Acentos removidos; "DA/DE/DO/DAS/DOS/E/D'" tratados como palavras normais conforme exemplos (mantém SBO incluindo "D'OESTE"). Tudo MAIÚSCULO, sem espaços.

A sigla por cidade fica persistida na primeira vez que é gerada (tabela `city_codes`) e reaproveitada nos próximos projetos da mesma cidade/UF.

### Sigla do Tipo de Projeto
Expandir `project_types` com coluna `code` (text) e popular os 18 tipos:
`DAT, MAN, PIL, PIP, PIV, SUP, VCP, VMS, LIC, SIN, RCL, SER, GEN, INT, INV, SOW, PRO, COR, UPGRADE`.

### Sequencial
**Global**, 5 dígitos, com padding (`00001`…`99999`). Implementado como `SEQUENCE` Postgres (`projects_code_seq`) — atômico, sem corrida em criação simultânea.

## Mudanças no banco

1. `project_types`: adicionar `code text unique not null`. Inserir/atualizar os 18 tipos com seus códigos.
2. `projects`: adicionar `project_code text unique` (nullable até a migração popular).
3. Nova tabela `city_codes (city, state, code)` com `unique(city,state)` e `unique(code)` — guarda a sigla resolvida de cada cidade.
4. `CREATE SEQUENCE projects_code_seq START 1`.
5. Função SECURITY DEFINER `generate_project_code(p_city, p_state, p_type_id) → text`:
   - resolve/insere sigla na `city_codes` (com fallback de colisão);
   - lê `code` em `project_types`;
   - consome `nextval('projects_code_seq')`;
   - monta `'1' || tipo || cidade || lpad(seq::text,5,'0')`.
6. Trigger `BEFORE INSERT` em `projects`: se `project_code` for nulo, chama a função.
7. GRANTS para `authenticated` e `service_role` nas novas tabelas/função.

## Backfill retroativo
Migração roda script que, para cada projeto sem código (ordenado por `created_at`), executa `generate_project_code` e atualiza a linha. Projetos sem `project_type_id` recebem o tipo padrão **PIV** (Implantação Venda) — sinalizado em log para revisão posterior pelo admin.

## Mudanças no frontend

- **`src/pages/NewProject.tsx`**: campo somente-leitura "Código do Projeto" com badge "gerado automaticamente"; exibe **prévia** ao escolher cidade/estado + tipo (chamando RPC `preview_project_code` que calcula sem consumir o sequencial). O código real é atribuído pelo trigger no insert e mostrado na confirmação.
- **`src/pages/ProjectDetail.tsx`** e listagens (`Projects`, `ProjectList`, `Implantacao`, `Kanban`): exibir `project_code` como identificador principal (badge monoespaçado) ao lado do nome da empresa.
- **`CommandPalette.tsx`**: incluir busca por `project_code`.
- **Tipagem**: `src/integrations/supabase/types.ts` é regenerado após a migração.

## Validação

- Testes unitários da função de sigla de cidade (casos OLI/OLN, CGR/CGA, NSN/SBO/SIP/SRP).
- Verificar formato `^1[A-Z]{3,6}[A-Z]{3}\d{5}$` no client antes de exibir.
- `psql` para conferir unicidade após backfill.

## Pontos de atenção

- Edição manual do código não é exposta (evita quebrar unicidade/sequencial); admin pode solicitar ajuste via banco.
- Se cidade for renomeada depois, o código permanece (imutável após criação).
- UPGRADE tem 6 letras → código fica com 15 caracteres em vez de 12. Tratado como exceção válida.
