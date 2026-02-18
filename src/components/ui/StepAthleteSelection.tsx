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
          disabled={!isMinReached}
          onClick={onNext}
          className="px-10"
        >
          Finalizar Inscrição
        </Button>
      </div>
    </div>
  );
};
