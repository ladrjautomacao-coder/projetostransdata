import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPORTE_URL = "https://central-itstransdata.lovable.app/auth";

export default function Suporte() {
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div>
          <h1 className="text-lg font-semibold">Suporte Técnico</h1>
          <p className="text-xs text-muted-foreground">Central Transdata</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={SUPORTE_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </a>
        </Button>
      </div>
      <iframe
        src={SUPORTE_URL}
        title="Central de Suporte Técnico"
        className="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
