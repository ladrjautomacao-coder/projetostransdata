

## Plano: Corrigir frota exibida no drill-down "Frota por Status"

### Problema
Ao expandir um status no drill-down (ex: Comercial), a coluna "Frota" mostra `getProjectFleet(p)` — ou seja, a frota total (contratada + complementar). Deveria exibir apenas o saldo restante (`total - implemented_fleet`), pois a parte implementada já está contabilizada no quadrante "Implementado".

### Alteração

**`src/pages/Dashboard.tsx`**

1. **Linha ~760 — filtro do drill-down**: Além de filtrar por `p.status === selectedFleetStatus`, incluir projetos que tenham `implemented_fleet > 0` quando `selectedFleetStatus === "encerrado"` (mesmo que o card não esteja nesse status)

2. **Linha ~811 — valor exibido na coluna Frota**: Criar uma função auxiliar que retorna a frota ajustada por status:
   - Se o status selecionado é o status atual do projeto e `implemented_fleet > 0`: mostrar `totalFleet - implemented_fleet`
   - Se o status selecionado é "encerrado" e o projeto tem `implemented_fleet > 0`: mostrar `implemented_fleet`
   - Caso contrário: mostrar `getProjectFleet(p)` normalmente

3. **Contagem de projetos no badge**: Atualizar para refletir a lista correta de projetos

### Lógica resumida
```text
getFleetForStatus(project, selectedStatus):
  total = fleet_size + complementary_fleet
  impl  = implemented_fleet

  if selectedStatus == "encerrado":
    return impl                    // só a parte implementada
  else if impl > 0:
    return total - impl            // saldo restante
  else:
    return total
```

### Resultado
- Drill-down "Comercial" mostrará 15 (não 37) para o Atlântico Salvador
- Drill-down "Implementado" incluirá os 22 implementados desse projeto
- Os totais por status no drill-down ficarão consistentes com os números dos cards

### Arquivo alterado
- `src/pages/Dashboard.tsx`

