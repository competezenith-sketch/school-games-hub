import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, UserCheck, Trash2 } from "lucide-react";

const RegrasStaff = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [minCount, setMinCount] = useState("");
  const [maxCount, setMaxCount] = useState("");
  const [minTrigger, setMinTrigger] = useState("");
  const [maxTrigger, setMaxTrigger] = useState("");
  const [notes, setNotes] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["delegation-staff-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delegation_staff_rules").select("*").order("role_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("delegation_staff_rules").insert({
        role_name: roleName,
        is_required: isRequired,
        min_count: minCount ? parseInt(minCount) : 0,
        max_count: maxCount ? parseInt(maxCount) : null,
        min_athletes_trigger: minTrigger ? parseInt(minTrigger) : null,
        max_athletes_trigger: maxTrigger ? parseInt(maxTrigger) : null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra criada!");
      queryClient.invalidateQueries({ queryKey: ["delegation-staff-rules"] });
      setOpen(false);
      setRoleName(""); setIsRequired(false); setMinCount(""); setMaxCount(""); setMinTrigger(""); setMaxTrigger(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delegation_staff_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["delegation-staff-rules"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Regras de Staff</h2>
          <p className="text-muted-foreground text-sm mt-1">Regras de composição da comissão técnica por delegação</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Nova Regra de Staff</DialogTitle>
              <DialogDescription>Defina as regras de composição da comissão técnica</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Função</Label>
                <Input placeholder="Ex: Técnico, Dirigente" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                <Label>Obrigatório</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mín. Pessoas</Label>
                  <Input type="number" value={minCount} onChange={(e) => setMinCount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Pessoas</Label>
                  <Input type="number" value={maxCount} onChange={(e) => setMaxCount(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>A partir de (atletas)</Label>
                  <Input type="number" placeholder="Mín. atletas" value={minTrigger} onChange={(e) => setMinTrigger(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Até (atletas)</Label>
                  <Input type="number" placeholder="Máx. atletas" value={maxTrigger} onChange={(e) => setMaxTrigger(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!roleName || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <UserCheck className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma regra de staff cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Mín.</TableHead>
                  <TableHead>Máx.</TableHead>
                  <TableHead>Atletas (gatilho)</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.role_name}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_required ? "default" : "secondary"}>{r.is_required ? "Sim" : "Não"}</Badge>
                    </TableCell>
                    <TableCell>{r.min_count ?? 0}</TableCell>
                    <TableCell>{r.max_count ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.min_athletes_trigger || r.max_athletes_trigger
                        ? `${r.min_athletes_trigger ?? "—"} – ${r.max_athletes_trigger ?? "—"}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(r.id)}>
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

export default RegrasStaff;
