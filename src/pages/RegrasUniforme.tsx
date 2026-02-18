import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, Shirt, Trash2 } from "lucide-react";

const RegrasUniforme = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [itemType, setItemType] = useState("");
  const [appliesTo, setAppliesTo] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [maxApps, setMaxApps] = useState("");
  const [articleRef, setArticleRef] = useState("");
  const [notes, setNotes] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["uniform-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("uniform_rules").select("*").order("label");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("uniform_rules").insert({
        label,
        item_type: itemType || null,
        applies_to: appliesTo || null,
        max_area_cm2: maxArea ? parseInt(maxArea) : null,
        max_applications: maxApps ? parseInt(maxApps) : null,
        article_ref: articleRef || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra criada!");
      queryClient.invalidateQueries({ queryKey: ["uniform-rules"] });
      setOpen(false);
      setLabel(""); setItemType(""); setAppliesTo(""); setMaxArea(""); setMaxApps(""); setArticleRef(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("uniform_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["uniform-rules"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Regras de Uniforme</h2>
          <p className="text-muted-foreground text-sm mt-1">Especificações de uniformes e publicidade</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Nova Regra de Uniforme</DialogTitle>
              <DialogDescription>Configure as especificações de uniforme</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Ex: Logo do patrocinador na camisa" value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Item</Label>
                  <Input placeholder="Ex: camisa, short" value={itemType} onChange={(e) => setItemType(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Aplica-se a</Label>
                  <Input placeholder="Ex: atleta, todos" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área Máx. (cm²)</Label>
                  <Input type="number" value={maxArea} onChange={(e) => setMaxArea(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Máx. Aplicações</Label>
                  <Input type="number" value={maxApps} onChange={(e) => setMaxApps(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Artigo Ref.</Label>
                <Input placeholder="Ex: Art. 22" value={articleRef} onChange={(e) => setArticleRef(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!label || createMutation.isPending} onClick={() => createMutation.mutate()}>
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
          <Shirt className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma regra de uniforme cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aplica-se</TableHead>
                  <TableHead>Área Máx.</TableHead>
                  <TableHead>Máx. Apl.</TableHead>
                  <TableHead>Artigo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[250px]">{r.label}</TableCell>
                    <TableCell className="text-xs">{r.item_type || "—"}</TableCell>
                    <TableCell className="text-xs">{r.applies_to || "—"}</TableCell>
                    <TableCell>{r.max_area_cm2 ? `${r.max_area_cm2} cm²` : "—"}</TableCell>
                    <TableCell>{r.max_applications ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.article_ref || "—"}</TableCell>
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

export default RegrasUniforme;
