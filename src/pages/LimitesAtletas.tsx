import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Users, Trash2 } from "lucide-react";

const LimitesAtletas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [modalityId, setModalityId] = useState("");
  const [ageCategoryId, setAgeCategoryId] = useState("");
  const [gender, setGender] = useState("");
  const [minAthletes, setMinAthletes] = useState("");
  const [maxAthletes, setMaxAthletes] = useState("");
  const [isNational, setIsNational] = useState(true);

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

  const { data: modalities = [] } = useQuery({
    queryKey: ["modalities-limits", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("modalities").select("id, name, gender").eq("org_id", orgId).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: ageCategories = [] } = useQuery({
    queryKey: ["age-categories-limits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("age_categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: limits = [], isLoading } = useQuery({
    queryKey: ["athlete-limits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modality_athlete_limits")
        .select("*, modalities(name), age_categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("modality_athlete_limits").insert({
        modality_id: modalityId || null,
        age_category_id: ageCategoryId || null,
        gender: gender || null,
        min_athletes: minAthletes ? parseInt(minAthletes) : null,
        max_athletes: maxAthletes ? parseInt(maxAthletes) : null,
        is_national_qualifier: isNational,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Limite criado!");
      queryClient.invalidateQueries({ queryKey: ["athlete-limits"] });
      setOpen(false);
      setModalityId(""); setAgeCategoryId(""); setGender(""); setMinAthletes(""); setMaxAthletes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modality_athlete_limits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido!");
      queryClient.invalidateQueries({ queryKey: ["athlete-limits"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Limites de Atletas</h2>
          <p className="text-muted-foreground text-sm mt-1">Mínimos e máximos de atletas por modalidade e categoria</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Novo Limite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Novo Limite de Atletas</DialogTitle>
              <DialogDescription>Configure mínimos e máximos por modalidade</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <Select value={modalityId} onValueChange={setModalityId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {modalities.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria Etária</Label>
                <Select value={ageCategoryId} onValueChange={setAgeCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {ageCategories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gênero</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Feminino</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mín. Atletas</Label>
                  <Input type="number" value={minAthletes} onChange={(e) => setMinAthletes(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Atletas</Label>
                  <Input type="number" value={maxAthletes} onChange={(e) => setMaxAthletes(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isNational} onCheckedChange={setIsNational} />
                <Label>Classificatório Nacional</Label>
              </div>
              <Button className="w-full" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : limits.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum limite cadastrado</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Gênero</TableHead>
                  <TableHead>Mín.</TableHead>
                  <TableHead>Máx.</TableHead>
                  <TableHead>Nacional</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limits.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.modalities?.name ?? "—"}</TableCell>
                    <TableCell>{l.age_categories?.name ?? "—"}</TableCell>
                    <TableCell>{l.gender ?? "Todos"}</TableCell>
                    <TableCell>{l.min_athletes ?? "—"}</TableCell>
                    <TableCell>{l.max_athletes ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={l.is_national_qualifier ? "default" : "secondary"}>
                        {l.is_national_qualifier ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(l.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
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

export default LimitesAtletas;
