import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Download, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react";
import {
  JJ2026_ALL_MODALITIES,
  JJ2026_CATEGORIES,
  JJ2026_AGE_EXCEPTIONS,
  JJ2026_DEFAULT_AGE,
  JJ2026_DELEGATION_LIMITS,
  JJ2026_INSCRIPTION_RULES,
  JJ2026_KEY_DATES,
  getCategoryForModality,
  generateRulesConfig,
  type JJ2026CategoryTemplate,
} from "@/lib/jj2026-rules";

interface ImportResult {
  modalitiesCreated: number;
  modalitiesUpdated: number;
  categoriesCreated: number;
  rulesCreated: number;
  errors: string[];
}

interface JJ2026ImportProps {
  orgId: string;
  competitionId: string;
  competitionName: string;
}

export function JJ2026Import({ orgId, competitionId, competitionName }: JJ2026ImportProps) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      const res: ImportResult = {
        modalitiesCreated: 0,
        modalitiesUpdated: 0,
        categoriesCreated: 0,
        rulesCreated: 0,
        errors: [],
      };

      // 1. Fetch existing modalities
      const { data: existingMods, error: modsErr } = await supabase
        .from("modalities")
        .select("id, name, type, is_team_sport")
        .eq("org_id", orgId);
      if (modsErr) throw modsErr;

      const modMap = new Map(existingMods.map((m) => [m.name, m]));
      // Also add lowercase keys for fuzzy matching
      existingMods.forEach((m) => modMap.set(m.name.toLowerCase(), m));

      // 2. Create/update modalities using upsert
      for (const mod of JJ2026_ALL_MODALITIES) {
        const existing = modMap.get(mod.name) || modMap.get(mod.name.toLowerCase());
        if (existing) {
          // Update type and is_team_sport if different
          if (existing.type !== mod.type || existing.is_team_sport !== mod.isTeamSport) {
            const { error } = await supabase
              .from("modalities")
              .update({ type: mod.type, is_team_sport: mod.isTeamSport })
              .eq("id", existing.id);
            if (error) {
              res.errors.push(`Erro ao atualizar ${mod.name}: ${error.message}`);
            } else {
              res.modalitiesUpdated++;
            }
          }
        } else {
          // Try to find by name globally (unique constraint is not per-org)
          const { data: globalMatch } = await supabase
            .from("modalities")
            .select("id")
            .eq("name", mod.name)
            .maybeSingle();

          if (globalMatch) {
            // Modality exists under another org — skip creation, just reference it
            res.modalitiesUpdated++;
          } else {
            const { error } = await supabase.from("modalities").insert({
              name: mod.name,
              type: mod.type,
              is_team_sport: mod.isTeamSport,
              gender: "misto",
              gender_type: mod.feminino === null ? "male" : mod.masculino === null ? "female" : "mixed",
              org_id: orgId,
            });
            if (error) {
              // Handle duplicate key gracefully — modality exists but RLS hid it
              if (error.code === "23505" || error.message.includes("duplicate key")) {
                res.modalitiesUpdated++;
              } else {
                res.errors.push(`Erro ao criar ${mod.name}: ${error.message}`);
              }
            } else {
              res.modalitiesCreated++;
            }
          }
        }
      }

      // 3. Re-fetch all modalities (not filtered by org, since unique constraint is global)
      const { data: allMods } = await supabase
        .from("modalities")
        .select("id, name");
      const modIdMap = new Map((allMods || []).map((m) => [m.name.toLowerCase(), m.id]));

      // 4. Fetch existing categories
      const { data: existingCats } = await supabase
        .from("categories")
        .select("id, name, year_min, year_max")
        .eq("org_id", orgId);
      const catMap = new Map(
        (existingCats || []).map((c) => [`${c.year_min}-${c.year_max}`, c])
      );

      // 5. Create categories
      const catIdMap = new Map<string, string>();
      for (const cat of JJ2026_CATEGORIES) {
        const key = `${cat.yearMin}-${cat.yearMax}`;
        const existing = catMap.get(key);
        if (existing) {
          catIdMap.set(key, existing.id);
        } else {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              name: cat.name,
              org_id: orgId,
              year_min: cat.yearMin,
              year_max: cat.yearMax,
              description: cat.description,
            })
            .select("id")
            .single();
          if (error) {
            res.errors.push(`Erro ao criar categoria ${cat.name}: ${error.message}`);
          } else {
            catIdMap.set(key, data.id);
            res.categoriesCreated++;
          }
        }
      }

      // 6. Fetch existing rules
      const { data: existingRules } = await supabase
        .from("competition_rules")
        .select("id, modality_id, category_id")
        .eq("competition_id", competitionId)
        .eq("org_id", orgId);
      const ruleSet = new Set(
        (existingRules || []).map((r) => `${r.modality_id}-${r.category_id}`)
      );

      // 7. Create competition_rules for each modality × gender
      for (const mod of JJ2026_ALL_MODALITIES) {
        const modId = modIdMap.get(mod.name.toLowerCase());
        if (!modId) continue;

        const cat = getCategoryForModality(mod.name);
        const catKey = `${cat.yearMin}-${cat.yearMax}`;
        const catId = catIdMap.get(catKey);
        if (!catId) continue;

        // Check if rule already exists
        const ruleKey = `${modId}-${catId}`;
        if (ruleSet.has(ruleKey)) continue;

        // Generate rules_config combining M and F limits
        const configM = generateRulesConfig(mod.name, "M");
        const configF = generateRulesConfig(mod.name, "F");

        const mergedConfig = {
          ...configM,
          max_athletes_m: mod.masculino,
          max_athletes_f: mod.feminino,
          max_athletes: Math.max(mod.masculino ?? 0, mod.feminino ?? 0),
        };

        const { error } = await supabase.from("competition_rules").insert({
          org_id: orgId,
          competition_id: competitionId,
          modality_id: modId,
          category_id: catId,
          rules_config: mergedConfig as any,
        });

        if (error) {
          res.errors.push(`Erro ao criar regra ${mod.name}: ${error.message}`);
        } else {
          res.rulesCreated++;
        }
      }

      return res;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries();
      if (data.errors.length === 0) {
        toast.success("Regulamento JJ 2026 importado com sucesso!");
      } else {
        toast.warning(`Importado com ${data.errors.length} aviso(s).`);
      }
    },
    onError: (err: any) => toast.error(err.message || "Erro ao importar"),
  });

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-5 w-5" /> Importar Regulamento JJ 2026
        </CardTitle>
        <CardDescription>
          Importa automaticamente todas as modalidades, categorias e regras do
          Regulamento Geral dos Jogos da Juventude 2026 (COB) para a competição{" "}
          <strong>{competitionName}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary of what will be imported */}
        <div className="grid gap-2 sm:grid-cols-2 text-sm">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="font-medium">Modalidades</p>
            <p className="text-muted-foreground text-xs">
              {JJ2026_ALL_MODALITIES.length} modalidades ({JJ2026_ALL_MODALITIES.filter(m => m.type === "individual").length} individuais, {JJ2026_ALL_MODALITIES.filter(m => m.type === "coletivo").length} coletivas)
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="font-medium">Categorias Etárias</p>
            <p className="text-muted-foreground text-xs">
              {JJ2026_CATEGORIES.length} faixas: {JJ2026_CATEGORIES.map(c => c.name.split("(")[0].trim()).join(", ")}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="font-medium">Delegação (Art 14)</p>
            <p className="text-muted-foreground text-xs">
              Máx {JJ2026_DELEGATION_LIMITS.maxTotal} integrantes, {JJ2026_DELEGATION_LIMITS.maxDirigentes} dirigentes
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="font-medium">Inscrição (Art 33)</p>
            <p className="text-muted-foreground text-xs">
              Máx {JJ2026_INSCRIPTION_RULES.maxModalitiesPerAthlete} modalidades por atleta, {JJ2026_INSCRIPTION_RULES.maxSubstitutionsPerModality} substituições
            </p>
          </div>
        </div>

        {/* Age exceptions detail */}
        <div className="rounded-lg border p-3">
          <p className="font-medium text-sm mb-2">Faixas Etárias Especiais (Art 12)</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">Padrão: {JJ2026_DEFAULT_AGE.ageLabel} ({JJ2026_DEFAULT_AGE.birthYearMin}-{JJ2026_DEFAULT_AGE.birthYearMax})</Badge>
            {Object.entries(JJ2026_AGE_EXCEPTIONS).map(([mod, range]) => (
              <Badge key={mod} variant="outline" className="text-xs">
                {mod}: {range.ageLabel}
              </Badge>
            ))}
          </div>
        </div>

        {/* Key dates */}
        <div className="rounded-lg border p-3">
          <p className="font-medium text-sm mb-2">Datas Importantes (Art 36)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs text-muted-foreground">
            <span>Cadastro UF: {JJ2026_KEY_DATES.cadastroUF}</span>
            <span>Inscr. Nominal: {JJ2026_KEY_DATES.inscricaoNominal}</span>
            <span>Documentos: {JJ2026_KEY_DATES.documentos}</span>
            <span>Início: {JJ2026_KEY_DATES.inicioJogos}</span>
            <span>Fim: {JJ2026_KEY_DATES.fimJogos}</span>
          </div>
        </div>

        {/* Import button */}
        {!result ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importando regulamento...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Importar Regulamento JJ 2026 para "{competitionName}"
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Importação concluída!
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="rounded bg-muted p-2 text-center">
                <p className="font-bold">{result.modalitiesCreated}</p>
                <p className="text-xs text-muted-foreground">Modalidades criadas</p>
              </div>
              <div className="rounded bg-muted p-2 text-center">
                <p className="font-bold">{result.modalitiesUpdated}</p>
                <p className="text-xs text-muted-foreground">Modalidades atualizadas</p>
              </div>
              <div className="rounded bg-muted p-2 text-center">
                <p className="font-bold">{result.categoriesCreated}</p>
                <p className="text-xs text-muted-foreground">Categorias criadas</p>
              </div>
              <div className="rounded bg-muted p-2 text-center">
                <p className="font-bold">{result.rulesCreated}</p>
                <p className="text-xs text-muted-foreground">Regras criadas</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                <p className="text-sm font-medium text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> {result.errors.length} erro(s)
                </p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive/80">{e}</p>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Importar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
