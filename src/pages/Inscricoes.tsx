import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const Inscricoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0); 
  const [selectedCompetition] = useState("e897b931-ee83-4de8-848b-40c67a289cb2");
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Busca perfil e Organização (SaaS ready)
  const { data: userContext } = useQuery({
    queryKey: ["user-context", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("org_id, delegation_id").eq("user_id", user!.id).single();
      const { data: org } = await supabase.from("organizations").select("*").eq("id", prof.org_id).single();
      return { ...org, delegation_id: prof.delegation_id };
    }
  });

  // 2. Busca Etapas do Evento (Regional/Estadual)
  const { data: stages = [] } = useQuery({
    queryKey: ["stages", selectedCompetition],
    queryFn: async () => {
      const { data } = await supabase.from("competition_stages").select("*").eq("competition_id", selectedCompetition).order("stage_number");
      return data || [];
    }
  });

  // 3. Busca o Catálogo Único de Provas (A "Tabela Única")
  const { data: offerings = [], isLoading: loadingRules } = useQuery({
    queryKey: ["event-catalog", selectedCompetition, selectedStage?.id],
    enabled: !!selectedStage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select(`
          *,
          modalities (id, name, type),
          categories (id, name)
        `)
        .eq("competition_id", selectedCompetition);
      
      if (error) throw error;
      return data;
    }
  });

  // 4. Salvar Inscrição (Apenas na tabela única 'inscriptions')
  const saveAction = useMutation({
    mutationFn: async () => {
      if (!enrolledAthletes.length) throw new Error("Selecione ao menos um atleta.");

      const payload = enrolledAthletes.map(athlete => ({
        org_id: userContext.id,
        participant_id: athlete.id,
        competition_rule_id: selectedRule.id,
        status: 'confirmado'
      }));

      const { error } = await supabase.from("inscriptions").insert(payload);
      if (error) {
        if (error.code === '23505') throw new Error("Um ou mais atletas já estão inscritos nesta prova!");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-inscriptions"] });
      setStep(1); // Volta para a seleção de modalidades
      setEnrolledAthletes([]);
      setSelectedRule(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (!userContext) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-primary">JER Digital 2026</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold">{userContext.name}</p>
        </div>
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
      </header>

      {/* PASSO 0: Seleção da Etapa (Regional) */}
      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {stages.map((s: any) => {
            const blocked = s.allowed_cities && !s.allowed_cities.includes(userContext.city);
            return (
              <Card 
                key={s.id} 
                className={cn(
                  "p-6 cursor-pointer transition-all border-2", 
                  blocked ? "opacity-40 grayscale cursor-not-allowed" : "hover:border-primary border-transparent bg-muted/30"
                )} 
                onClick={() => !blocked && (setSelectedStage(s), setStep(1))}
              >
                <div className="flex justify-between items-start">
                  <p className="font-black text-lg uppercase leading-tight">{s.name}</p>
                  {blocked ? <Lock className="h-4 w-4 text-destructive" /> : <MapPin className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">{s.city}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* PASSO 1: Catálogo de Modalidades (Vem da Tabela Mestre) */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/10">
            <p className="text-sm font-bold uppercase">Modalidades disponíveis para {selectedStage.name}</p>
            <Badge variant="outline">{offerings.length} Provas</Badge>
          </div>
          
          <div className="grid md:grid-cols-4 gap-3">
            {offerings.map((rule: any) => (
              <Card 
                key={rule.id} 
                className="p-4 cursor-pointer hover:bg-primary/5 hover:border-primary transition-colors border-l-4 border-l-primary" 
                onClick={() => { setSelectedRule(rule); setStep(2); }}
              >
                <p className="font-black text-sm uppercase truncate">{rule.modalities.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-[9px] bg-primary/10 text-primary border-none">{rule.categories.name}</Badge>
                  <span className="text-[9px] text-muted-foreground font-bold">LMT: {rule.max_athletes}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* PASSO 2: Seleção de Atletas (Com as travas da regra selecionada) */}
      {step === 2 && selectedRule && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <StepAthleteSelection 
            orgId={userContext.id} 
            rule={selectedRule} // Agora o objeto 'rule' já contém min_athletes e max_athletes
            stageId={selectedStage.id} 
            enrolled={enrolledAthletes} 
            onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])} 
            onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))} 
            onBack={() => setStep(1)} 
            onNext={() => saveAction.mutate()} 
          />
        </div>
      )}
    </div>
  );
};

export default Inscricoes;
