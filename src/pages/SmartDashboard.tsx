import { useUserRole } from "@/hooks/useUserRole";
import Dashboard from "@/pages/Dashboard";
import GestorDashboard from "@/pages/GestorDashboard";
import { Loader2 } from "lucide-react";

const SmartDashboard = () => {
  const { isAdmin, isGestor, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isGestor && !isAdmin) {
    return <GestorDashboard />;
  }

  return <Dashboard />;
};

export default SmartDashboard;
