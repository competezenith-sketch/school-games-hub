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
import { Loader2, Plus, DollarSign, Trash2 } from "lucide-react";

const TaxasAdministrativas = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [feeCode, setFeeCode] = useState("");
  const [description, setDescription] = useState("");
  const [amountKg, setAmountKg] = useState("");
  const [articleRef, setArticleRef] = useState("");
  const [notes, setNotes] = useState("");

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["administrative-fees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("administrative_fees").select("*").order("fee_code");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("administrative_fees").insert({
        fee_code: feeCode || null,
        description,
        amount_kg: amountKg ? parseFloat(amountKg) : null,
        article_ref: articleRef || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Taxa criada!");
      queryClient.invalidateQueries({ queryKey: ["administrative-fees"] });
      setOpen(false);
      setFeeCode(""); setDescription(""); setAmountKg(""); setArticleRef(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("administrative_fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["administrative-fees"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Taxas Administrativas</h2>
          <p className="text-muted-foreground text-sm mt-1">Multas e taxas previstas no regulamento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Taxa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display tracking-wider">Nova Taxa Administrativa</DialogTitle>
              <DialogDescription>Defina a descrição e o valor da taxa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input placeholder="Ex: T01" value={feeCode} onChange={(e) => setFeeCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Artigo Ref.</Label>
                  <Input placeholder="Ex: Art. 30" value={articleRef} onChange={(e) => setArticleRef(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição da taxa..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor (Kg)</Label>
                <Input type="number" step="0.01" placeholder="Ex: 5.00" value={amountKg} onChange={(e) => setAmountKg(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" disabled={!description || createMutation.isPending} onClick={() => createMutation.mutate()}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : fees.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma taxa cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor (Kg)</TableHead>
                  <TableHead>Artigo</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium font-mono">{f.fee_code || "—"}</TableCell>
                    <TableCell className="max-w-[300px]">{f.description}</TableCell>
                    <TableCell>{f.amount_kg != null ? f.amount_kg.toFixed(2) : "—"}</TableCell>
                    <TableCell className="text-xs">{f.article_ref || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{f.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)}>
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

export default TaxasAdministrativas;
