import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Tag, ChevronRight, Settings2, Save, X, Trophy, Dumbbell, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- EDITOR DE REGRAS ---
function RulesConfigEditor({ ruleId, categoryName, modalityName, initialConfig, onClose }: any) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(initialConfig || {});

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_rules").update({ rules_config: config }).eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parâmetros atualizados!");
      queryClient.invalidateQueries({ queryKey: ["rules-detail"] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div>
            <CardTitle>Configurar Prova</CardTitle>
            <CardDescription className="font-bold text-primary">{modalityName} • {categoryName}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mín. Atletas</Label>
              <Input type="number" value={config.min_athletes || ""} onChange={(e) => setConfig({...config, min_athletes: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Máx. Atletas</Label>
              <Input type="number" value={config.max_athletes || ""} onChange={(e) => setConfig({...config, max_athletes: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={config.type || "individual"} onValueChange={(v) => setConfig({...config, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="coletivo">Coletivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Naipe</Label>
              <Select value={config.gender_restriction || "X"} onValueChange={(v) => setConfig({...config, gender_restriction: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="M">Masc</SelectItem>
                   <SelectItem value="F">Fem</SelectItem>
                   <SelectItem value="X">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full mt-4" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
const StructureManager = () => {
  const { user } = useAuth();
  const [competitionId, setCompetitionId] = useState<string>("");
  const [selectedModalityId, setSelectedModalityId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<any>(null);

  // 1. Busca competições
  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-list"],
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").order("year", { ascending: false });
      return data || [];
    },
  });

  // 2. Busca apenas modalidades que POSSUEM REGRAS para a competição selecionada
  const { data: modalities = [], isLoading: loadingMods } = useQuery({
    queryKey: ["modalities-by-comp", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data: rules } = await supabase
        .from("competition_rules")
        .select("modality_id, modalities(id, name, type)")
        .eq("competition_id", competitionId);
      
      // Remove duplicatas de modalidades
      const uniqueMods = Array.from(new Map(rules?.map(r => [r.modalities.id, r.modalities])).values());
      return uniqueMods.sort((a: any, b: any) => a.name.localeCompare(b.name));
    }
  });

  // 3. Busca detalhes das regras da modalidade escolhida
  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["rules-detail", competitionId, selectedModalityId],
    enabled: !!competitionId && !!selectedModalityId,
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_rules")
        .select("*, categories(*), modalities(*)")
        .eq("competition_id", competitionId)
        .eq("modality_id", selectedModalityId);
      return data || [];
    }
  });

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl border">
        <Label className="text-xs uppercase font-bold text-muted-foreground">Selecione a Competição</Label>
        <Select value={competitionId} onValueChange={(v) => { setCompetitionId(v); setSelectedModalityId(null); }}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="JER's ou JERP's..." /></SelectTrigger>
          <SelectContent>
            {competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {competitionId && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 flex-1 overflow-hidden">
          <Card className="flex flex-col overflow-hidden border-muted">
            <div className="p-3 border-b bg-muted/50 font-bold text-[10px] uppercase">Modalidades Ativas</div>
            <ScrollArea className="flex-1">
              {loadingMods ? <Loader2 className="animate-spin m-10" /> : modalities.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModalityId(m.id)}
                  className={cn(
                    "w-full text-left p-3 text-sm font-medium border-b transition-colors hover:bg-muted",
                    selectedModalityId === m.id ? "bg-primary/10 text-primary border-r-4 border-r-primary" : ""
                  )}
                >
                  {m.name}
                </button>
              ))}
            </ScrollArea>
          </Card>

          <Card className="flex flex-col overflow-hidden">
            {selectedModalityId ? (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Regras</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">{r.categories?.name}</TableCell>
                        <TableCell className="text-xs">{r.categories?.year_min} - {r.categories?.year_max}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {r.rules_config?.type} • Máx: {r.rules_config?.max_athletes}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setEditingRule({
                            ruleId: r.id, categoryName: r.categories.name, modalityName: r.modalities.name, initialConfig: r.rules_config
                          })}><Settings2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                <Dumbbell className="h-12 w-12 mb-2" />
                <p className="text-sm">Selecione uma modalidade à esquerda</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {editingRule && <RulesConfigEditor {...editingRule} onClose={() => setEditingRule(null)} />}
    </div>
  );
};

export default StructureManager;
