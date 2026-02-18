import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, Calendar, Users, CheckCircle2, ChevronRight, AlertTriangle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── STEP 1: SELEÇÃO DE ETAPA (Com Trava Geográfica) ───
const StageSelectionStep = ({ competitionId, orgCity, onSelectStage }: any) => {
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["stages-list", competitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_stages")
        .select("*")
        .eq("competition_id", competitionId)
        .order("start_date");
      return data || [];
    }
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto" />;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stages.map((stage) => {
        // Lógica de Trava: Se allowed_cities existir e a cidade do user não estiver lá -> Bloqueia
        const isLocked = stage.allowed_cities && orgCity && !stage.allowed_cities.includes(orgCity);
        const isFinal = stage.stage_type === 'final';

        return (
          <button
            key={stage.id}
            disabled={isLocked || isFinal}
            onClick={() => onSelectStage(stage)}
            className={cn(
              "relative flex flex-col items-start p-4 rounded-xl border text-left transition-all",
              isLocked 
                ? "bg-muted/50 border-muted opacity-70 cursor-not-allowed" 
                : "bg-card hover:border-primary hover:shadow-md cursor-pointer",
              isFinal && "border-yellow-200 bg-yellow-50/50"
            )}
          >
            {isLocked && (
              <div className="absolute top-3 right-3 text-destructive">
                <Lock className="h-5 w-5" />
              </div>
            )}
            
            <div className="mb-2">
              <Badge variant={isFinal ? "secondary" : "outline"} className="mb-1">
                {isFinal ? "Fase Final" : "Regional"}
              </Badge>
              <h3 className="font-bold text-lg leading-tight">{stage.name}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {stage.city}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> 
                {new Date(stage.start_date).toLocaleDateString()}
              </div>
            </div>

            {isLocked && (
              <div className="mt-3 text-xs bg-destructive/10 text-destructive p-2 rounded w-full flex gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Exclusivo para escolas de: {stage.allowed_cities.join(", ")}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ───
const Inscricoes = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0: Etapa, 1: Modalidade, 2: Atletas
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null); // Regra da Modalidade Escolhida

  // 1. Dados do Usuário (Cidade)
  const { data: userOrg } = useQuery({
    queryKey: ["user-org-city", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      if (!profile) return null;
      const { data: org } = await supabase.from("organizations").select("*").eq("id", profile.org_id).single();
      return org;
    }
  });

  // 2. Competições Ativas
  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-active"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").eq("status", "published");
      return data || [];
    }
  });

  // 3. Regras (Modalidades disponíveis na competição)
  const { data: availableRules = [] } = useQuery({
    queryKey: ["competition-rules", selectedCompetition],
    enabled: !!selectedCompetition && step === 1,
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_rules")
        .select("*, modalities(*), categories(*)")
        .eq("competition_id", selectedCompetition)
        .order("modalities(name)");
      return data || [];
    }
  });

  // --- Handlers ---
  const handleStageSelect = (stage: any) => {
    setSelectedStage(stage);
    setStep(1);
  };

  const handleRuleSelect = (rule: any) => {
    setSelectedRule(rule);
    setStep(2);
  };

  const reset = () => {
    setStep(0);
    setSelectedStage(null);
    setSelectedRule(null);
  };

  if (!userOrg) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-tight">Inscrições</h1>
          <p className="text-muted-foreground">
            {step === 0 && "Selecione a etapa onde sua escola irá competir."}
            {step === 1 && `Inscrevendo para: ${selectedStage?.name}`}
            {step === 2 && `Selecionando atletas para ${selectedRule?.modalities.name} - ${selectedRule?.categories.name}`}
          </p>
        </div>
        {step > 0 && (
          <Button variant="outline" onClick={reset}>Trocar Etapa</Button>
        )}
      </div>

      {/* Seleção de Competição (Se houver mais de uma) */}
      {!selectedCompetition && (
        <Card>
          <CardHeader><CardTitle>Selecione o Campeonato</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {competitions.map(comp => (
                <Button key={comp.id} variant="outline" className="h-auto p-6 justify-start text-left" onClick={() => setSelectedCompetition(comp.id)}>
                  <div>
                    <div className="font-bold text-lg">{comp.name}</div>
                    <div className="text-sm text-muted-foreground">{comp.year}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedCompetition && (
        <>
          {/* STEP 0: ESCOLHA DA ETAPA */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                <MapPin className="h-4 w-4" />
                Sua Escola está registrada em: <strong>{userOrg.city}</strong>. Apenas etapas permitidas estarão disponíveis.
              </div>
              <StageSelectionStep 
                competitionId={selectedCompetition} 
                orgCity={userOrg.city} 
                onSelectStage={handleStageSelect} 
              />
            </div>
          )}

          {/* STEP 1: ESCOLHA DA MODALIDADE */}
          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableRules.map((rule: any) => (
                <Card key={rule.id} className="cursor-pointer hover:border-primary transition-all" onClick={() => handleRuleSelect(rule)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center font-bold",
                      rule.modalities.type === 'coletivo' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                    )}>
                      {rule.modalities.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold">{rule.modalities.name}</h4>
                      <Badge variant="secondary" className="mt-1">{rule.categories.name}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* STEP 2: INSCRIÇÃO DE ATLETAS (Placeholder para lógica complexa) */}
          {step === 2 && selectedRule && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Atletas</CardTitle>
                <CardDescription>
                  Adicione atletas nascidos entre {selectedRule.categories.year_min} e {selectedRule.categories.year_max}.
                  <br/>Limite: {selectedRule.rules_config.max_athletes} atletas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>Aqui virá o componente de seleção de atletas (StepAthleteSelection)</p>
                  <Button className="mt-4" onClick={() => toast.success("Inscrição Realizada!")}>
                    Finalizar Inscrição
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Inscricoes;
