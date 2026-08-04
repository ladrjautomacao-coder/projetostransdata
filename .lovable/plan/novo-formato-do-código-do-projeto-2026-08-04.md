# Novo formato do Código do Projeto

## Formato

```text
CRI    SC     VE     NEW    0001   -CRICIUMA
 |      |      |      |      |        |
 |      |      |      |      |        nome da empresa
 |      |      |      |      sequencial global (4 dígitos)
 |      |      |      seguimento do projeto (3 letras)
 |      |      tipo do projeto (2 letras)
 |      estado (UF)
 cidade (3 primeiras letras)
```

Exemplo: `CRISCVENEW0001-CRICIUMA`

Regras:
- Cidade: 3 primeiras letras, sem acento, maiúsculas.
- Estado: sigla UF do projeto.
- Tipo do projeto: sigla de 2 letras (nova, definida por tipo).
- Seguimento: `NEW` (New Project) ou `UPG` (Upgrade de equipamentos).
- Sequencial: contador único global de 4 dígitos, iniciando em 0001.
- Sufixo: nome da empresa normalizado (sem acentos, sem espaços, maiúsculo).

## Siglas de 2 letras por tipo de projeto

Serão adicionadas às opções ativas:

| Tipo | Sigla |
|---|---|
| Venda de equipamentos | VE |
| Alocação de equipamentos (SIGO) | AS |
| Alocação de equipamentos (TRANSDATA) | AT |

Os demais tipos legados recebem uma sigla de 2 letras derivada do código atual, para não quebrar cadastros existentes.

## O que muda na tela

- No cadastro de projeto, o campo **Código do Projeto** continua mostrando o preview em tempo real conforme cidade, estado, tipo e seguimento forem preenchidos (sequencial e sufixo aparecem como estimativa; o valor definitivo é gravado ao salvar).
- Abaixo do campo, a legenda explicativa passa a descrever a nova composição:
  `Formato: Cidade (3) + UF (2) + Tipo (2) + Seguimento (3) + Sequencial (4) - Nome da empresa. Os 4 dígitos sequenciais são atribuídos no momento do cadastro.`
- Mesma exibição/legenda na tela de detalhes do projeto.

## Projetos existentes

Todos os projetos já cadastrados terão o código recalculado no novo formato, ordenados por data de criação (o mais antigo recebe 0001), e o contador global continua a partir do último.

## Detalhes técnicos

- Migration:
  - Adicionar `project_types.short_code` (2 chars) e preencher para todos os tipos.
  - Criar sequência `projects_code_seq_v2` iniciando em 1.
  - Reescrever `generate_project_code(p_city, p_state, p_project_type_id, p_segment, p_company_name)` e `preview_project_code(...)` com a nova composição; adicionar helper de normalização (`norm_text` + remoção de não alfanuméricos).
  - Atualizar o trigger `projects_set_code` para passar `project_segment` e `company_name`.
  - Backfill: `UPDATE` de todos os projetos existentes com o novo código, atribuindo o sequencial por `created_at`, e ajustar a sequência para o próximo valor.
  - `city_codes` deixa de ser usada na geração (mantida como está, sem remoção).
- Frontend:
  - `src/pages/NewProject.tsx`: chamada de `preview_project_code` passando também seguimento e nome da empresa; atualizar texto da legenda.
  - `src/pages/ProjectDetail.tsx`: manter exibição do código (somente leitura) e legenda equivalente onde aplicável.
