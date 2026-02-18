import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Building2, Loader2, Plus, Trash2, Pencil, Upload } from "lucide-react";

const TYPE_OPTIONS = [
  { value: "municipio", label: "Município" },
  { value: "escola", label: "Escola" },
  { value: "clube", label: "Clube" },
];

interface DelegationForm {
  name: string;
  city: string;
  type: string;
}

const emptyForm: DelegationForm = { name: "", city: "", type: "escola" };

const Delegacoes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState<DelegationForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [importType, setImportType] = useState("escola");

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

  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delegations").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // ─── Create ───
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Organização não encontrada.");
      const { error } = await supabase.from("delegations").insert({
        name: form.name,
        city: form.city || null,
        type: form.type,
        org_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegação criada!");
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      setCreateOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ─── Update ───
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      const { error } = await supabase
        .from("delegations")
        .update({ name: form.name, city: form.city || null, type: form.type })
        .eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegação atualizada!");
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      setEditOpen(false);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // ─── Delete ───
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delegations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegação removida!");
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      setDeleteId(null);
    },
    onError: (err: any) => {
      setDeleteId(null);
      if (err.message?.includes("foreign key") || err.message?.includes("violates")) {
        toast.error("Não é possível excluir: há participantes ou inscrições vinculados.");
      } else {
        toast.error(err.message);
      }
    },
  });

  // ─── Bulk Import ───
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Organização não encontrada.");
      const names = importText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (names.length === 0) throw new Error("Nenhum nome informado.");

      const rows = names.map((n) => ({
        name: n,
        type: importType,
        org_id: orgId,
      }));

      const { error } = await supabase.from("delegations").insert(rows);
      if (error) throw error;
      return names.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} delegação(ões) importada(s)!`);
      queryClient.invalidateQueries({ queryKey: ["delegations"] });
      setImportOpen(false);
      setImportText("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (d: any) => {
    setEditId(d.id);
    setForm({ name: d.name, city: d.city || "", type: d.type });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Delegações</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as escolas e delegações participantes
          </p>
        </div>
        <div className="flex gap-2">
          {/* Import Button */}
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wider">Importar Escolas</DialogTitle>
                <DialogDescription>
                  Cole os nomes das escolas, um por linha
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nomes (um por linha)</Label>
                  <Textarea
                    rows={10}
                    placeholder={"Escola Estadual João da Silva\nEscola Municipal Maria...\nColégio XYZ"}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {importText.split("\n").filter((l) => l.trim()).length} nome(s) detectado(s)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  className="w-full"
                  disabled={!importText.trim() || importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                >
                  {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Importar {importText.split("\n").filter((l) => l.trim()).length} escola(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Button */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display tracking-wider">Nova Delegação</DialogTitle>
                <DialogDescription>Preencha os dados da delegação participante</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Ex: Escola Estadual XYZ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input placeholder="Ex: Boa Vista" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full" disabled={!form.name || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Editar Delegação</DialogTitle>
            <DialogDescription>Atualize os dados</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" disabled={!form.name || updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir delegação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Se houver participantes ou inscrições vinculados, a exclusão será bloqueada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : delegations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma delegação cadastrada</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Use "Nova" ou "Importar" para adicionar</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wider text-lg">
              Todas as Delegações ({delegations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.city || "—"}</TableCell>
                    <TableCell className="capitalize">{TYPE_OPTIONS.find((o) => o.value === d.type)?.label ?? d.type}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

export default Delegacoes;
