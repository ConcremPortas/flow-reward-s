import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "warning" | "ferias" | "licenca" | "rescisao";
  children?: React.ReactNode;
  className?: string;
}

const statusMap = {
  active: "status-active",
  inactive: "status-inactive", 
  warning: "status-warning",
  ferias: "status-warning",
  licenca: "status-warning",
  rescisao: "status-inactive"
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  warning: "Atenção",
  ferias: "Férias",
  licenca: "Licença",
  rescisao: "Rescisão"
};

export const StatusBadge = ({ status, children, className }: StatusBadgeProps) => {
  return (
    <span className={cn("status-badge", statusMap[status], className)}>
      {children || statusLabels[status]}
    </span>
  );
};