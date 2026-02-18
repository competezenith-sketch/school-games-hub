import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Regulamento from "@/pages/Regulamento";
import Participantes from "@/pages/Participantes";
import ResetPassword from "@/pages/ResetPassword";
import MatchSheetPrint from "@/pages/MatchSheetPrint";
import Resultados from "@/pages/Resultados";
import Delegacoes from "@/pages/Delegacoes";
import Inscricoes from "@/pages/Inscricoes";
import AdminSetup from "@/pages/AdminSetup";
import StructureManager from "@/pages/StructureManager";
import Etapas from "@/pages/Etapas";
import Classificacao from "@/pages/Classificacao";
import PeriodosInscricao from "@/pages/PeriodosInscricao";
import ValidacaoInscricoes from "@/pages/ValidacaoInscricoes";
import CategoriasEtarias from "@/pages/CategoriasEtarias";
import LimitesAtletas from "@/pages/LimitesAtletas";
import VagasSede from "@/pages/VagasSede";
import RegrasStaff from "@/pages/RegrasStaff";
import RegrasDisciplinares from "@/pages/RegrasDisciplinares";
import RegrasUniforme from "@/pages/RegrasUniforme";
import TaxasAdministrativas from "@/pages/TaxasAdministrativas";
import NotFound from "@/pages/NotFound";
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/regulamento" element={<ProtectedRoute><Regulamento /></ProtectedRoute>} />
            <Route path="/dashboard/participantes" element={<ProtectedRoute><Participantes /></ProtectedRoute>} />
            <Route path="/dashboard/match-sheet-print" element={<ProtectedRoute><MatchSheetPrint /></ProtectedRoute>} />
            <Route path="/dashboard/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
            <Route path="/dashboard/delegacoes" element={<ProtectedRoute><Delegacoes /></ProtectedRoute>} />
            <Route path="/dashboard/inscricoes" element={<ProtectedRoute><Inscricoes /></ProtectedRoute>} />
            <Route path="/dashboard/etapas" element={<ProtectedRoute><Etapas /></ProtectedRoute>} />
            <Route path="/dashboard/classificacao" element={<ProtectedRoute><Classificacao /></ProtectedRoute>} />
            <Route path="/dashboard/periodos-inscricao" element={<ProtectedRoute><PeriodosInscricao /></ProtectedRoute>} />
            <Route path="/dashboard/validacao-inscricoes" element={<ProtectedRoute><ValidacaoInscricoes /></ProtectedRoute>} />
            <Route path="/admin/setup" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
            <Route path="/admin/structure" element={<ProtectedRoute><StructureManager /></ProtectedRoute>} />
            <Route path="/admin/categorias-etarias" element={<ProtectedRoute><CategoriasEtarias /></ProtectedRoute>} />
            <Route path="/admin/limites-atletas" element={<ProtectedRoute><LimitesAtletas /></ProtectedRoute>} />
            <Route path="/admin/vagas-sede" element={<ProtectedRoute><VagasSede /></ProtectedRoute>} />
            <Route path="/admin/regras-staff" element={<ProtectedRoute><RegrasStaff /></ProtectedRoute>} />
            <Route path="/admin/regras-disciplinares" element={<ProtectedRoute><RegrasDisciplinares /></ProtectedRoute>} />
            <Route path="/admin/regras-uniforme" element={<ProtectedRoute><RegrasUniforme /></ProtectedRoute>} />
            <Route path="/admin/taxas-administrativas" element={<ProtectedRoute><TaxasAdministrativas /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
