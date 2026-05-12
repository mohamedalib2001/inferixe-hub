import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, X, Clock, AlertCircle } from "lucide-react";

type Status = "approved" | "pending" | "rejected" | "in_progress" | "active" | "inactive" | "present" | "absent" | "late" | "leave" | "available" | "in_use" | "maintenance" | "retired";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusConfig: Record<Status, { label: string; labelAr: string; className: string; icon?: typeof Check }> = {
  approved: {
    label: "Approved",
    labelAr: "موافق عليه",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    icon: Check,
  },
  pending: {
    label: "Pending",
    labelAr: "قيد الانتظار",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  rejected: {
    label: "Rejected",
    labelAr: "مرفوض",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    icon: X,
  },
  in_progress: {
    label: "In Progress",
    labelAr: "قيد التنفيذ",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    icon: AlertCircle,
  },
  active: {
    label: "Active",
    labelAr: "نشط",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  inactive: {
    label: "Inactive",
    labelAr: "غير نشط",
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
  present: {
    label: "Present",
    labelAr: "حاضر",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    icon: Check,
  },
  absent: {
    label: "Absent",
    labelAr: "غائب",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
    icon: X,
  },
  late: {
    label: "Late",
    labelAr: "متأخر",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  leave: {
    label: "On Leave",
    labelAr: "في إجازة",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  available: {
    label: "Available",
    labelAr: "متاح",
    className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  },
  in_use: {
    label: "In Use",
    labelAr: "قيد الاستخدام",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  maintenance: {
    label: "Maintenance",
    labelAr: "صيانة",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  retired: {
    label: "Retired",
    labelAr: "متقاعد",
    className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border",
        config.className,
        size === "sm" && "text-xs px-2 py-0.5"
      )}
    >
      {Icon && <Icon className={cn("h-3 w-3 me-1", size === "sm" && "h-2.5 w-2.5")} />}
      {config.label}
    </Badge>
  );
}
