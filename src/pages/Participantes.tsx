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
import { Loader2, Plus, Users, Pencil, Trash2, X } from "lucide-react";
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
import type { Tables } from "@/integrations/supabase/types";

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

  // Form state
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<string>("atleta");
  const [sex, setSex] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [delegationId, setDelegationId] = useState<string>("");

  // For gestores: auto-load their delegation
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
      
      // Gestores only see their own delegation
      if (isGestorOnly && gestorDelegationId) {
        query = query.eq("delegation_id", gestorDelegationId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations-for-participants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delegations").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create or Update Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const orgId = isGestorOnly ? gestorOrgId : undefined;
      const delId = isGestorOnly ? gestorDelegationId : delegationId || null;

      // Get user org_id from profile if not gestor
      let finalOrgId = orgId;
      if (!finalOrgId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("user_id", user!.id)
          .single();
        if (!profile) throw new Error("Perfil não encontrado. Configure sua organização.");
        finalOrgId = profile.org_id;
      }

      const payload = {
        full_name: fullName,
        cpf,
        role: role as any,
        sex: sex ? (sex as any) : null,
        birth_date: birthDate || null,
        photo_url: photoUrl,
        org_id: finalOrgId!,
        delegation_id: delId,
      };

      if (editingId) {
        // Update
        const { error } = await supabase
          .from("participants")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from("participants")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Participante atualizado!" : "Participante cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("participants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Participante removido.");
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
    setPhotoUrl(p.photo_url);
    setDelegationId(p.delegation_id || "");
    setShowForm(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFullName("");
    setCpf("");
    setRole("atleta");
    setSex("");
    setBirthDate("");
    setPhotoUrl(null);
    setDelegationId("");
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">
            {isGestorOnly ? "Meus Atletas e Staff" : "Participantes"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isGestorOnly ? "Cadastre e gerencie atletas e comissão técnica da sua escola" : "Gerencie atletas, técnicos e demais participantes"}
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in border-primary/20 bg-muted/10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-display tracking-wider">
                {editingId ? "Editar Participante" : "Novo Participante"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Preencha os dados e envie a foto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[auto_1fr]">
              {/* Photo upload */}
              <div className="flex justify-center md:justify-start">
                <PhotoUpload
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  folder={user?.id || "unknown"}
                />
              </div>

              {/* Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} required maxLength={14} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>Função</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select value={sex} onValueChange={setSex}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de nascimento</Label>
                  <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </div>
                {!isGestorOnly && (
                  <div className="space-y-2">
                    <Label>Delegação</Label>
                    <Select value={delegationId} onValueChange={setDelegationId}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {delegations.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="sm:col-span-2 flex gap-3 pt-2 justify-end">
                   <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                   <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {editingId ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : participants.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum participante cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Novo" para adicionar</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((p: any) => (
            <Card key={p.id} className="flex flex-col p-4 relative group hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full overflow-hidden bg-muted shrink-0 border border-border">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{roleLabels[p.role] || p.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-secondary/50 px-1.5 py-0.5 rounded text-secondary-foreground">
                       {p.sex === 'M' ? 'Masc.' : p.sex === 'F' ? 'Fem.' : '-'}
                    </span>
                    {p.birth_date && (
                        <span className="text-[10px] text-muted-foreground">
                            Nasc: {new Date(p.birth_date).getFullYear()}
                        </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                 <div className="flex gap-1">
                   {/* Botão de Carteirinha */}
                   <AthleteIDCardModal
                      athleteId={p.id}
                      fullName={p.full_name}
                      photoUrl={p.photo_url}
                      role={p.role}
                      delegation={p.delegations?.name}
                      sex={p.sex}
                    />
                 </div>
                 
                 <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(p)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Participante?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover <b>{p.full_name}</b>? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(p.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Participantes;
