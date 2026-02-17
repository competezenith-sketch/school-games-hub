import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Building2, FileText } from "lucide-react";

const stats = [
  { label: "Competições", value: "—", icon: Trophy, color: "text-primary" },
  { label: "Participantes", value: "—", icon: Users, color: "text-accent" },
  { label: "Delegações", value: "—", icon: Building2, color: "text-warning" },
  { label: "Inscrições", value: "—", icon: FileText, color: "text-primary" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl tracking-wide">Visão Geral</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Resumo da sua organização
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-display font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
