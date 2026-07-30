export interface FollowUpNote {
  raw: string;
  author: string | null;
  date: Date | null;
  dateLabel: string | null;
  text: string;
}

const ENTRY_RE = /^\[(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})\s*[•\-·]\s*([^\]]+)\]\s*(.*)$/;

/**
 * As notas de acompanhamento são gravadas no formato:
 *   [dd/MM/yyyy HH:mm • Autor] texto
 * Linhas fora do padrão são devolvidas como texto simples.
 */
export function parseFollowUpNotes(observations: string | null | undefined): FollowUpNote[] {
  if (!observations) return [];
  const lines = observations.split("\n");
  const notes: FollowUpNote[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(ENTRY_RE);
    if (m) {
      const [, dd, mm, yyyy, hh, mi, author, text] = m;
      const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi));
      notes.push({
        raw: trimmed,
        author: author.trim(),
        date: isNaN(date.getTime()) ? null : date,
        dateLabel: `${dd}/${mm}/${yyyy} ${hh}:${mi}`,
        text: text.trim(),
      });
    } else if (notes.length > 0) {
      // continuação da nota anterior (nota multi-linha)
      const last = notes[notes.length - 1];
      last.text = `${last.text}\n${trimmed}`.trim();
      last.raw = `${last.raw}\n${trimmed}`;
    } else {
      notes.push({ raw: trimmed, author: null, date: null, dateLabel: null, text: trimmed });
    }
  }

  return notes;
}

export function latestFollowUpNote(observations: string | null | undefined): FollowUpNote | null {
  const notes = parseFollowUpNotes(observations);
  return notes[0] ?? null;
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86_400_000);
}
