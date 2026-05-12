import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import type { Employee, Request } from "@shared/schema";

const requestTypes = [
  { value: "leave", labelEn: "Leave Request", labelAr: "طلب إجازة" },
  { value: "certificate", labelEn: "Certificate Request", labelAr: "طلب شهادة" },
  { value: "transfer", labelEn: "Transfer Request", labelAr: "طلب نقل" },
  { value: "expense", labelEn: "Expense Request", labelAr: "طلب مصروفات" },
  { value: "maintenance", labelEn: "Maintenance Request", labelAr: "طلب صيانة" },
  { value: "other", labelEn: "Other", labelAr: "أخرى" },
];

const priorityOptions = [
  { value: "low", labelEn: "Low", labelAr: "منخفضة" },
  { value: "medium", labelEn: "Medium", labelAr: "متوسطة" },
  { value: "high", labelEn: "High", labelAr: "عالية" },
];

export default function MyRequests() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "leave",
    title: "",
    titleAr: "",
    description: "",
    priority: "medium",
    startDate: "",
    endDate: "",
  });

  // Use secure /api/me/* endpoints that return only user's own data
  const { data: myEmployee } = useQuery<Employee>({
    queryKey: ["/api/me", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
  });

  const { data: myRequests = [], isLoading } = useQuery<Request[]>({
    queryKey: ["/api/me", "requests"],
    queryFn: async () => {
      const res = await fetch("/api/me/requests");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Use the secure /api/me/requests endpoint which auto-assigns employeeId server-side
      return apiRequest("POST", "/api/me/requests", {
        ...data,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me", "requests"] });
      toast({
        title: isRTL ? "تم تقديم الطلب بنجاح" : "Request submitted successfully",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: isRTL ? "حدث خطأ" : "Error occurred",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "leave",
      title: "",
      titleAr: "",
      description: "",
      priority: "medium",
      startDate: "",
      endDate: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof Clock; label: string; labelAr: string }> = {
      pending: { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Clock, label: "Pending", labelAr: "قيد الانتظار" },
      approved: { color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle, label: "Approved", labelAr: "موافق عليه" },
      rejected: { color: "bg-red-500/10 text-red-600 border-red-500/30", icon: XCircle, label: "Rejected", labelAr: "مرفوض" },
      in_progress: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Clock, label: "In Progress", labelAr: "قيد التنفيذ" },
    };
    const s = config[status] || config.pending;
    const Icon = s.icon;
    return (
      <Badge variant="outline" className={s.color}>
        <Icon className="h-3 w-3 me-1" />
        {isRTL ? s.labelAr : s.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const t = requestTypes.find(r => r.value === type);
    return t ? (isRTL ? t.labelAr : t.labelEn) : type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "طلباتي" : "My Requests"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? "إدارة ومتابعة طلباتي" : "Manage and track my requests"}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? "طلب جديد" : "New Request"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{myRequests.length}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الطلبات" : "Total Requests"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {myRequests.filter(r => r.status === "pending").length}
            </p>
            <p className="text-xs text-muted-foreground">{isRTL ? "قيد الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {myRequests.filter(r => r.status === "approved").length}
            </p>
            <p className="text-xs text-muted-foreground">{isRTL ? "موافق عليها" : "Approved"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {myRequests.filter(r => r.status === "rejected").length}
            </p>
            <p className="text-xs text-muted-foreground">{isRTL ? "مرفوضة" : "Rejected"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "سجل الطلبات" : "Request History"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {isRTL ? "لا توجد طلبات" : "No requests found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  myRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(request.type)}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {isRTL && request.titleAr ? request.titleAr : request.title}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status || "pending")}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isRTL ? "طلب جديد" : "New Request"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? "نوع الطلب" : "Request Type"}</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {isRTL ? type.labelAr : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "العنوان" : "Title"}</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isRTL ? "عنوان الطلب" : "Request title"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "الوصف" : "Description"}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isRTL ? "تفاصيل الطلب" : "Request details"}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? "الأولوية" : "Priority"}</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {isRTL ? p.labelAr : p.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "leave" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? "من تاريخ" : "From Date"}</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? "إلى تاريخ" : "To Date"}</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.title || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {isRTL ? "تقديم الطلب" : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
