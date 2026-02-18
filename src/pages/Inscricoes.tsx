import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Users,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertTriangle,
  Send,
  Info,
} from "lucide-react";

// ─── Types ───
interface RulesConfig {
  min_athletes?: number;
  max_athletes?: number;
  max_athletes_m?: number | null;
  max_athletes_f?: number | null;
  birth_date_min?: string;
  birth_date_max?: string;
  birth_year_min?: number;
  birth_year_max?: number;
  max_modalities_per_athlete?: number;
  max_substitutions?: number;
  max_coaches?: number;
  notes?: string | null;
  [key: string]: unknown;
}

interface CategoryWithYears {
  id: string;
  name: string;
  year_min: number | null;
  year_max: number | null;
}

interface CompetitionRule {
  id: string;
  competition_id: string;
  modality_id: string;
  category_id: string;
  rules_config: RulesConfig;
  category: CategoryWithYears;
  modality: { id: string; name: string };
}

interface Participant {
  id: string;
  full_name: string;
  birth_date: string | null;
  role: string;
  sex: string | null;
  photo_url: string | null;
  delegation_id: string | null;
}

// ─── Helpers ───
function birthYearFromDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

function isAgeValid(
  birthDate: string | null,
  category: CategoryWithYears,
  rulesConfig?: RulesConfig
): { valid: boolean; reason?: string } {
  const year = birthYearFromDate(birthDate);
  if (!year) return { valid: false, reason: "Data de nascimento não informada" };

  // Use rules_config birth_year_min/max if available, otherwise fall back to category
  const yearMin = rulesConfig?.birth_year_min ?? category.year_min;
  const yearMax = rulesConfig?.birth_year_max ?? category.year_max;

  if (yearMin && year < yearMin) {
    return { valid: false, reason: `Nascido em ${year}, mínimo permitido: ${yearMin}` };
  }
  if (yearMax && year > yearMax) {
    return { valid: false, reason: `Nascido em ${year}, máximo permitido: ${yearMax}` };
  }
  return { valid: true };
}

