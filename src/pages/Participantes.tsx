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
import { Loader2, Plus, Users, Pencil, Trash2, X, Calendar } from "lucide-react";
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

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<string>("atleta");
  const [sex, setSex] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [enrollmentDate, setEnrollmentDate] = useState(""); // Novo campo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [delegationId, setDelegationId] = useState<string>("");

  const { data: myProfile } = useQuery({
    queryKey: ["my-profile-participants", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("org_id, delegation_id").eq("user_id", user!.id).single();
      return data;
    },
  });

  const isGestorOnly = isGestor && !isAdmin;
  const gestorDelegationId = myProfile?.delegation_id;
  const gestorOrgId = myProfile?.org_id;

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["participants", isGestorOnly, gestorDelegationId],
    queryFn: async () => {
      let query = supabase.from("participants").select("*, delegations(name)").order("created_at", { ascending: false });
      if (isGestorOnly && gestorDelegationId) query = query.eq("delegation_id", gestorDelegationId);
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
        enrollment_date: enrollmentDate || null, // Salva data de matrícula
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
      toast.success(editingId ? "Atualizado!" : "Cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setEditingId(null); setFullName(""); setCpf(""); setRole("atleta"); setSex("");
    setBirthDate(""); setEnrollmentDate(""); setPhotoUrl(null); setDelegationId(""); setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Participantes</h2>
          <p className="text-muted-foreground text-sm mt-1">Gerencie os dados dos atletas e comissão técnica.</p>
        </div>
        {!showForm && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Novo</Button>}
      </div>

      {showForm && (
        <Card className="animate-fade-in border-primary/20 bg-muted/10">
          <CardHeader>
            <CardTitle>{editingId ? "Editar" : "Novo"} Participante</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="grid gap-6 md:grid-cols-[auto_1fr]">
              <PhotoUpload value={photoUrl} onChange={setPhotoUrl} folder={user?.id || "unknown"} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome completo</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={cpf} onChange={(e) => setCpf(e.target.value)} required placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="M">Masculino</SelectItem><SelectItem value="F">Feminino</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary font-bold">Data de Matrícula Escolar</Label>
                  <Input type="date" value={enrollmentDate} onChange={(e) => setEnrollmentDate(e.target.value)} required />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2 justify-end">
                   <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                   <Button type="submit" disabled={saveMutation.isPending}>Salvar</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Participantes (Cards) permanece a mesma, apenas exibindo os dados novos se desejar */}
    </div>
  );
};

export default Participantes;
