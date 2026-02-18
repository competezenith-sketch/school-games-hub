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
import { Loader2, Plus, Dumbbell, Tag, ChevronRight, Settings2, Save, X, Trophy, Calendar, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── TYPES & CONSTANTS ───
const MODALITY_PRESETS = ["Futsal", "Vôlei", "Xadrez", "Atletismo", "Basquete", "Handebol", "Natação", "Tênis de Mesa", "Judô", "Karatê", "Badminton"];
const TYPE_OPTIONS = [
  { value: "coletivo", label: "Coletivo" },
  { value: "individual", label: "Individual" },
];
const GENDER_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "X", label: "Misto" },
];

// ─── HELPER: Badge Colors ───
const getCategoryBadgeStyle = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("mirim")) return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"; // Verde
  if (n.includes("infantil")) return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100"; // Azul
  return "bg-gray-100 text-gray-800 border-gray-200";
};

// ─── SUB-COMPONENT: RULES CONFIG EDITOR ───
function RulesConfigEditor({
  ruleId,
  categoryName,
  modalityName,
  initialConfig,
  onClose,
}: {
  ruleId: string;
  categoryName: string;
  modalityName: string;
  initialConfig: any;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(initialConfig || {});

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("competition_rules")
        .update({ rules_config: config })
        .eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regras atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      onClose();
    },
    onError: (err: any) => toast.error("Erro ao salvar regras: " + err.message),
  });

  const handleChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-xl border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Configurar Regras</CardTitle>
            <CardDescription className="text-base font-medium text-primary mt-1">
              {modalityName} <span className="mx-1 text-muted-foreground">•</span> {categoryName}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Mín. Atletas
              </Label>
              <Input
                type="number"
                className="font-mono text-lg"
                value={config.min_athletes || ""}
                onChange={(e) => handleChange("min_athletes", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-primary font-semibold">
                <Users className="h-4 w-4" /> Máx. Atletas
              </Label>
              <Input
                type="number"
                className="font-mono text-lg border-primary/30 bg-primary/5"
                value={config.max_athletes || ""}
                onChange={(e) => handleChange("max_athletes", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" /> Máx. Staff
              </Label>
              <Input
                type="number"
                value={config.max_coaches || ""}
                onChange={(e) => handleChange("max_coaches", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Settings2 className="h-4 w-4" /> Substituições
              </Label>
              <Input
                type="number"
                value={config.max_substitutions || ""}
                onChange={(e) => handleChange("max_substitutions", parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas / Observações</Label>
            <Input
              value={config.notes || ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Ex: Tempo de jogo 2x20min"
            />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} size="lg">
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SUB-COMPONENT: MODALITIES SECTION ───
interface ModalitiesSectionProps {
  orgId: string;
  competitionId?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ModalitiesSection = ({ orgId, competitionId, selectedId, onSelect }: ModalitiesSectionProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newModalityName, setNewModalityName] = useState("");
  const [newModalityType, setNewModalityType] = useState("coletivo");
  const [newModalityGender, setNewModalityGender] = useState("X");
  const queryClient = useQueryClient();

  const { data: modalities = [], isLoading } = useQuery({
    queryKey: ["modalities", orgId, competitionId],
    queryFn: async () => {
      const { data: allModalities, error } = await supabase
        .from("modalities")
        .select("*")
        .eq("org_id", orgId)
        .order("name");

      if (error) throw error;

      if (competitionId) {
        const { data: rules } = await supabase
          .from("competition_rules")
          .select("modality_id")
          .eq("competition_id", competitionId);
        
        const activeIds = new Set(rules?.map((r) => r.modality_id));
        return allModalities.filter((m) => activeIds.has(m.id));
      }

      return allModalities;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("modalities")
        .insert({
          org_id: orgId,
          name: newModalityName,
          type: newModalityType as any,
          gender: newModalityGender as any,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newModality) => {
      toast.success("Modalidade criada!");
      setIsCreateOpen(false);
      setNewModalityName("");
      queryClient.invalidateQueries({ queryKey: ["modalities"] });
      if (newModality) onSelect(newModality.id);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card className="h-full flex flex-col border-r-0 rounded-r-none">
      <CardHeader className="bg-muted/10 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Modalidades
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Plus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Modalidade</DialogTitle>
                <DialogDescription>Cadastre uma modalidade esportiva.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input 
                    value={newModalityName} 
                    onChange={(e) => setNewModalityName(e.target.value)} 
                    placeholder="Ex: Futsal" 
                    list="modality-presets"
                  />
                  <datalist id="modality-presets">
                    {MODALITY_PRESETS.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={newModalityType} onValueChange={setNewModalityType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gênero Padrão</Label>
                    <Select value={newModalityGender} onValueChange={setNewModalityGender}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>
          Selecione para ver as categorias.
        </CardDescription>
      </CardHeader>
      <div className="p-3 bg-muted/5 border-b">
        <Input placeholder="Buscar modalidade..." className="h-8 text-xs bg-background" />
      </div>
      <CardContent className="flex-1 overflow-y-auto max-h-[600px] p-2 space-y-1">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : modalities.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma modalidade encontrada.
          </div>
        ) : (
          modalities.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-md text-left transition-all border",
                selectedId === m.id 
                  ? "bg-primary/10 border-primary shadow-sm" 
                  : "bg-card border-transparent hover:bg-muted hover:border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                  m.type === 'coletivo' ? "bg-orange-100 text-orange-700" : "bg-purple-100 text-purple-700"
                )}>
                  {m.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm leading-none">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Badge variant="outline" className="h-4 px-1 py-0 text-[9px] uppercase font-normal tracking-wide">
                      {m.type}
                    </Badge>
                  </div>
                </div>
              </div>
              {selectedId === m.id && <ChevronRight className="h-4 w-4 text-primary" />}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// ─── SUB-COMPONENT: CATEGORIES SECTION (UPDATED WITH TABLE) ───
interface CategoriesSectionProps {
  orgId: string;
  competitionId: string | null;
  modalityId: string;
  onEditRule: (ruleId: string, categoryName: string, modalityName: string, config: any) => void;
}

const CategoriesSection = ({ orgId, competitionId, modalityId, onEditRule }: CategoriesSectionProps) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["categories-rules", competitionId, modalityId],
    enabled: !!competitionId && !!modalityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select("*, categories(*), modalities(*)")
        .eq("competition_id", competitionId)
        .eq("modality_id", modalityId)
        .order("categories(name)"); // Ordenar por nome da categoria
      if (error) throw error;
      return data;
    },
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ["all-categories", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("org_id", orgId);
      return data || [];
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      if (!competitionId) throw new Error("Selecione uma competição");
      const exists = rules.find(r => r.category_id === categoryId);
      if (exists) return;

      const { error } = await supabase.from("competition_rules").insert({
        org_id: orgId,
        competition_id: competitionId,
        modality_id: modalityId,
        category_id: categoryId,
        rules_config: {}
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria adicionada!");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      queryClient.invalidateQueries({ queryKey: ["modalities"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .insert({ org_id: orgId, name: newCategoryName })
        .select()
        .single();
      if (catError) throw catError;

      if (competitionId) {
        await addCategoryMutation.mutateAsync(cat.id);
      }
    },
    onSuccess: () => {
      setNewCategoryName("");
      queryClient.invalidateQueries({ queryKey: ["all-categories"] });
    }
  });

  const removeRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase.from("competition_rules").delete().eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria removida.");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      queryClient.invalidateQueries({ queryKey: ["modalities"] });
    }
  });

  if (!competitionId) return <div className="p-8 text-center text-muted-foreground">Selecione uma competição.</div>;

  return (
    <Card className="h-full flex flex-col border-l-0 rounded-l-none shadow-none">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" /> Categorias & Regras
            </CardTitle>
            <CardDescription>Defina os limites de idade e quantidade de atletas.</CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Select onValueChange={(val) => addCategoryMutation.mutate(val)}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                <SelectValue placeholder="Adicionar categoria..." />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map(c => (
                  <SelectItem key={c.id} value={c.id} disabled={rules.some(r => r.category_id === c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" size="sm" className="h-8"><Plus className="h-3 w-3 mr-1" /> Criar</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Criar Nova Categoria</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <Label>Nome</Label>
                  <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ex: Sub-17" />
                  <Button onClick={() => createCategoryMutation.mutate()} className="w-full">Criar e Adicionar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-0">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Tag className="h-8 w-8 opacity-20" />
            <p className="text-sm">Nenhuma categoria configurada.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="w-[200px]">Categoria</TableHead>
                <TableHead>Ano de Nascimento</TableHead>
                <TableHead>Limites (Atletas)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule: any) => (
                <TableRow key={rule.id}>
                  {/* Coluna Categoria */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-base">{rule.categories?.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                         {rule.categories?.description || "Sem descrição"}
                      </span>
                    </div>
                  </TableCell>
                  
                  {/* Coluna Anos */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={cn("text-xs px-2 py-1 font-mono", getCategoryBadgeStyle(rule.categories?.name || ""))}>
                          <Calendar className="h-3 w-3 mr-1.5 opacity-50" />
                          {rule.categories?.year_min} — {rule.categories?.year_max}
                       </Badge>
                    </div>
                  </TableCell>
                  
                  {/* Coluna Limites */}
                  <TableCell>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex flex-col items-center px-3 py-1 bg-muted/30 rounded border">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Mín</span>
                        <span className="font-mono font-medium">{rule.rules_config?.min_athletes || "-"}</span>
                      </div>
                      <div className="h-px w-4 bg-border" />
                      <div className="flex flex-col items-center px-3 py-1 bg-primary/5 border border-primary/20 rounded">
                        <span className="text-[10px] text-primary uppercase font-bold">Máx</span>
                        <span className="font-mono font-bold text-primary">{rule.rules_config?.max_athletes || "-"}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Coluna Ações */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => onEditRule(rule.id, rule.categories?.name, rule.modalities?.name, rule.rules_config)}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeRuleMutation.mutate(rule.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// ─── MAIN COMPONENT ───
const StructureManager = () => {
  const { user } = useAuth();
  const [competitionId, setCompetitionId] = useState<string>("");
  const [selectedModalityId, setSelectedModalityId] = useState<string | null>(null);
  
  const [editingRule, setEditingRule] = useState<{
    ruleId: string;
    categoryName: string;
    modalityName: string;
    config: any;
  } | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile-structure", user?.id],
    enabled: !!user?.id,
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

  if (!orgId) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Estrutura da Competição</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie modalidades e categorias por competição
        </p>
      </div>

      {/* Seleção de Competição */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Competição Ativa</Label>
          <Select value={competitionId} onValueChange={(val) => {
            setCompetitionId(val);
            setSelectedModalityId(null);
          }}>
            <SelectTrigger className="mt-1 bg-background h-10 border-primary/20 focus:ring-primary/20">
              <SelectValue placeholder="Selecione uma competição..." />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={c.id} className="font-medium">
                  {c.name} <span className="text-muted-foreground font-normal ml-1">({c.year})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {competitionId ? (
        <div className="grid gap-0 lg:grid-cols-[350px_1fr] border rounded-xl overflow-hidden shadow-sm h-[650px] bg-card">
          {/* Coluna Esquerda: Modalidades */}
          <ModalitiesSection
            orgId={orgId}
            competitionId={competitionId}
            selectedId={selectedModalityId}
            onSelect={(id) => {
              setSelectedModalityId(id);
              setEditingRule(null);
            }}
          />

          {/* Coluna Direita: Categorias (Tabela) */}
          {selectedModalityId ? (
            <CategoriesSection
              orgId={orgId}
              competitionId={competitionId}
              modalityId={selectedModalityId}
              onEditRule={(ruleId, categoryName, modalityName, config) =>
                setEditingRule({ ruleId, categoryName, modalityName, config })
              }
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center bg-muted/5 p-8">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma modalidade selecionada</h3>
              <p className="text-muted-foreground text-sm max-w-xs mt-2">
                Selecione uma modalidade na lista à esquerda para visualizar e editar as regras de categoria.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border rounded-lg border-dashed bg-muted/10">
          <p className="text-muted-foreground">Selecione uma competição acima para começar.</p>
        </div>
      )}

      {/* Modal Editor de Regras */}
      {editingRule && (
        <RulesConfigEditor
          ruleId={editingRule.ruleId}
          categoryName={editingRule.categoryName}
          modalityName={editingRule.modalityName}
          initialConfig={editingRule.config}
          onClose={() => setEditingRule(null)}
        />
      )}
    </div>
  );
};

export default StructureManager;
