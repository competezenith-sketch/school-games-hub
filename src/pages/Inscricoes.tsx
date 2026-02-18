import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const Inscricoes = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); 
  const [selectedCompetition] = useState<string>("e897b931-ee83-4de8-848b-40c67a289cb2"); // 53º JER's
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  const { data: userOrg } = useQuery({
    queryKey: ["user-org"],
    queryFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("org_id, delegation_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", prof.org_id).single();
      return { ...org, delegation_id: prof.delegation_id };
    }
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages", selectedCompetition],
    queryFn: async () => {
      const { data } = await supabase.from("competition_stages").select("*").eq("competition_id", selectedCompetition).order("stage_number");
      return data || [];
    }
  });

  const { data: filteredRules = [] } = useQuery({
  queryKey: ["rules-step", selectedStage?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from("competition_rules")
      .select("*, modalities(*), categories(*)")
      .eq("competition_id", selectedCompetition);
    
    // FILTRO PARA NÃO REPETIR O ÍCONE DA MODALIDADE
    // Se a modalidade tem Mirim e Infantil, aqui no passo 1 só deve aparecer o esporte uma vez
    const uniqueModalities = [];
    const seenIds = new Set();

    data?.forEach(rule => {
      if (!seenIds.has(rule.modality_id)) {
        seenIds.add(rule.modality_id);
        uniqueModalities.push(rule);
      }
    });

    return uniqueModalities;
  }
});

  const saveAction = useMutation({
    mutationFn: async () => {
      // 1. Inscrição da Escola na Etapa
      await supabase.from("enrollments").upsert({ 
        competition_id: selectedCompetition, stage_id: selectedStage.id, org_id: userOrg.id 
      }, { onConflict: 'stage_id, org_id' });

      // 2. Inscrição dos Atletas
      const payload = enrolledAthletes.map(a => ({
        org_id: userOrg.id, participant_id: a.id, competition_rule_id: selectedRule.id,
        stage_id: selectedStage.id, delegation_id: userOrg.delegation_id
      }));
      const { error } = await supabase.from("inscriptions").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição concluída!");
      setStep(1); setEnrolledAthletes([]);
    }
  });

  if (!userOrg) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold uppercase tracking-tight">JER Digital 2026</h2>
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
      </div>

      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((s: any) => {
            const blocked = s.allowed_cities && !s.allowed_cities.includes(userOrg.city);
            return (
              <Card key={s.id} className={cn("p-4 cursor-pointer relative", blocked ? "opacity-40 grayscale" : "hover:border-primary")} onClick={() => !blocked && (setSelectedStage(s), setStep(1))}>
                {blocked && <Lock className="h-4 w-4 absolute top-2 right-2 text-destructive" />}
                <p className="font-bold text-sm uppercase">{s.name}</p>
                <p className="text-[10px] text-muted-foreground mt-2"><MapPin className="h-3 w-3 inline" /> {s.city}</p>
              </Card>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="grid md:grid-cols-4 gap-4">
          {filteredRules.map((r: any) => (
            <Card key={r.id} className="p-3 cursor-pointer hover:border-primary border-l-4 border-l-primary" onClick={() => (setSelectedRule(r), setStep(2))}>
              <p className="font-bold text-[13px] uppercase">{r.modalities.name}</p>
              <Badge variant="secondary" className="text-[9px] mt-1">{r.categories.name}</Badge>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && (
        <StepAthleteSelection orgId={userOrg.id} rule={selectedRule} stageId={selectedStage.id} enrolled={enrolledAthletes} onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])} onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))} onBack={() => setStep(1)} onNext={() => saveAction.mutate()} />
      )}
    </div>
  );
};

export default Inscricoes;
