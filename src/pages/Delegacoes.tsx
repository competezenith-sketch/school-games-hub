import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Loader2 } from "lucide-react";

const Delegacoes = () => {
  const { data: delegations = [], isLoading } = useQuery({
    queryKey: ["delegations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delegations")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl tracking-wider">Delegações</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie as delegações participantes
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : delegations.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">Nenhuma delegação cadastrada</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-display tracking-wider text-lg">
              Todas as Delegações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegations.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.city || "—"}</TableCell>
                    <TableCell className="capitalize">{d.type}</TableCell>
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
