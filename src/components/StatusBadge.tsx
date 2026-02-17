import { cn } from "@/lib/utils";

type StatusType = "validado" | "pendente" | "rejeitado" | "analise";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  validado: {
    label: "Validado",
    className: "bg-success/15 text-success border-success/30",
  },
  pendente: {
    label: "Pendente",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  analise: {
    label: "Em Análise",
    className: "bg-warning/15 text-warning-foreground border-warning/30",
  },
  rejeitado: {
    label: "Rejeitado",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig.pendente;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};

export { StatusBadge, type StatusType };
