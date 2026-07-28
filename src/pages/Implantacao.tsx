import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMPLANTACAO_URL = "https://psm-agendamento-web-production.up.railway.app/login";

export default function Implantacao() {
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div>
          <h1 className="text-lg font-semibold">Implantação</h1>
          <p className="text-xs text-muted-foreground">Portal PSM Agendamento</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={IMPLANTACAO_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </a>
        </Button>
      </div>
      <iframe
        src={IMPLANTACAO_URL}
        title="Portal de Implantação"
        className="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
