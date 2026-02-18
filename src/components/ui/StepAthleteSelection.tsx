import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, UserMinus, Users, AlertCircle, Info, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const StepAthleteSelection = ({ orgId, rule, enrolled, onAdd, onRemove, onBack, onNext }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const MATRICULA_LIMITE = new Date("2026-03-06");

  // 1. Busca atletas com suas inscrições atuais para validar limites
  const { data: allAthletes = [], isLoading } = useQuery({
    queryKey: ["org-athletes-eligibility", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, registrations(modality_id, modalities(type))`)
        .eq("org_id", orgId)
        .eq("role", "athlete");
      if (error) throw error;
      return data;
    }
  });

  const eligibleAthletes = useMemo(() => {
    if (!rule || !allAthletes.length) return [];
    
    const minYear = rule.categories.year_min;
    const maxYear = rule.categories.year_max;
    const typeAtual = rule.modalities.type;

    return allAthletes.filter((athlete: any) => {
      // 1. Já selecionado nesta lista atual?
      if (enrolled.some(e => e.id === athlete.id)) return false;

      // 2. Filtro de Busca
      if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // 3. Regra de Matrícula (Art. Regulamento: Até 06/03/2026)
      if (!athlete.enrollment_date || new Date(athlete.enrollment_date) > MATRICULA_LIMITE) return false;

      // 4. Regra de Idade
      const birthYear = new Date(athlete.birth_date).getFullYear();
      if (birthYear < minYear || birthYear > maxYear) return false;

      // 5. Regra de Gênero
      const genderRest = rule.rules_config.gender_restriction || 'X';
      if (genderRest !== 'X' && athlete.gender !== genderRest) return false;

      // 6. Limite de Participação (1 Individual + 1 Coletiva)
      const inscricoes = athlete.registrations || [];
      const jaTemColetiva = inscricoes.some((r: any) => r.modalities.type === 'coletivo');
      const jaTemIndividual = inscricoes.some((r: any) => r.modalities.type === 'individual');

      if (typeAtual === 'coletivo' && jaTemColetiva) return false;
      if (typeAtual === 'individual' && jaTemIndividual) return false;

      return true;
    });
  }, [allAthletes, rule, enrolled, searchTerm]);

  const maxAthletes = rule.rules_config.max_athletes || 99;
  const minAthletes = rule.rules_config.min_athletes || 0;

  return (
    <div className="space-y-4 animate-in fade-in">
      <Alert className="bg-blue-50 border-blue-200 py-2">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          Exibindo alunos matriculados até <b>06/03/2026</b> com vaga disponível para modalidade <b>{rule.modalities.type}</b>.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-4 h-[450px]">
        {/* Disponíveis */}
        <Card className="flex flex-col h-full">
          <CardHeader className="p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold">Alunos Elegíveis</span>
              <Badge variant="secondary">{eligibleAthletes.length}</Badge>
            </div>
            <Input 
              placeholder="Buscar por nome..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full pr-2">
              {eligibleAthletes.map((athlete: any) => (
                <div key={athlete.id} className="flex items-center justify-between p-2 mb-1 border rounded-md hover:bg-muted/50 group">
                  <div className="text-sm">
                    <p className="font-medium">{athlete.name}</p>
                    <p className="text-[10px] text-muted-foreground">Nascimento: {new Date(athlete.birth_date).getFullYear()}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onAdd(athlete)} disabled={enrolled.length >= maxAthletes}>
                    <UserPlus className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selecionados */}
        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader className="p-3 bg-primary/5 border-b">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-primary">Equipe Selecionada</span>
              <span className="text-xs font-mono">{enrolled.length} / {maxAthletes}</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full">
              {enrolled.map((athlete: any) => (
                <div key={athlete.id} className="flex items-center justify-between p-2 mb-1 bg-primary/5 border border-primary/10 rounded-md">
                  <span className="text-sm font-medium">{athlete.name}</span>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => onRemove(athlete.id)}>
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <div className="flex items-center gap-4">
          {enrolled.length < minAthletes && (
            <span className="text-xs text-destructive flex items-center gap-1 italic">
              <AlertCircle className="h-3 w-3" /> Mínimo de {minAthletes} atletas
            </span>
          )}
          <Button onClick={onNext} disabled={enrolled.length < minAthletes}>Finalizar Equipe</Button>
        </div>
      </div>
    </div>
  );
};
