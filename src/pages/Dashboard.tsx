import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, HardHat, BookOpen, Activity, Wifi, Signal, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    supabase.from("projects").select("id", { count: "exact", head: true }).then(({ count }) => {
      setProjectCount(count ?? 0);
    });
  }, []);

  const cards = [
    {
      title: "Projetos",
      description: "Gerencie os projetos de telemetria",
      icon: FolderKanban,
      badge: `${projectCount} projetos`,
      onClick: () => navigate("/projetos"),
      soon: false,
    },
    {
      title: "Implantação",
      description: "Acompanhe implantações em campo",
      icon: HardHat,
      badge: "Em breve",
      onClick: () => navigate("/implantacao"),
      soon: true,
    },
    {
      title: "Acervo Técnico",
      description: "Documentação e base técnica",
      icon: BookOpen,
      badge: "Em breve",
      onClick: () => navigate("/acervo"),
      soon: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-foreground to-foreground/80 p-8 md:p-10">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(hsl(28 90% 52% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(28 90% 52% / 0.3) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <Wifi className="h-4 w-4 text-primary" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Signal className="h-5 w-5 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Painel de Controle</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-background mb-2">
            Sistema de Gestão
          </h1>
          <p className="text-background/60 text-lg max-w-lg">
            Monitoramento e gerenciamento de projetos de telemetria TransMobile
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Projetos Ativos", value: projectCount, icon: Activity },
          { label: "Sinal do Sistema", value: "Online", icon: Wifi },
          { label: "Módulos", value: "3", icon: Signal },
        ].map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <Card
            key={card.title}
            className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden ${
              card.soon ? 'opacity-70' : 'glow-orange hover:glow-orange-strong'
            }`}
            onClick={card.onClick}
          >
            {!card.soon && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
            )}
            <CardContent className="flex flex-col p-6 gap-4">
              <div className="flex items-start justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                  card.soon ? 'bg-muted' : 'bg-primary/10'
                }`}>
                  <card.icon className={`h-7 w-7 ${card.soon ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <Badge variant={card.soon ? "secondary" : "default"} className={!card.soon ? 'bg-primary text-primary-foreground' : ''}>
                  {card.badge}
                </Badge>
              </div>
              <div>
                <h2 className="text-xl font-bold">{card.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
              </div>
              {!card.soon && (
                <div className="flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Acessar <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
