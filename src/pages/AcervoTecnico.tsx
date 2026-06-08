import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AcervoTecnico() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full border-accent/40">
        <CardContent className="flex flex-col items-center text-center p-10 gap-4">
          <div className="rounded-full bg-accent/10 p-4">
            <Construction className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">Em construção</h1>
          <p className="text-muted-foreground">
            O Acervo Técnico está em desenvolvimento e estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
