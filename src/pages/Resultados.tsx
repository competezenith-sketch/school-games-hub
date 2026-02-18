import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge, type StatusType } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Loader2, Upload, Trophy, Calendar, MapPin, Clock } from "lucide-react";

const statusOptions = [
  { value: "agendado", label: "Agendado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "encerrado", label: "Encerrado" },
  { value: "wo", label: "W.O." },
];

const statusToBadge: Record<string, StatusType> = {
  agendado: "pendente",
  em_andamento: "analise",
  encerrado: "validado",
  wo: "rejeitado",
};

const Resultados = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [status, setStatus] = useState("agendado");
  const [winnerOverride, setWinnerOverride] = useState<string>("");
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, delegation_a:delegations!matches_delegation_a_id_fkey(name), delegation_b:delegations!matches_delegation_b_id_fkey(name)")
        .order("match_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const openScoreModal = (match: any) => {
    setSelectedMatch(match);
    setScoreA(match.score_a?.toString() ?? "");
    setScoreB(match.score_b?.toString() ?? "");
    setStatus(match.status || "agendado");
    setWinnerOverride(match.winner_delegation_id || "");
    setSheetFile(null);
  };

  const suggestedWinner = () => {
    const a = parseInt(scoreA);
    const b = parseInt(scoreB);
    if (isNaN(a) || isNaN(b)) return null;
    if (a > b) return selectedMatch?.delegation_a_id;
    if (b > a) return selectedMatch?.delegation_b_id;
    return null; // draw
  };

  const effectiveWinner = winnerOverride || suggestedWinner();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMatch) return;

      let scannedUrl = selectedMatch.scanned_sheet_url;

      // Upload scanned sheet if provided
      if (sheetFile) {
        setUploading(true);
        const ext = sheetFile.name.split(".").pop();
        const path = `${selectedMatch.org_id}/${selectedMatch.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("match-sheets")
          .upload(path, sheetFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("match-sheets")
          .getPublicUrl(path);
        scannedUrl = urlData.publicUrl;
        setUploading(false);
      }

      const { error } = await supabase
        .from("matches")
        .update({
          score_a: scoreA ? parseInt(scoreA) : null,
          score_b: scoreB ? parseInt(scoreB) : null,
          status,
          winner_delegation_id: effectiveWinner || null,
          scanned_sheet_url: scannedUrl,
        })
        .eq("id", selectedMatch.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resultado salvo com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      setSelectedMatch(null);
    },
    onError: (err: any) => {
      setUploading(false);
      toast.error(err.message || "Erro ao salvar resultado");
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const todayMatches = matches.filter((m: any) => m.match_date === today);
  const otherMatches = matches.filter((m: any) => m.match_date !== today);

  const MatchCard = ({ match }: { match: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {match.match_date && (
              <>
                <Calendar className="h-3 w-3" />
                <span>{new Date(match.match_date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </>
            )}
            {match.match_time && (
              <>
                <Clock className="h-3 w-3 ml-2" />
                <span>{match.match_time?.slice(0, 5)}</span>
              </>
            )}
          </div>
          <StatusBadge status={statusToBadge[match.status] || "pendente"} />
        </div>

        {/* Confrontation */}
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="text-right flex-1">
            <p className="font-display text-sm tracking-wide truncate">
              {match.delegation_a?.name || "Time A"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-display text-xl w-8 text-center font-bold">
              {match.score_a ?? "–"}
            </span>
            <span className="text-muted-foreground text-xs">×</span>
            <span className="font-display text-xl w-8 text-center font-bold">
              {match.score_b ?? "–"}
            </span>
          </div>
          <div className="text-left flex-1">
            <p className="font-display text-sm tracking-wide truncate">
              {match.delegation_b?.name || "Time B"}
            </p>
          </div>
        </div>

        {match.location && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{match.location}</span>
          </div>
        )}

        <Button
          size="sm"
          className="w-full mt-3"
          variant={match.status === "encerrado" ? "outline" : "default"}
          onClick={() => openScoreModal(match)}
        >
          <Trophy className="h-4 w-4 mr-2" />
          {match.status === "encerrado" ? "Editar Placar" : "Lançar Placar"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Resultados</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Lance e gerencie os placares dos jogos
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : matches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum jogo cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Cadastre jogos para começar a lançar resultados
          </p>
        </Card>
      ) : (
        <>
          {todayMatches.length > 0 && (
            <div>
              <h3 className="font-display text-lg tracking-wider mb-3">Jogos de Hoje</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {todayMatches.map((m: any) => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}
          {otherMatches.length > 0 && (
            <div>
              <h3 className="font-display text-lg tracking-wider mb-3">Todos os Jogos</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {otherMatches.map((m: any) => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Score entry modal */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Lançar Resultado</DialogTitle>
            <DialogDescription>Preencha o placar e o status do jogo</DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="space-y-6 py-2">
              {/* Score inputs */}
              <div className="flex items-center justify-center gap-4">
                <div className="text-center space-y-2 flex-1">
                  <p className="font-display text-xs tracking-wider truncate">
                    {selectedMatch.delegation_a?.name || "Time A"}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="text-center text-3xl font-display font-bold h-16"
                  />
                </div>
                <span className="text-2xl font-bold text-muted-foreground pt-5">×</span>
                <div className="text-center space-y-2 flex-1">
                  <p className="font-display text-xs tracking-wider truncate">
                    {selectedMatch.delegation_b?.name || "Time B"}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="text-center text-3xl font-display font-bold h-16"
                  />
                </div>
              </div>

              {/* Suggested winner */}
              {suggestedWinner() && (
                <div className="text-center text-xs text-success font-medium">
                  Vencedor sugerido:{" "}
                  {suggestedWinner() === selectedMatch.delegation_a_id
                    ? selectedMatch.delegation_a?.name
                    : selectedMatch.delegation_b?.name}
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                <Label>Status do Jogo</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Winner override */}
              <div className="space-y-2">
                <Label>Vencedor (ajuste manual)</Label>
                <Select value={winnerOverride} onValueChange={setWinnerOverride}>
                  <SelectTrigger><SelectValue placeholder="Automático pelo placar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={selectedMatch.delegation_a_id}>
                      {selectedMatch.delegation_a?.name || "Time A"}
                    </SelectItem>
                    <SelectItem value={selectedMatch.delegation_b_id}>
                      {selectedMatch.delegation_b?.name || "Time B"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scanned sheet upload */}
              <div className="space-y-2">
                <Label>Súmula Escaneada (obrigatório para finalizar)</Label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {sheetFile ? sheetFile.name : "Clique ou arraste a foto da súmula"}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setSheetFile(e.target.files?.[0] || null)}
                  />
                </div>
                {selectedMatch.scanned_sheet_url && !sheetFile && (
                  <p className="text-xs text-success">✓ Súmula já anexada anteriormente</p>
                )}
              </div>

              {/* Save */}
              <Button
                className="w-full"
                size="lg"
                disabled={saveMutation.isPending || uploading}
                onClick={() => {
                  if (status === "encerrado" && !sheetFile && !selectedMatch.scanned_sheet_url) {
                    toast.error("Anexe a súmula escaneada para finalizar o jogo.");
                    return;
                  }
                  saveMutation.mutate();
                }}
              >
                {saveMutation.isPending || uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Salvar Resultado"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Resultados;
