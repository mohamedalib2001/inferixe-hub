import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Minus,
  Clock,
  Calendar,
  DollarSign,
  Check,
  X,
  AlertTriangle,
  UserMinus,
  Banknote,
  Timer,
  Gift,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { PayrollRequest, Employee } from "@shared/schema";

type PayrollRequestWithEmployee = PayrollRequest & {
  employeeName?: string;
  employeeNameAr?: string;
  employeeNumber?: string;
};

const deductionTypes = [
  { value: "absence", icon: UserMinus },
  { value: "disciplinary", icon: AlertTriangle },
  { value: "amount_deduction", icon: Banknote },
];

const additionTypes = [
  { value: "extra_days", icon: CalendarPlus },
  { value: "extra_hours", icon: Timer },
  { value: "bonus", icon: Gift },
];

export default function PayrollRequests() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === "ar";

  const [activeTab, setActiveTab] = useState<"deduction" | "addition">("deduction");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [formData, setFormData] = useState({
    employeeId: "",
    category: "deduction" as "deduction" | "addition",
    requestType: "",
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    days: 0,
    hours: 0,
    amount: 0,
    targetYear: new Date().getFullYear(),
    targetMonth: new Date().getMonth() + 1,
  });

  const { data: requests = [], isLoading } = useQuery<PayrollRequestWithEmployee[]>({
    queryKey: ["/api/payroll-requests", selectedYear, selectedMonth],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/payroll-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-requests"] });
      toast({ title: t("requestCreated") });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: t("error"), variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/payroll-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-requests"] });
      toast({ title: t("requestApproved") });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return apiRequest("POST", `/api/payroll-requests/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-requests"] });
      toast({ title: t("requestRejected") });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/payroll-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll-requests"] });
      toast({ title: t("success") });
    },
  });

  const resetForm = () => {
    setFormData({
      employeeId: "",
      category: activeTab,
      requestType: "",
      title: "",
      titleAr: "",
      description: "",
      descriptionAr: "",
      days: 0,
      hours: 0,
      amount: 0,
      targetYear: selectedYear,
      targetMonth: selectedMonth,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const openNewDialog = (category: "deduction" | "addition") => {
    setFormData(prev => ({
      ...prev,
      category,
      requestType: "",
      targetYear: selectedYear,
      targetMonth: selectedMonth,
    }));
    setIsDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      absence: t("absence"),
      disciplinary: t("disciplinary"),
      amount_deduction: t("amountDeduction"),
      extra_days: t("extraDays"),
      extra_hours: t("extraHours"),
      bonus: t("bonus"),
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      applied: "outline",
    };
    const labels: Record<string, string> = {
      pending: t("pending"),
      approved: t("approved"),
      rejected: t("rejected"),
      applied: t("approved"),
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      absence: <UserMinus className="h-4 w-4" />,
      disciplinary: <AlertTriangle className="h-4 w-4" />,
      amount_deduction: <Banknote className="h-4 w-4" />,
      extra_days: <CalendarPlus className="h-4 w-4" />,
      extra_hours: <Timer className="h-4 w-4" />,
      bonus: <Gift className="h-4 w-4" />,
    };
    return icons[type] || <DollarSign className="h-4 w-4" />;
  };

  const filteredRequests = requests.filter(r => r.category === activeTab);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(2024, i, 1), "MMMM", { locale: isRTL ? ar : enUS }),
  }));

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("payrollRequests")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRTL ? "إدارة الاستقطاعات والإضافات للرواتب" : "Manage payroll deductions and additions"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px]" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[100px]" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "deduction" | "addition")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="deduction" className="gap-2" data-testid="tab-deductions">
              <Minus className="h-4 w-4" />
              {t("deductions")}
            </TabsTrigger>
            <TabsTrigger value="addition" className="gap-2" data-testid="tab-additions">
              <Plus className="h-4 w-4" />
              {t("additions")}
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => openNewDialog(activeTab)} data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === "deduction" ? t("newDeduction") : t("newAddition")}
          </Button>
        </div>

        <TabsContent value="deduction" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-destructive" />
                <CardTitle>{t("deductions")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RequestsList
                requests={filteredRequests}
                isLoading={isLoading}
                language={language}
                t={t}
                getTypeLabel={getTypeLabel}
                getTypeIcon={getTypeIcon}
                getStatusBadge={getStatusBadge}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addition" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-500" />
                <CardTitle>{t("additions")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RequestsList
                requests={filteredRequests}
                isLoading={isLoading}
                language={language}
                t={t}
                getTypeLabel={getTypeLabel}
                getTypeIcon={getTypeIcon}
                getStatusBadge={getStatusBadge}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id, reason) => rejectMutation.mutate({ id, reason })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {formData.category === "deduction" ? t("newDeduction") : t("newAddition")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("selectEmployee")}</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, employeeId: v }))}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder={t("selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {language === "ar" && emp.fullNameAr ? emp.fullNameAr : emp.fullName} ({emp.employeeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{formData.category === "deduction" ? t("deductionType") : t("additionType")}</Label>
              <Select
                value={formData.requestType}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, requestType: v }))}
              >
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder={formData.category === "deduction" ? t("deductionType") : t("additionType")} />
                </SelectTrigger>
                <SelectContent>
                  {(formData.category === "deduction" ? deductionTypes : additionTypes).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {getTypeLabel(type.value)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("title")} (EN)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("title")} (AR)</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                  dir="rtl"
                  data-testid="input-title-ar"
                />
              </div>
            </div>

            {(formData.requestType === "absence" || formData.requestType === "extra_days") && (
              <div className="space-y-2">
                <Label>{t("numberOfDays")}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.days}
                  onChange={(e) => setFormData((prev) => ({ ...prev, days: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-days"
                />
              </div>
            )}

            {formData.requestType === "extra_hours" && (
              <div className="space-y-2">
                <Label>{t("numberOfHours")}</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                  data-testid="input-hours"
                />
              </div>
            )}

            {(formData.requestType === "amount_deduction" || formData.requestType === "bonus" || formData.requestType === "disciplinary") && (
              <div className="space-y-2">
                <Label>{t("amount")} (SAR)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  data-testid="input-amount"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("targetPeriod")}</Label>
                <Select
                  value={String(formData.targetMonth)}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, targetMonth: Number(v) }))}
                >
                  <SelectTrigger data-testid="select-target-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("year")}</Label>
                <Select
                  value={String(formData.targetYear)}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, targetYear: Number(v) }))}
                >
                  <SelectTrigger data-testid="select-target-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={2}
                data-testid="input-description"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.employeeId || !formData.requestType || !formData.title}
                data-testid="button-submit"
              >
                {createMutation.isPending ? t("loading") : t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestsList({
  requests,
  isLoading,
  language,
  t,
  getTypeLabel,
  getTypeIcon,
  getStatusBadge,
  onApprove,
  onReject,
  onDelete,
}: {
  requests: PayrollRequestWithEmployee[];
  isLoading: boolean;
  language: string;
  t: (key: any) => string;
  getTypeLabel: (type: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onDelete: (id: string) => void;
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mb-3 opacity-50" />
        <p>{t("noPayrollRequests")}</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-4 border rounded-lg hover-elevate"
              data-testid={`request-item-${request.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${request.category === "deduction" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"}`}>
                    {getTypeIcon(request.requestType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {language === "ar" && request.titleAr ? request.titleAr : request.title}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(request.requestType)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar" && request.employeeNameAr ? request.employeeNameAr : request.employeeName}
                      {request.employeeNumber && ` (${request.employeeNumber})`}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {request.days && request.days > 0 && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {request.days} {t("days")}
                        </span>
                      )}
                      {request.hours && request.hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {request.hours} {language === "ar" ? "ساعة" : "hours"}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {(request.calculatedAmount || request.amount || 0).toLocaleString()} SAR
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(request.status || "pending")}
                  {request.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => onApprove(request.id)}
                        data-testid={`button-approve-${request.id}`}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                        onClick={() => {
                          setRejectId(request.id);
                          setRejectDialogOpen(true);
                        }}
                        data-testid={`button-reject-${request.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("rejectRequest")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("rejectionReason")}</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                data-testid="input-rejection-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onReject(rejectId, rejectReason);
                  setRejectDialogOpen(false);
                  setRejectReason("");
                }}
                data-testid="button-confirm-reject"
              >
                {t("rejectRequest")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
