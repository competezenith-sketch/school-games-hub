import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, MapPin, Trash2 } from "lucide-react";

const VagasSede = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("");
  const [quota, setQuota] = useState("");
  const [notes, setNotes] = useState("");

  const { data: quotas = [], isLoading } = useQuery({
    queryKey: ["stage-team-quotas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stage_team_quotas").select("*").order("city");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stage_team_quotas").insert({
        city,
        quota: parseInt(quota),
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga criada!");
      queryClient.invalidateQueries({ queryKey: ["stage-team-quotas"] });
      setOpen(false);
      setCity(""); setQuota(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stage_team_quotas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["stage-team-quotas"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const totalQuotas = quotas.reduce((sum: number, q: any) => sum + (q.quota || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Vagas por Sede</h2>
          <p className="text-muted-foreground text-sm mt-1">Cotas de equipes por cidade-sede</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Vaga</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display tracking-wider">Nova Vaga por Sede</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input placeholder="Ex: Boa Vista" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Vagas</Label>
                <Input type="number" min={1} value={quota} onChange={(e) => setQuota(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!city || !quota || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : quotas.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma vaga cadastrada</p>
        </Card>
      ) : (
        <>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4 flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total de vagas: <strong>{totalQuotas}</strong> em {quotas.length} cidade(s)</span>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Vagas</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.city}</TableCell>
                      <TableCell>{q.quota}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{q.notes || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(q.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VagasSede;
