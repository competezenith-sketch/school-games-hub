import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, type StatusType } from "@/components/StatusBadge";
import { FileText, Loader2 } from "lucide-react";

const statusMap: Record<string, StatusType> = {
  pendente: "pendente",
  validado: "validado",
  rejeitado: "rejeitado",
};

const Inscricoes = () => {
  const { data: inscriptions = [], isLoading } = useQuery({
    queryKey: ["inscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inscriptions")
        .select("*, participant:participants(full_name), delegation:delegations(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Inscrições</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie as inscrições dos participantes nas modalidades
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : inscriptions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma inscrição encontrada</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wider text-lg">
              Todas as Inscrições
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Delegação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">
                      {i.participant?.full_name || "—"}
                    </TableCell>
                    <TableCell>{i.delegation?.name || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={statusMap[i.status] || "pendente"} />
                    </TableCell>
                    <TableCell>
                      {new Date(i.created_at).toLocaleDateString("pt-BR")}
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

export default Inscricoes;
