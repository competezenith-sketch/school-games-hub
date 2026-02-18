import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area"; // <-- ADICIONE ESTA LINHA
import { toast } from "sonner";
import { Loader2, Tag, ChevronRight, Settings2, Save, X, Trophy, Dumbbell, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CadastroGestor = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgId, setOrgId] = useState("");
  const [delegationId, setDelegationId] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: orgs = [] } = useQuery({
    queryKey: ["public-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ["public-delegations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delegations")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!fullName.trim()) throw new Error("Nome completo é obrigatório.");
      if (!email.trim()) throw new Error("Email é obrigatório.");
      if (!orgId) throw new Error("Selecione a organização.");
      if (!delegationId) throw new Error("Selecione sua escola.");

      const { error } = await supabase.from("gestor_registrations").insert({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        org_id: orgId,
        delegation_id: delegationId,
      });

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          throw new Error("Já existe um cadastro pendente com este email.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle className="h-16 w-16 text-primary mb-4" />
            <h2 className="font-display text-xl tracking-wider mb-2">Cadastro Enviado!</h2>
            <p className="text-muted-foreground text-sm">
              Seu pré-cadastro foi recebido e será analisado pela organização.
              Você receberá um email com instruções de acesso após a aprovação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary flex items-center justify-center mb-3">
            <UserPlus className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-xl tracking-wider">
            Cadastro de Gestor de Escola
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Preencha seus dados para solicitar acesso ao sistema
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo *</Label>
            <Input
              placeholder="Seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Organização *</Label>
            <Select value={orgId} onValueChange={(v) => { setOrgId(v); setDelegationId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione a organização..." /></SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Escola (Delegação) *</Label>
            <Select value={delegationId} onValueChange={setDelegationId} disabled={!orgId}>
              <SelectTrigger><SelectValue placeholder={orgId ? "Selecione sua escola..." : "Selecione a organização primeiro"} /></SelectTrigger>
              <SelectContent>
                {delegations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!fullName || !email || !orgId || !delegationId || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar Cadastro"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroGestor;
