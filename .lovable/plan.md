## Objetivo
Criar uma nova aba **"Manual do Sistema"** dentro do grupo **Administração** do menu lateral, acessível a todos usuários autenticados. A página exibirá o PDF do manual inline (leitura no navegador) e oferecerá um botão para download.

## Implementação

### 1. Storage (Lovable Cloud)
- Criar bucket público `manuals` via migração SQL.
- Políticas:
  - Leitura pública (qualquer usuário autenticado consegue ler).
  - Upload/atualização restrita ao role `service_role` (eu subo via tool quando você enviar o PDF).
- Arquivo padrão: `manuals/manual-sistema.pdf`.

### 2. Nova rota e página
- Arquivo: `src/pages/SystemManual.tsx`
- Conteúdo:
  - Cabeçalho com título "Manual do Sistema", ícone `BookOpen` e botão **"Baixar PDF"** (link para a URL pública do Storage com `download` attr).
  - Visualizador inline: `<iframe>` apontando para a URL pública do PDF, altura responsiva (`calc(100vh - 200px)`), borda arredondada e estilo glassmorphism alinhado ao restante do sistema.
  - Mensagem de fallback caso o navegador não consiga renderizar PDF nativamente.

### 3. Roteamento
- Em `src/App.tsx`: adicionar `<Route path="/manual" element={<SystemManual />} />` dentro do `AppLayout` protegido (sem `AdminRoute`, pois é para todos logados).

### 4. Menu lateral
- Em `src/components/AppSidebar.tsx`: adicionar item **"Manual do Sistema"** no grupo **Administração**, com ícone `BookOpen` e rota `/manual`. Aparece para todos usuários (sem checagem `isAdmin`).

### 5. Command Palette
- Em `src/components/CommandPalette.tsx`: adicionar entrada de navegação para `/manual` para busca rápida via Ctrl+K.

### 6. Upload do PDF
- Após sua aprovação do plano e envio do PDF no próximo turno, faço o upload para `manuals/manual-sistema.pdf` no bucket recém-criado.

## Observação técnica
O grupo de Administração no sidebar atualmente é renderizado somente para admins. Para manter o item visível para todos, vou colocar **"Manual do Sistema"** como um item permitido nesse grupo independente do `isAdmin`, ou (alternativa) movê-lo para o grupo principal logo abaixo de Administração. Vou usar a primeira abordagem — o grupo Administração passa a renderizar sempre que houver ao menos um item permitido, e o Manual será o item padrão visível para usuários não-admin.
