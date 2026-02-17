import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Settings,
  Users,
  FileText,
  Building2,
  LogOut,
  Menu,
  ChevronRight,
  Mountain,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Visão Geral", icon: Trophy },
  { to: "/dashboard/regulamento", label: "Regulamento", icon: Settings },
  { to: "/dashboard/delegacoes", label: "Delegações", icon: Building2 },
  { to: "/dashboard/participantes", label: "Participantes", icon: Users },
  { to: "/dashboard/inscricoes", label: "Inscrições", icon: FileText },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          onClick={() => setSidebarOpen(false)}
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

        <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              onClick={() => setSidebarOpen(false)}
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
          ))}
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
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
