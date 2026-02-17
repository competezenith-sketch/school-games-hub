import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RulesConfig {
  birth_date_min: string;
  birth_date_max: string;
  min_athletes: number;
  max_athletes: number;
  max_staff: number;
  requires_rg: boolean;
  requires_medical_cert: boolean;
  allow_transgender: boolean;
  scoring_system: string;
}

const defaultRules: RulesConfig = {
  birth_date_min: "",
  birth_date_max: "",
  min_athletes: 5,
  max_athletes: 15,
  max_staff: 3,
  requires_rg: true,
  requires_medical_cert: false,
  allow_transgender: true,
  scoring_system: "pontos_corridos",
};

interface ComboItem {
  id: string;
  name: string;
}

const Regulamento = () => {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<ComboItem[]>([]);
  const [modalities, setModalities] = useState<ComboItem[]>([]);
  const [categories, setCategories] = useState<ComboItem[]>([]);
  const [competitionRules, setCompetitionRules] = useState<{ id: string; competition_id: string; modality_id: string; category_id: string }[]>([]);

  const [selectedCompetition, setSelectedCompetition] = useState("");
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rules, setRules] = useState<RulesConfig>(defaultRules);
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load reference data
  useEffect(() => {
    const load = async () => {
      const [compRes, modRes, catRes] = await Promise.all([
        supabase.from("competitions").select("id, name"),
        supabase.from("modalities").select("id, name"),
        supabase.from("categories").select("id, name"),
      ]);
      setCompetitions((compRes.data as ComboItem[]) || []);
      setModalities((modRes.data as ComboItem[]) || []);
      setCategories((catRes.data as ComboItem[]) || []);
    };
    load();
  }, []);

  // Load existing rule when selection changes
  useEffect(() => {
    if (!selectedCompetition || !selectedModality || !selectedCategory) {
      setRules(defaultRules);
      setRuleId(null);
      return;
    }

    const loadRule = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("competition_rules")
        .select("id, rules_config")
        .eq("competition_id", selectedCompetition)
        .eq("modality_id", selectedModality)
        .eq("category_id", selectedCategory)
        .maybeSingle();

      if (data) {
        setRuleId(data.id);
        const config = data.rules_config as Record<string, unknown>;
        setRules({ ...defaultRules, ...config } as RulesConfig);
      } else {
        setRuleId(null);
        setRules(defaultRules);
      }
      setLoading(false);
    };
    loadRule();
  }, [selectedCompetition, selectedModality, selectedCategory]);

  const handleSave = async () => {
    if (!selectedCompetition || !selectedModality || !selectedCategory) {
      toast.error("Selecione competição, modalidade e categoria.");
      return;
    }

    setSaving(true);
    try {
      // Get user org_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) {
        toast.error("Perfil não encontrado. Configure sua organização primeiro.");
        return;
      }

      if (ruleId) {
        const { error } = await supabase
          .from("competition_rules")
          .update({ rules_config: JSON.parse(JSON.stringify(rules)) })
          .eq("id", ruleId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("competition_rules")
          .insert([{
            org_id: profile.org_id,
            competition_id: selectedCompetition,
            modality_id: selectedModality,
            category_id: selectedCategory,
            rules_config: JSON.parse(JSON.stringify(rules)),
          }]);
        if (error) throw error;
      }
      toast.success("Regulamento salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar regulamento");
    } finally {
      setSaving(false);
    }
  };

  const updateRule = <K extends keyof RulesConfig>(key: K, value: RulesConfig[K]) => {
    setRules((prev) => ({ ...prev, [key]: value }));
  };

  const formReady = selectedCompetition && selectedModality && selectedCategory;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl">Parametrização do Regulamento</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Configure as regras de cada modalidade e categoria por competição.
        </p>
      </div>

      {/* Selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecione o contexto</CardTitle>
          <CardDescription>Escolha a competição, modalidade e categoria para editar as regras.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Competição</Label>
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select value={selectedModality} onValueChange={setSelectedModality}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {modalities.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rules form */}
      {formReady && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regras do Regulamento</CardTitle>
            <CardDescription>
              {ruleId ? "Editando regra existente" : "Criando nova regra"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Date range */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateField
                    label="Data Nasc. Mínima"
                    value={rules.birth_date_min}
                    onChange={(v) => updateRule("birth_date_min", v)}
                  />
                  <DateField
                    label="Data Nasc. Máxima"
                    value={rules.birth_date_max}
                    onChange={(v) => updateRule("birth_date_max", v)}
                  />
                </div>

                {/* Numeric inputs */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Mín. Atletas</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={rules.min_athletes}
                      onChange={(e) => updateRule("min_athletes", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. Atletas</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={rules.max_athletes}
                      onChange={(e) => updateRule("max_athletes", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Máx. Comissão</Label>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={rules.max_staff}
                      onChange={(e) => updateRule("max_staff", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Toggle switches */}
                <div className="space-y-4">
                  <ToggleField
                    label="Exige RG"
                    description="Participante deve apresentar documento de identidade."
                    checked={rules.requires_rg}
                    onChange={(v) => updateRule("requires_rg", v)}
                  />
                  <ToggleField
                    label="Exige Atestado Médico"
                    description="Participante deve apresentar atestado médico válido."
                    checked={rules.requires_medical_cert}
                    onChange={(v) => updateRule("requires_medical_cert", v)}
                  />
                  <ToggleField
                    label="Permite Atleta Transgênero"
                    description="Conforme regulamento da competição."
                    checked={rules.allow_transgender}
                    onChange={(v) => updateRule("allow_transgender", v)}
                  />
                </div>

                {/* Scoring system */}
                <div className="space-y-2">
                  <Label>Sistema de Pontuação</Label>
                  <Select value={rules.scoring_system} onValueChange={(v) => updateRule("scoring_system", v)}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontos_corridos">Pontos corridos</SelectItem>
                      <SelectItem value="mata_mata">Mata-mata</SelectItem>
                      <SelectItem value="grupos_mata_mata">Fase de grupos + Mata-mata</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Regulamento
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* Subcomponents */
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const date = value ? new Date(value) : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default Regulamento;
