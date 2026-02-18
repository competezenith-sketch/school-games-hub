import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Plus, Dumbbell, Tag, ChevronRight, Settings2, Save, X, Trophy, Calendar, Users, Shield, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// ─── CONFIG EDITOR (Modal de Regras) ───
function RulesConfigEditor({ ruleId, categoryName, modalityName, initialConfig, onClose }: any) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(initialConfig || {});

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_rules").update({ rules_config: config }).eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regras atualizadas!");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleChange = (key: string, value: any) => setConfig((prev: any) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-xl border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle>Configurar Regras</CardTitle>
            <CardDescription>{modalityName} • {categoryName}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Mín. Atletas</Label>
              <Input type="number" value={config.min_athletes || ""} onChange={(e) => handleChange("min_athletes", parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-primary font-semibold">Máx. Atletas</Label>
              <Input type="number" className="border-primary/30 bg-primary/5" value={config.max_athletes || ""} onChange={(e) => handleChange("max_athletes", parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Máx. Staff</Label>
              <Input type="number" value={config.max_coaches || ""} onChange={(e) => handleChange("max_coaches", parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Gênero (Restrição)</Label>
              <Select value={config.gender_restriction || "X"} onValueChange={(v) => handleChange("gender_restriction", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="M">Masculino Apenas</SelectItem>
                   <SelectItem value="F">Feminino Apenas</SelectItem>
                   <SelectItem value="X">Misto/Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar
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

  // 1. Busca Organização do Usuário
  const { data: profile } = useQuery({
    queryKey: ["profile-structure", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      return data;
    },
  });

  const orgId = profile?.org_id;

  // 2. Busca Competições
  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-list", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").eq("org_id", orgId).order("year", { ascending: false });
      return data || [];
    },
  });

  // 3. Busca Modalidades Ativas na Competição
  const { data: modalities = [], isLoading: loadingMods } = useQuery({
    queryKey: ["modalities-active", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data: allMods } = await supabase.from("modalities").select("*").eq("org_id", orgId).order("name");
      const { data: rules } = await supabase.from("competition_rules").select("modality_id").eq("competition_id", competitionId);
      const activeIds = new Set(rules?.map((r) => r.modality_id));
      // Retorna mods que tem regras OU todas se nenhuma tiver regra (primeiro setup)
      if (activeIds.size === 0) return allMods || [];
      return allMods?.filter(m => activeIds.has(m.id)) || [];
    }
  });

  // 4. Busca Regras (Categorias) da Modalidade Selecionada
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

  // Helpers
  const getBadgeColor = (name: string) => {
    if (name.includes("Mirim")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (name.includes("Infantil")) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Estrutura do Evento</h2>
        <p className="text-muted-foreground text-sm">Gerencie as regras globais aplicáveis a todas as etapas.</p>
      </div>

      {/* Seleção de Competição */}
      <div className="bg-muted/30 p-4 rounded-lg border flex items-center gap-4">
        <Trophy className="h-8 w-8 text-primary/80" />
        <div className="flex-1">
          <Label>Competição Ativa</Label>
          <Select value={competitionId} onValueChange={setCompetitionId}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {competitionId && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-0 border rounded-xl overflow-hidden flex-1 shadow-sm bg-card">
          
          {/* Coluna Esquerda: Lista de Modalidades */}
          <div className="border-r bg-muted/5 flex flex-col">
            <div className="p-3 border-b font-medium text-sm text-muted-foreground bg-muted/20">
              Modalidades Habilitadas ({modalities.length})
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {loadingMods ? <Loader2 className="animate-spin m-4" /> : modalities.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedModalityId(m.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-all border",
                    selectedModalityId === m.id 
                      ? "bg-primary/10 border-primary shadow-sm" 
                      : "bg-card border-transparent hover:border-border hover:bg-white"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    m.type === 'coletivo' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                  )}>
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate">{m.name}</span>
                  {selectedModalityId === m.id && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Coluna Direita: Regras e Categorias */}
          <div className="flex flex-col bg-white">
            {selectedModalityId ? (
              <>
                <div className="p-4 border-b flex justify-between items-center bg-muted/10">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Categorias & Regras
                    </h3>
                    <p className="text-xs text-muted-foreground">Defina idades e limites de atletas para esta modalidade.</p>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                   {loadingRules ? <Loader2 className="animate-spin mx-auto" /> : (
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead>Categoria</TableHead>
                           <TableHead>Nascimento</TableHead>
                           <TableHead>Limites (Min/Máx)</TableHead>
                           <TableHead className="text-right">Ações</TableHead>
                         </TableRow>
                       </TableHeader>
                       <TableBody>
                         {rules.map((rule: any) => (
                           <TableRow key={rule.id}>
                             <TableCell>
                               <span className="font-medium">{rule.categories?.name}</span>
                             </TableCell>
                             <TableCell>
                               <Badge variant="outline" className={cn("font-mono", getBadgeColor(rule.categories?.name))}>
                                 {rule.categories?.year_min} - {rule.categories?.year_max}
                               </Badge>
                             </TableCell>
                             <TableCell>
                               <div className="flex gap-2 text-sm font-mono">
                                 <span className="text-muted-foreground">Min: {rule.rules_config?.min_athletes || 0}</span>
                                 <span className="text-primary font-bold">Max: {rule.rules_config?.max_athletes || 0}</span>
                               </div>
                             </TableCell>
                             <TableCell className="text-right">
                               <Button variant="ghost" size="sm" onClick={() => setEditingRule({
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
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                <Dumbbell className="h-12 w-12 mb-2" />
                <p>Selecione uma modalidade</p>
              </div>
            )}
          </div>
        </div>
      )}

      {editingRule && <RulesConfigEditor {...editingRule} onClose={() => setEditingRule(null)} />}
    </div>
  );
};

export default StructureManager;
