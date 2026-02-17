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
            <Route path="/admin/setup" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
