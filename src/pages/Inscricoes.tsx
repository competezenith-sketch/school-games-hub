import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const Inscricoes = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); 
  const [selectedCompetition, setSelectedCompetition] = useState<string>("e897b931-ee83-4de8-848b-40c67a289cb2"); // ID JERs 2026
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Dados da Escola (Município)
  const { data: userOrg } = useQuery({
    queryKey: ["user-org-data"],
    queryFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", prof.org_id).single();
      return org;
    }
  });

  // 2. Etapas (Fases)
  const { data: stages = [] } = useQuery({
    queryKey: ["stages", selectedCompetition],
    queryFn: async () => {
      const { data } = await supabase.from("competition_stages").select("*").eq("competition_id", selectedCompetition).order("stage_number");
      return data || [];
    }
  });

  // 3. Modalidades Filtradas (JERs vs JERPs)
  const { data: filteredRules = [] } = useQuery({
    queryKey: ["rules-step", selectedStage?.id],
    enabled: !!selectedStage && step === 1,
    queryFn: async () => {
      const isJerps = selectedStage.name.toLowerCase().includes("jerp") || selectedStage.stage_number === 99;
      const { data } = await supabase.from("competition_rules").select("*, modalities(*), categories(*)").eq("competition_id", selectedCompetition);
      
      return data?.filter((r: any) => {
        const isModPara = r.modalities.name.toLowerCase().includes("paralímpic") || r.modalities.name.toLowerCase().includes("bocha");
        return isJerps ? isModPara : !isModPara;
      }) || [];
    }
  });

  // 4. Gravação no Banco
  const saveAction = useMutation({
    mutationFn: async () => {
      const payload = enrolledAthletes.map(a => ({
        competition_id: selectedCompetition,
        stage_id: selectedStage.id,
        org_id: userOrg.id,
        modality_id: selectedRule.modality_id,
        category_id: selectedRule.category_id,
        athlete_id: a.id
      }));
      const { error } = await supabase.from("registrations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição da equipe realizada!");
      setStep(1); setEnrolledAthletes([]);
    },
    onError: (err: any) => toast.error("Erro: " + err.message)
  });

  if (!userOrg) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel de Inscrições</h2>
          <p className="text-muted-foreground text-sm">{userOrg.name} — {userOrg.city}</p>
        </div>
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
      </div>

      {/* STEP 0: ETAPAS */}
      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((s: any) => {
            const blocked = s.allowed_cities && !s.allowed_cities.includes(userOrg.city);
            return (
              <Card key={s.id} className={cn("p-4 cursor-pointer relative border-2", blocked ? "opacity-50 grayscale bg-muted" : "hover:border-primary")} onClick={() => !blocked && (setSelectedStage(s), setStep(1))}>
                {blocked && <Lock className="h-4 w-4 absolute top-2 right-2 text-destructive" />}
                <h4 className="font-bold text-sm">{s.name}</h4>
                <div className="flex items-center gap-1 text-[10px] mt-2 text-muted-foreground">
                   <MapPin className="h-3 w-3" /> {s.city}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* STEP 1: MODALIDADES */}
      {step === 1 && (
        <div className="grid md:grid-cols-4 gap-4">
          {filteredRules.map((r: any) => (
            <Card key={r.id} className="p-4 cursor-pointer border-l-4 border-l-primary hover:shadow-md transition-all" onClick={() => (setSelectedRule(r), setStep(2))}>
              <p className="font-bold text-sm truncate">{r.modalities.name}</p>
              <Badge variant="secondary" className="text-[9px] mt-1">{r.categories.name}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* STEP 2: ATLETAS */}
      {step === 2 && (
        <StepAthleteSelection 
          orgId={userOrg.id} 
          rule={selectedRule} 
          enrolled={enrolledAthletes} 
          onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])} 
          onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))} 
          onBack={() => setStep(1)} 
          onNext={() => saveAction.mutate()} 
        />
      )}
    </div>
  );
};

export default Inscricoes;
