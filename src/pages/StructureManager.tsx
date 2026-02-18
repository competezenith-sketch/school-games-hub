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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Plus, Dumbbell, Tag, ChevronRight, Settings2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MODALITY_PRESETS = ["Futsal", "Vôlei", "Xadrez", "Atletismo", "Basquete", "Handebol", "Natação", "Tênis de Mesa"];
const TYPE_OPTIONS = [
  { value: "coletivo", label: "Coletivo" },
  { value: "individual", label: "Individual" },
];
const GENDER_OPTIONS = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Feminino" },
  { value: "misto", label: "Misto" },
];

// ─── Rules Config Editor ───
interface RulesConfig {
  min_athletes?: number;
  max_athletes?: number;
  birth_year_min?: number;
  birth_year_max?: number;
  max_modalities_per_athlete?: number;
  max_substitutions?: number;
  max_coaches?: number;
  max_staff?: number;
  notes?: string | null;
  [key: string]: unknown;
}

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
  initialConfig: RulesConfig;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<RulesConfig>({ ...initialConfig });

  const updateField = (field: string, value: string) => {
    const num = value === "" ? undefined : parseInt(value);
    setConfig((prev) => ({ ...prev, [field]: isNaN(num as number) ? undefined : num }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Merge with any existing unknown fields
      const merged = { ...initialConfig, ...config };
      // Remove undefined values
      const cleaned = Object.fromEntries(
        Object.entries(merged).filter(([, v]) => v !== undefined)
      );
      const { error } = await supabase
        .from("competition_rules")
        .update({ rules_config: cleaned as any })
        .eq("id", ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regras atualizadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["linked-categories"] });
      queryClient.invalidateQueries({ queryKey: ["rule-config"] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const fields: { key: string; label: string; placeholder: string; group: string }[] = [
    { key: "min_athletes", label: "Mín. Atletas", placeholder: "Ex: 5", group: "atletas" },
    { key: "max_athletes", label: "Máx. Atletas", placeholder: "Ex: 12", group: "atletas" },
    { key: "birth_year_min", label: "Ano Nasc. Mín", placeholder: "Ex: 2010", group: "idade" },
    { key: "birth_year_max", label: "Ano Nasc. Máx", placeholder: "Ex: 2014", group: "idade" },
    { key: "max_modalities_per_athlete", label: "Máx. Modalidades/Atleta", placeholder: "Ex: 2", group: "atletas" },
    { key: "max_substitutions", label: "Máx. Substituições", placeholder: "Ex: 5", group: "atletas" },
    { key: "max_coaches", label: "Máx. Técnicos", placeholder: "Ex: 2", group: "oficiais" },
    { key: "max_staff", label: "Máx. Staff Total", placeholder: "Ex: 5", group: "oficiais" },
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-display tracking-wider flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Editor de Regras
            </CardTitle>
            <CardDescription className="mt-1">
              {modalityName} — {categoryName}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Atletas */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Atletas</p>
          <div className="grid grid-cols-2 gap-3">
            {fields.filter((f) => f.group === "atletas").map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  placeholder={f.placeholder}
                  value={config[f.key] != null ? String(config[f.key]) : ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Faixa Etária */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Faixa Etária</p>
          <div className="grid grid-cols-2 gap-3">
            {fields.filter((f) => f.group === "idade").map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  placeholder={f.placeholder}
                  value={config[f.key] != null ? String(config[f.key]) : ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Oficiais */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Oficiais / Comissão</p>
          <div className="grid grid-cols-2 gap-3">
            {fields.filter((f) => f.group === "oficiais").map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type="number"
                  placeholder={f.placeholder}
                  value={config[f.key] != null ? String(config[f.key]) : ""}
                  onChange={(e) => updateField(f.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Regras
          </Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Modalities Section ───
function ModalitiesSection({
  orgId,
  selectedId,
  onSelect,
}: {
  orgId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("coletivo");
  const [gender, setGender] = useState("misto");

  const { data: modalities = [], isLoading } = useQuery({
    queryKey: ["modalities", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modalities")
        .select("*")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("modalities").insert({
        name,
        type,
        gender,
        org_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modalidade criada!");
      queryClient.invalidateQueries({ queryKey: ["modalities", orgId] });
      setOpen(false);
      setName("");
      setType("coletivo");
      setGender("misto");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const typeLabel = (v: string) => TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v;
  const genderLabel = (v: string) => GENDER_OPTIONS.find((o) => o.value === v)?.label ?? v;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wider text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5" /> Modalidades
          </CardTitle>
          <CardDescription className="mt-1">Clique para ver as categorias</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Nova Modalidade</DialogTitle>
              <DialogDescription>Selecione ou digite o nome da modalidade</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Select value={name} onValueChange={setName}>
                  <SelectTrigger><SelectValue placeholder="Selecione ou digite..." /></SelectTrigger>
                  <SelectContent>
                    {MODALITY_PRESETS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ou digite um nome personalizado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!name || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : modalities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma modalidade cadastrada</p>
        ) : (
          <div className="space-y-1">
            {modalities.map((m: any) => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                  selectedId === m.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Dumbbell className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {typeLabel(m.type)} · {genderLabel(m.gender)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 opacity-40 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Categories Section ───
function CategoriesSection({
  orgId,
  competitionId,
  modalityId,
  onEditRule,
}: {
  orgId: string;
  competitionId: string;
  modalityId: string;
  onEditRule: (ruleId: string, categoryName: string, modalityName: string, config: RulesConfig) => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");

  const { data: linkedCategories = [], isLoading } = useQuery({
    queryKey: ["linked-categories", competitionId, modalityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select("id, rules_config, category:categories(id, name, year_min, year_max), modality:modalities(id, name)")
        .eq("competition_id", competitionId)
        .eq("modality_id", modalityId)
        .eq("org_id", orgId);
      if (error) throw error;
      return data.map((r: any) => ({
        ...r.category,
        rule_id: r.id,
        rules_config: r.rules_config,
        modality_name: r.modality?.name ?? "",
      }));
    },
    enabled: !!competitionId && !!modalityId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .insert({
          name,
          org_id: orgId,
          description: yearMin && yearMax ? `${yearMin}-${yearMax}` : null,
          year_min: yearMin ? parseInt(yearMin) : null,
          year_max: yearMax ? parseInt(yearMax) : null,
        })
        .select("id")
        .single();
      if (catErr) throw catErr;

      const { error: ruleErr } = await supabase
        .from("competition_rules")
        .insert({
          org_id: orgId,
          competition_id: competitionId,
          modality_id: modalityId,
          category_id: cat.id,
          rules_config: { min_athletes: 0, max_athletes: 20 },
        });
      if (ruleErr) throw ruleErr;
    },
    onSuccess: () => {
      toast.success("Categoria criada e vinculada!");
      queryClient.invalidateQueries({ queryKey: ["linked-categories", competitionId, modalityId] });
      setOpen(false);
      setName("");
      setYearMin("");
      setYearMax("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display tracking-wider text-lg flex items-center gap-2">
          <Tag className="h-5 w-5" /> Categorias
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Nova Categoria</DialogTitle>
              <DialogDescription>Defina o nome e a faixa etária da categoria</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Mirim, Infantil, Juvenil" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ano Nasc. Mín</Label>
                  <Input type="number" placeholder="Ex: 2012" value={yearMin} onChange={(e) => setYearMin(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ano Nasc. Máx</Label>
                  <Input type="number" placeholder="Ex: 2014" value={yearMax} onChange={(e) => setYearMax(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ao salvar, um <code>rules_config</code> padrão será inicializado automaticamente.
              </p>
              <Button
                className="w-full"
                disabled={!name || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : linkedCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma categoria vinculada a esta modalidade
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ano Mín</TableHead>
                <TableHead>Ano Máx</TableHead>
                <TableHead className="w-20 text-right">Regras</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedCategories.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.year_min || "—"}</TableCell>
                  <TableCell>{c.year_max || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRule(c.rule_id, c.name, c.modality_name, c.rules_config || {})}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
const StructureManager = () => {
  const { user } = useAuth();
  const [competitionId, setCompetitionId] = useState("");
  const [selectedModalityId, setSelectedModalityId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<{
    ruleId: string;
    categoryName: string;
    modalityName: string;
    config: RulesConfig;
  } | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const orgId = profile?.org_id ?? "";

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-list", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, name, year")
        .eq("org_id", orgId)
        .order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Estrutura da Competição</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie modalidades, categorias e regras esportivas por competição
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm">
            <Label>Competição</Label>
            <Select
              value={competitionId}
              onValueChange={(v) => {
                setCompetitionId(v);
                setSelectedModalityId(null);
                setEditingRule(null);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione a competição..." /></SelectTrigger>
              <SelectContent>
                {competitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {competitionId && orgId && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <ModalitiesSection
              orgId={orgId}
              selectedId={selectedModalityId}
              onSelect={(id) => {
                setSelectedModalityId(id);
                setEditingRule(null);
              }}
            />

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
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <Tag className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Selecione uma modalidade para ver suas categorias
                </p>
              </Card>
            )}
          </div>

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
