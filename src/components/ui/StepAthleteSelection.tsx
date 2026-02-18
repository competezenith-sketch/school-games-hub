import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, UserMinus, Users, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StepAthleteSelectionProps {
  orgId: string;
  rule: any; // Objeto da regra (competition_rules + categories + modalities)
  enrolled: any[]; // Lista de atletas já selecionados (profiles)
  onAdd: (athlete: any) => void;
  onRemove: (athleteId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepAthleteSelection = ({
  orgId,
  rule,
  enrolled,
  onAdd,
  onRemove,
  onBack,
  onNext
}: StepAthleteSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Buscar todos os atletas da escola
  const { data: allAthletes = [], isLoading } = useQuery({
    queryKey: ["org-athletes", orgId],
    queryFn: async () => {
      // Busca perfis com role 'athlete' vinculados à organização
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("org_id", orgId)
        .eq("role", "athlete")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  // 2. Filtrar Atletas Elegíveis (Lógica de Negócio)
  const eligibleAthletes = useMemo(() => {
    if (!rule || !allAthletes.length) return [];

    const minYear = rule.categories.year_min;
    const maxYear = rule.categories.year_max;
    const genderRest = rule.rules_config.gender_restriction || 'X'; // X = Misto

    return allAthletes.filter((athlete: any) => {
      // Filtra os que JÁ estão selecionados (para não duplicar na lista da esquerda)
      const isAlreadySelected = enrolled.some(e => e.id === athlete.id);
      if (isAlreadySelected) return false;

      // Filtro de Texto (Busca)
      if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // 1. Validação de Idade (Ano de Nascimento)
      if (!athlete.birth_date) return false; // Sem data não joga
      const birthYear = new Date(athlete.birth_date).getFullYear();
      if (birthYear < minYear || birthYear > maxYear) return false;

      // 2. Validação de Gênero
      // Se a regra for 'M', só aceita 'M'. Se for 'F', só aceita 'F'. Se for 'X', aceita tudo.
      if (genderRest !== 'X' && athlete.gender !== genderRest) return false;

      return true;
    });
  }, [allAthletes, rule, enrolled, searchTerm]);

  // 3. Validações de Limites
  const minAthletes = rule.rules_config.min_athletes || 0;
  const maxAthletes = rule.rules_config.max_athletes || 999;
  const currentCount = enrolled.length;
  const isMinMet = currentCount >= minAthletes;
  const isMaxReached = currentCount >= maxAthletes;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* --- HEADER DE CONTROLE --- */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {rule.modalities.name} <Badge variant="outline">{rule.categories.name}</Badge>
          </h3>
          <div className="text-sm text-muted-foreground mt-1 flex gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Nascidos: {rule.categories.year_min} a {rule.categories.year_max}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> Limite: {minAthletes} a {maxAthletes} atletas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-background p-2 rounded-md border shadow-sm">
          <span className="text-sm font-medium text-muted-foreground px-2">Selecionados:</span>
          <span className={cn(
            "text-lg font-bold font-mono",
            currentCount < minAthletes ? "text-orange-600" : "text-green-600"
          )}>
            {currentCount}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-bold text-muted-foreground">{maxAthletes}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
        
        {/* --- COLUNA ESQUERDA: DISPONÍVEIS --- */}
        <Card className="flex flex-col h-full border-dashed shadow-none bg-muted/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex justify-between">
              Atletas Disponíveis
              <Badge variant="secondary" className="font-normal">{eligibleAthletes.length}</Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                className="pl-8 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full pr-4">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Carregando atletas...</div>
              ) : eligibleAthletes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4">
                  <Users className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Nenhum atleta elegível encontrado.</p>
                  <p className="text-xs mt-1">Verifique se os alunos estão cadastrados com a data de nascimento correta ({rule.categories.year_min}-{rule.categories.year_max}).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eligibleAthletes.map((athlete: any) => (
                    <div key={athlete.id} className="flex items-center justify-between p-2 rounded-lg bg-background border hover:border-primary/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={athlete.photo_url} />
                          <AvatarFallback>{athlete.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Nasc: {new Date(athlete.birth_date).getFullYear()} • RG: {athlete.rg || 'Pend.'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          if (isMaxReached) {
                            toast.error("Limite máximo de atletas atingido.");
                            return;
                          }
                          onAdd(athlete);
                        }}
                        disabled={isMaxReached}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* --- COLUNA DIREITA: SELECIONADOS --- */}
        <Card className="flex flex-col h-full border-primary/20 shadow-md">
          <CardHeader className="pb-2 bg-primary/5 border-b">
            <CardTitle className="text-base font-medium text-primary flex justify-between">
              Equipe Selecionada
              <CheckCircle2 className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-full pr-4">
              {enrolled.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center p-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                    <UserPlus className="h-5 w-5 opacity-40" />
                  </div>
                  <p className="text-sm">Adicione atletas da lista ao lado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrolled.map((athlete: any, index) => (
                    <div key={athlete.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-mono font-bold text-primary/50 w-4">{index + 1}.</span>
                        <Avatar className="h-8 w-8 ring-1 ring-primary/20">
                          <AvatarImage src={athlete.photo_url} />
                          <AvatarFallback className="bg-primary/10 text-primary">{athlete.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none text-primary/90">{athlete.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                             {new Date(athlete.birth_date).getFullYear()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => onRemove(athlete.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* --- ALERTA DE VALIDAÇÃO --- */}
      {!isMinMet && enrolled.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Você precisa selecionar no mínimo {minAthletes} atletas para continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* --- FOOTER DE NAVEGAÇÃO --- */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button 
          onClick={onNext} 
          disabled={!isMinMet}
          className={cn(!isMinMet && "opacity-50 cursor-not-allowed")}
        >
          Avançar para Revisão
        </Button>
      </div>
    </div>
  );
};
