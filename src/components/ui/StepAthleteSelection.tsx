import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, UserMinus, Info, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const MATRICULA_LIMITE = new Date("2026-03-06");

  const { data: allAthletes = [], isLoading } = useQuery({
    queryKey: ["org-athletes-eligibility", orgId, rule.id],
    queryFn: async () => {
      // Busca atletas e as modalidades onde já estão inscritos nesta competição
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, registrations(modality_id, modalities(type, name))`)
        .eq("org_id", orgId)
        .eq("role", "athlete");
      if (error) throw error;
      return data;
    }
  });

  const eligibleAthletes = useMemo(() => {
    if (!rule || !allAthletes.length) return [];
    
    const isJerps = rule.modalities.name.toLowerCase().includes("paralímpic") || rule.modalities.name.toLowerCase().includes("bocha");
    const currentType = rule.modalities.type;

    return allAthletes.filter((athlete: any) => {
      if (enrolled.some(e => e.id === athlete.id)) return false;

      // 1. REGRA: Matrícula até 06/03/2026
      if (!athlete.enrollment_date || new Date(athlete.enrollment_date) > MATRICULA_LIMITE) return false;

      // 2. REGRA: Idade (Ano de Nascimento)
      const birthYear = new Date(athlete.birth_date).getFullYear();
      if (birthYear < rule.categories.year_min || birthYear > rule.categories.year_max) return false;

      // 3. REGRA: Limite de Modalidades (JERs: 1 Coletiva + 1 Individual | JERPs: 1 Total)
      const regs = athlete.registrations || [];
      if (isJerps) {
        if (regs.length >= 1) return false; // Paralímpico: apenas 1 modalidade
      } else {
        const hasColetiva = regs.some((r: any) => r.modalities.type === 'coletivo');
        const hasIndividual = regs.some((r: any) => r.modalities.type === 'individual');
        if (currentType === 'coletivo' && hasColetiva) return false;
        if (currentType === 'individual' && hasIndividual) return false;
      }

      if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [allAthletes, rule, enrolled, searchTerm]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          Alunos elegíveis: Matriculados até 06/03 dentro da faixa {rule.categories.year_min}-{rule.categories.year_max}.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4 h-[450px]">
        <Card className="flex flex-col h-full bg-muted/10">
          <CardHeader className="p-3">
            <Input placeholder="Buscar aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-9" />
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {eligibleAthletes.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 mb-1 bg-background border rounded-md group">
                  <div className="text-sm">
                    <p className="font-medium leading-none">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Nasc: {new Date(a.birth_date).getFullYear()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onAdd(a)}><UserPlus className="h-4 w-4" /></Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader className="p-3 bg-primary/5 border-b"><CardTitle className="text-sm">Selecionados ({enrolled.length})</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {enrolled.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-primary/5 border border-primary/10 rounded-md mb-1">
                  <span className="text-sm font-medium">{a.name}</span>
                  <Button size="sm" variant="ghost" onClick={() => onRemove(a.id)}><UserMinus className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center border-t pt-4">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <div className="flex items-center gap-3">
           {enrolled.length < (rule.rules_config.min_athletes || 0) && (
             <span className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Mínimo: {rule.rules_config.min_athletes}</span>
           )}
           <Button onClick={onNext} disabled={enrolled.length < (rule.rules_config.min_athletes || 0)}>Finalizar Equipe</Button>
        </div>
      </div>
    </div>
  );
};
