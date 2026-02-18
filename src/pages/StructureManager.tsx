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
import { toast } from "sonner";
import { Loader2, Tag, ChevronRight, Settings2, Save, X, Trophy, Dumbbell, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── CONFIG EDITOR (Modal de Regras Otimizado) ───
function RulesConfigEditor({ ruleId, categoryName, modalityName, initialConfig, onClose }: any) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(initialConfig || {});

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Salva no JSON rules_config da tabela competition_rules
      const { error } = await supabase.from("competition_rules").update({ rules_config: config }).eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Parâmetros de competição atualizados!");
      queryClient.invalidateQueries({ queryKey: ["rules-detail"] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (key: string, value: any) => setConfig((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between pb-4 bg-muted/20">
          <div>
            <CardTitle className="text-xl">Parâmetros Técnicos</CardTitle>
            <CardDescription className="font-bold text-primary">{modalityName} • {categoryName}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mín. Atletas</Label>
              <Input type="number" value={config.min_athletes || ""} onChange={(e) => handleChange("min_athletes", parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Máx. Atletas</Label>
              <Input type="number" className="border-primary/50 bg-primary/5" value={config.max_athletes || ""} onChange={(e) => handleChange("max_athletes", parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Máx. Comiss. Técnica</Label>
              <Input type="number" value={config.max_coaches || ""} onChange={(e) => handleChange("max_coaches", parseInt(e.target.value))} />
            </div>
            
            {/* TRAVA DE TIPO: Fundamental para a Regra 1+1 */}
            <div className="space-y-2">
              <Label>Tipo de Modalidade</Label>
              <Select value={config.type || "individual"} onValueChange={(v) => handleChange("type", v)}>
                <SelectTrigger className="border-orange-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual (1+1)</SelectItem>
                  <SelectItem value="coletivo">Coletivo (1+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Restrição de Naipe</Label>
              <Select value={config.gender_restriction || "X"} onValueChange={(v) => handleChange("gender_restriction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="M">Masculino (Apenas)</SelectItem>
                   <SelectItem value="F">Feminino (Apenas)</SelectItem>
                   <SelectItem value="X">Misto / Sem Restrição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex gap-2">
             <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
             <p className="text-[10px] text-amber-800 leading-relaxed">
               <b>Atenção:</b> Alterar o "Tipo" impacta diretamente na elegibilidade dos atletas (Regra de 01 Modalidade Individual + 01 Coletiva).
             </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
              Confirmar Regras
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN COMPONENT ───
const StructureManager = () => {
  const { user } = useAuth();
  const [competitionId, setCompetitionId] = useState<string>("");
  const [selectedModalityId, setSelectedModalityId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-structure", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      return data;
    },
  });

  const orgId = profile?.org_id;

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-list", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").eq("org_id", orgId).order("year", { ascending: false });
      return data || [];
    },
  });

  const { data: modalities = [], isLoading: loadingMods } = useQuery({
    queryKey: ["modalities-active", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data: allMods } = await supabase.from("modalities").select("*").eq("org_id", orgId).order("name");
      const { data: rules } = await supabase.from("competition_rules").select("modality_id").eq("competition_id", competitionId);
      const activeIds = new Set(rules?.map((r) => r.modality_id));
      if (activeIds.size === 0) return allMods || [];
      return allMods?.filter(m => activeIds.has(m.id)) || [];
    }
  });

  const { data: rules = [], isLoading: loadingRules } = useQuery({
    queryKey: ["rules-detail", competitionId, selectedModalityId],
    enabled: !!competitionId && !!selectedModalityId,
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_rules")
        .select("*, categories(*), modalities(*)")
        .eq("competition_id", competitionId)
        .eq("modality_id", selectedModalityId)
        .order("categories(name)");
      return data || [];
    }
  });

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl tracking-wider uppercase">Estrutura do Evento</h2>
          <p className="text-muted-foreground text-sm">Parametrização técnica de modalidades e categorias para 2026.</p>
        </div>
        <Badge variant="outline" className="h-fit">Administrador</Badge>
      </div>

      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-6">
        <Trophy className="h-10 w-10 text-primary animate-pulse" />
        <div className="flex-1 space-y-1">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Compromisso Ativo</Label>
          <Select value={competitionId} onValueChange={setCompetitionId}>
            <SelectTrigger className="bg-background border-primary/20"><SelectValue placeholder="Selecione a Competição para Gerenciar..." /></SelectTrigger>
            <SelectContent>
              {competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.year} - {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {competitionId && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 flex-1 overflow-hidden">
          {/* Coluna: Modalidades */}
          <Card className="flex flex-col shadow-none border-muted">
            <div className="p-3 border-b bg-muted/30 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
               <Dumbbell className="h-3 w-3" /> Esportes Habilitados
            </div>
            <ScrollArea className="flex-1 p-2">
              {loadingMods ? <Loader2 className="animate-spin m-4" /> : modalities.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModalityId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all mb-1",
                    selectedModalityId === m.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-md flex items-center justify-center text-[10px] font-black shrink-0",
                    selectedModalityId === m.id ? "bg-white/20" : "bg-primary/10 text-primary"
                  )}>
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold truncate">{m.name}</span>
                  {selectedModalityId === m.id && <ChevronRight className="h-4 w-4 ml-auto" />}
                </button>
              ))}
            </ScrollArea>
          </Card>

          {/* Coluna: Regras/Tabela */}
          <Card className="flex flex-col shadow-none overflow-hidden">
            {selectedModalityId ? (
              <>
                <div className="p-4 border-b flex justify-between items-center bg-muted/10">
                  <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-tight">
                    <Tag className="h-4 w-4 text-primary" /> Configuração de Categorias
                  </h3>
                </div>
                
                <div className="flex-1 overflow-auto">
                   {loadingRules ? <Loader2 className="animate-spin mx-auto mt-20" /> : (
                     <Table>
                       <TableHeader className="bg-muted/50">
                         <TableRow>
                           <TableHead className="text-[10px] uppercase">Categoria</TableHead>
                           <TableHead className="text-[10px] uppercase">Nascimento Permitido</TableHead>
                           <TableHead className="text-[10px] uppercase">Travas (Min/Máx)</TableHead>
                           <TableHead className="text-right text-[10px] uppercase">Ajustar</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {rules.map((rule: any) => (
                           <TableRow key={rule.id} className="hover:bg-muted/30">
                             <TableCell className="font-bold">{rule.categories?.name}</TableCell>
                             <TableCell>
                               <Badge variant="secondary" className="font-mono text-[10px]">
                                 {rule.categories?.year_min} — {rule.categories?.year_max}
                               </Badge>
                             </TableCell>
                             <TableCell>
                               <div className="flex gap-3 text-xs">
                                 <span className="text-muted-foreground">Mín: <b>{rule.rules_config?.min_athletes || 0}</b></span>
                                 <span className="text-primary">Máx: <b>{rule.rules_config?.max_athletes || 0}</b></span>
                                 <Badge variant="outline" className="h-4 text-[9px]">{rule.rules_config?.type || 'indiv.'}</Badge>
                               </div>
                             </TableCell>
                             <TableCell className="text-right">
                               <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingRule({
                                 ruleId: rule.id, 
                                 categoryName: rule.categories.name, 
                                 modalityName: rule.modalities.name, 
                                 config: rule.rules_config
                               })}>
                                 <Settings2 className="h-4 w-4" />
                               </Button>
                             </TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
                <Dumbbell className="h-16 w-16 mb-4 opacity-10" />
                <p className="text-sm font-medium">Selecione uma modalidade para parametrizar</p>
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
