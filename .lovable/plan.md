## Reorganização da Sidebar em Módulos

Alterar `src/components/AppSidebar.tsx` para agrupar os itens do menu principal em dois módulos nomeados, mantendo o grupo "Administração" existente inalterado.

### Nova estrutura

```text
MÓDULO PROJETOS
  • Dashboard        → /
  • Projetos         → /projetos

MÓDULO IMPLANTAÇÃO
  • Implantação      → /implantacao

ADMINISTRAÇÃO (inalterado)
  • Equipe / Usuários / Configurações / Manual
```

### Alterações técnicas

- Remover o array único `mainItems` e o grupo "Principal".
- Criar dois novos `SidebarGroup`s com `SidebarGroupLabel`:
  - "Módulo Projetos" contendo Dashboard e Projetos.
  - "Módulo Implantação" contendo Implantação.
- Manter o mesmo estilo visual dos labels (ícone `Signal`, uppercase, tracking) e os `NavLink` com `activeClassName` já usados.
- Nenhuma rota, ícone ou permissão é alterada — apenas o agrupamento visual e os rótulos das seções.

### Observações

- Se no futuro houver novas telas de implantação (ex.: cronograma, checklist), elas entram no módulo Implantação sem novas alterações estruturais.
- Nenhuma outra tela, rota ou lógica de negócio será tocada.
