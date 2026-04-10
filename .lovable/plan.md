

## Plano: Campo "Frota Total" e ajuste do Dashboard

### Alterações

**1. `src/pages/ProjectDetail.tsx`**
- Na seção "Venda Complementar", entre "Frota Complementar" e "Frota Implementada", adicionar um campo somente leitura "Frota Total" que exibe `fleet_size + complementary_fleet`
- Em modo edição: campo calculado automaticamente (read-only input com fundo cinza)
- Em modo visualização: exibir o valor calculado

**2. `src/pages/Dashboard.tsx`**
- A lógica de `fleetByStatus` já está correta: distribui `implemented_fleet` para "encerrado" e o restante para o status atual do card
- Ajustar para que a lógica se aplique a **todos** projetos com `implemented_fleet > 0`, não apenas quando `complementary_sale` é true (caso o campo seja preenchido independente da flag)
- Verificar que quando o projeto está no status "encerrado" e tem `implemented_fleet`, não duplique a contagem

### Resultado
- Novo campo visual "Frota Total" entre Frota Complementar e Frota Implementada
- Dashboard distribui corretamente: frota implementada → "Implementado", restante → status atual do card

