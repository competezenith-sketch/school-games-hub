import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// IMPORTANTE: Certifique-se de que o StepAthleteSelection está nesta pasta
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const Inscricoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Controle de Fluxo: 0 = Fase, 1 = Modalidade, 2 = Atletas
  const [step, setStep] = useState(0); 
  const [selectedCompetition, setSelectedCompetition] = useState<string>("e897b931-ee83-4de8-848b-40c67a289cb2"); // ID JERs 2026
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Dados da Organização do Usuário (Sua Escola)
  const { data: userOrg } = useQuery({
    queryKey: ["user-org-full"],
    queryFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", prof.org_id).single();
      return org;
    }
  });

  // 2. Busca as Fases (Regionais e Finais)
  const { data: stages = [] } = useQuery({
    queryKey: ["stages-list", selectedCompetition],
    queryFn: async () => {
      const { data } = await supabase.from("competition_stages").select("*").eq("competition_id", selectedCompetition).order("stage_number");
      return data || [];
    }
  });

  // 3. Busca Modalidades/Categorias (Filtrando JERs vs JERPs automaticamente)
  const { data: availableRules = [] } = useQuery({
    queryKey: ["filtered-rules", selectedStage?.id],
    enabled: !!selectedStage && step === 1,
    queryFn: async () => {
      const isParalimpico = selectedStage.name.toLowerCase().includes("jerp") || selectedStage.stage_number === 99;
      const { data } = await supabase.from("competition_rules").select("*, modalities(*), categories(*)").eq("competition_id", selectedCompetition);
      
      return data?.filter((r: any) => {
        const isModPara = r.modalities.name.toLowerCase().includes("paralímpic") || r.modalities.name.toLowerCase().includes("bocha");
        return isParalimpico ? isModPara : !isModPara;
      }) || [];
    }
  });

  // 4. Salvar no Banco de Dados (Tabela registrations)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = enrolledAthletes.map(athlete => ({
        competition_id: selectedCompetition,
        stage_id: selectedStage.id,
        org_id: userOrg.id,
        modality_id: selectedRule.modality_id,
        category_id: selectedRule.category_id,
        athlete_id: athlete.id, // ID do participante vindo do StepAthleteSelection
        status: 'pending'
      }));

      const { error } = await supabase.from("registrations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipe inscrita com sucesso!");
      setStep(1); // Volta para escolher outra modalidade
      setEnrolledAthletes([]);
      queryClient.invalidateQueries({ queryKey: ["org-athletes-eligibility"] });
    },
    onError: (err: any) => toast.error("Erro: " + err.message)
  });

  if (!userOrg) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight uppercase">Inscrições JER's 2026</h2>
          <p className="text-muted-foreground">Escola: <span className="text-primary font-bold">{userOrg.name}</span> — Município: <span className="font-bold">{userOrg.city}</span></p>
        </div>
        {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
      </div>

      {/* PASSO 0: SELEÇÃO DA FASE (REGIONAL) */}
      {step === 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage: any) => {
            const isBlocked = stage.allowed_cities && !stage.allowed_cities.includes(userOrg.city);
            return (
              <Card 
                key={stage.id} 
                className={cn("relative p-4 cursor-pointer transition-all border-2", isBlocked ? "opacity-40 grayscale bg-muted" : "hover:border-primary shadow-sm")}
                onClick={() => !isBlocked && (setSelectedStage(stage), setStep(1))}
              >
                {isBlocked && <Lock className="absolute top-2 right-2 h-4 w-4 text-destructive" />}
                <h4 className="font-bold text-lg">{stage.name}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                  <MapPin className="h-3 w-3" /> {stage.city}
                </div>
                {isBlocked && <p className="text-[10px] text-destructive font-bold mt-2"> Regional Exclusiva </p>}
              </Card>
            );
          })}
        </div>
      )}

      {/* PASSO 1: SELEÇÃO DA MODALIDADE */}
      {step === 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {availableRules.map((rule: any) => (
            <Card 
              key={rule.id} 
              className="p-4 cursor-pointer hover:border-primary border-l-4 border-l-primary group" 
              onClick={() => (setSelectedRule(rule), setStep(2))}
            >
              <p className="font-bold text-sm group-hover:text-primary transition-colors">{rule.modalities.name}</p>
              <Badge variant="secondary" className="text-[9px] mt-2">{rule.categories.name}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* PASSO 2: SELEÇÃO DE ATLETAS */}
      {step === 2 && selectedRule && (
        <StepAthleteSelection 
          orgId={userOrg.id} 
          rule={selectedRule} 
          enrolled={enrolledAthletes} 
          onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])} 
          onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))} 
          onBack={() => setStep(1)} 
          onNext={() => saveMutation.mutate()} 
        />
      )}
    </div>
  );
};

export default Inscricoes;
