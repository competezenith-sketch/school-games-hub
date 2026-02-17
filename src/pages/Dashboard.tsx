import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Building2, FileText } from "lucide-react";

type CountTable = "competitions" | "participants" | "delegations" | "inscriptions";

function useCount(table: CountTable, filter?: { column: string; value: string }) {
  return useQuery({
    queryKey: ["count", table, filter],
    queryFn: async () => {
      // Use raw rpc-style count to avoid deep type instantiation
      const baseQuery = supabase.from(table).select("id", { count: "exact", head: true } as any);
      const res = filter
        ? await (baseQuery as any).eq(filter.column, filter.value)
        : await baseQuery;
      if (res.error) throw res.error;
      return (res.count as number) ?? 0;
    },
  });
}

const stats: Array<{ key: string; label: string; icon: React.ComponentType<{ className?: string }>; table: CountTable; filter?: { column: string; value: string } }> = [
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
        {isLoading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p className="text-3xl font-display font-bold">{count ?? 0}</p>
        )}
      </CardContent>
    </Card>
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
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} icon={s.icon} table={s.table} filter={s.filter} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
