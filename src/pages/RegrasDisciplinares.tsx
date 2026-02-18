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
import { Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react";

const RegrasDisciplinares = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [ruleCode, setRuleCode] = useState("");
  const [description, setDescription] = useState("");
  const [penalty, setPenalty] = useState("");
  const [articleRef, setArticleRef] = useState("");

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["disciplinary-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("disciplinary_rules").select("*").order("rule_code");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("disciplinary_rules").insert({
        rule_code: ruleCode || null,
        description,
        penalty: penalty || null,
        article_ref: articleRef || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra criada!");
      queryClient.invalidateQueries({ queryKey: ["disciplinary-rules"] });
      setOpen(false);
      setRuleCode(""); setDescription(""); setPenalty(""); setArticleRef("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("disciplinary_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida!");
      queryClient.invalidateQueries({ queryKey: ["disciplinary-rules"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Regras Disciplinares</h2>
          <p className="text-muted-foreground text-sm mt-1">Infrações e penalidades do regulamento</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display tracking-wider">Nova Regra Disciplinar</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input placeholder="Ex: D01" value={ruleCode} onChange={(e) => setRuleCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Artigo Ref.</Label>
                  <Input placeholder="Ex: Art. 15" value={articleRef} onChange={(e) => setArticleRef(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição da infração..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Penalidade</Label>
                <Input placeholder="Ex: Suspensão de 2 jogos" value={penalty} onChange={(e) => setPenalty(e.target.value)} />
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
      ) : rules.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma regra disciplinar cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Penalidade</TableHead>
                  <TableHead>Artigo</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium font-mono">{r.rule_code || "—"}</TableCell>
                    <TableCell className="max-w-[300px]">{r.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.penalty || "—"}</TableCell>
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

export default RegrasDisciplinares;
