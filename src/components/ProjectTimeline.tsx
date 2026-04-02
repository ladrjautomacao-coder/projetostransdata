import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const PHASES: { key: ProjectStatus; label: string; short: string }[] = [
  { key: "comercial", label: "Comercial", short: "Com" },
  { key: "planejamento", label: "Planejamento", short: "Plan" },
  { key: "implantacao", label: "Implantação", short: "Impl" },
  { key: "encerrado", label: "Implementado", short: "Impl" },
  { key: "suspenso", label: "Suspenso", short: "Susp" },
];

const PHASE_COLORS: Record<ProjectStatus, string> = {
  comercial: "hsl(217 91% 60%)",
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
        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs font-semibold text-foreground truncate">{companyName}</p>
          <motion.span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${PHASE_COLORS[status]}20`, color: PHASE_COLORS[status] }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {PHASES[currentIndex]?.label}
          </motion.span>
        </div>
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
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.12, duration: 0.4, type: "spring", stiffness: 300 }}
                className="relative flex flex-col items-center"
              >
                <div
                  className={`
                    relative flex items-center justify-center rounded-lg border-2 transition-all
                    ${compact ? "h-7 min-w-[52px] px-1.5" : "h-10 min-w-[80px] px-2.5"}
                    ${isCompleted
                      ? "border-transparent"
                      : isCurrent
                        ? "border-transparent"
                        : "border-border/30 bg-muted/20"
                    }
                  `}
                  style={
                    isCompleted
                      ? { backgroundColor: `${color}20`, borderColor: `${color}40` }
                      : isCurrent
                        ? { backgroundColor: color, borderColor: color, boxShadow: `0 4px 20px ${color}50, 0 0 40px ${color}25` }
                        : undefined
                  }
                >
                  {/* Animated glow rings on current */}
                  {isCurrent && (
                    <>
                      {/* Outer expanding ring */}
                      <motion.div
                        className="absolute inset-[-4px] rounded-xl"
                        style={{ border: `2px solid ${color}` }}
                        animate={{
                          scale: [1, 1.12, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      {/* Second ring offset */}
                      <motion.div
                        className="absolute inset-[-2px] rounded-lg"
                        style={{ border: `1.5px solid ${color}` }}
                        animate={{
                          scale: [1, 1.08, 1],
                          opacity: [0.4, 0, 0.4],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.5,
                        }}
                      />
                      {/* Inner glow pulse */}
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        style={{ backgroundColor: color }}
                        animate={{
                          opacity: [0.85, 1, 0.85],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      {/* Shimmer sweep */}
                      <motion.div
                        className="absolute inset-0 rounded-lg overflow-hidden"
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)`,
                          }}
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatDelay: 1.5,
                          }}
                        />
                      </motion.div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex items-center gap-1">
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.12 + 0.2, type: "spring", stiffness: 400 }}
                      >
                        <Check
                          className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
                          style={{ color }}
                          strokeWidth={3}
                        />
                      </motion.div>
                    )}
                    {isCurrent && !compact && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Zap className="h-3 w-3 text-primary-foreground" strokeWidth={2.5} />
                      </motion.div>
                    )}
                    <span
                      className={`
                        font-bold leading-none whitespace-nowrap
                        ${compact ? "text-[9px]" : "text-[11px]"}
                        ${isCurrent ? "text-primary-foreground drop-shadow-sm" : ""}
                        ${isFuture ? "text-muted-foreground/40" : ""}
                      `}
                      style={isCompleted ? { color } : undefined}
                    >
                      {compact ? phase.short : phase.label}
                    </span>
                  </div>
                </div>

                {/* "Atual" indicator below current */}
                {isCurrent && !compact && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className="mt-1.5 flex items-center gap-0.5"
                  >
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                      animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color }}>
                      Atual
                    </span>
                  </motion.div>
                )}
              </motion.div>

              {/* Connector line */}
              {i < PHASES.length - 1 && (
                <div className="relative">
                  <div
                    className={`${compact ? "w-4 h-[2px]" : "w-6 h-[2px]"} shrink-0`}
                    style={{
                      backgroundColor: i < currentIndex
                        ? PHASE_COLORS[PHASES[i + 1].key]
                        : "hsl(var(--border))",
                      opacity: i < currentIndex ? 0.5 : 0.25,
                    }}
                  />
                  {/* Animated dot traveling on completed connectors */}
                  {i < currentIndex && (
                    <motion.div
                      className="absolute top-[-1.5px] h-[5px] w-[5px] rounded-full"
                      style={{ backgroundColor: PHASE_COLORS[PHASES[i + 1].key] }}
                      animate={{ left: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
