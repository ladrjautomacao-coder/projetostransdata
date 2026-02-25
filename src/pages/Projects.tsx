import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, List, BarChart3, Signal } from "lucide-react";

function AnimatedBus({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="50"
      viewBox="0 0 120 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bus body */}
      <rect x="10" y="8" width="90" height="30" rx="6" fill="hsl(28, 90%, 52%)" fillOpacity="0.15" stroke="hsl(28, 90%, 52%)" strokeWidth="1.5" strokeOpacity="0.4" />
      {/* Windows */}
      <rect x="18" y="14" width="12" height="10" rx="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.25" />
      <rect x="34" y="14" width="12" height="10" rx="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.25" />
      <rect x="50" y="14" width="12" height="10" rx="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.25" />
      <rect x="66" y="14" width="12" height="10" rx="2" fill="hsl(28, 90%, 52%)" fillOpacity="0.25" />
      {/* Windshield */}
      <rect x="82" y="12" width="14" height="16" rx="3" fill="hsl(28, 90%, 52%)" fillOpacity="0.35" />
      {/* Wheels */}
      <circle cx="30" cy="40" r="6" fill="hsl(220, 20%, 12%)" fillOpacity="0.3" stroke="hsl(28, 90%, 52%)" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="30" cy="40" r="2.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.4" />
      <circle cx="80" cy="40" r="6" fill="hsl(220, 20%, 12%)" fillOpacity="0.3" stroke="hsl(28, 90%, 52%)" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="80" cy="40" r="2.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.4" />
      {/* Headlight */}
      <rect x="100" y="22" width="6" height="6" rx="1.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.6" />
      {/* Signal antenna */}
      <line x1="25" y1="8" x2="25" y2="2" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.5" />
      <circle cx="25" cy="1" r="1.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.6" />
    </svg>
  );
}

export default function Projects() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Cadastrar Novo Projeto",
      description: "Crie um novo projeto no sistema",
      icon: Plus,
      onClick: () => navigate("/projetos/novo"),
      glow: false,
    },
    {
      title: "Visualizar Projetos",
      description: "Veja e gerencie os projetos existentes",
      icon: List,
      onClick: () => navigate("/projetos/lista"),
      glow: false,
    },
    {
      title: "Visão Analítica",
      description: "Dashboard com gráficos e métricas dos projetos",
      icon: BarChart3,
      onClick: () => navigate("/projetos/analitico"),
      glow: true,
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Animated road lines behind everything */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Road line 1 */}
        <div className="absolute top-[30%] w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[road-line_8s_linear_infinite]" />
        {/* Road line 2 */}
        <div className="absolute top-[60%] w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-[road-line_12s_linear_infinite_2s]" />
      </div>

      {/* Animated buses */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute animate-[bus-move-right_14s_linear_infinite]" style={{ top: "12%" }}>
          <AnimatedBus />
        </div>
        <div className="absolute animate-[bus-move-left_18s_linear_infinite_3s]" style={{ top: "78%" }}>
          <div className="scale-x-[-1]">
            <AnimatedBus />
          </div>
        </div>
        <div className="absolute animate-[bus-move-right_22s_linear_infinite_7s]" style={{ top: "45%" }}>
          <AnimatedBus className="opacity-40 scale-75" />
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Signal className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
            Módulo de Projetos
          </span>
          <Signal className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
          Projetos
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
          Gerencie, monitore e analise seus projetos de telemetria
        </p>
      </div>

      {/* Cards */}
      <div className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl px-4">
        {cards.map((card, i) => (
          <Card
            key={card.title}
            className={`
              group cursor-pointer transition-all duration-500 hover:-translate-y-2 relative overflow-hidden
              border-border/50 backdrop-blur-sm bg-card/80
              ${card.glow ? "glow-orange-strong" : "hover:glow-orange"}
            `}
            onClick={card.onClick}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
              card.glow
                ? "bg-gradient-to-r from-primary via-primary/80 to-primary/40"
                : "bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:from-primary/40 group-hover:via-primary group-hover:to-primary/40"
            }`} />

            {/* Hover glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />

            {/* Corner decoration */}
            <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-primary/0 group-hover:border-primary/30 transition-all duration-500 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-primary/0 group-hover:border-primary/30 transition-all duration-500 rounded-bl-lg" />

            <CardContent className="flex flex-col items-center text-center p-10 gap-5 relative z-10">
              <div className={`
                flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-500
                ${card.glow
                  ? "bg-primary/15 text-primary pulse-glow"
                  : "bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110"
                }
              `}>
                <card.icon className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold mb-1.5">{card.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              </div>

              {/* Arrow indicator */}
              <div className="flex items-center gap-1 text-xs text-primary font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span>Acessar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom decorative line */}
      <div className="relative z-10 mt-12 flex items-center gap-3 text-muted-foreground/40">
        <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
        <Signal className="h-3 w-3 text-primary/40" />
        <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
      </div>
    </div>
  );
}
