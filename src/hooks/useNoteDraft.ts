import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Rascunho automático de texto de acompanhamento, por usuário e por projeto.
 * Salva no localStorage com debounce e restaura ao reabrir a tela.
 */
export function useNoteDraft(projectId: string | undefined) {
  const { user } = useAuth();
  const key = user?.id && projectId ? `transdata:note-draft:${user.id}:${projectId}` : null;
  const [value, setValue] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);

  // Restaura o rascunho existente ao montar
  useEffect(() => {
    if (!key || restored.current) return;
    restored.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { text?: string; savedAt?: string };
        if (parsed.text?.trim()) {
          setValue(parsed.text);
          if (parsed.savedAt) setDraftSavedAt(new Date(parsed.savedAt));
        }
      }
    } catch {
      /* ignore */
    }
  }, [key]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = useCallback((text: string) => {
    setValue(text);
    if (!key) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        if (text.trim()) {
          const savedAt = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify({ text, savedAt }));
          setDraftSavedAt(new Date(savedAt));
        } else {
          localStorage.removeItem(key);
          setDraftSavedAt(null);
        }
      } catch {
        /* ignore */
      }
    }, 800);
  }, [key]);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (key) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
    setValue("");
    setDraftSavedAt(null);
  }, [key]);

  return { value, update, clear, draftSavedAt };
}
