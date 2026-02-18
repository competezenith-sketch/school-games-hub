import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Clock, FileCheck } from "lucide-react";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  validado: "Validado",
  rejeitado: "Rejeitado",
  rascunho: "Rascunho",
  enviado: "Enviado",
};

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  validado: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejeitado: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  rascunho: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  enviado: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const ValidacaoInscricoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [competitionId, setCompetitionId] = useState("");
  const [filterStatus, setFilterStatus] = useState("pendente");

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
    queryKey: ["competitions-valid", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, name, year").eq("org_id", orgId).order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inscriptions = [], isLoading } = useQuery({
    queryKey: ["inscriptions-validation", competitionId, filterStatus],
    enabled: !!competitionId,
    queryFn: async () => {
      let query = supabase
        .from("inscriptions")
        .select(`
          id, status, created_at, notes,
          participant:participants(id, full_name, birth_date, sex, role, photo_url),
          delegation:delegations(id, name),
          competition_rule:competition_rules(
            id,
            competition_id,
            modality:modalities(name),
            category:categories(name)
          )
        `)
        .eq("org_id", orgId);

      if (filterStatus) {
        query = query.eq("status", filterStatus as any);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(200);
      if (error) throw error;

      // Filter by competition through competition_rule
      if (competitionId) {
        return (data as any[]).filter(
          (i) => i.competition_rule?.competition_id === competitionId
        );
      }
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("inscriptions")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(`Inscrição ${statusLabels[status]?.toLowerCase() ?? status}!`);
      queryClient.invalidateQueries({ queryKey: ["inscriptions-validation"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const bulkValidateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("inscriptions")
        .update({ status: "validado" as any })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inscrições validadas em lote!");
      queryClient.invalidateQueries({ queryKey: ["inscriptions-validation"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingIds = inscriptions.filter((i: any) => i.status === "pendente").map((i: any) => i.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Validação de Inscrições</h2>
        <p className="text-muted-foreground text-sm mt-1">Revise, valide ou rejeite inscrições pendentes</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-2 flex-1 min-w-[200px] max-w-sm">
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
          <div className="space-y-2 min-w-[150px]">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="validado">Validado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pendingIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => bulkValidateMutation.mutate(pendingIds)}
              disabled={bulkValidateMutation.isPending}
            >
              {bulkValidateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Validar Todos ({pendingIds.length})
            </Button>
          )}
        </CardContent>
      </Card>

      {competitionId && (
        isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : inscriptions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <FileCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma inscrição com status "{statusLabels[filterStatus]}"</p>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display tracking-wider text-lg">Inscrições</CardTitle>
              <CardDescription>{inscriptions.length} registro(s) encontrado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead>Delegação</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscriptions.map((insc: any) => (
                      <TableRow key={insc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {insc.participant?.photo_url && (
                              <img src={insc.participant.photo_url} className="h-7 w-7 rounded-full object-cover" />
                            )}
                            <span className="font-medium text-sm">{insc.participant?.full_name ?? "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{insc.delegation?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{insc.competition_rule?.modality?.name ?? "—"}</TableCell>
                        <TableCell className="text-sm">{insc.competition_rule?.category?.name ?? "—"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[insc.status] ?? ""}`}>
                            {statusLabels[insc.status] ?? insc.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(insc.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {insc.status === "pendente" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => updateStatusMutation.mutate({ id: insc.id, status: "validado" })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => updateStatusMutation.mutate({ id: insc.id, status: "rejeitado" })}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {insc.status === "rejeitado" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: insc.id, status: "pendente" })}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default ValidacaoInscricoes;
