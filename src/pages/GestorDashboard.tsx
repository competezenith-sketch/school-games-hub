import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, FileText, Trophy, UserCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GestorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, delegation:delegations(name)")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as any;
    },
  });

  const delegationId = profile?.delegation_id;
  const delegationName = profile?.delegation?.name || "Minha Escola";

  const { data: stats } = useQuery({
    queryKey: ["gestor-stats", delegationId],
    enabled: !!delegationId,
    queryFn: async () => {
      const [participantsRes, inscriptionsRes] = await Promise.all([
        supabase
          .from("participants")
          .select("id, role", { count: "exact" })
          .eq("delegation_id", delegationId),
        supabase
          .from("inscriptions")
          .select("id, status", { count: "exact" })
          .eq("delegation_id", delegationId),
      ]);

      const participants = participantsRes.data || [];
      const inscriptions = inscriptionsRes.data || [];

      return {
        totalAthletes: participants.filter((p) => p.role === "atleta").length,
        totalStaff: participants.filter((p) => p.role !== "atleta").length,
        totalInscriptions: inscriptions.length,
        pendingInscriptions: inscriptions.filter((i) => i.status === "pendente").length,
        validatedInscriptions: inscriptions.filter((i) => i.status === "validado").length,
      };
    },
  });

  if (profileLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    {
      title: "Meus Atletas",
      description: `${stats?.totalAthletes ?? 0} atletas cadastrados`,
      icon: Users,
      action: () => navigate("/dashboard/participantes"),
      buttonLabel: "Gerenciar Atletas",
    },
    {
      title: "Staff / Comissão Técnica",
      description: `${stats?.totalStaff ?? 0} membros cadastrados`,
      icon: UserCheck,
      action: () => navigate("/dashboard/participantes"),
      buttonLabel: "Gerenciar Staff",
    },
    {
      title: "Inscrições",
      description: `${stats?.totalInscriptions ?? 0} inscrições (${stats?.pendingInscriptions ?? 0} pendentes)`,
      icon: FileText,
      action: () => navigate("/dashboard/inscricoes"),
      buttonLabel: "Inscrever Equipes",
    },
    {
      title: "Competições",
      description: `${stats?.validatedInscriptions ?? 0} inscrições validadas`,
      icon: Trophy,
      action: () => navigate("/dashboard/inscricoes"),
      buttonLabel: "Ver Status",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">{delegationName}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Painel do Gestor — gerencie atletas, staff e inscrições da sua escola
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-start gap-3 pb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <card.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-display tracking-wider">{card.title}</CardTitle>
                <CardDescription className="text-xs">{card.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" onClick={card.action}>
                {card.buttonLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GestorDashboard;
