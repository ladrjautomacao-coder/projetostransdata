

## Plano: Campo "Integrações" no cadastro e detalhe do projeto

### O que sera feito

Adicionar uma nova seção "Integrações" logo abaixo de "Soluções / Escopo" no formulário de cadastro e na tela de detalhe do projeto. O campo terá checkboxes com as opções fixas:

- CFTV - Plenatech
- Bilhetagem - TRANSDATA
- Monitoramento - Bus2

As integrações selecionadas serão salvas no banco usando o mesmo padrão de `project_solutions` (tabela de junção).

### Alterações

**1. Migração SQL**
- Criar tabela `integrations` (id, name, active, created_at) e inserir os 3 registros
- Criar tabela `project_integrations` (id, project_id, integration_id) com FK para projects e integrations
- Habilitar RLS em ambas as tabelas com políticas para authenticated

**2. `src/pages/NewProject.tsx`**
- Carregar integrações do banco no useEffect
- Adicionar state `selectedIntegrations`
- Renderizar seção "Integrações" com checkboxes logo abaixo do card "Soluções / Escopo"
- Salvar na tabela `project_integrations` ao submeter

**3. `src/pages/ProjectDetail.tsx`**
- Carregar integrações do projeto (project_integrations + integrations)
- Exibir na seção de soluções em modo leitura
- Permitir edição com checkboxes no modo edição
- Registrar alterações no histórico

### Arquivos alterados
- Nova migração SQL (2 tabelas + seed + RLS)
- `src/pages/NewProject.tsx`
- `src/pages/ProjectDetail.tsx`

