import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, List, BarChart3, Signal } from "lucide-react";
import { useEffect, useRef } from "react";

function TechBus({ direction = "right", size = 1, delay = 0, y = 20 }: { direction?: "left" | "right"; size?: number; delay?: number; y?: number }) {
  return (
    <div
      className={`absolute pointer-events-none`}
      style={{
        top: `${y}%`,
        animation: `bus-move-${direction} ${14 + delay * 2}s linear infinite ${delay}s`,
        transform: direction === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <svg
        width={140 * size}
        height={60 * size}
        viewBox="0 0 140 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_hsl(28,90%,52%,0.3)]"
      >
        {/* Digital trail effect */}
        <defs>
          <linearGradient id={`trail-${y}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="hsl(28, 90%, 52%)" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(28, 90%, 52%)" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id={`body-grad-${y}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(28, 90%, 52%)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="hsl(28, 90%, 42%)" stopOpacity="0.08" />
          </linearGradient>
          <filter id={`glow-${y}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Digital trail behind bus */}
        <rect x="-60" y="18" width="70" height="24" rx="4" fill={`url(#trail-${y})`} />

        {/* Bus body - sleek modern shape */}
        <path
          d="M12 38 L12 16 Q12 10 18 10 L100 10 Q108 10 112 14 L120 22 Q122 24 122 28 L122 38 Q122 42 118 42 L16 42 Q12 42 12 38Z"
          fill={`url(#body-grad-${y})`}
          stroke="hsl(28, 90%, 52%)"
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* Roof tech strip */}
        <rect x="20" y="10" width="80" height="2" rx="1" fill="hsl(28, 90%, 52%)" fillOpacity="0.4">
          <animate attributeName="fillOpacity" values="0.2;0.6;0.2" dur="2s" repeatCount="indefinite" />
        </rect>

        {/* Windows - digital style */}
        {[22, 38, 54, 70].map((x, i) => (
          <g key={i}>
            <rect x={x} y="15" width="12" height="11" rx="2" fill="hsl(200, 80%, 60%)" fillOpacity="0.15" stroke="hsl(200, 80%, 60%)" strokeWidth="0.5" strokeOpacity="0.3" />
            {/* Data line inside window */}
            <line x1={x + 2} y1={21 - i % 2} x2={x + 10} y2={21 + i % 2} stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.4">
              <animate attributeName="strokeOpacity" values="0.2;0.6;0.2" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </line>
          </g>
        ))}

        {/* Windshield */}
        <path d="M88 14 L102 14 Q108 14 110 18 L116 26 L88 26 Z" fill="hsl(200, 80%, 60%)" fillOpacity="0.2" stroke="hsl(200, 80%, 60%)" strokeWidth="0.5" strokeOpacity="0.35" />

        {/* HUD display on windshield */}
        <line x1="94" y1="18" x2="106" y2="18" stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.5">
          <animate attributeName="x2" values="100;108;100" dur="3s" repeatCount="indefinite" />
        </line>
        <line x1="94" y1="21" x2="102" y2="21" stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.3" />

        {/* Headlights - LED style */}
        <rect x="120" y="22" width="3" height="8" rx="1.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.8" filter={`url(#glow-${y})`}>
          <animate attributeName="fillOpacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
        </rect>

        {/* Taillights */}
        <rect x="12" y="24" width="2" height="6" rx="1" fill="hsl(0, 80%, 55%)" fillOpacity="0.6">
          <animate attributeName="fillOpacity" values="0.3;0.8;0.3" dur="1s" repeatCount="indefinite" />
        </rect>

        {/* Wheels - futuristic */}
        {[34, 98].map((cx, i) => (
          <g key={i}>
            <circle cx={cx} cy="42" r="7" fill="hsl(220, 20%, 10%)" fillOpacity="0.4" stroke="hsl(28, 90%, 52%)" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx={cx} cy="42" r="3" fill="hsl(28, 90%, 52%)" fillOpacity="0.3">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 42`} to={`360 ${cx} 42`} dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Wheel rim lines */}
            <line x1={cx} y1={36} x2={cx} y2={48} stroke="hsl(28, 90%, 52%)" strokeWidth="0.5" strokeOpacity="0.2">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 42`} to={`360 ${cx} 42`} dur="1s" repeatCount="indefinite" />
            </line>
          </g>
        ))}

        {/* Antenna with signal */}
        <line x1="28" y1="10" x2="28" y2="3" stroke="hsl(28, 90%, 52%)" strokeWidth="0.8" strokeOpacity="0.5" />
        <circle cx="28" cy="2" r="1.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.7">
          <animate attributeName="r" values="1;2;1" dur="2s" repeatCount="indefinite" />
          <animate attributeName="fillOpacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* Signal waves from antenna */}
        {[4, 7, 10].map((r, i) => (
          <circle key={i} cx="28" cy="2" r={r} fill="none" stroke="hsl(28, 90%, 52%)" strokeWidth="0.4" strokeOpacity="0">
            <animate attributeName="strokeOpacity" values="0;0.3;0" dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="r" values={`${r - 2};${r + 2}`} dur="2s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* Undercarriage tech glow */}
        <rect x="30" y="44" width="60" height="1" rx="0.5" fill="hsl(28, 90%, 52%)" fillOpacity="0.2">
          <animate attributeName="fillOpacity" values="0.1;0.35;0.1" dur="2s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; pulse: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.fillStyle = `hsla(28, 90%, 52%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        particles.forEach((p2, j) => {
          if (j <= i) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `hsla(28, 90%, 52%, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function Projects() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const cards = [
    ...(isAdmin ? [{
      title: "Cadastrar Novo Projeto",
      description: "Crie um novo projeto no sistema",
      icon: Plus,
      onClick: () => navigate("/projetos/novo"),
      glow: false,
    }] : []),
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
      {/* Particle network background */}
      <div className="absolute inset-0 pointer-events-none">
        <ParticleField />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(hsl(28, 90%, 52%) 1px, transparent 1px),
          linear-gradient(90deg, hsl(28, 90%, 52%) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />

      {/* Horizontal scan lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"
          style={{ animation: "scan-horizontal 6s ease-in-out infinite", top: "30%" }} />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent"
          style={{ animation: "scan-horizontal 8s ease-in-out infinite 2s", top: "65%" }} />
      </div>

      {/* Animated tech buses */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <TechBus direction="right" y={10} delay={0} size={1} />
        <TechBus direction="left" y={80} delay={3} size={0.9} />
        <TechBus direction="right" y={48} delay={7} size={0.7} />
      </div>

      {/* Digital road lanes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[18, 55, 85].map((top, i) => (
          <div key={i} className="absolute w-full" style={{ top: `${top}%` }}>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
            {/* Dashed center line */}
            <div className="h-px w-full mt-[1px]" style={{
              backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 20px, hsl(28, 90%, 52%, 0.08) 20px, hsl(28, 90%, 52%, 0.08) 40px)",
            }} />
          </div>
        ))}
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
