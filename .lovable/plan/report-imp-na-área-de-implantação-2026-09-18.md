# Report IMP na área de Implantação

## Resultado esperado

- Adicionar **Report IMP** logo abaixo de **Implantação** no menu lateral.
- Permitir ao Analista de Implantação pesquisar e selecionar qualquer projeto disponível no sistema.
- Permitir o envio de arquivos de qualquer formato, vinculados ao projeto escolhido.
- Exibir os arquivos já enviados com nome, projeto, autor, data, tamanho e ação para baixar.
- Permitir que cada analista exclua somente os próprios arquivos; administradores poderão excluir qualquer arquivo.

## Tela Report IMP

- Criar a página `/implantacao/report-imp`, seguindo o visual atual do PAINEL 360.
- Incluir busca e seleção de projeto, área de upload, progresso do envio e mensagens claras de sucesso ou erro.
- Exibir uma lista dos arquivos do projeto selecionado, com download por link temporário seguro.
- Atualizar a lista imediatamente após enviar ou excluir um arquivo.
- Considerar limite de 100 MB por arquivo, mantendo o padrão já adotado para documentos do sistema.

## Acesso e permissões

- Criar a permissão independente **Report IMP**, visível na matriz de Admin → Permissões, com ações de visualizar e enviar/gerenciar.
- Liberar essa permissão inicialmente para a área **Implantação** e para administradores.
- Proteger tanto o item do menu quanto o acesso direto à página.
- O Analista de Implantação poderá visualizar todos os projetos, conforme definido.

## Arquivos e segurança

- Criar um espaço privado exclusivo para os arquivos do Report IMP, separado dos anexos comuns dos projetos.
- Registrar no banco o projeto, caminho do arquivo, nome original, tipo, tamanho, autor e data do envio.
- Exigir usuário autenticado e preencher o autor com a identidade da sessão, sem aceitar um autor informado pela tela.
- Aplicar regras no banco e no armazenamento para:
  - visualizar e baixar arquivos apenas com permissão de Report IMP;
  - enviar arquivos somente com permissão de gerenciamento;
  - excluir apenas arquivos próprios, exceto administradores;
  - impedir troca de projeto, autor ou caminho após o registro.

## Implementação técnica

- Atualizar o cadastro central de módulos e ações de permissão.
- Atualizar o menu lateral e registrar a nova rota protegida.
- Criar a página e os componentes de seleção, upload e listagem.
- Criar uma tabela dedicada para os metadados, com `GRANT`, RLS e índices por projeto/data no mesmo migration.
- Criar um bucket privado dedicado e políticas equivalentes em `storage.objects`.
- Atualizar os tipos gerados do banco após a migration.
- Atualizar o preset da área Implantação sem alterar as demais permissões já configuradas.

## Validação

- Confirmar que um Analista de Implantação vê todos os projetos e consegue enviar, baixar e excluir um arquivo próprio.
- Confirmar que esse analista não consegue excluir arquivo enviado por outra pessoa.
- Confirmar que administradores conseguem visualizar e excluir qualquer arquivo.
- Confirmar que usuários sem a permissão não veem o menu e não acessam a página, os registros ou os arquivos por URL direta.
- Verificar o funcionamento em desktop e celular, incluindo progresso, nomes longos e estados vazios.
