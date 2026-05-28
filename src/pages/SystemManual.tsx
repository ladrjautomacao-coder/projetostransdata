import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Download, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "manuals";
const FILE_PATH = "manual-sistema.pdf";

export default function SystemManual() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_PATH);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    setPdfUrl(url);

    // check existence
    fetch(url, { method: "HEAD" })
      .then(r => setExists(r.ok))
      .catch(() => setExists(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Manual do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Documentação completa de uso e administração da plataforma.
          </p>
        </div>
        {exists && pdfUrl && (
          <a href={pdfUrl} download="manual-sistema.pdf" target="_blank" rel="noreferrer">
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </a>
        )}
      </div>

      {exists === false ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold">Manual ainda não disponível</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            O arquivo do manual ainda não foi enviado. Ele aparecerá aqui assim que for publicado.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          {pdfUrl && (
            <object
              data={`${pdfUrl}#toolbar=1&navpanes=1&view=FitH`}
              type="application/pdf"
              className="w-full block"
              style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
            >
              <embed
                src={`${pdfUrl}#toolbar=1&navpanes=1&view=FitH`}
                type="application/pdf"
                className="w-full block"
                style={{ height: "calc(100vh - 200px)", minHeight: 500 }}
              />
              <div className="p-8 text-center text-sm text-muted-foreground">
                Seu navegador não conseguiu exibir o PDF.{" "}
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                  Abrir em nova aba
                </a>{" "}
                ou use o botão "Baixar PDF".
              </div>
            </object>
          )}
          <div className="p-3 text-xs text-muted-foreground flex items-center gap-2 border-t border-border/40">
            <FileText className="h-3.5 w-3.5" />
            Se o PDF não carregar no seu navegador, use o botão "Baixar PDF" acima ou{" "}
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                abra em nova aba
              </a>
            )}
            .
          </div>
        </Card>
      )}
    </div>
  );
}
