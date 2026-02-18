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
import { toast } from "sonner";
import { Loader2, Plus, Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const STAGE_TYPES = [
  { value: "qualifying", label: "Classificatória" },
  { value: "regional", label: "Regional" },
  { value: "state", label: "Estadual" },
  { value: "final", label: "Final" },
];

const Etapas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [competitionId, setCompetitionId] = useState("");
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [stageNumber, setStageNumber] = useState("1");
  const [stageType, setStageType] = useState("qualifying");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [congressDate, setCongressDate] = useState("");
  const [congressTime, setCongressTime] = useState("");
  const [credentialDate, setCredentialDate] = useState("");

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
    queryKey: ["competitions-etapas", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("competitions").select("id, name, year").eq("org_id", orgId).order("year", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["stages", competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_stages")
        .select("*")
        .eq("competition_id", competitionId)
        .order("stage_number", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("competition_stages").insert({
        competition_id: competitionId,
        name,
        stage_number: parseInt(stageNumber),
        stage_type: stageType,
        city: city || null,
        start_date: startDate || null,
        end_date: endDate || null,
        congress_date: congressDate || null,
        congress_time: congressTime || null,
        credential_date: credentialDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etapa criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["stages", competitionId] });
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetForm = () => {
    setName("");
    setStageNumber(String((stages.length || 0) + 1));
    setStageType("qualifying");
    setCity("");
    setStartDate("");
    setEndDate("");
    setCongressDate("");
    setCongressTime("");
    setCredentialDate("");
  };

  const stageTypeLabel = (v: string) => STAGE_TYPES.find((t) => t.value === v)?.label ?? v;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl tracking-wider">Etapas da Competição</h2>
          <p className="text-muted-foreground text-sm mt-1">Gerencie fases, datas e locais de cada etapa</p>
        </div>
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
                <Button><Plus className="h-4 w-4 mr-2" /> Nova Etapa</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-display tracking-wider">Nova Etapa</DialogTitle>
                  <DialogDescription>Defina os dados da nova etapa da competição</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Nome</Label>
                      <Input placeholder="Ex: Fase Municipal" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nº da Etapa</Label>
                      <Input type="number" min={1} value={stageNumber} onChange={(e) => setStageNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={stageType} onValueChange={setStageType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STAGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Cidade / Local</Label>
                      <Input placeholder="Ex: Boa Vista" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Credenciamento</Label>
                      <Input type="date" value={credentialDate} onChange={(e) => setCredentialDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Congresso Técnico</Label>
                      <Input type="date" value={congressDate} onChange={(e) => setCongressDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário Congresso</Label>
                      <Input type="time" value={congressTime} onChange={(e) => setCongressTime(e.target.value)} />
                    </div>
                  </div>
                  <Button className="w-full" disabled={!name || createMutation.isPending} onClick={() => createMutation.mutate()}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Etapa"}
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
        ) : stages.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma etapa cadastrada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Nova Etapa" para começar</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {stages.map((s: any, i: number) => (
              <Card key={s.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {s.stage_number ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base tracking-wider">{s.name || `Etapa ${s.stage_number}`}</h3>
                        <Badge variant="secondary" className="text-[10px]">{stageTypeLabel(s.stage_type)}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        {s.city && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.city}</span>
                        )}
                        {s.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(s.start_date)}
                            {s.end_date && ` → ${formatDate(s.end_date)}`}
                          </span>
                        )}
                        {s.congress_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Congresso: {formatDate(s.congress_date)}
                            {s.congress_time && ` às ${s.congress_time.slice(0, 5)}`}
                          </span>
                        )}
                        {s.credential_date && (
                          <span>Credenciamento: {formatDate(s.credential_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Etapas;
