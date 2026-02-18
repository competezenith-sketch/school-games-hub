import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Users, Trash2 } from "lucide-react";

const CategoriasEtarias = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [birthYears, setBirthYears] = useState("");
  const [eventType, setEventType] = useState("jers");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["age-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("age_categories").select("*").order("min_age");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("age_categories").insert({
        name,
        min_age: minAge ? parseInt(minAge) : null,
        max_age: maxAge ? parseInt(maxAge) : null,
        birth_years: birthYears || null,
        event_type: eventType || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria etária criada!");
      queryClient.invalidateQueries({ queryKey: ["age-categories"] });
      setOpen(false);
      setName(""); setMinAge(""); setMaxAge(""); setBirthYears("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("age_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["age-categories"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Categorias Etárias</h2>
          <p className="text-muted-foreground text-sm mt-1">Faixas de idade para classificação dos participantes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Categoria</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display tracking-wider">Nova Categoria Etária</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Ex: Sub-14" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idade Mínima</Label>
                  <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Idade Máxima</Label>
                  <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Anos de Nascimento</Label>
                <Input placeholder="Ex: 2010, 2011, 2012" value={birthYears} onChange={(e) => setBirthYears(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : categories.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma categoria etária cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade Mín.</TableHead>
                  <TableHead>Idade Máx.</TableHead>
                  <TableHead>Anos Nascimento</TableHead>
                  <TableHead>Tipo Evento</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.min_age ?? "—"}</TableCell>
                    <TableCell>{c.max_age ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.birth_years || "—"}</TableCell>
                    <TableCell>{c.event_type || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
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

export default CategoriasEtarias;
