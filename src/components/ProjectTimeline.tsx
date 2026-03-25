import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const PHASES: { key: ProjectStatus; label: string; short: string }[] = [
  { key: "planejamento", label: "Planejamento", short: "Plan" },
  { key: "implantacao", label: "Implantação", short: "Impl" },
  { key: "encerrado", label: "Encerrado", short: "Enc" },
  { key: "suspenso", label: "Suspenso", short: "Susp" },
];

const PHASE_COLORS: Record<ProjectStatus, string> = {
  planejamento: "hsl(38 92% 50%)",
  implantacao: "hsl(28 90% 52%)",
  encerrado: "hsl(142 72% 42%)",
  suspenso: "hsl(0 62% 50%)",
};

interface ProjectTimelineProps {
  status: ProjectStatus;
  companyName: string;
  compact?: boolean;
}

export function ProjectTimeline({ status, companyName, compact = false }: ProjectTimelineProps) {
  const currentIndex = PHASES.findIndex(p => p.key === status);

  return (
    <div className={compact ? "" : "py-2"}>
      {!compact && (
        <p className="text-xs font-semibold text-foreground mb-3 truncate">{companyName}</p>
      )}
      <div className="flex items-center gap-0">
        {PHASES.map((phase, i) => {
          const isCurrent = i === currentIndex;
          const isCompleted = i < currentIndex;
          const isFuture = i > currentIndex;
          const color = PHASE_COLORS[phase.key];

          return (
            <div key={phase.key} className="flex items-center">
              {/* Phase box */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="relative flex flex-col items-center"
              >
                <div
                  className={`
                    relative flex items-center justify-center rounded-md border-2 transition-all
                    ${compact ? "h-7 min-w-[52px] px-1.5" : "h-9 min-w-[72px] px-2"}
                    ${isCompleted
                      ? "border-transparent"
                      : isCurrent
                        ? "border-transparent shadow-lg"
                        : "border-border/40 bg-muted/30"
                    }
                  `}
                  style={
                    isCompleted
                      ? { backgroundColor: `${color}25`, borderColor: `${color}50` }
                      : isCurrent
                        ? { backgroundColor: color, borderColor: color }
                        : undefined
                  }
                >
                  {/* Pulse ring animation on current */}
                  {isCurrent && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-md"
                        style={{ border: `2px solid ${color}` }}
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-md"
                        style={{ backgroundColor: color }}
                        animate={{
                          opacity: [0.8, 1, 0.8],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1">
                    {isCompleted && (
                      <Check
                        className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
                        style={{ color }}
                      />
                    )}
                    <span
                      className={`
                        font-semibold leading-none whitespace-nowrap
                        ${compact ? "text-[9px]" : "text-[10px]"}
                        ${isCurrent ? "text-primary-foreground" : ""}
                        ${isCompleted ? "" : ""}
                        ${isFuture ? "text-muted-foreground/60" : ""}
                      `}
                      style={isCompleted ? { color } : undefined}
                    >
                      {compact ? phase.short : phase.label}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div
                  className={`${compact ? "w-3 h-[2px]" : "w-5 h-[2px]"} shrink-0`}
                  style={{
                    backgroundColor: i < currentIndex
                      ? PHASE_COLORS[PHASES[i + 1].key]
                      : "hsl(var(--border))",
                    opacity: i < currentIndex ? 0.6 : 0.4,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
