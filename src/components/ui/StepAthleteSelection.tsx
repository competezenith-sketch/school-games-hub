import { useQuery } from "@tanstack/react-query";
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
  rule: any;
  enrolled: any[];
  onAdd: (athlete: any) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}

type BlockReason = "limite" | "matricula" | "genero" | "modalidade_individual" | "modalidade_coletiva" | null;

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: Props) => {
  const genderRestriction: string = rule.gender_restriction ?? "X";
  const yearMin = rule.categories?.year_min ?? rule.category?.year_min;
  const yearMax = rule.categories?.year_max ?? rule.category?.year_max;
  const modalityType: string = rule.modality_type ?? "coletiva";
  const isJerps: boolean = rule.categories?.event_type === "jerps" || rule.category?.event_type === "jerps";

  // 1. Busca Atletas já filtrando Gênero no Banco (Mais eficiente)
  const { data: eligibleAthletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.category_id, genderRestriction],
    queryFn: async () => {
      let query = supabase
        .from("participants")
        .select("id, full_name, birth_date, sex, enrollment_date, org_id")
        .eq("org_id", orgId)
        .eq("role", "atleta");

      // Filtro direto no Supabase
      if (genderRestriction !== "X") {
        query = query.eq("sex", genderRestriction);
      }

      const { data } = await query;
      if (!data) return [];

      // Filtro de idade
      return data.filter((a) => {
        const birthYear = new Date(a.birth_date).getFullYear();
        return birthYear >= yearMin && birthYear <= yearMax;
      });
    },
  });

  // 2. Busca Inscrições Ativas
  const athleteIds = eligibleAthletes.map((a: any) => a.id);
  const { data: existingInscriptions = [] } = useQuery({
    queryKey: ["athlete-inscriptions-check", athleteIds, rule.competition_id],
    enabled: athleteIds.length > 0,
    queryFn: async () => {
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

  const inscriptionMap: Record<string, Set<string>> = {};
  for (const i of existingInscriptions as any[]) {
    const pid = i.participant_id;
    const mtype = i.competition_rule?.modality_type;
    if (!inscriptionMap[pid]) inscriptionMap[pid] = new Set();
    if (mtype) inscriptionMap[pid].add(mtype);
  }

  const getBlockReason = (athlete: any): BlockReason => {
    if (enrolled.some((e) => e.id === athlete.id)) return null;
    if (enrolled.length >= rule.max_athletes) return "limite";
    if (athlete.enrollment_date && isAfter(new Date(athlete.enrollment_date), MATRICULA_LIMITE))
      return "matricula";
    if (genderRestriction !== "X" && athlete.sex !== genderRestriction) return "genero";

    const existing = inscriptionMap[athlete.id];
    if (existing) {
      if (modalityType === "individual" && existing.has("individual")) return "modalidade_individual";
      if (isJerps && modalityType === "coletiva") return "modalidade_coletiva";
      if (!isJerps && modalityType === "coletiva" && existing.has("coletiva")) return "modalidade_coletiva";
    }
    return null;
  };

  const blockMessages: Record<string, string> = {
    limite: "Limite de atletas atingido",
    matricula: "Matrícula fora do prazo (máx. 06/03/2026)",
    genero: `Categoria restrita ao sexo ${genderRestriction === "M" ? "masculino" : "feminino"}`,
    modalidade_individual: "Atleta já inscrito em uma individual",
    modalidade_coletiva: isJerps ? "JERP's: apenas 1 individual" : "Atleta já inscrito em uma coletiva",
  };

  const isMinReached = enrolled.length >= (rule.min_athletes ?? 1);

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5 border-primary/20 shadow-none">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black uppercase text-lg text-primary">{rule.modalities?.name ?? rule.modality?.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {rule.categories?.name ?? rule.category?.name}
              </p>
              <Badge variant="secondary" className="text-[9px] h-4 uppercase">{modalityType}</Badge>
              {isJerps && <Badge className="text-[9px] h-4 uppercase bg-purple-600">JERP'S</Badge>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Vagas</p>
            <span className="text-2xl font-black">{enrolled.length}/{rule.max_athletes}</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
            <span>Disponíveis</span>
            <span>{eligibleAthletes.length}</span>
          </p>
          <ScrollArea className="h-[380px] pr-4 border rounded-lg bg-card/50">
            {isLoading ? (
              <div className="p-8 text-center text-xs animate-pulse">Carregando atletas...</div>
            ) : (
              eligibleAthletes.map((athlete: any) => {
                const isSelected = enrolled.some((e) => e.id === athlete.id);
                const blockReason = isSelected ? null : getBlockReason(athlete);
                const isBlocked = blockReason !== null;

                return (
                  <div key={athlete.id} className={cn("p-3 m-2 border rounded-md flex items-center justify-between bg-background", isSelected && "border-primary ring-1 ring-primary/20", isBlocked && "opacity-40")}>
                    <div className="min-w-0">
                      <p className="font-bold text-[11px] uppercase truncate">{athlete.full_name}</p>
                      <p className="text-[9px] text-muted-foreground uppercase">{athlete.sex} · Nasc: {new Date(athlete.birth_date).getFullYear()}</p>
                    </div>
                    {isSelected ? (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onRemove(athlete.id)}><UserMinus className="h-4 w-4" /></Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button size="icon" variant="outline" className="h-7 w-7" disabled={isBlocked} onClick={() => onAdd(athlete)}><UserPlus className="h-4 w-4" /></Button>
                            </span>
                          </TooltipTrigger>
                          {isBlocked && <TooltipContent className="bg-destructive text-white border-none text-[10px] uppercase font-bold">{blockMessages[blockReason]}</TooltipContent>}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })
            )}
          </ScrollArea>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Equipe</p>
          <div className="bg-muted/20 rounded-lg p-2 h-[380px] border-2 border-dashed flex flex-col">
            {enrolled.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
                <Users className="h-8 w-8 mb-1" />
                <p className="text-[9px] font-bold uppercase">Vazio</p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {enrolled.map((athlete: any) => (
                  <div key={athlete.id} className="flex items-center gap-2 bg-background p-2 rounded mb-1.5 border shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-[10px] font-bold uppercase flex-1 truncate">{athlete.full_name}</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => onRemove(athlete.id)}><UserMinus className="h-3 w-3" /></Button>
                  </div>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} size="sm" className="uppercase font-bold text-[10px]">Voltar</Button>
        <Button disabled={!isMinReached} onClick={onNext} size="sm" className="px-8 uppercase font-bold text-[10px]">
          {isMinReached ? "Próximo Passo" : `Faltam ${rule.min_athletes - enrolled.length} atleta(s)`}
        </Button>
      </div>
    </div>
  );
};
