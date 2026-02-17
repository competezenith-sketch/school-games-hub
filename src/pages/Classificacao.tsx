import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, Medal } from "lucide-react";

const Classificacao = () => {
  const { user } = useAuth();
  const [competitionId, setCompetitionId] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("org_id").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const orgId = profile?.org_id ?? "";

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-class", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, name, year").eq("org_id", orgId).order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Scoring rules for the selected competition
  const { data: scoringRules = [] } = useQuery({
    queryKey: ["scoring-rules", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scoring_rules")
        .select("*")
        .eq("competition_id", competitionId)
        .order("placement", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // All finished matches for the competition
  const { data: matches = [], isLoading: loadingMatches } = useQuery({
    queryKey: ["matches-class", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, delegation_a_id, delegation_b_id, score_a, score_b, winner_delegation_id, status, competition_rule_id")
        .eq("competition_id", competitionId)
        .eq("status", "encerrado");
      if (error) throw error;
      return data;
    },
  });

  // All delegations
  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations-class", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("delegations").select("id, name").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data;
    },
  });

  // Build standings from matches
  const standings = useMemo(() => {
    const stats: Record<string, { id: string; name: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number }> = {};

    const getDelegation = (id: string) => {
      if (!stats[id]) {
        const del = delegations.find((d: any) => d.id === id);
        stats[id] = { id, name: del?.name ?? "—", played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      }
      return stats[id];
    };

    matches.forEach((m: any) => {
      if (m.score_a == null || m.score_b == null) return;
      const a = getDelegation(m.delegation_a_id);
      const b = getDelegation(m.delegation_b_id);

      a.played++;
      b.played++;
      a.goalsFor += m.score_a;
      a.goalsAgainst += m.score_b;
      b.goalsFor += m.score_b;
      b.goalsAgainst += m.score_a;

      if (m.score_a > m.score_b) {
        a.wins++;
        a.points += 3;
        b.losses++;
      } else if (m.score_b > m.score_a) {
        b.wins++;
        b.points += 3;
        a.losses++;
      } else {
        a.draws++;
        b.draws++;
        a.points += 1;
        b.points += 1;
      }
    });

    return Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
  }, [matches, delegations]);

  const medalColor = (pos: number) => {
    if (pos === 0) return "text-yellow-500";
    if (pos === 1) return "text-gray-400";
    if (pos === 2) return "text-amber-700";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Classificação Geral</h2>
        <p className="text-muted-foreground text-sm mt-1">Tabela de classificação por delegação</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2 max-w-sm">
            <Label>Competição</Label>
            <Select value={competitionId} onValueChange={setCompetitionId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {competitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scoring rules reference */}
      {scoringRules.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5">
            <p className="text-sm font-semibold mb-2">Tabela de Pontuação</p>
            <div className="flex flex-wrap gap-2">
              {scoringRules.map((r: any) => (
                <Badge key={r.id} variant="secondary">{r.placement}º lugar: {r.points} pts</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {competitionId && (
        loadingMatches ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : standings.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum resultado finalizado ainda</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Os dados aparecerão quando os jogos forem encerrados</p>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display tracking-wider text-lg">Tabela de Classificação</CardTitle>
              <CardDescription>{standings.length} delegação(ões) com jogos encerrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Delegação</TableHead>
                    <TableHead className="text-center">J</TableHead>
                    <TableHead className="text-center">V</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">GP</TableHead>
                    <TableHead className="text-center">GC</TableHead>
                    <TableHead className="text-center">SG</TableHead>
                    <TableHead className="text-center font-bold">PTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((s, i) => (
                    <TableRow key={s.id} className={i < 3 ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {i < 3 ? <Medal className={`h-4 w-4 ${medalColor(i)}`} /> : <span className="text-muted-foreground">{i + 1}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">{s.played}</TableCell>
                      <TableCell className="text-center">{s.wins}</TableCell>
                      <TableCell className="text-center">{s.draws}</TableCell>
                      <TableCell className="text-center">{s.losses}</TableCell>
                      <TableCell className="text-center">{s.goalsFor}</TableCell>
                      <TableCell className="text-center">{s.goalsAgainst}</TableCell>
                      <TableCell className="text-center">{s.goalsFor - s.goalsAgainst}</TableCell>
                      <TableCell className="text-center font-bold text-primary">{s.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default Classificacao;
