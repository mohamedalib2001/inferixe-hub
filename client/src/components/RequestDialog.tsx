import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import type { Request, Employee } from "@shared/schema";

interface RequestDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDialog({ request, open, onOpenChange }: RequestDialogProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return empId;
    return isRTL && emp.fullNameAr ? emp.fullNameAr : emp.fullName;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, { en: string; ar: string }> = {
      leave: { en: "Leave Request", ar: "طلب إجازة" },
      maintenance: { en: "Maintenance", ar: "صيانة" },
      transfer: { en: "Transfer", ar: "نقل" },
      certificate: { en: "Certificate", ar: "شهادة" },
      expense: { en: "Expense", ar: "مصروفات" },
      other: { en: "Other", ar: "أخرى" },
    };
    return isRTL ? types[type]?.ar || type : types[type]?.en || type;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      high: { en: "High", ar: "عالية" },
      medium: { en: "Medium", ar: "متوسطة" },
      low: { en: "Low", ar: "منخفضة" },
    };
    return isRTL ? labels[priority]?.ar || priority : labels[priority]?.en || priority;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRTL ? "تفاصيل الطلب" : "Request Details"}</DialogTitle>
          <DialogDescription>
            {isRTL ? "عرض تفاصيل الطلب" : "View request details"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              {isRTL && request.titleAr ? request.titleAr : request.title}
            </h3>
            <StatusBadge status={request.status as any} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "مقدم الطلب" : "Requester"}</p>
              <p className="font-medium">{getEmployeeName(request.requesterId)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "نوع الطلب" : "Request Type"}</p>
              <p className="font-medium">{getTypeLabel(request.type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "الأولوية" : "Priority"}</p>
              <Badge variant="outline" className={getPriorityColor(request.priority || "low")}>
                {getPriorityLabel(request.priority || "low")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? "تاريخ الإنشاء" : "Created At"}</p>
              <p className="font-medium">{formatDate(request.createdAt)}</p>
            </div>
            {request.startDate && (
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "تاريخ البدء" : "Start Date"}</p>
                <p className="font-medium">{formatDate(request.startDate)}</p>
              </div>
            )}
            {request.endDate && (
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "تاريخ الانتهاء" : "End Date"}</p>
                <p className="font-medium">{formatDate(request.endDate)}</p>
              </div>
            )}
          </div>

          {request.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">{isRTL ? "الوصف" : "Description"}</p>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{request.description}</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
              {isRTL ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
