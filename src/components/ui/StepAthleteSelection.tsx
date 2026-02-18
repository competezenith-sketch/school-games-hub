import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, UserMinus, Info } from "lucide-react";

export const StepAthleteSelection = ({ orgId, rule, stageId, enrolled, onAdd, onRemove, onBack, onNext }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const DATA_CORTE = "2026-03-06";

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("participants")
        .select(`*, inscriptions(competition_rule_id, competition_rules(modalities(type)))`)
        .eq("org_id", orgId)
        .eq("role", "atleta");
      return data || [];
    }
  });

  const filtered = useMemo(() => {
    return athletes.filter((a: any) => {
      if (enrolled.some(e => e.id === a.id)) return false;
      if (searchTerm && !a.full_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // TRAVA 1: Matrícula (Art. Regulamento)
      if (!a.enrollment_date || a.enrollment_date > DATA_CORTE) return false;

      // TRAVA 2: Idade (Ano de nascimento da Categoria)
      const anoNasc = new Date(a.birth_date).getFullYear();
      if (anoNasc < rule.categories.year_min || anoNasc > rule.categories.year_max) return false;

      // TRAVA 3: Limite 1 Individual + 1 Coletiva
      const regs = a.inscriptions || [];
      const hasColetiva = regs.some((r: any) => r.competition_rules.modalities.type === 'coletivo');
      const hasIndividual = regs.some((r: any) => r.competition_rules.modalities.type === 'individual');
      
      if (rule.modalities.type === 'coletivo' && hasColetiva) return false;
      if (rule.modalities.type === 'individual' && hasIndividual) return false;

      return true;
    });
  }, [athletes, rule, enrolled, searchTerm]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <Alert className="bg-blue-50 border-blue-200 py-2">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          Regra 2026: Apenas alunos matriculados até {DATA_CORTE}.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4 h-[400px]">
        <Card className="flex flex-col h-full bg-muted/10 shadow-none border-dashed">
          <CardHeader className="p-3"><Input placeholder="Buscar atleta..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {filtered.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 mb-1 bg-background border rounded-md">
                  <div className="text-xs">
                    <p className="font-bold">{a.full_name}</p>
                    <p className="text-muted-foreground">{new Date(a.birth_date).getFullYear()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onAdd(a)}><UserPlus className="h-4 w-4" /></Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20 shadow-lg">
          <CardHeader className="p-3 bg-primary/5 border-b font-bold text-sm text-primary">Equipe Selecionada ({enrolled.length})</CardHeader>
          <CardContent className="flex-1 p-2">
            <ScrollArea className="h-full">
              {enrolled.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 mb-1 bg-primary/5 border border-primary/10 rounded-md">
                  <span className="text-xs font-medium">{a.full_name}</span>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)}><UserMinus className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={enrolled.length < (rule.rules_config.min_athletes || 0)}>Finalizar Inscrição</Button>
      </div>
    </div>
  );
};
