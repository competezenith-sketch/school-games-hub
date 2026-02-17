import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  dashboard: "Painel",
  regulamento: "Regulamento",
  delegacoes: "Delegações",
  participantes: "Participantes",
  inscricoes: "Inscrições",
  resultados: "Resultados",
  "match-sheet-print": "Impressão de Súmulas",
  admin: "Admin",
  setup: "Configurações Globais",
  structure: "Estrutura do Evento",
};

const sectionLabels: Record<string, string> = {
  dashboard: "Geral",
  admin: "Configuração",
};

const Breadcrumbs = () => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = routeLabels[seg] || seg;
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((c) => (
        <span key={c.path} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 opacity-40" />
          {c.isLast ? (
            <span className="text-foreground font-medium">{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
