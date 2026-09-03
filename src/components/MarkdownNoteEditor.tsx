import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bold, Italic, List, ListOrdered, Heading2, Link as LinkIcon } from "lucide-react";

type Action = "bold" | "italic" | "ul" | "ol" | "h2" | "link";

const TOOLS: { action: Action; icon: typeof Bold; label: string }[] = [
  { action: "bold", icon: Bold, label: "Negrito (Ctrl+B)" },
  { action: "italic", icon: Italic, label: "Itálico (Ctrl+I)" },
  { action: "h2", icon: Heading2, label: "Título" },
  { action: "ul", icon: List, label: "Lista com marcadores" },
  { action: "ol", icon: ListOrdered, label: "Lista numerada" },
  { action: "link", icon: LinkIcon, label: "Link" },
];

function applyAction(value: string, start: number, end: number, action: Action) {
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  const wrap = (mark: string, placeholder: string) => {
    const text = selected || placeholder;
    return {
      value: `${before}${mark}${text}${mark}${after}`,
      selStart: start + mark.length,
      selEnd: start + mark.length + text.length,
    };
  };

  const prefixLines = (fn: (line: string, i: number) => string) => {
    const text = selected || "";
    const lines = (text || "item").split("\n");
    const out = lines.map(fn).join("\n");
    const needsBreak = before && !before.endsWith("\n") ? "\n" : "";
    return {
      value: `${before}${needsBreak}${out}${after}`,
      selStart: start + needsBreak.length,
      selEnd: start + needsBreak.length + out.length,
    };
  };

  switch (action) {
    case "bold":
      return wrap("**", "texto");
    case "italic":
      return wrap("*", "texto");
    case "h2": {
      const needsBreak = before && !before.endsWith("\n") ? "\n" : "";
      const text = selected || "Título";
      return {
        value: `${before}${needsBreak}## ${text}${after}`,
        selStart: start + needsBreak.length + 3,
        selEnd: start + needsBreak.length + 3 + text.length,
      };
    }
    case "ul":
      return prefixLines(l => `- ${l}`);
    case "ol":
      return prefixLines((l, i) => `${i + 1}. ${l}`);
    case "link": {
      const text = selected || "texto";
      const out = `[${text}](https://)`;
      return {
        value: `${before}${out}${after}`,
        selStart: start + text.length + 3,
        selEnd: start + out.length - 1,
      };
    }
  }
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MarkdownNoteEditor({ value, onChange, placeholder, disabled, className }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const run = (action: Action) => {
    const el = ref.current;
    if (!el) return;
    const res = applyAction(value, el.selectionStart, el.selectionEnd, action);
    onChange(res.value);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(res.selStart, res.selEnd);
    });
  };

  return (
    <div className="rounded-md border border-input bg-background">
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-1.5 py-1">
          {TOOLS.map(({ action, icon: Icon, label }) => (
            <Tooltip key={action}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={disabled}
                  onClick={() => run(action)}
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">{label}</TooltipContent>
            </Tooltip>
          ))}
          <span className="ml-auto pr-1 text-[10px] uppercase tracking-wider text-muted-foreground">Markdown</span>
        </div>
      </TooltipProvider>
      <Textarea
        ref={ref}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
            const k = e.key.toLowerCase();
            if (k === "b") { e.preventDefault(); run("bold"); }
            if (k === "i") { e.preventDefault(); run("italic"); }
          }
        }}
        className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${className ?? "min-h-[100px]"}`}
      />
    </div>
  );
}

export function NoteContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words
      prose-p:my-1.5 prose-p:leading-relaxed
      prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-foreground
      prose-h1:text-sm prose-h2:text-sm prose-h3:text-[13px]
      prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-li:marker:text-primary
      prose-strong:text-foreground
      prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
      text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">{children}</a>
          ),
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
        }}
      >{content}</ReactMarkdown>
    </div>
  );
}
