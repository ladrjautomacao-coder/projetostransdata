
# Configurações do Sistema — Inventário + Plano

## Parte 1 — Inventário de tudo que existe hoje

Mapeei **14 categorias** de regras, SLAs, enums, validações e parâmetros visuais. Resumo executivo abaixo (lista completa com `arquivo:linha` está consolidada e pronta para virar documentação).

### 1. SLAs e thresholds (HOJE 100% hardcoded)

| Regra | Valor atual | Onde |
|---|---|---|
| Heat map Kanban — Verde | ≤ 7 dias sem atualização | `KanbanCard.tsx` |
| Heat map Kanban — Amarelo | 8–15 dias | `KanbanCard.tsx` |
| Heat map Kanban — Laranja | 16–30 dias | `KanbanCard.tsx` |
| Heat map Kanban — Vermelho | > 30 dias | `KanbanCard.tsx` |
| Alerta "D-zero vencendo" | janela ≤ 7 dias | `AlertsBell.tsx` |
| Alerta "Parado" | > 30 dias sem `updated_at` | `AlertsBell.tsx` |
| KPI "Críticos" no AI | > 30 dias (duplicado) | `project-assistant` |
| Polling da central de alertas | 60 s | `AlertsBell.tsx` |

### 2. Kanban — fases, sub-fases e regras
- 5 fases fixas (enum DB): `comercial`, `planejamento`, `implantacao`, `encerrado`, `suspenso`.
- Sub-fases hardcoded: 5 em Comercial, 6 em Planejamento, 3 em Suspenso. **Implantação e Encerrado sem sub-fases.**
- Regra `reached_implemented`: card que passou por Encerrado mantém esse status para Dashboard mesmo se voltar.
- Movimentação: admin move tudo; gerente só move se `manager_id` for seu; demais leitura.
- Cores das colunas e dos badges SLA fixas em Tailwind.

### 3. Central de alertas — 4 categorias fixas
`returned`, `dzero (≤7d)`, `stuck (>30d)`, `no_manager`. Limite de 8 itens visíveis por categoria.

### 4. Enums de banco (imutáveis sem migration)
- `project_status` (5 valores)
- `app_role`: `admin`, `super_admin`, `user`
- `brazilian_state`: 27 siglas
- Categorias de anexo (hardcoded no front): `contrato`, `proposta`, `ata`, `outros`
- Roles de equipe (front): só `executivo_vendas` e `gerente_projetos`

### 5. Catálogos
| Catálogo | Tabela | Tem tela admin? |
|---|---|---|
| Soluções | `solutions` | ✅ |
| Produtos | `products` | ✅ |
| Equipe | `team_members` | ✅ |
| Usuários/roles | `user_roles` | ✅ |
| **Features de solução** | `solution_features` | ❌ só via DB |
| **Tipos de projeto** | `project_types` | ❌ só via DB |
| **Integrações** | `integrations` | ❌ só via DB |
| **Tipos de equipamento** | `equipment_types` | ❌ só via DB |

### 6. RBAC — pontos de verificação
9 lugares checam papéis (rotas admin, botões "Novo Projeto", "Kanban", delete, edit, command palette, sidebar, AI assistant exige `super_admin`, promoção a super_admin).

### 7. Validações de campo (formulários)
Limites maxLength e min em ~15 campos (nome empresa 200, cidade 100/regex, frota ≥1, info piloto 2000, observações Kanban 500, notas sem limite, etc.). Calendar entre 2015–2035.

### 8. Dashboard
- 4 KPIs fixos, 6 gráficos fixos.
- Ordem dos gráficos **já é personalizável** (drag-and-drop, `localStorage`).
- Cores dos gráficos: 5 cores de status + 8 cores de produto, hardcoded.
- Top estados limitado a 10.

