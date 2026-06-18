
UPDATE public.app_settings SET label='SLA Verde — até X dias (no prazo)', description=E'Cards de projeto que tiveram alguma atualização nos últimos X dias aparecem com a borda VERDE no Kanban (status "no prazo").\n\n• Padrão recomendado: 6 dias\n• Aplica-se em: Quadro Kanban (cor dos cards)\n• Regra: o valor precisa ser MENOR que o SLA Amarelo.' WHERE key='sla.kanban.green_max_days';

UPDATE public.app_settings SET label='SLA Amarelo — até X dias (atenção)', description=E'Cards sem atualização entre (Verde + 1) e X dias ficam com a borda AMARELA, sinalizando que o projeto começa a ficar parado.\n\n• Padrão recomendado: 15 dias\n• Aplica-se em: Quadro Kanban (cor dos cards)\n• Regra: precisa ser MAIOR que SLA Verde e MENOR que SLA Laranja.' WHERE key='sla.kanban.yellow_max_days';

UPDATE public.app_settings SET label='SLA Laranja — até X dias (atrasado)', description=E'Cards sem atualização entre (Amarelo + 1) e X dias ficam LARANJAS. Acima desse limite, o card fica VERMELHO (crítico).\n\n• Padrão recomendado: 30 dias\n• Aplica-se em: Quadro Kanban (cor dos cards)\n• Regra: precisa ser MAIOR que SLA Amarelo. Define também o ponto em que o card vira vermelho.' WHERE key='sla.kanban.orange_max_days';

UPDATE public.app_settings SET label='Aviso D-zero — janela em dias', description=E'Quantos dias ANTES da data de Go-Live (D-zero) um projeto deve aparecer no sino de alertas como "data de virada se aproximando".\n\n• Padrão recomendado: 7 dias\n• Aplica-se em: Central de alertas (sino no topo)\n• Exemplo: com valor 7, um projeto com D-zero em 5 dias gera alerta; com 10 dias, ainda não.' WHERE key='alerts.dzero_window_days';

UPDATE public.app_settings SET label='Projeto parado — mais de X dias sem atualização', description=E'Projetos que ficaram X dias ou mais sem nenhuma atualização (notas, status, anexos) aparecem como "parados" no sino de alertas.\n\n• Padrão recomendado: 7 dias\n• Aplica-se em: Central de alertas (sino no topo)\n• Não afeta as cores do Kanban (essas usam os SLAs acima).' WHERE key='alerts.stuck_days';

UPDATE public.app_settings SET label='Intervalo de atualização dos alertas (segundos)', description=E'De quanto em quanto tempo o sino de alertas consulta o banco em busca de novos avisos.\n\n• Padrão recomendado: 60 segundos (1 minuto)\n• Mínimo prático: 30 segundos. Valores muito baixos aumentam tráfego e custo.\n• Aplica-se em: Central de alertas (polling automático).' WHERE key='alerts.polling_seconds';

UPDATE public.app_settings SET label='Expiração do link de visualização de anexos (segundos)', description=E'Tempo de vida dos links temporários gerados para PRÉ-VISUALIZAR anexos (abrir no navegador sem baixar).\n\n• Padrão recomendado: 60 segundos\n• Aplica-se em: Aba "Anexos" do projeto, ao clicar em visualizar.\n• Quanto menor, mais seguro (link expira rápido); quanto maior, melhor para navegação lenta.' WHERE key='storage.preview_url_ttl_seconds';

UPDATE public.app_settings SET label='Expiração do link de download de anexos (segundos)', description=E'Tempo de vida dos links temporários gerados para BAIXAR anexos do projeto.\n\n• Padrão recomendado: 300 segundos (5 minutos)\n• Aplica-se em: Aba "Anexos" do projeto, ao clicar em baixar.\n• Após expirar, o usuário precisa clicar novamente para gerar um novo link.' WHERE key='storage.download_url_ttl_seconds';

UPDATE public.app_settings SET label='Tamanho máximo — Nome da empresa (caracteres)', description=E'Limite de caracteres aceitos no campo "Empresa" ao criar/editar um projeto.\n\n• Padrão recomendado: 200 caracteres\n• Aplica-se em: Formulário de novo projeto e edição do projeto.' WHERE key='validation.company_name_max';

UPDATE public.app_settings SET label='Tamanho máximo — Cidade (caracteres)', description=E'Limite de caracteres aceitos no campo "Cidade" ao criar/editar um projeto.\n\n• Padrão recomendado: 100 caracteres\n• Aplica-se em: Formulário de novo projeto e edição do projeto.' WHERE key='validation.city_max';

UPDATE public.app_settings SET label='Tamanho máximo — Informações do piloto (caracteres)', description=E'Limite de caracteres do campo livre "Informações do piloto" no detalhe do projeto.\n\n• Padrão recomendado: 2000 caracteres\n• Aplica-se em: Tela de detalhe do projeto, bloco do piloto.' WHERE key='validation.pilot_info_max';

UPDATE public.app_settings SET label='Tamanho máximo — Observação no card do Kanban (caracteres)', description=E'Limite de caracteres da observação rápida que pode ser escrita direto no card do Kanban.\n\n• Padrão recomendado: 500 caracteres\n• Aplica-se em: Quadro Kanban, campo de observação no card.' WHERE key='validation.kanban_note_max';

UPDATE public.app_settings SET label='Categorias de anexo', description=E'Lista de categorias disponíveis no seletor "Categoria" ao enviar um anexo para o projeto.\n\n• O "Identificador (slug)" é o valor técnico salvo no banco — não deve ser alterado depois que já houver anexos usando-o.\n• O "Rótulo exibido" é o texto mostrado ao usuário.\n• Aplica-se em: upload de anexos e filtros da aba Anexos.' WHERE key='attachment.categories';

UPDATE public.app_settings SET label='Funções da equipe', description=E'Lista de papéis/funções disponíveis ao cadastrar membros da equipe de um projeto.\n\n• O "Identificador (slug)" é salvo no banco — evite renomear depois que estiver em uso.\n• O "Rótulo exibido" é o texto que aparece nos selects e na listagem.\n• Aplica-se em: cadastro e listagem de membros de equipe.' WHERE key='team.roles';
