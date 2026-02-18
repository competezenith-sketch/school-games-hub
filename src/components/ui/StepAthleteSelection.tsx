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
  const DATA_CORTE_MATRICULA = "2026-03-06";

  const { data: athletes = [], isLoading } = useQuery({
    queryKey: ["eligible-athletes", orgId, rule.competition_id],
    queryFn: async () => {
      // Importante: Buscamos da tabela 'participants' para bater com o cadastro do gestor
      const { data } = await supabase
        .from("participants")
        .select(`*, registrations(id, modalities(type))`)
        .eq("org_id", orgId)
        .eq("role", "atleta");
      return data || [];
    }
  });

  const filtered = useMemo(() => {
    const isJerps = rule.modalities.name.toLowerCase().includes("jerp") || rule.modalities.name.toLowerCase().includes("paralímpic");
    
    return athletes.filter((a: any) => {
      if (enrolled.some(e => e.id === a.id)) return false;
      if (searchTerm && !a.full_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // 1. Matrícula até 06/03
      if (!a.enrollment_date || a.enrollment_date > DATA_CORTE_MATRICULA) return false;

      // 2. Faixa Etária
      const anoNasc = new Date(a.birth_date).getFullYear();
      if (anoNasc < rule.categories.year_min || anoNasc > rule.categories.year_max) return false;

      // 3. Regra de Limite de Modalidades
      const regs = a.registrations || [];
      if (isJerps) {
        if (regs.length >= 1) return false; // JERPs: Max 1 total
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
        <AlertDescription className="text-blue-800 text-xs">
          Regra 2026: Alunos matriculados até {DATA_CORTE_MATRICULA} ({rule.categories.year_min}-{rule.categories.year_max}).
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4 h-[400px]">
        {/* Lado Esquerdo: Disponíveis */}
        <Card className="flex flex-col h-full bg-muted/10">
          <CardHeader className="p-3"><Input placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full pr-2">
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

        {/* Lado Direito: Selecionados */}
        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader className="p-3 bg-primary/5 border-b font-bold text-sm">Equipe Selecionada ({enrolled.length}/{rule.rules_config.max_athletes})</CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
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

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext} disabled={enrolled.length < (rule.rules_config.min_athletes || 0)}>Avançar</Button>
      </div>
    </div>
  );
};
