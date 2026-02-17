import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Building2, FileText } from "lucide-react";

const stats = [
  { label: "Competições", value: "—", icon: Trophy },
  { label: "Participantes", value: "—", icon: Users },
  { label: "Delegações", value: "—", icon: Building2 },
  { label: "Inscrições", value: "—", icon: FileText },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl">Visão Geral</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo da sua organização
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
