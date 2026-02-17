import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusType } from "@/components/StatusBadge";
import { Trophy, Users, Building2, FileText, Calendar, MapPin } from "lucide-react";
import { format, addDays } from "date-fns";

type CountTable = "competitions" | "participants" | "delegations" | "inscriptions";

function useCount(table: CountTable, filter?: { column: string; value: string }) {
  return useQuery({
    queryKey: ["count", table, filter],
    queryFn: async () => {
      const baseQuery = supabase.from(table).select("id", { count: "exact", head: true } as any);
      const res = filter
        ? await (baseQuery as any).eq(filter.column, filter.value)
        : await baseQuery;
      if (res.error) throw res.error;
      return (res.count as number) ?? 0;
    },
  });
}

const statsDef: Array<{ key: string; label: string; icon: React.ComponentType<{ className?: string }>; table: CountTable; filter?: { column: string; value: string } }> = [
  { key: "competitions", label: "Competições Ativas", icon: Trophy, table: "competitions", filter: { column: "status", value: "em_andamento" } },
  { key: "participants", label: "Participantes", icon: Users, table: "participants" },
  { key: "delegations", label: "Delegações", icon: Building2, table: "delegations" },
  { key: "inscriptions", label: "Inscrições", icon: FileText, table: "inscriptions" },
];

function StatCard({ label, icon: Icon, table, filter }: { label: string; icon: React.ComponentType<{ className?: string }>; table: CountTable; filter?: { column: string; value: string } }) {
  const { data: count, isLoading } = useCount(table, filter);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-display font-bold">{count ?? 0}</p>}
      </CardContent>
    </Card>
  );
}

const statusToBadge: Record<string, StatusType> = {
  agendado: "pendente",
  em_andamento: "analise",
  encerrado: "validado",
  wo: "rejeitado",
};

function UpcomingMatches() {
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["upcoming-matches", today, tomorrow],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id, match_date, match_time, location, status, score_a, score_b, delegation_a:delegations!matches_delegation_a_id_fkey(name), delegation_b:delegations!matches_delegation_b_id_fkey(name)")
        .in("match_date", [today, tomorrow])
        .order("match_date", { ascending: true })
        .order("match_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const todayMatches = matches.filter((m: any) => m.match_date === today);
  const tomorrowMatches = matches.filter((m: any) => m.match_date === tomorrow);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display tracking-wider text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Próximos Jogos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum jogo agendado para hoje ou amanhã
          </p>
        ) : (
          <div className="space-y-5">
            {todayMatches.length > 0 && <MatchGroup label="Hoje" matches={todayMatches} />}
            {tomorrowMatches.length > 0 && <MatchGroup label="Amanhã" matches={tomorrowMatches} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchGroup({ label, matches }: { label: string; matches: any[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="space-y-2">
        {matches.map((m: any) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="shrink-0 text-center w-14">
              {m.match_time ? (
                <p className="text-sm font-display font-bold">{m.match_time.slice(0, 5)}</p>
              ) : (
                <p className="text-xs text-muted-foreground">A def.</p>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{m.delegation_a?.name ?? "Time A"}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className="text-sm font-medium truncate">{m.delegation_b?.name ?? "Time B"}</span>
              </div>
              {m.location && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground truncate">{m.location}</span>
                </div>
              )}
            </div>
            <div className="shrink-0">
              {m.status === "encerrado" ? (
                <span className="font-display font-bold text-sm">{m.score_a} × {m.score_b}</span>
              ) : (
                <StatusBadge status={statusToBadge[m.status] ?? "pendente"} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Visão Geral</h2>
        <p className="text-muted-foreground text-sm mt-1">Resumo da sua organização</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsDef.map((s) => (
          <StatCard key={s.key} label={s.label} icon={s.icon} table={s.table} filter={s.filter} />
        ))}
      </div>
      <UpcomingMatches />
    </div>
  );
};

export default Dashboard;
