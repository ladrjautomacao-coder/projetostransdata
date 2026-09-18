import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Check,
  ChevronsUpDown,
  Download,
  FileUp,
  FolderOpen,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BUCKET = "report-imp";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface ProjectOption {
  id: string;
  company_name: string;
  project_code: string | null;
  city: string;
}

interface ReportFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFileName(name: string) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "arquivo";
}

export default function ReportImp() {
  const { user, isAdmin } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [files, setFiles] = useState<ReportFile[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileSearch, setFileSearch] = useState("");

  const canView = can("report_imp", "view");
  const canUpload = can("report_imp", "create");
  const canDelete = can("report_imp", "delete");

  useEffect(() => {
    if (permissionsLoading || !canView) return;
    supabase
      .from("projects")
      .select("id, company_name, project_code, city")
      .order("company_name")
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Erro ao carregar projetos", description: error.message, variant: "destructive" });
          return;
        }
        setProjects(data ?? []);
      });
  }, [canView, permissionsLoading, toast]);

  const loadFiles = useCallback(async () => {
    if (!selectedProjectId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("report_imp_files")
      .select("id, project_id, file_name, file_path, file_size, content_type, uploaded_by, created_at")
      .eq("project_id", selectedProjectId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar arquivos", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const loadedFiles = data ?? [];
    setFiles(loadedFiles);
    const authorIds = [...new Set(loadedFiles.map(file => file.uploaded_by))];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", authorIds);
      setAuthorNames(Object.fromEntries((profiles ?? []).map(profile => [profile.user_id, profile.full_name || "Usuário"])));
    } else {
      setAuthorNames({});
    }
    setLoading(false);
  }, [selectedProjectId, toast]);

  useEffect(() => {
    if (canView) void loadFiles();
  }, [canView, loadFiles]);

  const selectedProject = projects.find(project => project.id === selectedProjectId);
  const visibleFiles = useMemo(() => {
    const term = fileSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) return files;
    return files.filter(file =>
      file.file_name.toLocaleLowerCase("pt-BR").includes(term)
      || (authorNames[file.uploaded_by] || "").toLocaleLowerCase("pt-BR").includes(term)
    );
  }, [authorNames, fileSearch, files]);

  const uploadFile = async (file: File) => {
    if (!user || !selectedProjectId || !canUpload) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo acima de 100 MB", description: "Selecione um arquivo menor para continuar.", variant: "destructive" });
      return;
    }

    const path = `${selectedProjectId}/${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    setUploading(true);
    setUploadProgress(30);
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      setUploadProgress(75);

      const { error: metadataError } = await supabase.from("report_imp_files").insert({
        project_id: selectedProjectId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        content_type: file.type || null,
      });
      if (metadataError) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw metadataError;
      }

      setUploadProgress(100);
      toast({ title: "Arquivo enviado", description: `${file.name} foi vinculado ao projeto.` });
      await loadFiles();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar o arquivo.";
      toast({ title: "Erro no envio", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const downloadFile = async (file: ReportFile) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(file.file_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro ao abrir arquivo", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const deleteFile = async (file: ReportFile) => {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.file_path]);
    if (storageError) {
      toast({ title: "Erro ao excluir arquivo", description: storageError.message, variant: "destructive" });
      return;
    }
    const { error: metadataError } = await supabase.from("report_imp_files").delete().eq("id", file.id);
    if (metadataError) {
      toast({ title: "Arquivo removido, mas o registro não foi limpo", description: metadataError.message, variant: "destructive" });
      return;
    }
    setFiles(current => current.filter(item => item.id !== file.id));
    toast({ title: "Arquivo excluído" });
  };

  if (permissionsLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }
  if (!canView) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-1 border-b pb-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <FileUp className="h-4 w-4" /> Implantação
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">Report IMP</h1>
        <p className="text-sm text-muted-foreground">Envie e consulte os arquivos de implantação de cada projeto.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar projeto</CardTitle>
          <CardDescription>Pesquise pelo código, empresa ou cidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full max-w-2xl justify-between font-normal">
                <span className="truncate">
                  {selectedProject
                    ? `${selectedProject.project_code ? `${selectedProject.project_code} · ` : ""}${selectedProject.company_name}`
                    : "Selecione um projeto"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar projeto..." />
                <CommandList>
                  <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                  <CommandGroup>
                    {projects.map(project => (
                      <CommandItem
                        key={project.id}
                        value={`${project.project_code || ""} ${project.company_name} ${project.city}`}
                        onSelect={() => {
                          setSelectedProjectId(project.id);
                          setProjectPickerOpen(false);
                          setFileSearch("");
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedProjectId === project.id ? "opacity-100" : "opacity-0")} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{project.company_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{project.project_code || "Sem código"} · {project.city}</p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <>
          {canUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enviar arquivo</CardTitle>
                <CardDescription>Qualquer formato, com até 100 MB por arquivo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={inputRef}
                  type="file"
                  className="sr-only"
                  disabled={uploading}
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />
                <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {uploading ? "Enviando..." : "Selecionar arquivo"}
                </Button>
                {uploading && <Progress value={uploadProgress} className="h-2 max-w-xl" />}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="text-lg">Arquivos do projeto</CardTitle>
                <CardDescription>{files.length} {files.length === 1 ? "arquivo enviado" : "arquivos enviados"}</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={fileSearch} onChange={event => setFileSearch(event.target.value)} placeholder="Buscar arquivo ou autor" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
              ) : visibleFiles.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="font-medium">Nenhum arquivo encontrado</p>
                  <p className="text-sm text-muted-foreground">Os arquivos enviados para este projeto aparecerão aqui.</p>
                </div>
              ) : (
                <div className="divide-y rounded-md border">
                  {visibleFiles.map(file => {
                    const mayDelete = canDelete && (isAdmin || file.uploaded_by === user?.id);
                    return (
                      <div key={file.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
                          <FileUp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.file_size)} · {authorNames[file.uploaded_by] || "Usuário"} · {format(new Date(file.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => void downloadFile(file)}>
                            <Download className="mr-2 h-4 w-4" /> Baixar
                          </Button>
                          {mayDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Excluir ${file.file_name}`}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação removerá “{file.file_name}” permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => void deleteFile(file)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}