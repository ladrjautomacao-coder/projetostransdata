export const PROJECT_SEGMENTS = [
  { value: "new_project", label: "New Project" },
  { value: "upgrade_equipamentos", label: "Upgrade de equipamentos" },
] as const;

export function projectSegmentLabel(value?: string | null) {
  return PROJECT_SEGMENTS.find(s => s.value === value)?.label || "—";
}
