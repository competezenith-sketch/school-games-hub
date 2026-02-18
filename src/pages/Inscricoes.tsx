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
  const [selectedCompetition, setSelectedCompetition] = useState<string>("e897b931-ee83-4de8-848b-40c67a289cb2"); // ID JER's 2026
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  const { data: userOrg } = useQuery({
    queryKey: ["user-org"],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", profile.org_id).single();
      return org;
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
    queryKey: ["rules", selectedCompetition, selectedStage?.id],
    enabled: !!selectedStage && step === 1,
    queryFn: async () => {
      const isParalimpico = selectedStage.name.toLowerCase().includes("paralímpic") || selectedStage.stage_number === 99;
      const { data } = await supabase.from("competition_rules").select("*, modalities(*), categories(*)").eq("competition_id", selectedCompetition);
      
      return data?.filter((r: any) => {
        const isModPara = r.modalities.name.toLowerCase().includes("paralímpic") || r.modalities.name.toLowerCase().includes("bocha");
        return isParalimpico ? isModPara : !isModPara;
      }) || [];
    }
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = enrolledAthletes.map(a => ({
        competition_id: selectedCompetition, stage_id: selectedStage.id, org_id: userOrg.id,
        modality_id: selectedRule.modality_id, category_id: selectedRule.category_id, athlete_id: a.id
      }));
      const { error } = await supabase.from("registrations").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição salva!");
      setStep(1); setEnrolledAthletes([]);
    }
  });

  if (!userOrg) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Inscrições JER's 2026</h2>
        {step > 0 && <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Voltar</Button>}
      </div>

      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((s: any) => {
            const blocked = s.allowed_cities && !s.allowed_cities.includes(userOrg.city);
            return (
              <Card key={s.id} className={cn("p-4 cursor-pointer relative", blocked ? "opacity-40 grayscale" : "hover:border-primary")} onClick={() => !blocked && (setSelectedStage(s), setStep(1))}>
                {blocked && <Lock className="h-4 w-4 absolute top-2 right-2" />}
                <p className="font-bold text-sm">{s.name}</p>
                <p className="text-[10px] text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {s.city}</p>
              </Card>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <div className="grid md:grid-cols-4 gap-4">
          {filteredRules.map((r: any) => (
            <Card key={r.id} className="p-3 cursor-pointer hover:border-primary border-l-4 border-l-primary" onClick={() => (setSelectedRule(r), setStep(2))}>
              <p className="font-bold text-[13px]">{r.modalities.name}</p>
              <Badge variant="secondary" className="text-[9px] mt-1">{r.categories.name}</Badge>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && (
        <StepAthleteSelection orgId={userOrg.id} rule={selectedRule} enrolled={enrolledAthletes} onAdd={a => setEnrolledAthletes([...enrolledAthletes, a])} onRemove={id => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))} onBack={() => setStep(1)} onNext={() => save.mutate()} />
      )}
    </div>
  );
};

export default Inscricoes;
