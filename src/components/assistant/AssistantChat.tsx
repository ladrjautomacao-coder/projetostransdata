import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, RotateCcw, Loader2, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-assistant`;

const SUGGESTIONS = [
  "Quais projetos estão críticos (parados há mais de 30 dias)?",
  "Me dê um resumo dos KPIs atuais.",
  "Projetos em homologação no momento.",
  "Última atualização do projeto…",
];

export function AssistantChat({ onClose }: { onClose?: () => void }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
  }, []);

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando sessão…
      </div>
    );
  }

  return <AssistantChatInner token={token} onClose={onClose} />;
}

function AssistantChatInner({ token, onClose }: { token: string; onClose?: () => void }) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(() => crypto.randomUUID());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useRef<DefaultChatTransport<UIMessage>>(
    new DefaultChatTransport({
      api: ENDPOINT,
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    })
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    transport: transport.current,
    onError: (err) => toast({ title: "Erro no assistente", description: err.message, variant: "destructive" }),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => { inputRef.current?.focus(); }, [chatId, status]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isBusy) return;
    setInput("");
    await sendMessage({ text: value });
  };

  const handleReset = () => {
    setMessages([]);
    setChatId(crypto.randomUUID());
    setInput("");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-2 border-b px-4 py-3 bg-card/60 backdrop-blur">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Assistente Transdata</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">IA · somente leitura</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleReset} title="Nova conversa">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Olá! Pergunte sobre qualquer projeto. Posso trazer a última atualização do Acompanhamento, listar projetos por filtro e dar um panorama geral.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-foreground px-3 py-1.5 transition-colors"
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Consultando…
          </div>
        )}
      </div>

      <div className="border-t p-3 space-y-2">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          placeholder={token ? "Pergunte algo… (Enter envia, Shift+Enter quebra linha)" : "Carregando sessão…"}
          rows={2}
          disabled={!token || isBusy}
          className="resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => handleSend()} disabled={!input.trim() || isBusy || !token}>
            <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter(p => p.type === "text") as Array<{ type: "text"; text: string }>;
  const toolParts = message.parts.filter(p => p.type.startsWith("tool-"));
  const text = textParts.map(p => p.text).join("");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
        isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
      }`}>
        {!isUser && toolParts.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
            <Wrench className="h-3 w-3" /> consultando dados…
          </div>
        )}
        {text && (
          <div className={`prose prose-sm max-w-none ${isUser ? "prose-invert" : "dark:prose-invert"}`}>
            <ReactMarkdown
              components={{
                a: ({ href, children }) => href?.startsWith("/")
                  ? <Link to={href} className="underline font-medium">{children}</Link>
                  : <a href={href} target="_blank" rel="noreferrer" className="underline">{children}</a>,
              }}
            >{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
