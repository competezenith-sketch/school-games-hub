import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhotoUpload from "@/components/PhotoUpload";
import { toast } from "sonner";
import { Loader2, Plus, Users, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge"; // IMPORTANTE: Resolve o erro de ReferenceError
import { cn } from "@/lib/utils"; // IMPORTANTE: Resolve o erro de ReferenceError

const roleLabels: Record<string, string> = {
  atleta: "Atleta",
  tecnico: "Técnico",
  dirigente: "Dirigente",
  motorista: "Motorista",
  arbitro: "Árbitro",
};

const Participantes = () => {
  const { user } = useAuth();
  const { isGestor, isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estados do Formulário
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<string>("atleta");
  const [sex, setSex] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(""); 
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [delegationId, setDelegationId] = useState<string>("");

  // REGRA JER'S 2026: Matrícula deve ser até 06 de Março
  const MATRICULA_LIMITE = new Date("2026-03-06");

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-participants", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("org_id, delegation_id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const isGestorOnly = isGestor && !isAdmin;
  const gestorDelegationId = myProfile?.delegation_id;
  const gestorOrgId = myProfile?.org_id;

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["participants", isGestorOnly, gestorDelegationId],
    queryFn: async () => {
      let query = supabase
        .from("participants")
        .select("*, delegations(name)")
        .order("full_name", { ascending: true });
      
      if (isGestorOnly && gestorDelegationId) {
        query = query.eq("delegation_id", gestorDelegationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: fullName,
        cpf,
        role: role as any,
        sex: sex ? (sex as any) : null,
        birth_date: birthDate || null,
        enrollment_date: enrollmentDate || null,
        photo_url: photoUrl,
        org_id: gestorOrgId,
        delegation_id: isGestorOnly ? gestorDelegationId : delegationId || null,
      };

      if (editingId) {
        const { error } = await supabase.from("participants").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("participants").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Dados atualizados!" : "Participante cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      resetForm();
    },
    onError: (err: any) => toast.error("Erro ao salvar: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("participants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
    },
    onError: (err: any) => toast.error("Erro ao remover: " + err.message),
  });

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setFullName(p.full_name);
    setCpf(p.cpf);
    setRole(p.role);
    setSex(p.sex || "");
    setBirthDate(p.birth_date ? p.birth_date.split("T")[0] : "");
    setEnrollmentDate(p.enrollment_date ? p.enrollment_date.split("T")[0] : "");
    setPhotoUrl(p.photo_url);
    setDelegationId(p.delegation_id || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null); setFullName(""); setCpf(""); setRole("atleta"); setSex("");
    setBirthDate(""); setEnrollmentDate(""); setPhotoUrl(null); setDelegationId(""); setShowForm(false);
  };

  const isInvalidEnrollment = (dateStr: string) => {
    if (!dateStr) return false;
    return isAfter(new Date(dateStr), MATRICULA_LIMITE);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider uppercase">Participantes</h2>
          <p className="text-muted-foreground text-sm">Controle de atletas e staff para os JER's 2026</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Novo Registro</Button>}
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-muted/5">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg uppercase text-primary">
                {editingId ? "Editar Perfil" : "Novo Cadastro"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="flex flex-col items-center gap-4">
                <PhotoUpload value={photoUrl} onChange={setPhotoUrl} folder={user?.id || "unknown"} />
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold">Foto para Credencial</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Conforme RG" />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Função no Evento</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required />
                </div>
                
                <div className="space-y-2">
                  <Label className={cn(isInvalidEnrollment(enrollmentDate) ? "text-destructive" : "text-primary font-bold")}>
                    Data de Matrícula (Censo)
                  </Label>
                  <Input 
                    type="date" 
                    value={enrollmentDate} 
                    onChange={e => setEnrollmentDate(e.target.value)} 
                    required 
                    className={cn(isInvalidEnrollment(enrollmentDate) && "border-destructive")}
                  />
                  {isInvalidEnrollment(enrollmentDate) && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1 font-bold">
                      <AlertCircle className="h-3 w-3" /> ATENÇÃO: Matrícula fora do prazo regulamentar.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 flex gap-3 pt-6 justify-end border-t">
                  <Button type="button" variant="ghost" onClick={resetForm}>Descartar</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingId ? "Salvar Alterações" : "Confirmar Cadastro"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((p: any) => (
            <Card key={p.id} className={cn(
              "p-4 hover:shadow-md transition-all border-l-4",
              isInvalidEnrollment(p.enrollment_date) ? "border-l-destructive/50" : "border-l-primary/50"
            )}>
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted border shrink-0">
                  {p.photo_url ? (
                    <img src={p.photo_url} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-full w-full p-4 opacity-10" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs truncate uppercase leading-tight">{p.full_name}</p>
                    <Badge variant={isInvalidEnrollment(p.enrollment_date) ? "destructive" : "outline"} className="text-[8px] h-4 uppercase">
                      {roleLabels[p.role]}
                    </Badge>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>Nasc:</span>
                      <span className="font-mono">{p.birth_date ? new Date(p.birth_date).toLocaleDateString() : '--'}</span>
                    </div>
                    <div className={cn(
                      "flex justify-between text-[10px] p-1 rounded",
                      isInvalidEnrollment(p.enrollment_date) ? "bg-destructive/10 text-destructive font-bold" : "text-muted-foreground"
                    )}>
                      <span>Matrícula:</span>
                      <span className="font-mono">{p.enrollment_date ? new Date(p.enrollment_date).toLocaleDateString() : 'N/D'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-4 pt-2 border-t border-dashed">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação removerá <b>{p.full_name}</b> permanentemente do sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-destructive">Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Participantes;
