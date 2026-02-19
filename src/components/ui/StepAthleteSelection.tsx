import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, UserPlus, UserMinus, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAfter } from "date-fns";

interface Props {
  orgId: string;
  rule: any; // Recebe a regra com min_athletes, max_athletes, category (year_min/max)
  enrolled: any[];
  onAdd: (athlete: any) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: Props) => {
  const MATRICULA_LIMITE = new Date("2026-03-06");

  // 1. Busca atletas da escola que cumprem o requisito de IDADE da categoria
  const { data: eligibleAthletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("org_id", orgId)
        .eq("role", "atleta")
        // Filtro de gênero (se a regra não for mista 'X')
        .filter("sex", rule.gender_restriction === 'X' ? 'in' : 'eq', 
                rule.gender_restriction === 'X' ? '(M,F)' : rule.gender_restriction);

      if (!data) return [];

      // Filtro de Idade baseado no ano de nascimento definido na categoria
      const yearMin = rule.categories.year_min;
      const yearMax = rule.categories.year_max;

      return data.filter(a => {
        const birthYear = new Date(a.birth_date).getFullYear();
        return birthYear >= yearMin && birthYear <= yearMax;
      });
    }
  });

  const isLimitReached = enrolled.length >= rule.max_athletes;
  const isMinReached = enrolled.length >= rule.min_athletes;

  return (
    <div className="space-y-6">
      {/* Header de Status da Modalidade */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase text-lg">{rule.modalities.name}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase">{rule.categories.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Vagas Preenchidas</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-black", isLimitReached ? "text-primary" : "text-foreground")}>
                {enrolled.length} / {rule.max_athletes}
              </span>
            </div>
          </div>
        </div>
        
        {!isMinReached && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded text-[10px] font-bold uppercase">
            <Info className="h-3 w-3" /> Mínimo de {rule.min_athletes} atletas necessário para validar a equipe.
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lista de Atletas Elegíveis */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Atletas Elegíveis (Escola)</p>
          <ScrollArea className="h-[400px] pr-4">
            {eligibleAthletes.map((athlete) => {
              const isSelected = enrolled.some(e => e.id === athlete.id);
              const invalidEnrollment = athlete.enrollment_date && isAfter(new Date(athlete.enrollment_date), MATRICULA_LIMITE);

              return (
                <Card 
                  key={athlete.id} 
                  className={cn(
                    "p-3 mb-2 flex items-center justify-between transition-all",
                    isSelected ? "bg-primary/10 border-primary" : "hover:border-primary/50",
                    invalidEnrollment && "opacity-60 grayscale-[0.5]"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs uppercase truncate">{athlete.full_name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[9px] text-muted-foreground uppercase">Nasc: {new Date(athlete.birth_date).getFullYear()}</span>
                      {invalidEnrollment && (
                        <Badge variant="destructive" className="text-[7px] h-3 uppercase">Matrícula Fora do Prazo</Badge>
                      )}
                    </div>
                  </div>
                  
                  {isSelected ? (
                    <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => onRemove(athlete.id)}>
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-8 w-8" 
                      disabled={isLimitReached || invalidEnrollment}
                      onClick={() => onAdd(athlete)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              );
            })}
          </ScrollArea>
        </div>

        {/* Resumo da Inscrição Atual */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Composição da Equipe</p>
          <div className="bg-muted/30 rounded-lg p-4 h-[400px] border-2 border-dashed flex flex-col">
            {enrolled.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Users className="h-10 w-10 mb-2" />
                <p className="text-[10px] font-bold uppercase">Nenhum atleta selecionado</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {enrolled.map((athlete) => (
                  <div key={athlete.id} className="flex items-center gap-2 bg-background p-2 rounded mb-2 border">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[10px] font-bold uppercase truncate">{athlete.full_name}</span>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button 
          disabled={!isMinReached}import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, UserPlus, UserMinus, AlertTriangle, Info, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAfter } from "date-fns";

const MATRICULA_LIMITE = new Date("2026-03-06");

interface Props {
  orgId: string;
  rule: any; // min_athletes, max_athletes, modality_type, gender_restriction, category (year_min/max, event_type)
  enrolled: any[];
  onAdd: (athlete: any) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

// Razões pelas quais um atleta pode ser bloqueado
type BlockReason = "limite" | "matricula" | "genero" | "modalidade_individual" | "modalidade_coletiva" | null;

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: Props) => {

  // 1. Atletas elegíveis por faixa etária
  const { data: eligibleAthletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("participants")
        .select("id, full_name, birth_date, sex, enrollment_date, org_id")
        .eq("org_id", orgId)
        .eq("role", "atleta");

      if (!data) return [];

      const yearMin = rule.categories?.year_min ?? rule.category?.year_min;
      const yearMax = rule.categories?.year_max ?? rule.category?.year_max;

      return data.filter((a) => {
        const birthYear = new Date(a.birth_date).getFullYear();
        return birthYear >= yearMin && birthYear <= yearMax;
      });
    },
  });

  // 2. Inscrições ativas destes atletas (para verificar regra 1+1)
  const athleteIds = eligibleAthletes.map((a: any) => a.id);
  const { data: existingInscriptions = [] } = useQuery({
    queryKey: ["athlete-inscriptions-check", athleteIds, rule.competition_id],
    enabled: athleteIds.length > 0,
    queryFn: async () => {
      if (athleteIds.length === 0) return [];
      const { data } = await supabase
        .from("inscriptions")
        .select(`
          participant_id,
          competition_rule:competition_rules(modality_type, competition_id)
        `)
        .in("participant_id", athleteIds)
        .not("status", "eq", "cancelada");

      return (data ?? []).filter(
        (i: any) => i.competition_rule?.competition_id === rule.competition_id
      );
    },
  });

  // Mapa: participant_id → tipos de modalidade já inscritos
  const inscriptionMap: Record<string, Set<string>> = {};
  for (const i of existingInscriptions as any[]) {
    const pid = i.participant_id;
    const mtype = i.competition_rule?.modality_type;
    if (!inscriptionMap[pid]) inscriptionMap[pid] = new Set();
    if (mtype) inscriptionMap[pid].add(mtype);
  }

  const modalityType: string = rule.modality_type ?? "coletiva";
  const genderRestriction: string = rule.gender_restriction ?? "X";
  const isJerps: boolean = rule.categories?.event_type === "jerps" || rule.category?.event_type === "jerps";

  // Determina o motivo de bloqueio de um atleta (ou null se pode ser adicionado)
  const getBlockReason = (athlete: any): BlockReason => {
    if (enrolled.some((e) => e.id === athlete.id)) return null; // já selecionado, botão de remover aparece

    // Limite de vagas atingido
    if (enrolled.length >= rule.max_athletes) return "limite";

    // Matrícula fora do prazo
    if (athlete.enrollment_date && isAfter(new Date(athlete.enrollment_date), MATRICULA_LIMITE))
      return "matricula";

    // Gênero incompatível (X = misto, aceita todos)
    if (genderRestriction !== "X" && athlete.sex !== genderRestriction) return "genero";

    // Regra 1+1: verificar inscrições existentes no mesmo campeonato
    const existing = inscriptionMap[athlete.id];
    if (existing) {
      if (modalityType === "individual" && existing.has("individual")) return "modalidade_individual";
      // JERP's: só 1 individual, sem coletiva
      if (isJerps && modalityType === "coletiva") return "modalidade_coletiva";
      if (!isJerps && modalityType === "coletiva" && existing.has("coletiva")) return "modalidade_coletiva";
    }

    return null;
  };

  const blockMessages: Record<string, string> = {
    limite: "Limite de atletas atingido",
    matricula: "Matrícula fora do prazo (máx. 06/03/2026)",
    genero: `Categoria restrita ao sexo ${genderRestriction === "M" ? "masculino" : "feminino"}`,
    modalidade_individual: "Atleta já inscrito em uma modalidade individual neste campeonato",
    modalidade_coletiva: isJerps
      ? "JERP's: apenas 1 modalidade individual por atleta"
      : "Atleta já inscrito em uma modalidade coletiva neste campeonato",
  };

  const isLimitReached = enrolled.length >= rule.max_athletes;
  const isMinReached = enrolled.length >= (rule.min_athletes ?? 1);

  return (
    <div className="space-y-6">
      {/* Header da modalidade */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase text-lg">{rule.modalities?.name ?? rule.modality?.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                {rule.categories?.name ?? rule.category?.name}
              </p>
              {genderRestriction !== "X" && (
                <Badge variant="outline" className="text-[9px] h-4 uppercase">
                  {genderRestriction === "M" ? "Masculino" : "Feminino"}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[9px] h-4 uppercase">
                {modalityType}
              </Badge>
              {isJerps && (
                <Badge className="text-[9px] h-4 uppercase bg-purple-100 text-purple-700 border-purple-200">
                  JERP's
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Vagas Preenchidas</p>
            <span className={cn("text-2xl font-black", isLimitReached ? "text-primary" : "text-foreground")}>
              {enrolled.length} / {rule.max_athletes}
            </span>
          </div>
        </div>

        {!isMinReached && (
          <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded text-[10px] font-bold uppercase">
            <Info className="h-3 w-3 shrink-0" />
            Mínimo de {rule.min_athletes} atleta(s) necessário para validar.
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Atletas elegíveis */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Atletas Elegíveis ({eligibleAthletes.length})
          </p>
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <p className="text-xs text-muted-foreground text-center pt-8">Carregando...</p>
            ) : eligibleAthletes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center pt-8">Nenhum atleta elegível encontrado.</p>
            ) : (
              eligibleAthletes.map((athlete: any) => {
                const isSelected = enrolled.some((e) => e.id === athlete.id);
                const blockReason = isSelected ? null : getBlockReason(athlete);
                const isBlocked = blockReason !== null;

                return (
                  <Card
                    key={athlete.id}
                    className={cn(
                      "p-3 mb-2 flex items-center justify-between transition-all",
                      isSelected && "bg-primary/10 border-primary",
                      isBlocked && !isSelected && "opacity-50",
                      !isSelected && !isBlocked && "hover:border-primary/50"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-xs uppercase truncate">{athlete.full_name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[9px] text-muted-foreground uppercase">
                          Nasc: {new Date(athlete.birth_date).getFullYear()}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase">
                          {athlete.sex === "M" ? "Masc" : "Fem"}
                        </span>
                        {isBlocked && blockReason !== "limite" && (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-0.5 text-[9px] text-red-500 uppercase font-bold cursor-help">
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {blockReason === "matricula" && "Matrícula"}
                                  {blockReason === "genero" && "Gênero"}
                                  {(blockReason === "modalidade_individual" || blockReason === "modalidade_coletiva") && "1+1"}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="text-xs max-w-[200px]">
                                {blockMessages[blockReason]}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {isSelected ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive h-8 w-8 shrink-0"
                        onClick={() => onRemove(athlete.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    ) : (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                disabled={isBlocked}
                                onClick={() => onAdd(athlete)}
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {isBlocked && (
                            <TooltipContent side="left" className="text-xs max-w-[200px]">
                              {blockMessages[blockReason!]}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </Card>
                );
              })
            )}
          </ScrollArea>
        </div>

        {/* Composição da equipe */}
        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Composição da Equipe ({enrolled.length}/{rule.max_athletes})
          </p>
          <div className="bg-muted/30 rounded-lg p-4 h-[400px] border-2 border-dashed flex flex-col">
            {enrolled.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Users className="h-10 w-10 mb-2" />
                <p className="text-[10px] font-bold uppercase">Nenhum atleta selecionado</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {enrolled.map((athlete: any) => (
                  <div
                    key={athlete.id}
                    className="flex items-center gap-2 bg-background p-2 rounded mb-2 border"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase truncate block">{athlete.full_name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {athlete.sex === "M" ? "Masculino" : "Feminino"} · {new Date(athlete.birth_date).getFullYear()}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive h-6 w-6 shrink-0"
                      onClick={() => onRemove(athlete.id)}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button disabled={!isMinReached} onClick={onNext} className="px-10">
          Finalizar Inscrição
        </Button>
      </div>
    </div>
  );
};
          onClick={onNext}
          className="px-10"
        >
          Finalizar Inscrição
        </Button>
      </div>
    </div>
  );
};
