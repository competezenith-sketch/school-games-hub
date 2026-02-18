import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const Inscricoes = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); 
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Dados da Organização
  const { data: userOrg } = useQuery({
    queryKey: ["user-org-info", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", profile.org_id).single();
      return org;
    }
  });

  // 2. Etapas da Competição Selecionada
  const { data: stages = [] } = useQuery({
    queryKey: ["stages-by-comp", selectedCompetition],
    enabled: !!selectedCompetition,
    queryFn: async () => {
      const { data } = await supabase.from("competition_stages").select("*").eq("competition_id", selectedCompetition).order("stage_number");
      return data || [];
    }
  });

  // 3. Modalidades (Regras)
  const { data: rules = [] } = useQuery({
    queryKey: ["rules-by-comp", selectedCompetition],
    enabled: !!selectedCompetition && step === 1,
    queryFn: async () => {
      const { data } = await supabase.from("competition_rules").select("*, modalities(*), categories(*)").eq("competition_id", selectedCompetition);
      return data || [];
    }
  });

  // 4. Salvar Inscrição
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = enrolledAthletes.map(athlete => ({
        competition_id: selectedCompetition,
        stage_id: selectedStage.id,
        org_id: userOrg.id,
        modality_id: selectedRule.modality_id,
        category_id: selectedRule.category_id,
        athlete_id: athlete.id,
        status: 'pending'
      }));
      const { error } = await supabase.from("registrations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!");
      setStep(1); // Volta para escolher outra modalidade na mesma etapa
      setEnrolledAthletes([]);
    },
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message)
  });

  if (!userOrg) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inscrição JER's 2026</h2>
          <p className="text-muted-foreground text-sm">Escola: {userOrg.name} ({userOrg.city})</p>
        </div>
        {step > 0 && <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
      </div>

      {/* Passo 0: Escolha da Etapa (Com Filtro Geográfico) */}
      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((stage: any) => {
            const isBlocked = stage.allowed_cities && !stage.allowed_cities.includes(userOrg.city);
            return (
              <Card 
                key={stage.id} 
                className={cn("relative p-4 cursor-pointer transition-all border-2", isBlocked ? "opacity-50 grayscale bg-muted" : "hover:border-primary")}
                onClick={() => !isBlocked && (setSelectedStage(stage), setStep(1))}
              >
                {isBlocked && <Lock className="absolute top-2 right-2 h-4 w-4" />}
                <h4 className="font-bold">{stage.name}</h4>
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {stage.city}
                </div>
                {isBlocked && <p className="text-[10px] text-destructive mt-2">Sua escola não pertence a esta regional.</p>}
              </Card>
            );
          })}
        </div>
      )}

      {/* Passo 1: Escolha da Modalidade */}
      {step === 1 && (
        <div className="grid md:grid-cols-4 gap-4">
          {rules.map((rule: any) => (
            <Card 
              key={rule.id} 
              className="p-4 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary"
              onClick={() => (setSelectedRule(rule), setStep(2))}
            >
              <h5 className="font-bold text-sm">{rule.modalities.name}</h5>
              <Badge variant="secondary" className="mt-1 text-[10px]">{rule.categories.name}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Passo 2: Seleção de Atletas */}
      {step === 2 && (
        <StepAthleteSelection
          orgId={userOrg.id}
          rule={selectedRule}
          enrolled={enrolledAthletes}
          onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])}
          onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter(a => a.id !== id))}
          onBack={() => setStep(1)}
          onNext={() => saveMutation.mutate()}
        />
      )}
    </div>
  );
};

export default Inscricoes;
