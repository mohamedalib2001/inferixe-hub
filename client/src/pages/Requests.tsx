import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { RequestDialog } from "@/components/RequestDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  FileText,
  Eye,
  Check,
  X,
  Calendar,
  Wrench,
  ArrowRightLeft,
  FileCheck,
  DollarSign,
  MoreHorizontal,
  Clock,
  UserX,
  AlertTriangle,
  Briefcase,
  UserCheck,
  LogOut,
  TrendingUp,
  Wallet,
  Gift,
  Timer,
  Minus,
  Plus,
  MessageSquare,
  ClipboardCheck,
  MessageCircle,
  Gavel,
  FileOutput,
  Edit,
  Mail,
  Shield,
  Users,
  Smartphone,
} from "lucide-react";
import type { Request, RequestType, Employee } from "@shared/schema";

const requestTypeIcons: Record<RequestType, typeof Calendar> = {
  // Attendance & Leave
  leave: Calendar,
  vacation: Calendar,
  extend_vacation: Clock,
  absence: UserX,
  escape: AlertTriangle,
  // Work Status
  start_work_new: Briefcase,
  start_work_return: UserCheck,
  last_day_vacation: LogOut,
  last_day_end_service: LogOut,
  // Payroll Related
  salary_increase: TrendingUp,
  advance: Wallet,
  bonus: Gift,
  late_fine: Timer,
  deduction: Minus,
  addition_hours: Plus,
  addition_days: Plus,
  // HR & Compliance
  complaint: MessageSquare,
  evaluation: ClipboardCheck,
  objection: MessageCircle,
  disciplinary: Gavel,
  clearance: FileOutput,
  update_data: Edit,
  letters: Mail,
  // Operations
  transfer: ArrowRightLeft,
  employee_guarantee: Shield,
  desire_workers: Users,
  data_sim: Smartphone,
  // General
  maintenance: Wrench,
  certificate: FileCheck,
  expense: DollarSign,
  other: MoreHorizontal,
};

// Using direct labels for flexibility with the schema types
const getRequestTypeLabel = (type: RequestType, isRTL: boolean): string => {
  const labels: Record<RequestType, { en: string; ar: string }> = {
    // Attendance & Leave
    leave: { en: "Leave", ar: "إجازة" },
    vacation: { en: "Vacation", ar: "إجازة" },
    extend_vacation: { en: "Extend Vacation", ar: "تمديد إجازة" },
    absence: { en: "Absence", ar: "غياب" },
    escape: { en: "Escape", ar: "هروب" },
    // Work Status
    start_work_new: { en: "Start Work (New Employee)", ar: "مباشرة عمل (موظف جديد)" },
    start_work_return: { en: "Start Work (After Vacation)", ar: "مباشرة عمل (بعد الإجازة)" },
    last_day_vacation: { en: "Last Day (Vacation)", ar: "آخر يوم عمل (إجازة)" },
    last_day_end_service: { en: "Last Day (End of Service)", ar: "آخر يوم عمل (إنهاء خدمات)" },
    // Payroll Related
    salary_increase: { en: "Salary Increase", ar: "زيادة راتب" },
    advance: { en: "Advance Payment", ar: "سلفة" },
    bonus: { en: "Bonus", ar: "مكافأة" },
    late_fine: { en: "Late Fine", ar: "غرامة تأخير" },
    deduction: { en: "Deduction", ar: "استقطاع" },
    addition_hours: { en: "Additions By Hours", ar: "إضافات بالساعات" },
    addition_days: { en: "Additions By Days", ar: "إضافات بالأيام" },
    // HR & Compliance
    complaint: { en: "Complaint", ar: "شكوى" },
    evaluation: { en: "Evaluation Form", ar: "نموذج تقييم" },
    objection: { en: "Objection Request", ar: "طلب اعتراض" },
    disciplinary: { en: "Disciplinary Action", ar: "إجراء تأديبي" },
    clearance: { en: "Clearance Form", ar: "إخلاء طرف" },
    update_data: { en: "Update Employee Data", ar: "تحديث بيانات" },
    letters: { en: "Letters", ar: "خطابات" },
    // Operations
    transfer: { en: "Transfer", ar: "نقل" },
    employee_guarantee: { en: "Employee Guarantee", ar: "ضمان موظف" },
    desire_workers: { en: "Request Workers", ar: "طلب عمال" },
    data_sim: { en: "Data SIM Services", ar: "شريحة بيانات" },
    // General
    maintenance: { en: "Maintenance", ar: "صيانة" },
    certificate: { en: "Certificate", ar: "شهادة" },
    expense: { en: "Expense", ar: "مصروفات" },
    other: { en: "Other", ar: "أخرى" },
  };
  const label = labels[type];
  return label ? (isRTL ? label.ar : label.en) : type;
};

