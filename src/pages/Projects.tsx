import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, List } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Projetos</h1>
      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
        <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate("/projetos/novo")}>
          <CardContent className="flex flex-col items-center text-center p-8 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold">Cadastrar Novo Projeto</h2>
            <p className="text-sm text-muted-foreground">Crie um novo projeto no sistema</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all" onClick={() => navigate("/projetos/lista")}>
          <CardContent className="flex flex-col items-center text-center p-8 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <List className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold">Visualizar Projetos</h2>
            <p className="text-sm text-muted-foreground">Veja e gerencie os projetos existentes</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
