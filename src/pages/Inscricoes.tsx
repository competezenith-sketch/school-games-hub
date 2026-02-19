import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, ChevronLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

const COMPETITION_ID = "e897b931-ee83-4de8-848b-40c67a289cb2";

const genderLabel: Record<string, string> = { M: "Masculino", F: "Feminino", X: "Misto" };
const modalityTypeLabel: Record<string, string> = { individual: "Individual", coletiva: "Coletiva" };

const Inscricoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Contexto do Usuário (Organização/Escola)
  const { data: userContext } = useQuery({
    queryKey: ["user-context", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("org_id, delegation_id")
        .eq("user_id", user!.id)
        .single();
      
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", prof.org_id)
        .single();
        
      return { ...org, delegation_id: prof.delegation_id };
    },
  });

  // 2. Busca de Etapas
  const { data: stages = [] } = useQuery({
    queryKey: ["stages", COMPETITION_ID],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_stages")
        .select("*")
        .eq("competition_id", COMPETITION_ID)
        .order("stage_number");
      return data || [];
    },
  });

  // 3. Catálogo de Provas Disponíveis
  const { data: offerings = [], isLoading: loadingRules } = useQuery({
    queryKey: ["event-catalog", COMPETITION_ID, selectedStage?.id],
    enabled: !!selectedStage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select(`
          *,
          modalities (id, name, type),
          categories (id, name, event_type, gender)
        `)
        .eq("competition_id", COMPETITION_ID);

      if (error) throw error;

      return (data ?? []).filter((rule: any) => {
        if (!rule.allowed_stage_types || rule.allowed_stage_types.length === 0) return true;
        return rule.allowed_stage_types.includes(selectedStage.stage_type);
      });
    },
  });

  // 4. Inscrições já existentes (para evitar duplicados na lista)
  const { data: myInscriptions = [] } = useQuery({
    queryKey: ["my-inscriptions-stage", COMPETITION_ID, selectedStage?.id, userContext?.id],
    enabled: !!selectedStage && !!userContext?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("inscriptions")
        .select("competition_rule_id")
        .eq("org_id", userContext.id)
        .not("status", "eq", "cancelada");
      return data ?? [];
    },
  });

  const inscribedRuleIds = new Set(myInscriptions.map((i: any) => i.competition_rule_id));

  // 5. Ação de Salvar Otimizada (Batch Insert)
  const saveAction = useMutation({
    mutationFn: async () => {
      if (!enrolledAthletes.length) throw new Error("Selecione ao menos um atleta.");

      // Prepara o lote de inserção
      const payload = enrolledAthletes.map((athlete) => ({
        org_id: userContext.id,
        participant_id: athlete.id,
        competition_rule_id: selectedRule.id,
        delegation_id: userContext.delegation_id ?? null,
        status: "pendente",
      }));

      const { error } = await supabase.from("inscriptions").insert(payload);
      
      if (error) {
        if (error.code === "23505") throw new Error("Atletas já inscritos nesta prova.");
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Inscrição enviada para validação!");
      queryClient.invalidateQueries({ queryKey: ["my-inscriptions-stage"] });
      setStep(1); // Volta para a lista de modalidades
      setEnrolledAthletes([]);
      setSelectedRule(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const grouped = offerings.reduce((acc: Record<string, any[]>, rule: any) => {
    const key = rule.modalities?.name ?? "Outras";
    if (!acc[key]) acc[key] = [];
    acc[key].push(rule);
    return acc;
  }, {});

  if (!userContext) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-xl font-black uppercase text-primary tracking-tighter">JER Digital 2026</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">{userContext.name}</p>
        </div>
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStep(step - 1); setEnrolledAthletes([]); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
      </header>

      {/* ETAPA 0: Seleção da Fase dos Jogos */}
      {step === 0 && (
        <div className="grid md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95">
          {stages.map((s: any) => {
            const blocked = s.allowed_cities && !s.allowed_cities.includes(userContext.city);
            return (
              <Card key={s.id} className={cn("p-5 cursor-pointer border-2 transition-all", blocked ? "opacity-40 grayscale" : "hover:border-primary bg-card")} onClick={() => !blocked && (setSelectedStage(s), setStep(1))}>
                <div className="flex justify-between items-start">
                  <p className="font-bold uppercase text-sm">{s.name}</p>
                  {blocked ? <Lock className="h-4 w-4 text-destructive" /> : <MapPin className="h-4 w-4 text-primary" />}
                </div>
                <Badge variant="secondary" className="mt-4 text-[9px] uppercase">{s.stage_type || "Etapa"}</Badge>
              </Card>
            );
          })}
        </div>
      )}

      {/* ETAPA 1: Catálogo de Modalidades */}
      {step === 1 && (
        <div className="space-y-6">
          {loadingRules ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : offerings.length === 0 ? (
            <Card className="p-10 text-center"><ShieldAlert className="mx-auto h-8 w-8 mb-2 opacity-20" /><p className="text-sm opacity-50">Nenhuma modalidade disponível.</p></Card>
          ) : (
            Object.entries(grouped).map(([name, rules]) => (
              <div key={name} className="space-y-3">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-l-2 border-primary pl-2">{name}</h4>
                <div className="grid md:grid-cols-4 gap-3">
                  {(rules as any[]).map((rule) => {
                    const enrolled = inscribedRuleIds.has(rule.id);
                    return (
                      <Card key={rule.id} className={cn("p-4 cursor-pointer hover:shadow-md transition-all", enrolled && "bg-green-50/50 border-green-200")} onClick={() => !enrolled && (setSelectedRule(rule), setStep(2))}>
                        <p className="text-xs font-bold uppercase truncate">{rule.categories?.name}</p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-[8px]">{genderLabel[rule.categories?.gender] || rule.categories?.gender}</Badge>
                          <Badge variant="secondary" className="text-[8px]">{modalityTypeLabel[rule.modality_type]}</Badge>
                        </div>
                        {enrolled && <p className="text-[9px] text-green-600 font-bold mt-2 uppercase flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Inscrito</p>}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ETAPA 2: Seleção de Atletas (Componente StepAthleteSelection) */}
      {step === 2 && selectedRule && (
        <StepAthleteSelection
          orgId={userContext.id}
          rule={selectedRule}
          enrolled={enrolledAthletes}
          onAdd={(a) => setEnrolledAthletes([...enrolledAthletes, a])}
          onRemove={(id) => setEnrolledAthletes(enrolledAthletes.filter(x => x.id !== id))}
          onBack={() => setStep(1)}
          onNext={() => saveAction.mutate()}
        />
      )}

      {saveAction.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
            <p className="text-xs font-bold uppercase animate-pulse">Gravando Inscrições...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inscricoes;
