import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const FINANCEIRO_URL = "https://to-do.microsoft.com/sharing?InvitationToken=cbYLmgc7BOYrhvapwakVBQnuMVQsw5cwUNYLozx5XLD2YvKaWS_X-GgYNerpbBLfA";

export default function Financeiro() {
  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div>
          <h1 className="text-lg font-semibold">Financeiro</h1>
          <p className="text-xs text-muted-foreground">Data Studio Transdata</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={FINANCEIRO_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </a>
        </Button>
      </div>
      <iframe
        src={FINANCEIRO_URL}
        title="Módulo Financeiro"
        className="flex-1 w-full border-0"
        allow="clipboard-read; clipboard-write; fullscreen"
      />
    </div>
  );
}
