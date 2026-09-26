import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CronogramaTab } from "@/components/comercial/CronogramaTab";

export default function Cronograma() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" onClick={() => navigate("/projetos")} className="mb-2 w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>
      <CronogramaTab />
    </div>
  );
}