### 9. AI Assistant
- Modelo `google/gemini-3-flash-preview`, exige `super_admin`.
- Limites: 15 projetos por busca, 5–20 notas, 50 steps.
- **Bug pendente:** o prompt menciona fases `execucao` e `homologacao` que não existem no banco.

### 10. Identidade visual
Cores, fontes (Rajdhani / Space Grotesk), efeitos glow, grid tech, animações — todos em `index.css`.

### 11. Storage
- Bucket `project-attachments`: sem limite de upload no front; URL assinada 60s (preview) / 300s (download).
- Bucket `manuals`: público.

### 12. Outros parâmetros mágicos
Toast 1.000.000 ms, durações de animação, larguras de popover, etc.

---

## Parte 2 — Proposta: o que vira configurável

Para comercialização, sugiro **3 níveis**:

### Nível A — Tela "Configurações" (admin, edita pela UI) 🔴 PRIORITÁRIO
Itens de alto impacto operacional, valores simples:

1. **SLA do Kanban** — 3 sliders (verde→amarelo, amarelo→laranja, laranja→vermelho).
2. **Alerta D-zero** — janela em dias (default 7).
3. **Alerta "parado"** — dias sem atualização (default 30).
4. **Polling da central de alertas** — segundos (default 60).
5. **Categorias de anexo** — CRUD simples.
6. **Roles de equipe** — CRUD (hoje só 2 fixos).
7. **Expiração das URLs de anexo** — preview / download.
8. **Validações de formulário** — limites de caracteres de campos-chave.

### Nível B — Novas telas de catálogo (admin) 🟠 RÁPIDO
Tabelas que já existem mas não têm UI:

9. **Tipos de projeto** (CRUD)
10. **Integrações** (CRUD)
11. **Tipos de equipamento** (CRUD)
12. **Features de solução** (CRUD vinculado à solução)

### Nível C — Customização por cliente (white-label) 🟡 ESTRATÉGICO
Para vender o sistema a outras empresas:

13. **Identidade visual** — primary, accent, sidebar (HSL), logo, nome do produto.
14. **Sub-fases do Kanban** — labels e ordem por fase (precisa virar tabela `kanban_subphases`).
15. **Dashboard** — quais KPIs/gráficos exibir.

### Nível D — Mantém hardcoded (não vale o esforço)
- Enums de banco (`project_status`, `app_role`, `brazilian_state`).
- Cores dos gráficos.
- Limites internos do AI (steps, busca).
- Durações de animação.
- Regra `reached_implemented` (regra de negócio crítica, não parâmetro).
- Matriz RBAC (segurança).

---

## Parte 3 — Arquitetura proposta (técnica)

```text
Tabela única: public.app_settings
  ├── key         text PK         ex: "sla.kanban.green_max_days"
  ├── value       jsonb           ex: 7 ou {"r":124,"g":58,...}
  ├── category    text            "sla" | "alerts" | "branding" | "validation"
  ├── label       text            "SLA Verde (dias)"
  ├── description text
  ├── updated_by  uuid
  └── updated_at  timestamptz

+ função  public.get_setting(key, default)  SECURITY DEFINER
+ hook    useSettings()  carrega tudo 1x e cacheia
+ tela    /admin/configuracoes  agrupada por category
+ RLS     SELECT autenticado, UPDATE admin
```

Vantagens:
- Uma tabela cobre tudo (escalável).
- Frontend lê via hook único.
- Defaults no código garantem fallback se a chave não existir.

Catálogos do Nível B ficam em suas próprias tabelas (já existem) — só faltam telas CRUD.

---

## Próximo passo

Me confirme:

1. **Quais níveis (A, B, C) vamos atacar agora?** Sugiro começar por **A + B** (impacto imediato + telas que faltam) e deixar **C (white-label)** para uma onda seguinte.
2. **Algum item da lista A que você quer remover ou adicionar?**
3. **White-label (nível C) é prioridade comercial agora ou pode esperar?**

Quando aprovar, gero o plano de implementação detalhado por onda.