// Group request types by category
const requestTypeCategories = {
  attendanceLeave: {
    en: "Attendance & Leave",
    ar: "الحضور والإجازات",
    types: ["leave", "vacation", "extend_vacation", "absence", "escape"] as RequestType[],
  },
  workStatus: {
    en: "Work Status",
    ar: "حالة العمل",
    types: ["start_work_new", "start_work_return", "last_day_vacation", "last_day_end_service"] as RequestType[],
  },
  payrollRelated: {
    en: "Payroll Related",
    ar: "متعلق بالرواتب",
    types: ["salary_increase", "advance", "bonus", "late_fine", "deduction", "addition_hours", "addition_days"] as RequestType[],
  },
  hrCompliance: {
    en: "HR & Compliance",
    ar: "الموارد البشرية",
    types: ["complaint", "evaluation", "objection", "disciplinary", "clearance", "update_data", "letters"] as RequestType[],
  },
  operations: {
    en: "Operations",
    ar: "العمليات",
    types: ["transfer", "employee_guarantee", "desire_workers", "data_sim"] as RequestType[],
  },
  general: {
    en: "General",
    ar: "عام",
    types: ["maintenance", "certificate", "expense", "other"] as RequestType[],
  },
};

export default function Requests() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "" as RequestType,
    targetEmployeeId: "", // Employee the request is for (empty = self)
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    startDate: "",
    endDate: "",
    amount: "",
    days: "",
    hours: "",
    reason: "",
  });

  // Check if user is management (can submit requests for other employees)
  const isManagement = user?.role && ["super_admin", "admin", "hr", "finance", "operations"].includes(user.role);

  // Fetch employees list for management users
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: !!isManagement,
  });

  const openRequestDialog = (request: Request) => {
    setSelectedRequest(request);
    setIsRequestDialogOpen(true);
  };

  const { data: requests = [], isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/requests", {
        ...data,
        requesterId: user?.id || "unknown",
        targetEmployeeId: data.targetEmployeeId || null, // null means self
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("success"), description: isRTL ? "تم إرسال الطلب بنجاح" : "Request submitted successfully" });
      setIsAddDialogOpen(false);
      setFormData({ type: "" as RequestType, targetEmployeeId: "", title: "", description: "", priority: "medium", startDate: "", endDate: "", amount: "", days: "", hours: "", reason: "" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to submit request", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/requests/${id}`, { status, updatedAt: new Date().toISOString() });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({ title: t("success"), description: "Request updated successfully" });
    },
  });

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && req.status === "pending") ||
      (activeTab === "approved" && req.status === "approved") ||
      (activeTab === "rejected" && req.status === "rejected");
    return matchesSearch && matchesTab;
  });

  const columns: Column<Request>[] = [
    {
      key: "title",
      header: "Request",
      render: (req) => {
        const Icon = requestTypeIcons[req.type];
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">
                {isRTL && req.titleAr ? req.titleAr : req.title}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {getRequestTypeLabel(req.type, isRTL)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "priority",
      header: "Priority",
      render: (req) => (
        <Badge
          variant="outline"
          className={
            req.priority === "high"
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
              : req.priority === "medium"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              : "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
          }
        >
          {req.priority}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (req) => (
        <span className="text-sm text-muted-foreground">
          {new Date(req.createdAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (req) => <StatusBadge status={req.status as any} size="sm" />,
    },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      render: (req) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openRequestDialog(req)}
            data-testid={`button-view-${req.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {req.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-600 hover:text-green-700"
                onClick={() => updateMutation.mutate({ id: req.id, status: "approved" })}
                data-testid={`button-approve-${req.id}`}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700"
                onClick={() => updateMutation.mutate({ id: req.id, status: "rejected" })}
                data-testid={`button-reject-${req.id}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    if (!formData.type || !formData.title) {
      toast({ title: t("error"), description: "Please fill required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("requests")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and track all workflow requests
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            {t("pending")} ({requests.filter((r) => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            {t("approved")} ({requests.filter((r) => r.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            {t("rejected")} ({requests.filter((r) => r.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <DataTable
            title={`${t("requests")} (${filteredRequests.length})`}
            columns={columns}
            data={filteredRequests}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search requests..."
            onAdd={() => setIsAddDialogOpen(true)}
            addLabel={t("newRequest")}
            emptyMessage="No requests found"
            emptyIcon={FileText}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("newRequest")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">{isRTL ? "نوع الطلب *" : "Request Type *"}</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData({ ...formData, type: val as RequestType })}
              >
                <SelectTrigger data-testid="select-request-type">
                  <SelectValue placeholder={isRTL ? "اختر النوع" : "Select type"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(requestTypeCategories).map(([categoryKey, category]) => (
                    <div key={categoryKey}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {isRTL ? category.ar : category.en}
                      </div>
                      {category.types.map((type) => {
                        const Icon = requestTypeIcons[type];
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{getRequestTypeLabel(type, isRTL)}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Requester info - show current user */}
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{isRTL ? "مقدم الطلب" : "Submitted by"}</span>
                  <span className="font-medium text-sm">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || (isRTL ? "المستخدم الحالي" : "Current User")}
                  </span>
                </div>
              </div>
            </div>

            {/* Target employee selector - only for management */}
            {isManagement && (
              <div className="space-y-2">
                <Label htmlFor="targetEmployee">{isRTL ? "الطلب لأجل *" : "Request For *"}</Label>
                <Select
                  value={formData.targetEmployeeId}
                  onValueChange={(val) => setFormData({ ...formData, targetEmployeeId: val })}
                >
                  <SelectTrigger data-testid="select-target-employee">
                    <SelectValue placeholder={isRTL ? "اختر الموظف" : "Select employee"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="self">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{isRTL ? "لنفسي" : "For myself"}</span>
                      </div>
                    </SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{emp.fullName}</span>
                          <span className="text-xs text-muted-foreground">({emp.employeeNumber})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{isRTL ? "العنوان *" : "Title *"}</Label>
              <Input
                id="title"
                placeholder={isRTL ? "عنوان الطلب" : "Request title"}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-request-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your request..."
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="textarea-description"
              />
            </div>
            {/* Conditional fields based on request type */}
            {["salary_increase", "advance", "bonus", "deduction", "late_fine"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="amount">{isRTL ? "المبلغ" : "Amount"} *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={isRTL ? "أدخل المبلغ" : "Enter amount"}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  data-testid="input-amount"
                />
              </div>
            )}

            {["addition_days", "leave", "vacation", "extend_vacation", "absence"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="days">{isRTL ? "عدد الأيام" : "Number of Days"} *</Label>
                <Input
                  id="days"
                  type="number"
                  placeholder={isRTL ? "أدخل عدد الأيام" : "Enter number of days"}
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                  data-testid="input-days"
                />
              </div>
            )}

            {["addition_hours", "late_fine"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="hours">{isRTL ? "عدد الساعات" : "Number of Hours"} *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  placeholder={isRTL ? "أدخل عدد الساعات" : "Enter number of hours"}
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  data-testid="input-hours"
                />
              </div>
            )}

            {["complaint", "objection", "disciplinary", "escape"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="reason">{isRTL ? "السبب" : "Reason"} *</Label>
                <Textarea
                  id="reason"
                  placeholder={isRTL ? "أدخل السبب بالتفصيل" : "Enter detailed reason"}
                  className="resize-none"
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  data-testid="textarea-reason"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">{isRTL ? "الأولوية" : "Priority"}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData({ ...formData, priority: val as "low" | "medium" | "high" })}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue placeholder={isRTL ? "اختر الأولوية" : "Select priority"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{isRTL ? "منخفضة" : "Low"}</SelectItem>
                    <SelectItem value="medium">{isRTL ? "متوسطة" : "Medium"}</SelectItem>
                    <SelectItem value="high">{isRTL ? "عالية" : "High"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">{isRTL ? "تاريخ البداية" : "Start Date"}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
            </div>

            {["leave", "vacation", "extend_vacation"].includes(formData.type) && (
              <div className="space-y-2">
                <Label htmlFor="endDate">{isRTL ? "تاريخ النهاية" : "End Date"}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? t("loading") : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RequestDialog
        request={selectedRequest}
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
      />
    </div>
  );
}
