import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bell, Send, Users, Building2, Briefcase, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee, Department, Branch } from "@shared/schema";

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  titleAr: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  contentAr: z.string().optional(),
  type: z.enum(["info", "success", "warning", "alert", "announcement", "reminder", "system"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  targetType: z.enum(["all", "employees", "department", "branch", "role"]),
  targetIds: z.array(z.string()).optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const roleOptions = [
  { value: "super_admin", label: "Super Admin", labelAr: "مدير النظام" },
  { value: "admin", label: "Admin", labelAr: "مسؤول" },
  { value: "hr", label: "HR", labelAr: "موارد بشرية" },
  { value: "finance", label: "Finance", labelAr: "مالية" },
  { value: "operations", label: "Operations", labelAr: "تشغيل" },
  { value: "fleet_manager", label: "Fleet Manager", labelAr: "مدير أسطول" },
  { value: "employee", label: "Employee", labelAr: "موظف" },
];

export function SendNotificationDialog() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: open,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: open,
  });

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      titleAr: "",
      content: "",
      contentAr: "",
      type: "info",
      priority: "normal",
      targetType: "all",
      targetIds: [],
    },
  });

  const targetType = form.watch("targetType");

  const sendMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const response = await apiRequest("POST", "/api/notifications", {
        ...data,
        targetIds: selectedIds.length > 0 ? selectedIds : undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t("notificationSent"),
        description: `${t("recipientCount")}: ${data.recipientCount}`,
      });
      form.reset();
      setSelectedIds([]);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: NotificationFormData) => {
    sendMutation.mutate(data);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTargetOptions = () => {
    switch (targetType) {
      case "employees":
        return employees.map((e) => ({
          id: e.id,
          label: language === "ar" && e.fullNameAr ? e.fullNameAr : e.fullName,
          sublabel: e.position,
        }));
      case "department":
        return departments.map((d) => ({
          id: d.id,
          label: language === "ar" ? d.nameAr : d.name,
          sublabel: "",
        }));
      case "branch":
        return branches.map((b) => ({
          id: b.id,
          label: language === "ar" && b.nameAr ? b.nameAr : b.name,
          sublabel: b.code,
        }));
      case "role":
        return roleOptions.map((r) => ({
          id: r.value,
          label: language === "ar" ? r.labelAr : r.label,
          sublabel: "",
        }));
      default:
        return [];
    }
  };

  const targetOptions = getTargetOptions();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-send-notification">
          <Bell className="h-4 w-4 mr-2" />
          {t("sendNotification")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("sendNotification")}</DialogTitle>
          <DialogDescription>
            {t("notificationTarget")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationTitle")} (English)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Notification title" data-testid="input-notification-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="titleAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationTitle")} (العربية)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="عنوان الإشعار" dir="rtl" data-testid="input-notification-title-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationContent")} (English)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Notification content" rows={3} data-testid="input-notification-content" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contentAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationContent")} (العربية)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="محتوى الإشعار" rows={3} dir="rtl" data-testid="input-notification-content-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationType")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-notification-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">{t("typeInfo")}</SelectItem>
                        <SelectItem value="success">{t("typeSuccess")}</SelectItem>
                        <SelectItem value="warning">{t("typeWarning")}</SelectItem>
                        <SelectItem value="alert">{t("typeAlert")}</SelectItem>
                        <SelectItem value="announcement">{t("typeAnnouncement")}</SelectItem>
                        <SelectItem value="reminder">{t("typeReminder")}</SelectItem>
                        <SelectItem value="system">{t("typeSystem")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationPriority")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-notification-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">{t("priorityLow")}</SelectItem>
                        <SelectItem value="normal">{t("priorityNormal")}</SelectItem>
                        <SelectItem value="high">{t("priorityHigh")}</SelectItem>
                        <SelectItem value="urgent">{t("priorityUrgent")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sendTo")}</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedIds([]);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-notification-target">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t("targetAll")}
                          </div>
                        </SelectItem>
                        <SelectItem value="employees">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            {t("targetEmployees")}
                          </div>
                        </SelectItem>
                        <SelectItem value="department">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            {t("targetDepartment")}
                          </div>
                        </SelectItem>
                        <SelectItem value="branch">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {t("targetBranch")}
                          </div>
                        </SelectItem>
                        <SelectItem value="role">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            {t("targetRole")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {targetType !== "all" && targetOptions.length > 0 && (
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {targetType === "employees" && t("selectEmployees")}
                    {targetType === "department" && t("selectDepartments")}
                    {targetType === "branch" && t("selectBranches")}
                    {targetType === "role" && t("selectRoles")}
                  </span>
                  {selectedIds.length > 0 && (
                    <Badge variant="secondary">{selectedIds.length}</Badge>
                  )}
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {targetOptions.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2 p-2 rounded hover-elevate cursor-pointer"
                        onClick={() => toggleSelection(option.id)}
                      >
                        <Checkbox
                          checked={selectedIds.includes(option.id)}
                          onCheckedChange={() => toggleSelection(option.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{option.label}</p>
                          {option.sublabel && (
                            <p className="text-xs text-muted-foreground">{option.sublabel}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={sendMutation.isPending} data-testid="button-send-notification-submit">
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending ? "..." : t("sendNotification")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
