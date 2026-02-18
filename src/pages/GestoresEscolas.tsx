import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus, Trash2 } from "lucide-react";

const GestoresEscolas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [delegationId, setDelegationId] = useState("");

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

  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delegations").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get all gestor profiles (profiles with delegation_id set)
  const { data: gestores = [], isLoading } = useQuery({
    queryKey: ["gestores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, delegation:delegations(name)")
        .not("delegation_id", "is", null)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Organização não encontrada.");
      if (!delegationId) throw new Error("Selecione uma delegação.");
      if (!email || !password) throw new Error("Email e senha são obrigatórios.");
      if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");

      // 1. Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            org_id: orgId,
            delegation_id: delegationId,
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário.");

      const newUserId = authData.user.id;

      // 2. Create profile linked to delegation
      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: newUserId,
        org_id: orgId,
        delegation_id: delegationId,
        full_name: fullName || email,
      });
      if (profileError) throw profileError;

      // 3. Assign gestor_escola role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: newUserId,
        role: "gestor_escola" as any,
      });
      if (roleError) throw roleError;
    },
    onSuccess: () => {
      toast.success("Gestor criado com sucesso! O email de confirmação foi enviado.");
      queryClient.invalidateQueries({ queryKey: ["gestores"] });
      setOpen(false);
      setEmail("");
      setPassword("");
      setFullName("");
      setDelegationId("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Gestores de Escola</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre gestores e vincule-os às delegações (escolas)
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Gestor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Cadastrar Gestor</DialogTitle>
              <DialogDescription>Crie uma conta de acesso para o gestor da escola</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input placeholder="Nome do gestor" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email de Acesso</Label>
                <Input type="email" placeholder="gestor@escola.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Senha Inicial</Label>
                <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Delegação (Escola)</Label>
                <Select value={delegationId} onValueChange={setDelegationId}>
                  <SelectTrigger><SelectValue placeholder="Vincular à escola..." /></SelectTrigger>
                  <SelectContent>
                    {delegations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!email || !password || !delegationId || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Gestor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : gestores.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <UserPlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum gestor cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Novo Gestor" para vincular um responsável a uma escola</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wider text-lg">
              Gestores Cadastrados ({gestores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Delegação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gestores.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.full_name || "—"}</TableCell>
                    <TableCell>{g.delegation?.name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestoresEscolas;
