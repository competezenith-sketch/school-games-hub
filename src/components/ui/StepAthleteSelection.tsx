import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, UserMinus, Info, AlertCircle } from "lucide-react";

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const DATA_CORTE_MATRICULA = "2026-03-06"; // Art. do Regulamento

  // 1. Busca atletas e o que eles já estão jogando nesta competição
  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.competition_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`*, registrations(modality_id, modalities(type, name))`)
        .eq("org_id", orgId)
        .eq("role", "athlete");
      return data || [];
    }
  });

  // 2. Filtro de Elegibilidade Otimizado
  const filtered = useMemo(() => {
    const isParalimpico = rule.modalities.name.toLowerCase().includes("paralímpic") || rule.modalities.name.toLowerCase().includes("bocha");
    
    return athletes.filter((a: any) => {
      if (enrolled.some(e => e.id === a.id)) return false; // Já está na lista atual
      if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false; // Busca

      // TRAVA 1: Data de Matrícula (Regra Fundamental JER 2026)
      if (!a.enrollment_date || a.enrollment_date > DATA_CORTE_MATRICULA) return false;

      // TRAVA 2: Faixa Etária (Busca do Banco)
      const anoNasc = new Date(a.birth_date).getFullYear();
      if (anoNasc < rule.categories.year_min || anoNasc > rule.categories.year_max) return false;

      // TRAVA 3: Gênero
      const restGen = rule.rules_config.gender_restriction || 'X';
      if (restGen !== 'X' && a.gender !== restGen) return false;

      // TRAVA 4: Limite de Modalidades (1+1 para JERs | 1 Total para JERPs)
      const regs = a.registrations || [];
      if (isParalimpico) {
        if (regs.length >= 1) return false;
      } else {
        const jaTemColetiva = regs.some((r: any) => r.modalities.type === 'coletivo');
        const jaTemIndividual = regs.some((r: any) => r.modalities.type === 'individual');
        if (rule.modalities.type === 'coletivo' && jaTemColetiva) return false;
        if (rule.modalities.type === 'individual' && jaTemIndividual) return false;
      }

      return true;
    });
  }, [athletes, rule, enrolled, searchTerm]);

  return (
    <div className="space-y-4 animate-in fade-in">
      <Alert className="bg-blue-50 border-blue-200 py-2">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-[11px]">
          Alunos elegíveis: Matriculados até {DATA_CORTE_MATRICULA} e dentro da faixa {rule.categories.year_min}-{rule.categories.year_max}.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4 h-[400px]">
        <Card className="flex flex-col h-full bg-muted/10">
          <CardHeader className="p-3"><Input placeholder="Buscar aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {filtered.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 mb-1 bg-background border rounded-md">
                  <div className="text-xs"><p className="font-bold">{a.name}</p><p className="text-muted-foreground">{new Date(a.birth_date).getFullYear()}</p></div>
                  <Button size="sm" variant="ghost" onClick={() => onAdd(a)} disabled={enrolled.length >= (rule.rules_config.max_athletes || 99)}><UserPlus className="h-4 w-4" /></Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader className="p-3 bg-primary/5 border-b font-bold text-sm text-primary">Inscritos ({enrolled.length}/{rule.rules_config.max_athletes})</CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {enrolled.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-2 mb-1 bg-primary/5 border border-primary/10 rounded-md">
                  <span className="text-xs font-medium">{a.name}</span>
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
            <span className="text-[10px] text-destructive italic">Mínimo: {rule.rules_config.min_athletes}</span>
          )}
          <Button onClick={onNext} disabled={enrolled.length < (rule.rules_config.min_athletes || 0)}>Finalizar</Button>
        </div>
      </div>
    </div>
  );
};
