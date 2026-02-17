import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data — in production, fetch from Supabase based on match ID
const mockMatch = {
  number: "___",
  date: "____/____/________",
  time: "______:______",
  location: "________________________________________",
  category: "Sub-15",
  gender: "Masculino",
  teamA: {
    name: "DELEGAÇÃO A",
    athletes: Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      name: "",
      doc: "",
    })),
    staff: [
      { role: "Técnico(a)", name: "", cref: "" },
      { role: "Auxiliar", name: "", cref: "" },
    ],
  },
  teamB: {
    name: "DELEGAÇÃO B",
    athletes: Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      name: "",
      doc: "",
    })),
    staff: [
      { role: "Técnico(a)", name: "", cref: "" },
      { role: "Auxiliar", name: "", cref: "" },
    ],
  },
};

const ScoreBoxes = () => (
  <div className="flex items-center gap-2">
    {[1, 2, 3, 4, 5].map((s) => (
      <div key={s} className="w-8 h-8 border border-black" />
    ))}
  </div>
);

interface TeamTableProps {
  team: typeof mockMatch.teamA;
  label: string;
}

const TeamTable = ({ team, label }: TeamTableProps) => (
  <div className="mb-4">
    <h3 className="text-sm font-bold uppercase tracking-wide border-b border-black pb-1 mb-1">
      {label}: {team.name}
    </h3>
    <table className="w-full text-[10px] border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-black px-1 py-0.5 w-8 text-center">Nº</th>
          <th className="border border-black px-1 py-0.5 text-left">NOME COMPLETO</th>
          <th className="border border-black px-1 py-0.5 w-24 text-center">DOC (RG/CPF)</th>
          <th className="border border-black px-1 py-0.5 w-24 text-center">ASSINATURA</th>
          <th className="border border-black px-1 py-0.5 w-6 text-center" title="Gols">G</th>
          <th className="border border-black px-1 py-0.5 w-6 text-center" title="Cartão Amarelo">A</th>
          <th className="border border-black px-1 py-0.5 w-6 text-center" title="Cartão Vermelho">V</th>
        </tr>
      </thead>
      <tbody>
        {team.athletes.map((a) => (
          <tr key={a.id}>
            <td className="border border-black px-1 py-1 text-center h-5">{a.name ? a.id : ""}</td>
            <td className="border border-black px-1 py-1 uppercase">{a.name || ""}</td>
            <td className="border border-black px-1 py-1 text-center">{a.doc || ""}</td>
            <td className="border border-black px-1 py-1" />
            <td className="border border-black px-1 py-1" />
            <td className="border border-black px-1 py-1" />
            <td className="border border-black px-1 py-1" />
          </tr>
        ))}
      </tbody>
    </table>
    {/* Staff */}
    <table className="w-full text-[10px] border-collapse mt-1">
      <thead>
        <tr className="bg-gray-50">
          <th className="border border-black px-1 py-0.5 w-20 text-left">FUNÇÃO</th>
          <th className="border border-black px-1 py-0.5 text-left">NOME</th>
          <th className="border border-black px-1 py-0.5 w-20 text-center">CREF</th>
          <th className="border border-black px-1 py-0.5 w-24 text-center">ASSINATURA</th>
        </tr>
      </thead>
      <tbody>
        {team.staff.map((s, i) => (
          <tr key={i}>
            <td className="border border-black px-1 py-1 text-[9px] font-medium">{s.role}</td>
            <td className="border border-black px-1 py-1 uppercase">{s.name || ""}</td>
            <td className="border border-black px-1 py-1">{s.cref || ""}</td>
            <td className="border border-black px-1 py-1" />
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MatchSheetPrint = () => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const generated = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-50">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Súmula
        </Button>
      </div>

      {/* Printable content */}
      <div className="match-sheet-print bg-white text-black max-w-[210mm] mx-auto p-6 print:p-8 print:max-w-none font-sans text-xs">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-20 h-14 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 text-center">
            Logo JER / Governo
          </div>
          <div className="text-center flex-1 px-4">
            <h1
              className="text-base font-bold tracking-wider uppercase"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Súmula de Jogo — JER 2026
            </h1>
            <p className="text-[9px] text-gray-500 mt-0.5">
              Jogos Escolares de Roraima
            </p>
          </div>
          <div className="w-20 h-14 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 text-center">
            Logo Federação / Zenith
          </div>
        </div>

        {/* Match info */}
        <div className="grid grid-cols-6 gap-px border border-black text-[10px] mb-4">
          {[
            { label: "Jogo Nº", value: mockMatch.number },
            { label: "Data", value: mockMatch.date },
            { label: "Horário", value: mockMatch.time },
            { label: "Local", value: mockMatch.location },
            { label: "Categoria", value: mockMatch.category },
            { label: "Naipe", value: mockMatch.gender },
          ].map((f) => (
            <div key={f.label} className="border border-black px-1.5 py-1">
              <span className="block text-[8px] font-bold uppercase text-gray-500">{f.label}</span>
              <span className="block mt-0.5 min-h-[14px]">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Confrontation + Score */}
        <div className="flex items-center justify-center gap-4 mb-5 py-3 border-y border-black">
          <div className="text-right flex-1">
            <p
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {mockMatch.teamA.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-lg font-bold" />
            <span className="text-lg font-bold">×</span>
            <div className="w-12 h-12 border-2 border-black flex items-center justify-center text-lg font-bold" />
          </div>
          <div className="text-left flex-1">
            <p
              className="text-sm font-bold uppercase tracking-wide"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {mockMatch.teamB.name}
            </p>
          </div>
        </div>

        {/* Set scores (optional for volleyball etc) */}
        <div className="flex justify-center gap-8 mb-4 text-[9px]">
          <div className="text-center">
            <span className="block font-bold uppercase text-[8px] text-gray-500 mb-1">Sets / Períodos</span>
            <div className="flex gap-1">
              {["1º", "2º", "3º", "4º", "5º"].map((s) => (
                <div key={s} className="flex flex-col items-center gap-0.5">
                  <span className="text-[7px]">{s}</span>
                  <div className="w-6 h-5 border border-black" />
                  <div className="w-6 h-5 border border-black" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team rosters */}
        <TeamTable team={mockMatch.teamA} label="EQUIPE A" />
        <TeamTable team={mockMatch.teamB} label="EQUIPE B" />

        {/* Observations */}
        <div className="mb-4">
          <h3 className="text-[10px] font-bold uppercase border-b border-black pb-0.5 mb-1">
            Observações / Ocorrências
          </h3>
          <div className="border border-black min-h-[50px] p-1" />
        </div>

        {/* Referee signatures */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {["Árbitro Principal", "Árbitro Auxiliar", "Mesário / Anotador"].map((r) => (
            <div key={r} className="text-center">
              <div className="border-b border-black mb-1 h-10" />
              <p className="text-[9px] font-medium">{r}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-[8px] text-gray-400 border-t border-gray-200 pt-2">
          Gerado via Zenith Compete em {generated}
        </div>
      </div>
    </>
  );
};

export default MatchSheetPrint;
