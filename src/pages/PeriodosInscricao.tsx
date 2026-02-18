import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, CalendarCheck, CalendarX, ExternalLink } from "lucide-react";

const EVENT_TYPES = [
  { value: "jers", label: "JER's" },
  { value: "jerps", label: "JERP's" },
];

function getPeriodStatus(openDate: string | null, closeDate: string | null): "aberto" | "fechado" | "futuro" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (!openDate || !closeDate) return "fechado";
  const open = new Date(openDate + "T00:00:00");
  const close = new Date(closeDate + "T23:59:59");
  if (now < open) return "futuro";
  if (now > close) return "fechado";
  return "aberto";
}

const statusConfig = {
  aberto: { label: "Aberto", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  fechado: { label: "Encerrado", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  futuro: { label: "Em breve", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const PeriodosInscricao = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [competitionId, setCompetitionId] = useState("");
  const [open, setOpen] = useState(false);

  // Form
  const [eventType, setEventType] = useState("jers");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [enrollmentUrl, setEnrollmentUrl] = useState("");
  const [notes, setNotes] = useState("");

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

  const { data: competitions = [] } = useQuery({
    queryKey: ["competitions-periodos", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, name, year").eq("org_id", orgId).order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["registration-periods", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registration_periods")
        .select("*")
        .eq("competition_id", competitionId)
        .order("open_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("registration_periods").insert({
        competition_id: competitionId,
        event_type: eventType,
        open_date: openDate || null,
        close_date: closeDate || null,
        enrollment_url: enrollmentUrl || null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Período de inscrição criado!");
      queryClient.invalidateQueries({ queryKey: ["registration-periods", competitionId] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setEventType("jers");
    setOpenDate("");
    setCloseDate("");
    setEnrollmentUrl("");
    setNotes("");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Períodos de Inscrição</h2>
        <p className="text-muted-foreground text-sm mt-1">Controle os prazos de inscrição por competição</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-end gap-4">
          <div className="space-y-2 flex-1 max-w-sm">
            <Label>Competição</Label>
            <Select value={competitionId} onValueChange={setCompetitionId}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {competitions.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.year})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {competitionId && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Novo Período</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display tracking-wider">Novo Período de Inscrição</DialogTitle>
                  <DialogDescription>Defina as datas de abertura e encerramento</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Tipo do Evento</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Abertura</Label>
                      <Input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Encerramento</Label>
                      <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>URL de Inscrição</Label>
                    <Input placeholder="https://..." value={enrollmentUrl} onChange={(e) => setEnrollmentUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Notas adicionais..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                  </div>
                  <Button className="w-full" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>

      {competitionId && (
        isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : periods.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum período cadastrado</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {periods.map((p: any) => {
              const st = getPeriodStatus(p.open_date, p.close_date);
              const cfg = statusConfig[st];
              return (
                <Card key={p.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                        {EVENT_TYPES.find((t) => t.value === p.event_type)?.label ?? p.event_type ?? "Geral"}
                      </Badge>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
                        {st === "aberto" ? <CalendarCheck className="h-3 w-3" /> : <CalendarX className="h-3 w-3" />}
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p><span className="text-muted-foreground">Abertura:</span> <strong>{formatDate(p.open_date)}</strong></p>
                      <p><span className="text-muted-foreground">Encerramento:</span> <strong>{formatDate(p.close_date)}</strong></p>
                    </div>
                    {p.enrollment_url && (
                      <a href={p.enrollment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" /> Link de inscrição
                      </a>
                    )}
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};

export default PeriodosInscricao;
