import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Trophy,
  Users,
  FileText,
  Building2,
  LogOut,
  Menu,
  ChevronRight,
  Mountain,
  ClipboardList,
  Cog,
  LayoutGrid,
  ScrollText,
  Printer,
  BarChart3,
  Users2,
  Target,
  MapPinned,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Shirt,
  DollarSign,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const generalItems: NavItem[] = [
  { to: "/dashboard", label: "Visão Geral", icon: BarChart3, end: true },
  { to: "/dashboard/delegacoes", label: "Delegações", icon: Building2 },
  { to: "/dashboard/participantes", label: "Participantes", icon: Users },
  { to: "/dashboard/inscricoes", label: "Inscrições", icon: FileText },
  { to: "/dashboard/periodos-inscricao", label: "Períodos Inscrição", icon: Trophy },
];

// Items visible only for gestores (school managers)
const gestorItems: NavItem[] = [
  { to: "/dashboard", label: "Visão Geral", icon: BarChart3, end: true },
  { to: "/dashboard/participantes", label: "Meus Atletas", icon: Users },
  { to: "/dashboard/inscricoes", label: "Inscrições", icon: FileText },
];

const operationItems: NavItem[] = [
  { to: "/dashboard/etapas", label: "Etapas", icon: Mountain },
  { to: "/dashboard/resultados", label: "Resultados", icon: ClipboardList },
  { to: "/dashboard/classificacao", label: "Classificação", icon: Trophy },
  { to: "/dashboard/match-sheet-print", label: "Impressão Súmulas", icon: Printer },
  { to: "/dashboard/validacao-inscricoes", label: "Validar Inscrições", icon: FileText },
];

const adminItems: NavItem[] = [
  { to: "/admin/setup", label: "Configurações Globais", icon: Cog },
  { to: "/admin/structure", label: "Estrutura do Evento", icon: LayoutGrid },
  { to: "/admin/gestores", label: "Gestores de Escola", icon: UserPlus },
  { to: "/dashboard/regulamento", label: "Regulamento", icon: ScrollText },
  { to: "/admin/categorias-etarias", label: "Categorias Etárias", icon: Users2 },
  { to: "/admin/limites-atletas", label: "Limites de Atletas", icon: Target },
  { to: "/admin/vagas-sede", label: "Vagas por Sede", icon: MapPinned },
  { to: "/admin/regras-staff", label: "Regras de Staff", icon: UserCheck },
  { to: "/admin/regras-disciplinares", label: "Regras Disciplinares", icon: ShieldAlert },
  { to: "/admin/regras-uniforme", label: "Regras de Uniforme", icon: Shirt },
  { to: "/admin/taxas-administrativas", label: "Taxas Administrativas", icon: DollarSign },
];

function SidebarNavItem({ item, onClick }: { item: NavItem; onClick: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-primary/15 text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4" />
      {item.label}
      <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />
    </NavLink>
  );
}

function SidebarGroup({ label, items, onClick }: { label: string; items: NavItem[]; onClick: () => void }) {
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem key={item.to} item={item} onClick={onClick} />
        ))}
      </div>
    </div>
  );
}

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const { isAdmin, isGestor } = useUserRole();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Client logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-display text-base font-bold tracking-wider text-sidebar-accent-foreground truncate">
              JER 2026
            </span>
            <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40">
              Jogos Escolares
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-5 px-3 overflow-y-auto">
          {isGestor && !isAdmin ? (
            <SidebarGroup label="Minha Escola" items={gestorItems} onClick={closeSidebar} />
          ) : (
            <>
              <SidebarGroup label="Geral" items={generalItems} onClick={closeSidebar} />
              <SidebarGroup label="Operação" items={operationItems} onClick={closeSidebar} />
              {isAdmin && (
                <SidebarGroup label="Configuração" items={adminItems} onClick={closeSidebar} />
              )}
            </>
          )}
        </nav>

        {/* User + Powered by */}
        <div className="border-t border-sidebar-border p-4 space-y-3">
          <div>
            <p className="text-xs text-sidebar-foreground/50 truncate mb-2">{user?.email}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-primary hover:bg-sidebar-accent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
          <div className="flex items-center gap-1.5 pt-2 border-t border-sidebar-border">
            <Mountain className="h-3 w-3 text-sidebar-foreground/30" />
            <span className="text-[10px] text-sidebar-foreground/30 tracking-wide">
              Powered by <span className="font-semibold">Zenith Compete</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Glass header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-lg tracking-wider">Painel Administrativo</h1>
        </header>
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
