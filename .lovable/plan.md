

## Plano: Adicionar botão "Adicionar Projeto" na tela de Projetos Existentes

### O que será feito
Adicionar um botão "Adicionar Projeto" no canto superior direito da página de listagem de projetos (ao lado do título "Projetos Existentes"), conforme indicado na imagem. O botão será um atalho para a tela de cadastro já existente (`/projetos/novo`).

### Implementação

**Arquivo: `src/pages/ProjectList.tsx`**
- Ajustar o layout do título para usar `flex` com `justify-between`, posicionando o título à esquerda e o botão à direita.
- Adicionar um `Button` com ícone `Plus` que navega para `/projetos/novo`.

Estrutura resultante:
```text
← Voltar
[Projetos Existentes]                    [+ Adicionar Projeto]
[Buscar...] [Status] [Estado] [Gerente] [Executivo]
```

