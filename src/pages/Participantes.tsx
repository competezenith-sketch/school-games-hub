import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PhotoUpload from "@/components/PhotoUpload";
import { toast } from "sonner";
import AthleteIDCardModal from "@/components/AthleteIDCardModal";
import { Loader2, Plus, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/StatusBadge";
import type { Tables } from "@/integrations/supabase/types";

type Participant = Tables<"participants">;

const roleLabels: Record<string, string> = {
  atleta: "Atleta",
  tecnico: "Técnico",
  dirigente: "Dirigente",
  motorista: "Motorista",
  arbitro: "Árbitro",
};

const Participantes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [role, setRole] = useState<string>("atleta");
  const [sex, setSex] = useState<string>("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("*, delegations(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Get user org_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("user_id", user!.id)
        .single();

      if (!profile) throw new Error("Perfil não encontrado. Configure sua organização.");

      const { error } = await supabase.from("participants").insert({
        full_name: fullName,
        cpf,
        role: role as any,
        sex: sex ? (sex as any) : null,
        birth_date: birthDate || null,
        photo_url: photoUrl,
        org_id: profile.org_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Participante cadastrado!");
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setFullName("");
    setCpf("");
    setRole("atleta");
    setSex("");
    setBirthDate("");
    setPhotoUrl(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Participantes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie atletas, técnicos e demais participantes
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg font-display tracking-wider">Novo Participante</CardTitle>
            <CardDescription>Preencha os dados e envie a foto</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[auto_1fr]">
              {/* Photo upload */}
              <div className="flex justify-center">
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
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {participants.map((p: any) => (
            <Card key={p.id} className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{p.full_name}</p>
                <p className="text-xs text-muted-foreground">{roleLabels[p.role] || p.role}</p>
              </div>
              <AthleteIDCardModal
                athleteId={p.id}
                fullName={p.full_name}
                photoUrl={p.photo_url}
                role={p.role}
                delegation={p.delegations?.name}
                sex={p.sex}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Participantes;
