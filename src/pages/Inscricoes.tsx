import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Lock, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

// IMPORTANTE: Ajuste o caminho se necessário, conforme onde você criou o arquivo
import { StepAthleteSelection } from "@/components/ui/StepAthleteSelection";

// ─── COMPONENTE AUXILIAR: SELEÇÃO DE ETAPA ───
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
        // Lógica de Trava: Bloqueia se a cidade da escola não estiver na lista permitida da etapa
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
            {isLocked && <div className="absolute top-3 right-3 text-destructive"><Lock className="h-5 w-5" /></div>}
            
            <div className="mb-2">
              <Badge variant={isFinal ? "secondary" : "outline"} className="mb-1">
                {isFinal ? "Fase Final" : "Regional"}
              </Badge>
              <h3 className="font-bold text-lg leading-tight">{stage.name}</h3>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {stage.city}</div>
              <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(stage.start_date).toLocaleDateString()}</div>
            </div>

            {isLocked && (
              <div className="mt-3 text-xs bg-destructive/10 text-destructive p-2 rounded w-full flex gap-2">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>Exclusivo para: {stage.allowed_cities?.join(", ")}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── PÁGINA PRINCIPAL ───
const Inscricoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Estados de Controle
  const [step, setStep] = useState(0); // 0: Etapa, 1: Modalidade, 2: Atletas
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  
  // Estado Importante: Lista de Atletas Selecionados
  const [enrolledAthletes, setEnrolledAthletes] = useState<any[]>([]);

  // 1. Buscar Dados da Organização (Escola) do Usuário Logado
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

  // 2. Buscar Competições Ativas
  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-active"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").eq("status", "published");
      return data || [];
    }
  });

  // 3. Buscar Modalidades Disponíveis (Regras)
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

  // 4. Mutação para Salvar Inscrição no Banco
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!userOrg || !selectedStage || !selectedRule) throw new Error("Dados incompletos");

      // A. Primeiro, garante que a escola está inscrita na etapa (tabela enrollments)
      // Usamos upsert para não dar erro se já estiver inscrita
      const { error: enrollError } = await supabase
        .from("enrollments")
        .upsert({ 
          competition_id: selectedCompetition,
          stage_id: selectedStage.id,
          org_id: userOrg.id,
          status: 'pending'
        }, { onConflict: 'stage_id, org_id' });
      
      if (enrollError) throw enrollError;

      // B. Insere os atletas na tabela de registros (registrations)
      // Nota: Você precisa ter uma tabela 'registrations' ou similar. 
      // Se não tiver, rode o SQL de criação que enviei antes.
      const registrationsData = enrolledAthletes.map(athlete => ({
        competition_id: selectedCompetition,
        stage_id: selectedStage.id,
        org_id: userOrg.id,
        modality_id: selectedRule.modality_id,
        category_id: selectedRule.category_id,
        athlete_id: athlete.id,
        status: 'pending'
      }));

      const { error: regError } = await supabase
        .from("registrations")
        .insert(registrationsData);

      if (regError) throw regError;
    },
    onSuccess: () => {
      toast.success(`Inscrição realizada com sucesso!`, {
        description: `${enrolledAthletes.length} atletas inscritos em ${selectedRule.modalities.name}.`
      });
      // Reseta para o inicio ou para a seleção de modalidade
      setEnrolledAthletes([]);
      setStep(1); 
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar inscrição", { description: err.message });
    }
  });

  // --- Handlers ---

  const handleStageSelect = (stage: any) => {
    setSelectedStage(stage);
    setStep(1);
  };

  const handleRuleSelect = (rule: any) => {
    setSelectedRule(rule);
    setEnrolledAthletes([]); // Limpa seleção anterior ao mudar de modalidade
    setStep(2);
  };

  const handleFinishInscricao = () => {
    saveMutation.mutate();
  };

  const reset = () => {
    setStep(0);
    setSelectedStage(null);
    setSelectedRule(null);
    setEnrolledAthletes([]);
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
            {step === 2 && `Selecionando atletas para ${selectedRule?.modalities.name}`}
          </p>
        </div>
        {step > 0 && (
          <Button variant="outline" onClick={reset}>Trocar Etapa</Button>
        )}
      </div>

      {/* Seleção de Competição (Se não selecionada) */}
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
                Sua Escola está em: <strong>{userOrg.city}</strong>.
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
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setStep(0)} className="mb-2 pl-0 hover:bg-transparent hover:underline">
                ← Voltar para Etapas
              </Button>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableRules.map((rule: any) => (
                  <Card key={rule.id} className="cursor-pointer hover:border-primary transition-all group" onClick={() => handleRuleSelect(rule)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold transition-transform group-hover:scale-110",
                        rule.modalities.type === 'coletivo' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                      )}>
                        {rule.modalities.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold group-hover:text-primary">{rule.modalities.name}</h4>
                        <Badge variant="secondary" className="mt-1 text-[10px]">{rule.categories.name}</Badge>
                      </div>
                      <CheckCircle2 className="h-5 w-5 ml-auto text-muted-foreground/20 group-hover:text-primary" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: INSCRIÇÃO DE ATLETAS (Integração do seu Componente UI) */}
          {step === 2 && selectedRule && (
            <StepAthleteSelection
              orgId={userOrg.id}
              rule={selectedRule}
              enrolled={enrolledAthletes}
              
              // Adiciona Atleta ao Estado
              onAdd={(athlete) => {
                // Verifica se já existe só por segurança
                if (!enrolledAthletes.find(a => a.id === athlete.id)) {
                  setEnrolledAthletes(prev => [...prev, athlete]);
                }
              }}
              
              // Remove Atleta do Estado
              onRemove={(athleteId) => {
                setEnrolledAthletes(prev => prev.filter(a => a.id !== athleteId));
              }}
              
              // Botão Voltar do Componente
              onBack={() => setStep(1)}
              
              // Botão Avançar/Salvar do Componente
              onNext={handleFinishInscricao}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Inscricoes;
