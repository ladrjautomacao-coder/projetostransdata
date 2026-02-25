import { Card, CardContent } from "@/components/ui/card";
import { HardHat, Columns3, Flag, BarChart3 } from "lucide-react";

export default function Implantacao() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Implantação</h1>
      <p className="text-muted-foreground mb-8">Módulo em construção. Em breve disponível.</p>
      <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
        {[
          { icon: Columns3, label: "Kanban por fases" },
          { icon: Flag, label: "Controle de marcos" },
          { icon: BarChart3, label: "Indicadores de progresso" },
        ].map(item => (
          <Card key={item.label} className="opacity-60">
            <CardContent className="flex flex-col items-center text-center p-6 gap-2">
              <item.icon className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
