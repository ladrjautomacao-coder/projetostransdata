

## Sistema de Gestão de Projetos Empresariais

### Visão Geral
Portal interno com visual verde/teal moderno, autenticação completa, e três módulos principais: Projetos, Implantação e Acervo Técnico.

---

### 1. Autenticação e Controle de Acesso
- Tela de login com email/senha via Supabase Auth
- Perfis de usuário com nome e avatar
- Tabela de roles (admin, user) para controle de permissões
- Redirecionamento automático para login quando não autenticado
- Tela de reset de senha

### 2. Tema Visual — Verde/Teal Moderno
- Paleta de cores verde/teal com tons de cinza para fundo
- Cards com sombras sutis e bordas arredondadas
- Tipografia limpa e profissional
- Ícones modernos (Lucide)

### 3. Layout Principal
- **Sidebar fixa** à esquerda com navegação entre módulos
- **Header** com nome do usuário logado e botão de logout
- **Tela inicial (Dashboard)** com 3 cards grandes e clicáveis:
  - 🗂️ **Projetos** — "Gerencie os projetos da empresa" + contador de projetos
  - 🚧 **Implantação** — "Acompanhe a implantação dos projetos" + badge "Em breve"
  - 📚 **Acervo Técnico** — "Base de conhecimento e documentos" + badge "Em breve"

### 4. Módulo Projetos

#### 4a. Cadastro de Equipe e Produtos (áreas administrativas)
- Tela para cadastrar **Executivos de Vendas** (nome, email)
- Tela para cadastrar **Gerentes de Projetos** (nome, email)
- Tela para cadastrar **Produtos** (nome, descrição)
- Essas entidades alimentam os dropdowns no formulário de projetos

#### 4b. Cadastrar Novo Projeto
- Formulário dividido em seções:
  - **Dados Gerais**: Nome da Empresa, Cidade, Estado (dropdown com UFs), Data de Contratação, Data D-zero, Data Handover
  - **Equipe**: Executivo de Vendas (dropdown), Gerente de Projetos (dropdown)
  - **Comercial**: Produtos contratados (multi-seleção)
  - **Status**: Planejamento, Implantação, Encerrado, Suspenso
- Botões Salvar e Cancelar
- Validação de campos obrigatórios

#### 4c. Visualizar Projetos Existentes
- Tabela com todas as colunas solicitadas
- Filtros: Gerente, Executivo, Estado, Status, Período de contratação
- Pesquisa por texto livre
- Ordenação por coluna
- Clique na linha para abrir detalhes

#### 4d. Detalhamento do Projeto
- Exibição de todos os dados cadastrados em layout organizado
- Linha do tempo visual do projeto (contratação → D-zero → Handover)
- Histórico de alterações (registrado automaticamente)
- Botão Editar para modificar dados
- Área para anexos de arquivos (usando Supabase Storage)

### 5. Módulo Implantação
- Página com mensagem "Módulo em construção. Em breve disponível."
- Layout preparado para futuro Kanban e indicadores

### 6. Módulo Acervo Técnico
- Página com mensagem "Módulo em construção. Em breve disponível."
- Layout preparado para futuro upload de documentos

### 7. Banco de Dados (Supabase)
- Tabelas: profiles, user_roles, projects, team_members, products, project_products, project_history, project_attachments
- RLS em todas as tabelas
- Triggers para histórico automático de alterações

### 8. Responsividade
- Layout adaptável para desktop, tablet e mobile
- Sidebar colapsável em telas menores
- Tabela com scroll horizontal no mobile

