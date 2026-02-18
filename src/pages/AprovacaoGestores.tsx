import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, type StatusType } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Loader2, UserCheck, CheckCircle2, XCircle, Clock, Copy } from "lucide-react";

const statusMap: Record<string, StatusType> = {
  pendente: "pendente",
  aprovado: "validado",
  rejeitado: "rejeitado",
};

const AprovacaoGestores = () => {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [approvedName, setApprovedName] = useState("");

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["gestor-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gestor_registrations")
        .select("*, delegation:delegations(name), organization:organizations(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data, error } = await supabase.functions.invoke("approve-gestor", {
        body: { registration_id: registrationId, action: "approve" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, registrationId) => {
      const reg = registrations.find((r: any) => r.id === registrationId);
      setApprovedName(reg?.full_name || "Gestor");
      setTempPassword(data.temp_password);
      toast.success("Gestor aprovado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["gestor-registrations"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectId) return;
      const { data, error } = await supabase.functions.invoke("approve-gestor", {
        body: { registration_id: rejectId, action: "reject", rejection_reason: rejectReason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast.success("Registro rejeitado.");
      queryClient.invalidateQueries({ queryKey: ["gestor-registrations"] });
      setRejectId(null);
      setRejectReason("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pending = registrations.filter((r: any) => r.status === "pendente");
  const processed = registrations.filter((r: any) => r.status !== "pendente");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Aprovação de Gestores</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Valide os pré-cadastros de gestores de escola
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 && processed.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum pré-cadastro recebido</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Compartilhe o link de cadastro com os gestores das escolas
          </p>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wider text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" /> Pendentes ({pending.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell className="text-muted-foreground">{r.phone || "—"}</TableCell>
                        <TableCell>{r.delegation?.name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(r.id)}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <><CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectId(r.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {processed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display tracking-wider text-lg">
                  Histórico ({processed.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Escola</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processed.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell>{r.delegation?.name || "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={statusMap[r.status] || "pendente"} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {r.reviewed_at
                            ? new Date(r.reviewed_at).toLocaleDateString("pt-BR")
                            : new Date(r.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Rejeitar Cadastro</DialogTitle>
            <DialogDescription>Informe o motivo da rejeição (opcional)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Escola não encontrada no cadastro"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <Button
              variant="destructive"
              className="w-full"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Rejeição"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Temp password dialog */}
      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Gestor Aprovado!</DialogTitle>
            <DialogDescription>
              Compartilhe a senha temporária com {approvedName}. Ele deve trocar no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono">{tempPassword}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword || "");
                  toast.success("Senha copiada!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              O gestor também receberá um email de acesso.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacaoGestores;
