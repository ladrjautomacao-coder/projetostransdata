import { Card, CardContent } from "@/components/ui/card";
import { Upload, FolderTree, GitBranch, BookOpen } from "lucide-react";

export default function AcervoTecnico() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Acervo Técnico</h1>
      <p className="text-muted-foreground mb-8">Módulo em construção. Em breve disponível.</p>
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
        {[
          { icon: Upload, label: "Upload de documentos" },
          { icon: FolderTree, label: "Organização por produto" },
          { icon: GitBranch, label: "Controle de versões" },
          { icon: BookOpen, label: "Base de conhecimento" },
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
