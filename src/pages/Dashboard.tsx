import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, HardHat, BookOpen } from "lucide-react";
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
      description: "Gerencie os projetos da empresa",
      icon: FolderKanban,
      badge: `${projectCount} projetos`,
      onClick: () => navigate("/projetos"),
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Implantação",
      description: "Acompanhe a implantação dos projetos",
      icon: HardHat,
      badge: "Em breve",
      onClick: () => navigate("/implantacao"),
      color: "bg-accent text-accent-foreground",
      soon: true,
    },
    {
      title: "Acervo Técnico",
      description: "Base de conhecimento e documentos",
      icon: BookOpen,
      badge: "Em breve",
      onClick: () => navigate("/acervo"),
      color: "bg-accent text-accent-foreground",
      soon: true,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Bem-vindo ao sistema de gestão de projetos</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(card => (
          <Card
            key={card.title}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
            onClick={card.onClick}
          >
            <CardContent className="flex flex-col items-center text-center p-8 gap-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${card.color}`}>
                <card.icon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{card.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
              </div>
              <Badge variant={card.soon ? "secondary" : "default"}>{card.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