// ─── Step Indicator ───
function StepIndicator({ current }: { current: number }) {
  const steps = ["Seleção de Equipa", "Seleção de Atletas", "Revisão e Envio"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
              i < current
                ? "bg-primary text-primary-foreground"
                : i === current
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline ${i === current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Team Selection ───
function StepTeamSelection({
  orgId,
  onSelect,
  gestorDelegationId,
}: {
  orgId: string;
  onSelect: (rule: CompetitionRule, delegationId: string) => void;
  gestorDelegationId?: string | null;
}) {
  const [competitionId, setCompetitionId] = useState("");
  const [modalityId, setModalityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [delegationId, setDelegationId] = useState(gestorDelegationId || "");

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-inscr", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, name, year").eq("org_id", orgId).order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rules = [] } = useQuery({
    queryKey: ["comp-rules-inscr", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_rules")
        .select("id, competition_id, modality_id, category_id, rules_config, category:categories(id, name, year_min, year_max), modality:modalities(id, name)")
        .eq("competition_id", competitionId)
        .eq("org_id", orgId);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations-inscr", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("delegations").select("id, name").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const modalities = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    rules.forEach((r: any) => { if (r.modality) map.set(r.modality.id, r.modality); });
    return Array.from(map.values());
  }, [rules]);

  const categories = useMemo(() => {
    return rules.filter((r: any) => r.modality_id === modalityId).map((r: any) => r.category).filter(Boolean);
  }, [rules, modalityId]);

  const selectedRule = useMemo(() => {
    return rules.find((r: any) => r.modality_id === modalityId && r.category_id === categoryId) as CompetitionRule | undefined;
  }, [rules, modalityId, categoryId]);

  const rulesConfig = selectedRule?.rules_config as RulesConfig | undefined;
  const category = selectedRule?.category as CategoryWithYears | undefined;

  const canProceed = selectedRule && delegationId;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display tracking-wider">Selecione o Contexto</CardTitle>
          <CardDescription>Escolha a competição, modalidade, categoria e delegação.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Competição</Label>
            <Select value={competitionId} onValueChange={(v) => { setCompetitionId(v); setModalityId(""); setCategoryId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{competitions.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {!gestorDelegationId && (
            <div className="space-y-2">
              <Label>Delegação (Escola)</Label>
              <Select value={delegationId} onValueChange={setDelegationId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{delegations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Modalidade</Label>
            <Select value={modalityId} onValueChange={(v) => { setModalityId(v); setCategoryId(""); }} disabled={!competitionId}>
              <SelectTrigger><SelectValue placeholder={competitionId ? "Selecione..." : "Escolha a competição primeiro"} /></SelectTrigger>
              <SelectContent>{modalities.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!modalityId}>
              <SelectTrigger><SelectValue placeholder={modalityId ? "Selecione..." : "Escolha a modalidade primeiro"} /></SelectTrigger>
              <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rules Summary Card */}
      {selectedRule && category && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-foreground">
                  Regras: {selectedRule.modality?.name} — {category.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {category.year_min && category.year_max && (
                    <Badge variant="secondary">Nascimento: {category.year_min}–{category.year_max}</Badge>
                  )}
                  {rulesConfig?.min_athletes != null && (
                    <Badge variant="secondary">Mín. Atletas: {rulesConfig.min_athletes}</Badge>
                  )}
                  {rulesConfig?.max_athletes != null && (
                    <Badge variant="secondary">Máx. Atletas: {rulesConfig.max_athletes}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button disabled={!canProceed} onClick={() => onSelect(selectedRule!, delegationId)}>
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Athlete Selection ───
function StepAthleteSelection({
  orgId,
  delegationId,
  rule,
  enrolled,
  onAdd,
  onRemove,
  onBack,
  onNext,
}: {
  orgId: string;
  delegationId: string;
  rule: CompetitionRule;
  enrolled: Participant[];
  onAdd: (p: Participant) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const category = rule.category;
  const rulesConfig = rule.rules_config as RulesConfig;
  const maxAthletes = rulesConfig?.max_athletes ?? 99;
  const maxModalities = rulesConfig?.max_modalities_per_athlete ?? 2;
  const enrolledIds = new Set(enrolled.map((e) => e.id));

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["available-participants", orgId, delegationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id, full_name, birth_date, role, sex, photo_url, delegation_id")
        .eq("org_id", orgId)
        .eq("delegation_id", delegationId)
        .eq("role", "atleta")
        .order("full_name");
      if (error) throw error;
      return data as Participant[];
    },
  });

  // Fetch existing inscriptions for this competition to check modality limits per athlete
  const { data: existingInscriptions = [] } = useQuery({
    queryKey: ["athlete-modality-count", rule.competition_id, delegationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("participant_id, competition_rule_id, competition_rule:competition_rules(modality_id)")
        .eq("delegation_id", delegationId)
        .in("status", ["pendente", "validado", "enviado"] as any);
      if (error) throw error;
      return data as any[];
    },
  });

  // Build map: participant_id -> Set of modality_ids they are already in
  const athleteModalityMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    existingInscriptions.forEach((ins: any) => {
      const pid = ins.participant_id;
      const mid = ins.competition_rule?.modality_id;
      if (!pid || !mid) return;
      if (!map.has(pid)) map.set(pid, new Set());
      map.get(pid)!.add(mid);
    });
    return map;
  }, [existingInscriptions]);

  const available = participants.filter((p) => !enrolledIds.has(p.id));

  const handleAdd = (p: Participant) => {
    if (enrolled.length >= maxAthletes) {
      toast.error(`Limite de ${maxAthletes} atletas atingido.`);
      return;
    }
    const check = isAgeValid(p.birth_date, category, rulesConfig);
    if (!check.valid) {
      toast.error(`Atleta "${p.full_name}" bloqueado: ${check.reason}`);
      return;
    }
    // Check max modalities per athlete (Art 33.II)
    const currentModalities = athleteModalityMap.get(p.id) ?? new Set();
    const willBeInModalities = new Set(currentModalities);
    willBeInModalities.add(rule.modality_id);
    if (willBeInModalities.size > maxModalities) {
      toast.error(`"${p.full_name}" já está inscrito em ${currentModalities.size} modalidade(s). Máximo permitido: ${maxModalities}.`);
      return;
    }
    onAdd(p);
    toast.success(`${p.full_name} adicionado à equipa.`);
  };

  return (
    <div className="space-y-5">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 flex items-center gap-3 text-sm">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <span>
            <strong>{rule.modality?.name} — {category.name}</strong> · {enrolled.length}/{maxAthletes} atletas
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Available */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Atletas Disponíveis
            </CardTitle>
            <CardDescription>{available.length} atleta(s) desta delegação</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : available.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum atleta disponível</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {available.map((p) => {
                  const ageCheck = isAgeValid(p.birth_date, category, rulesConfig);
                  const year = birthYearFromDate(p.birth_date);
                  const modalityCount = athleteModalityMap.get(p.id)?.size ?? 0;
                  const atModalityLimit = modalityCount >= maxModalities && !athleteModalityMap.get(p.id)?.has(rule.modality_id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                        {p.photo_url ? <img src={p.photo_url} className="h-full w-full object-cover" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.full_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {year ? `Nasc. ${year}` : "Sem data"}
                          {!ageCheck.valid && <span className="text-destructive ml-1">⚠ Fora da faixa</span>}
                          {modalityCount > 0 && <span className={`ml-1 ${atModalityLimit ? "text-destructive" : "text-amber-600"}`}>· {modalityCount}/{maxModalities} mod.</span>}
                        </p>
                      </div>
                      <Button size="sm" variant={ageCheck.valid && !atModalityLimit ? "default" : "outline"} onClick={() => handleAdd(p)} disabled={atModalityLimit}>
                        <UserPlus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrolled */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Equipa Atual
            </CardTitle>
            <CardDescription>{enrolled.length} de {maxAthletes} atletas</CardDescription>
          </CardHeader>
          <CardContent>
            {enrolled.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum atleta adicionado ainda</p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {enrolled.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                    <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">Nasc. {birthYearFromDate(p.birth_date) ?? "—"}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onRemove(p.id)}>
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
        <Button onClick={onNext} disabled={enrolled.length === 0}>
          Próximo <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Submit ───
function StepReview({
  rule,
  enrolled,
  delegationId,
  orgId,
  onBack,
  onDone,
}: {
  rule: CompetitionRule;
  enrolled: Participant[];
  delegationId: string;
  orgId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const rulesConfig = rule.rules_config as RulesConfig;
  const minAthletes = rulesConfig?.min_athletes ?? 0;
  const maxAthletes = rulesConfig?.max_athletes ?? 99;
  const isBelowMin = enrolled.length < minAthletes;

  // Fetch delegation staff rules
  const { data: staffRules = [] } = useQuery({
    queryKey: ["delegation-staff-rules-validation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delegation_staff_rules").select("*").order("role_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all participants in this delegation (staff)
  const { data: delegationParticipants = [] } = useQuery({
    queryKey: ["delegation-staff-count", delegationId],
    enabled: !!delegationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id, role")
        .eq("delegation_id", delegationId)
        .neq("role", "atleta");
      if (error) throw error;
      return data;
    },
  });

  // Map participant roles to staff rule role_names
  const staffWarnings = useMemo(() => {
    const warnings: { role: string; message: string; level: "error" | "warn" }[] = [];
    const roleCountMap = new Map<string, number>();
    delegationParticipants.forEach((p: any) => {
      const r = p.role as string;
      roleCountMap.set(r, (roleCountMap.get(r) ?? 0) + 1);
    });

    staffRules.forEach((sr: any) => {
      const roleName = sr.role_name?.toLowerCase();
      // Map rule role_name to participant_role enum
      const mappedRole =
        roleName === "técnico" || roleName === "tecnico" ? "tecnico" :
        roleName === "dirigente" ? "dirigente" :
        roleName === "motorista" ? "motorista" :
        roleName === "árbitro" || roleName === "arbitro" ? "arbitro" :
        null;

      if (!mappedRole) return;
      const count = roleCountMap.get(mappedRole) ?? 0;

      if (sr.is_required && count < (sr.min_count ?? 1)) {
        warnings.push({ role: sr.role_name, message: `${sr.role_name}: mínimo ${sr.min_count ?? 1}, tem ${count}`, level: "error" });
      }
      if (sr.max_count != null && count > sr.max_count) {
        warnings.push({ role: sr.role_name, message: `${sr.role_name}: máximo ${sr.max_count}, tem ${count}`, level: "error" });
      }
    });
    return warnings;
  }, [staffRules, delegationParticipants]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Delete any existing draft inscriptions for this rule + delegation
      await supabase
        .from("inscriptions")
        .delete()
        .eq("competition_rule_id", rule.id)
        .eq("delegation_id", delegationId)
        .in("status", ["rascunho" as any, "pendente" as any]);

      // Insert all as 'pendente' (submitted for validation)
      const rows = enrolled.map((p) => ({
        participant_id: p.id,
        competition_rule_id: rule.id,
        delegation_id: delegationId,
        org_id: orgId,
        status: "pendente" as any,
      }));

      const { error } = await supabase.from("inscriptions").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrição enviada com sucesso! Aguardando validação.");
      queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      onDone();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar inscrição"),
  });

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display tracking-wider">Revisão da Equipa</CardTitle>
          <CardDescription>
            {rule.modality?.name} — {rule.category?.name} · {enrolled.length} atleta(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {enrolled.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <span className="text-xs font-bold text-primary w-5 text-center">{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {p.photo_url ? <img src={p.photo_url} className="h-full w-full object-cover" /> : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.full_name}</p>
                </div>
                <span className="text-xs text-muted-foreground">Nasc. {birthYearFromDate(p.birth_date) ?? "—"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isBelowMin && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-5 flex items-center gap-3 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Mínimo de <strong>{minAthletes}</strong> atletas necessário. Você tem {enrolled.length}.</span>
          </CardContent>
        </Card>
      )}

      {staffWarnings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-5 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Composição da Delegação
            </div>
            {staffWarnings.map((w, i) => (
              <p key={i} className={`text-xs ${w.level === "error" ? "text-destructive" : "text-amber-600"}`}>
                ⚠ {w.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}><ChevronLeft className="mr-2 h-4 w-4" /> Voltar</Button>
        <Button
          disabled={isBelowMin || submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
          size="lg"
        >
          {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Finalizar Inscrição
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ───
const Inscricoes = () => {
  const { user } = useAuth();
  const { isGestor, isAdmin } = useUserRole();
  const [step, setStep] = useState(0);
  const [selectedRule, setSelectedRule] = useState<CompetitionRule | null>(null);
  const [delegationId, setDelegationId] = useState("");
  const [enrolled, setEnrolled] = useState<Participant[]>([]);

  const { data: profile } = useQuery({
    queryKey: ["my-profile-inscr", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("org_id, delegation_id").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const orgId = profile?.org_id ?? "";
  const isGestorOnly = isGestor && !isAdmin;
  const gestorDelegationId = profile?.delegation_id;

  const handleTeamSelected = (rule: CompetitionRule, delId: string) => {
    setSelectedRule(rule);
    setDelegationId(delId);
    setEnrolled([]);
    setStep(1);
  };

  const handleAddParticipant = (p: Participant) => {
    setEnrolled((prev) => [...prev, p]);
  };

  const handleRemoveParticipant = (id: string) => {
    setEnrolled((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDone = () => {
    setStep(0);
    setSelectedRule(null);
    setDelegationId("");
    setEnrolled([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Inscrições</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Inscreva atletas nas modalidades e categorias da competição
        </p>
      </div>

      <StepIndicator current={step} />

      {step === 0 && <StepTeamSelection orgId={orgId} onSelect={handleTeamSelected} gestorDelegationId={isGestorOnly ? gestorDelegationId : null} />}

      {step === 1 && selectedRule && (
        <StepAthleteSelection
          orgId={orgId}
          delegationId={delegationId}
          rule={selectedRule}
          enrolled={enrolled}
          onAdd={handleAddParticipant}
          onRemove={handleRemoveParticipant}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && selectedRule && (
        <StepReview
          rule={selectedRule}
          enrolled={enrolled}
          delegationId={delegationId}
          orgId={orgId}
          onBack={() => setStep(1)}
          onDone={handleDone}
        />
      )}
    </div>
  );
};

export default Inscricoes;
