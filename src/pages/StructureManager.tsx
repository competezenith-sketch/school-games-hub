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
import { Loader2, Plus, Dumbbell, Tag, ChevronRight, Settings2, Save, X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

// ─── SUB-COMPONENT: RULES CONFIG EDITOR ───
// Editor para as configurações específicas (JSON) da regra (ex: tempo de jogo, nº atletas)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Configurar Regras</CardTitle>
            <CardDescription>{modalityName} - {categoryName}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mín. Atletas</Label>
              <Input
                type="number"
                value={config.min_athletes || ""}
                onChange={(e) => handleChange("min_athletes", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. Atletas</Label>
              <Input
                type="number"
                value={config.max_athletes || ""}
                onChange={(e) => handleChange("max_athletes", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx. Staff (Técnicos)</Label>
              <Input
                type="number"
                value={config.max_coaches || ""}
                onChange={(e) => handleChange("max_coaches", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Substituições</Label>
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
          <div className="flex justify-end pt-4">
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
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

  // Busca modalidades filtrando pela competição se selecionada
  const { data: modalities = [], isLoading } = useQuery({
    queryKey: ["modalities", orgId, competitionId],
    queryFn: async () => {
      // 1. Busca TODAS as modalidades da organização
      const { data: allModalities, error } = await supabase
        .from("modalities")
        .select("*")
        .eq("org_id", orgId)
        .order("name");

      if (error) throw error;

      // 2. Se houver competição selecionada, filtra apenas as que têm regras nela
      if (competitionId) {
        const { data: rules } = await supabase
          .from("competition_rules")
          .select("modality_id")
          .eq("competition_id", competitionId);
        
        const activeIds = new Set(rules?.map((r) => r.modality_id));
        
        // Retorna apenas modalidades ativas nesta competição
        // Se a lista estiver vazia, retorna array vazio (não mostra misturado)
        return allModalities.filter((m) => activeIds.has(m.id));
      }

      // Se não tiver competição selecionada, mostra todas (modo gerenciamento global)
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
      // Se criou, já seleciona
      if (newModality) onSelect(newModality.id);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5" /> Modalidades
          </CardTitle>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
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
          {competitionId 
            ? "Modalidades ativas nesta competição." 
            : "Gerencie as modalidades da organização."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[500px] p-2">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : modalities.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            {competitionId ? "Nenhuma modalidade vinculada a esta competição." : "Nenhuma modalidade cadastrada."}
          </div>
        ) : (
          <div className="grid gap-2">
            {modalities.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border text-left transition-all hover:bg-accent",
                  selectedId === m.id ? "bg-primary/10 border-primary ring-1 ring-primary" : "bg-card"
                )}
              >
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {m.type} · {m.gender === 'X' ? 'Misto' : m.gender === 'M' ? 'Masculino' : 'Feminino'}
                  </div>
                </div>
                {selectedId === m.id && <ChevronRight className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─── SUB-COMPONENT: CATEGORIES SECTION ───
interface CategoriesSectionProps {
  orgId: string;
  competitionId: string | null;
  modalityId: string;
  onEditRule: (ruleId: string, categoryName: string, modalityName: string, config: any) => void;
}

const CategoriesSection = ({ orgId, competitionId, modalityId, onEditRule }: CategoriesSectionProps) => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const queryClient = useQueryClient();

  // Busca categorias JÁ vinculadas (regras) ou disponíveis
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["categories-rules", competitionId, modalityId],
    enabled: !!competitionId && !!modalityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select("*, categories(*), modalities(*)")
        .eq("competition_id", competitionId)
        .eq("modality_id", modalityId);
      if (error) throw error;
      return data;
    },
  });

  // Busca todas categorias globais para permitir selecionar
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
      // Verifica se já existe
      const exists = rules.find(r => r.category_id === categoryId);
      if (exists) return;

      const { error } = await supabase.from("competition_rules").insert({
        org_id: orgId,
        competition_id: competitionId,
        modality_id: modalityId,
        category_id: categoryId,
        rules_config: {} // Configuração padrão vazia
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria adicionada à modalidade!");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      // Invalida modalidades também para atualizar a lista da esquerda se necessário
      queryClient.invalidateQueries({ queryKey: ["modalities"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      // 1. Cria a categoria global
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .insert({ org_id: orgId, name: newCategoryName })
        .select()
        .single();
      if (catError) throw catError;

      // 2. Vincula à competição atual
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
      toast.success("Categoria removida da competição.");
      queryClient.invalidateQueries({ queryKey: ["categories-rules"] });
      queryClient.invalidateQueries({ queryKey: ["modalities"] });
    }
  });

  if (!competitionId) return <div className="p-4 text-center text-muted-foreground">Selecione uma competição.</div>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5" /> Categorias
        </CardTitle>
        <CardDescription>Categorias ativas para a modalidade selecionada.</CardDescription>
        
        {/* Adicionar Categoria Existente ou Nova */}
        <div className="flex gap-2 mt-2">
          <Select onValueChange={(val) => addCategoryMutation.mutate(val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Adicionar existente..." />
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
            <DialogTrigger asChild><Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar Nova Categoria</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <Label>Nome da Categoria</Label>
                <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Ex: Sub-17" />
                <Button onClick={() => createCategoryMutation.mutate()} className="w-full">Criar e Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : rules.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Nenhuma categoria configurada para esta modalidade nesta competição.
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div>
                  <div className="font-medium">{rule.categories?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {rule.rules_config?.min_athletes ? `Min: ${rule.rules_config.min_athletes}` : ''} 
                    {rule.rules_config?.max_athletes ? ` Max: ${rule.rules_config.max_athletes}` : ''}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEditRule(rule.id, rule.categories?.name, rule.modalities?.name, rule.rules_config)}
                  >
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeRuleMutation.mutate(rule.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
  
  // State para o modal de edição de regras
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
        <Trophy className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground uppercase font-bold">Competição</Label>
          <Select value={competitionId} onValueChange={(val) => {
            setCompetitionId(val);
            setSelectedModalityId(null); // Reseta seleção ao trocar competição
          }}>
            <SelectTrigger className="mt-1 bg-background">
              <SelectValue placeholder="Selecione uma competição..." />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {competitionId && (
        <>
          <div className="grid gap-6 lg:grid-cols-2 h-[600px]">
            {/* Coluna Esquerda: Modalidades (Filtradas) */}
            <ModalitiesSection
              orgId={orgId}
              competitionId={competitionId} // Passando ID para filtrar
              selectedId={selectedModalityId}
              onSelect={(id) => {
                setSelectedModalityId(id);
                setEditingRule(null);
              }}
            />

            {/* Coluna Direita: Categorias da Modalidade */}
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
              <Card className="flex flex-col items-center justify-center h-full text-center border-dashed">
                <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Selecione uma modalidade ao lado para gerenciar suas categorias
                </p>
              </Card>
            )}
          </div>

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
        </>
      )}
    </div>
  );
};

export default StructureManager;
