import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // 1. Perfil e organização
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

  // 2. Etapas
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

  // 3. Catálogo de provas — filtrado por allowed_stage_types e com gênero da categoria
  const { data: offerings = [], isLoading: loadingRules } = useQuery({
    queryKey: ["event-catalog", COMPETITION_ID, selectedStage?.id, selectedStage?.stage_type],
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

      // Filtrar pelo stage_type da etapa selecionada
      // allowed_stage_types NULL = disponível em todas as etapas
      return (data ?? []).filter((rule: any) => {
        if (!rule.allowed_stage_types || rule.allowed_stage_types.length === 0) return true;
        return rule.allowed_stage_types.includes(selectedStage.stage_type);
      });
    },
  });

  // 4. Inscrições já realizadas pela delegação nesta etapa (para mostrar badge "já inscrito")
  const { data: myInscriptions = [] } = useQuery({
    queryKey: ["my-inscriptions-stage", COMPETITION_ID, selectedStage?.id, userContext?.id],
    enabled: !!selectedStage && !!userContext?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("inscriptions")
        .select("competition_rule_id, status")
        .eq("org_id", userContext.id)
        .not("status", "eq", "cancelada");
      return data ?? [];
    },
  });

  const inscribedRuleIds = new Set(myInscriptions.map((i: any) => i.competition_rule_id));

  // 5. Salvar inscrição
  const saveAction = useMutation({
    mutationFn: async () => {
      if (!enrolledAthletes.length) throw new Error("Selecione ao menos um atleta.");

      const payload = enrolledAthletes.map((athlete) => ({
        org_id: userContext.id,
        participant_id: athlete.id,
        competition_rule_id: selectedRule.id,
        delegation_id: userContext.delegation_id ?? null,
        status: "pendente",
      }));

      const { error } = await supabase.from("inscriptions").insert(payload);
      if (error) {
        if (error.code === "23505") throw new Error("Um ou mais atletas já estão inscritos nesta prova!");
        // Captura erro do trigger de modalidade 1+1
        if (error.message?.includes("Máximo")) throw new Error(error.message);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Inscrição realizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["my-inscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["my-inscriptions-stage"] });
      setStep(1);
      setEnrolledAthletes([]);
      setSelectedRule(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Agrupar offerings por modalidade para exibição organizada
  const grouped = offerings.reduce((acc: Record<string, any[]>, rule: any) => {
    const key = rule.modalities?.name ?? "Outras";
    if (!acc[key]) acc[key] = [];
    acc[key].push(rule);
    return acc;
  }, {});

  if (!userContext)
    return (
      <div className="p-20 flex justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tighter text-primary">JER Digital 2026</h2>
          <p className="text-xs text-muted-foreground uppercase font-bold">{userContext.name}</p>
        </div>
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => { setStep(step - 1); setEnrolledAthletes([]); setSelectedRule(null); }}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        )}
      </header>

      {/* PASSO 0: Seleção da Etapa */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Selecione a etapa</p>
          <div className="grid md:grid-cols-3 gap-4">
            {stages.map((s: any) => {
              const blocked = s.allowed_cities && !s.allowed_cities.includes(userContext.city);
              return (
                <Card
                  key={s.id}
                  className={cn(
                    "p-6 cursor-pointer transition-all border-2",
                    blocked
                      ? "opacity-40 grayscale cursor-not-allowed"
                      : "hover:border-primary border-transparent bg-muted/30"
                  )}
                  onClick={() => !blocked && (setSelectedStage(s), setStep(1))}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-black text-lg uppercase leading-tight">{s.name}</p>
                    {blocked ? (
                      <Lock className="h-4 w-4 text-destructive" />
                    ) : (
                      <MapPin className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-4 uppercase tracking-widest">{s.city}</p>
                  {s.stage_type && (
                    <Badge variant="outline" className="text-[9px] mt-2 uppercase">
                      {s.stage_type}
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* PASSO 1: Catálogo de Modalidades */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-primary/5 p-4 rounded-lg flex items-center justify-between border border-primary/10">
            <div>
              <p className="text-sm font-bold uppercase">Modalidades — {selectedStage.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase mt-0.5">
                {offerings.length} prova(s) disponível(is) para esta etapa
              </p>
            </div>
            <Badge variant="outline">{selectedStage.stage_type ?? "etapa"}</Badge>
          </div>

          {loadingRules ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : offerings.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                Nenhuma modalidade disponível para esta etapa.
              </p>
            </Card>
          ) : (
            Object.entries(grouped).map(([modalityName, rules]) => (
              <div key={modalityName}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  {modalityName}
                </p>
                <div className="grid md:grid-cols-4 gap-3">
                  {(rules as any[]).map((rule: any) => {
                    const alreadyEnrolled = inscribedRuleIds.has(rule.id);
                    return (
                      <Card
                        key={rule.id}
                        className={cn(
                          "p-4 transition-colors border-l-4",
                          alreadyEnrolled
                            ? "border-l-green-500 bg-green-50/40 cursor-default opacity-80"
                            : "border-l-primary cursor-pointer hover:bg-primary/5 hover:border-primary"
                        )}
                        onClick={() => {
                          if (alreadyEnrolled) return;
                          setSelectedRule(rule);
                          setStep(2);
                        }}
                      >
                        <p className="font-black text-sm uppercase truncate">{rule.modalities?.name}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <Badge className="text-[9px] bg-primary/10 text-primary border-none">
                            {rule.categories?.name}
                          </Badge>
                          {rule.categories?.gender && rule.categories.gender !== "misto" && (
                            <Badge variant="outline" className="text-[9px]">
                              {genderLabel[rule.categories.gender] ?? rule.categories.gender}
                            </Badge>
                          )}
                          {rule.modality_type && (
                            <Badge variant="secondary" className="text-[9px]">
                              {modalityTypeLabel[rule.modality_type] ?? rule.modality_type}
                            </Badge>
                          )}
                          {rule.max_athletes && (
                            <span className="text-[9px] text-muted-foreground font-bold ml-auto">
                              LMT: {rule.max_athletes}
                            </span>
                          )}
                        </div>
                        {alreadyEnrolled && (
                          <div className="flex items-center gap-1 mt-2 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[9px] font-bold uppercase">Inscrito</span>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PASSO 2: Seleção de Atletas */}
      {step === 2 && selectedRule && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <StepAthleteSelection
            orgId={userContext.id}
            rule={selectedRule}
            enrolled={enrolledAthletes}
            onAdd={(a: any) => setEnrolledAthletes([...enrolledAthletes, a])}
            onRemove={(id: string) => setEnrolledAthletes(enrolledAthletes.filter((x) => x.id !== id))}
            onBack={() => setStep(1)}
            onNext={() => saveAction.mutate()}
          />
          {saveAction.isPending && (
            <div className="flex justify-center pt-4">
              <Loader2 className="animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inscricoes;
