import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhotoUpload from "@/components/PhotoUpload";
import { toast } from "sonner";
import AthleteIDCardModal from "@/components/AthleteIDCardModal";
import { Loader2, Plus, Users, Pencil, Trash2, X, Calendar, AlertCircle } from "lucide-react";
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
  const [enrollmentDate, setEnrollmentDate] = useState(""); // Novo campo crítico
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [delegationId, setDelegationId] = useState<string>("");

  const MATRICULA_LIMITE = new Date("2026-03-06");

  // Busca perfil para pegar org_id e delegation_id automaticamente
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
        .order("created_at", { ascending: false });
      
      if (isGestorOnly && gestorDelegationId) {
        query = query.eq("delegation_id", gestorDelegationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Salvar / Editar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: fullName,
        cpf,
        role: role as any,
        sex: sex ? (sex as any) : null,
        birth_date: birthDate || null,
        enrollment_date: enrollmentDate || null, // Persistência da data de matrícula
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

  const isInvalidEnrollment = enrollmentDate && isAfter(new Date(enrollmentDate), MATRICULA_LIMITE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider uppercase">Meus Participantes</h2>
          <p className="text-muted-foreground text-sm">Controle de atletas e staff para os JER's 2026</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Novo</Button>}
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-muted/5">
          <CardHeader className="pb-4">
            <div className="flex justify-between">
              <CardTitle className="text-lg uppercase">{editingId ? "Editar" : "Cadastrar"} Participante</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="grid gap-6 md:grid-cols-[auto_1fr]">
              <PhotoUpload value={photoUrl} onChange={setPhotoUrl} folder={user?.id || "unknown"} />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={e => setCpf(e.target.value)} required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
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
                
                {/* CAMPO DE DATA DE MATRÍCULA - REGRA 2026 */}
                <div className="space-y-2">
                  <Label className={cn(isInvalidEnrollment ? "text-destructive" : "text-primary font-bold")}>
                    Data de Matrícula Escolar
                  </Label>
                  <Input 
                    type="date" 
                    value={enrollmentDate} 
                    onChange={e => setEnrollmentDate(e.target.value)} 
                    required 
                    className={cn(isInvalidEnrollment && "border-destructive focus-visible:ring-destructive")}
                  />
                  {isInvalidEnrollment && (
                    <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" /> Após 06/03: Inelegível para JER's 2026.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 flex gap-3 pt-4 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingId ? "Atualizar" : "Salvar Participante"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid de Listagem com as melhorias visuais */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((p: any) => (
            <Card key={p.id} className="p-4 hover:border-primary/40 transition-all group relative">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border">
                  {p.photo_url ? <img src={p.photo_url} className="h-full w-full object-cover" /> : <Users className="h-full w-full p-4 opacity-20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate uppercase">{p.full_name}</p>
                  <Badge variant="outline" className="text-[9px] mt-1">{roleLabels[p.role]}</Badge>
                  <div className="mt-2 text-[10px] text-muted-foreground flex flex-col gap-0.5">
                    <span>Nasc: {new Date(p.birth_date).toLocaleDateString()}</span>
                    <span className={cn(p.enrollment_date && isAfter(new Date(p.enrollment_date), MATRICULA_LIMITE) ? "text-destructive font-bold" : "")}>
                      Matrícula: {p.enrollment_date ? new Date(p.enrollment_date).toLocaleDateString() : 'Não informada'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                 
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover Participante?</AlertDialogTitle>
                        <AlertDialogDescription>Deseja excluir permanentemente <b>{p.full_name}</b>?</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-destructive">Excluir</AlertDialogAction>
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
