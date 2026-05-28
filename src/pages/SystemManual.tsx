import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type LazyPdfPageProps = {
  pageNumber: number;
  width: number;
  estimatedHeight: number;
  scrollRoot: HTMLElement | null;
};

function LazyPdfPage({ pageNumber, width, estimatedHeight, scrollRoot }: LazyPdfPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            setRendered(true);
          } else {
            setVisible(false);
          }
        }
      },
      {
        root: scrollRoot ?? null,
        // Pre-render pages a viewport ahead/behind for smooth scrolling.
        rootMargin: "800px 0px 800px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [scrollRoot]);

  const placeholderHeight = measuredHeight ?? estimatedHeight;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-md border border-border/60 bg-background shadow-sm"
      style={{ minHeight: placeholderHeight }}
    >
      {rendered ? (
        <div style={{ display: visible || measuredHeight ? "block" : "block" }}>
          <Page
            pageNumber={pageNumber}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            onRenderSuccess={() => {
              const node = containerRef.current;
              if (node) setMeasuredHeight(node.clientHeight);
            }}
            loading={
              <div
                className="flex items-center justify-center text-xs text-muted-foreground"
                style={{ height: placeholderHeight }}
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Página {pageNumber}
              </div>
            }
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center text-xs text-muted-foreground"
          style={{ height: placeholderHeight }}
        >
          Página {pageNumber}
        </div>
      )}
    </div>
  );
}


const BUCKET = "manuals";
const FILE_PATH = "manual-sistema.pdf";

export default function SystemManual() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [viewerWidth, setViewerWidth] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(FILE_PATH);
    const url = `${data.publicUrl}?v=${Date.now()}`;
    setPdfUrl(url);

    const loadPdf = async () => {
      try {
        setLoadError(null);
        const response = await fetch(url);

        if (!response.ok) {
          setExists(false);
          return;
        }

        const buffer = await response.arrayBuffer();
        setPdfData(new Uint8Array(buffer));
        setExists(true);
      } catch {
        setExists(false);
        setLoadError("Não foi possível carregar o manual no momento.");
      }
    };

    void loadPdf();
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    const element = viewerRef.current;
    const updateWidth = () => setViewerWidth(element.clientWidth);

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
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
            {loadError ?? "O arquivo do manual ainda não foi enviado. Ele aparecerá aqui assim que for publicado."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
          <div ref={viewerRef} className="max-h-[calc(100vh-200px)] overflow-auto bg-muted/20 p-4 sm:p-6">
            {pdfData ? (
              <Document
                file={{ data: pdfData }}
                loading={
                  <div className="flex min-h-[480px] items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando manual...
                  </div>
                }
                error={
                  <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p>Não foi possível renderizar o PDF nesta tela.</p>
                    {pdfUrl && (
                      <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                        Abrir em nova aba
                      </a>
                    )}
                  </div>
                }
                onLoadSuccess={({ numPages }) => setPageCount(numPages)}
              >
                <div className="mx-auto flex max-w-5xl flex-col gap-4">
                  {Array.from({ length: pageCount }, (_, index) => (
                    <LazyPdfPage
                      key={index}
                      pageNumber={index + 1}
                      width={pageWidth}
                      estimatedHeight={estimatedPageHeight}
                      scrollRoot={viewerRef.current}
                    />
                  ))}
                </div>

              </Document>
            ) : (
              <div className="flex min-h-[480px] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparando visualização do manual...
              </div>
            )}
          </div>
          <div className="p-3 text-xs text-muted-foreground flex items-center gap-2 border-t border-border/40">
            <FileText className="h-3.5 w-3.5" />
            Se a visualização não abrir corretamente, use o botão "Baixar PDF" acima ou{" "}
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
