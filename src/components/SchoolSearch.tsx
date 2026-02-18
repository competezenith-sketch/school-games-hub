import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SchoolSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SchoolSearch({ value, onChange }: SchoolSearchProps) {
  const [open, setOpen] = useState(false);

  // Busca as escolas do banco de dados
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      // Verifique se a tabela se chama 'schools' ou 'escolas' no seu banco
      const { data, error } = await supabase
        .from("schools") 
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Encontra o nome da escola selecionada para exibir no botão
  const selectedSchool = schools.find((school) => school.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? selectedSchool?.name
            : "Selecione uma escola..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar escola..." />
          <CommandList>
            <CommandEmpty>Nenhuma escola encontrada.</CommandEmpty>
            <CommandGroup>
              {schools.map((school) => (
                <CommandItem
                  key={school.id}
                  value={school.name} // O valor aqui é usado para filtrar pelo texto digitado
                  onSelect={() => {
                    onChange(school.id === value ? "" : school.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === school.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {school.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
