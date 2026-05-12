import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/use-auth";
import { getTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, Globe, Moon, Bell, Shield, Save, DollarSign, Loader2, Users, Building, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ApprovalSetting {
  id: number;
  role: string;
  roleName: string;
  roleNameAr: string;
  orderIndex: number;
  isEnabled: boolean;
  allowedUserRoles: string[];
}

interface PayrollAutomationSettings {
  id: string;
  autoLinkPayrollRequests: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface ManagementAssignment {
  id: string;
  managerUserId: string;
  scopeType: "branch" | "employee";
  scopeId: string;
  notes?: string;
  createdAt: string;
}

interface AuthUserBasic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface Branch {
  id: string;
  name: string;
  nameAr: string;
}

interface Employee {
  id: string;
  fullName: string;
  fullNameAr?: string;
  employeeNumber: string;
}

export default function Settings() {
  const { language, setLanguage, isRTL } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const { data: approvalSettings = [], isLoading: loadingSettings } = useQuery<ApprovalSetting[]>({
    queryKey: ["/api/payroll/approval-settings"],
    enabled: isAdmin,
  });

  const toggleSettingMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      const response = await apiRequest("PATCH", `/api/payroll/approval-settings/${id}`, { isEnabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/approval-settings"] });
      toast({
        title: language === "ar" ? "تم تحديث الإعدادات" : "Settings updated",
        description: language === "ar" ? "تم تحديث إعدادات الاعتماد بنجاح" : "Approval settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل التحديث" : "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Payroll Automation Settings
  const { data: automationSettings, isLoading: loadingAutomation } = useQuery<PayrollAutomationSettings>({
    queryKey: ["/api/settings/payroll-automation"],
    enabled: isAdmin,
  });

  const updateAutomationMutation = useMutation({
    mutationFn: async (autoLinkPayrollRequests: boolean) => {
      const response = await apiRequest("PUT", "/api/settings/payroll-automation", { autoLinkPayrollRequests });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/payroll-automation"] });
      toast({
        title: language === "ar" ? "تم تحديث الإعدادات" : "Settings updated",
        description: language === "ar" ? "تم تحديث إعدادات الربط التلقائي" : "Automation settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل التحديث" : "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Management Assignments
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<ManagementAssignment[]>({
    queryKey: ["/api/management-assignments"],
    enabled: isAdmin,
  });

  const { data: authUsers = [] } = useQuery<AuthUserBasic[]>({
    queryKey: ["/api/auth-users"],
    enabled: isAdmin,
  });

  const { data: allBranches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: isAdmin,
  });

  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: isAdmin,
  });

  const [selectedManager, setSelectedManager] = useState("");
  const [scopeType, setScopeType] = useState<"branch" | "employee">("branch");
  const [selectedScope, setSelectedScope] = useState("");

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { managerUserId: string; scopeType: string; scopeId: string }) => {
      const response = await apiRequest("POST", "/api/management-assignments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/management-assignments"] });
      setSelectedManager("");
      setSelectedScope("");
      toast({
        title: language === "ar" ? "تم إنشاء التعيين" : "Assignment created",
        description: language === "ar" ? "تم تعيين المدير للنطاق المحدد" : "Manager assigned to scope successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل الإنشاء" : "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/management-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/management-assignments"] });
      toast({
        title: language === "ar" ? "تم حذف التعيين" : "Assignment deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل الحذف" : "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAssignment = () => {
    if (!selectedManager || !selectedScope) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى اختيار المدير والنطاق" : "Please select manager and scope",
        variant: "destructive",
      });
      return;
    }
    createAssignmentMutation.mutate({
      managerUserId: selectedManager,
      scopeType,
      scopeId: selectedScope,
    });
  };

  const getManagerName = (userId: string) => {
    const user = authUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}`.trim() || user.email : userId;
  };

  const getScopeName = (type: string, scopeId: string) => {
    if (type === "branch") {
      const branch = allBranches.find(b => b.id === scopeId);
      return branch ? (language === "ar" ? branch.nameAr : branch.name) : scopeId;
    } else {
      const employee = allEmployees.find(e => e.id === scopeId);
      return employee ? (language === "ar" ? employee.fullNameAr || employee.fullName : employee.fullName) : scopeId;
    }
  };

  // Filter users to show managers who can have scoped access
  // Excludes super_admin/admin (who bypass restrictions) and employee (who only have self-service)
  const managerUsers = authUsers.filter(u => 
    ["operations", "fleet_manager", "hr", "finance"].includes(u.role || "") && u.isActive
  );

  const handleSave = () => {
    toast({
      title: t("success"),
      description: "Settings saved successfully",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                  {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{`${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize mt-1">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  defaultValue={user?.firstName || ""}
                  data-testid="input-settings-firstname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  defaultValue={user?.lastName || ""}
                  data-testid="input-settings-lastname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">{t("name")} (Arabic)</Label>
                <Input
                  id="fullNameAr"
                  defaultValue={user?.fullNameAr || ""}
                  dir="rtl"
                  data-testid="input-settings-name-ar"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  data-testid="input-settings-email"
                  disabled
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Language & Appearance</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={(val) => setLanguage(val as "en" | "ar")}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(val) => setTheme(val as "light" | "dark")}>
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle dark mode on or off
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-email-notifications" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Request Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your requests are processed
                </p>
              </div>
              <Switch defaultChecked data-testid="switch-request-notifications" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Attendance Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Daily reminder to check in
                </p>
              </div>
              <Switch data-testid="switch-attendance-notifications" />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === "ar" ? "إعدادات اعتماد الرواتب" : "Payroll Approval Settings"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar" 
                      ? "تكوين مراحل اعتماد الرواتب" 
                      : "Configure payroll approval workflow stages"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSettings ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar"
                      ? "قم بتمكين أو تعطيل مراحل الاعتماد المطلوبة لمعالجة الرواتب. يجب إتمام المراحل بالترتيب."
                      : "Enable or disable approval stages required for payroll processing. Stages must be completed in order."}
                  </p>
                  
                  {approvalSettings.map((setting, index) => (
                    <div key={setting.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>
                            {language === "ar" ? setting.roleNameAr : setting.roleName}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {language === "ar" 
                              ? `المرحلة ${setting.orderIndex} في سلسلة الاعتماد`
                              : `Stage ${setting.orderIndex} in approval chain`}
                          </p>
                        </div>
                        <Switch
                          checked={setting.isEnabled}
                          onCheckedChange={(checked) => 
                            toggleSettingMutation.mutate({ id: setting.id, isEnabled: checked })
                          }
                          disabled={toggleSettingMutation.isPending}
                          data-testid={`switch-approval-${setting.role}`}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {approvalSettings.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {language === "ar" 
                        ? "لا توجد مراحل اعتماد مُعدّة" 
                        : "No approval stages configured"}
                    </p>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        {language === "ar" ? "الربط التلقائي للرواتب" : "Automatic Payroll Linking"}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {language === "ar"
                          ? "عند تفعيل هذا الخيار، سيتم إنشاء طلبات رواتب تلقائياً عند الموافقة على الطلبات المالية (مكافآت، استقطاعات، سلف، إضافات)"
                          : "When enabled, payroll requests will be automatically created when financial requests are approved (bonuses, deductions, advances, additions)"}
                      </p>
                    </div>
                    
                    {loadingAutomation ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          {language === "ar" ? "جاري التحميل..." : "Loading..."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>
                            {language === "ar" ? "الوضع التلقائي" : "Automatic Mode"}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {automationSettings?.autoLinkPayrollRequests
                              ? (language === "ar" ? "مفعّل - يتم إنشاء طلبات الرواتب تلقائياً" : "Enabled - Payroll requests created automatically")
                              : (language === "ar" ? "معطّل - يجب إنشاء طلبات الرواتب يدوياً" : "Disabled - Payroll requests must be created manually")}
                          </p>
                        </div>
                        <Switch
                          checked={automationSettings?.autoLinkPayrollRequests ?? true}
                          onCheckedChange={(checked) => updateAutomationMutation.mutate(checked)}
                          disabled={updateAutomationMutation.isPending}
                          data-testid="switch-auto-payroll-linking"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {language === "ar" ? "تعيينات المديرين" : "Manager Assignments"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar" 
                      ? "تعيين المديرين للفروع والموظفين الذين يمكنهم الوصول إليهم" 
                      : "Assign managers to branches and employees they can access"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {language === "ar"
                  ? "قم بتعيين المديرين إلى الفروع أو الموظفين المحددين. سيتمكن المديرون فقط من رؤية البيانات المعينة لهم."
                  : "Assign managers to specific branches or employees. Managers will only be able to see data assigned to them."}
              </p>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "المدير" : "Manager"}</Label>
                  <Select value={selectedManager} onValueChange={setSelectedManager}>
                    <SelectTrigger data-testid="select-manager">
                      <SelectValue placeholder={language === "ar" ? "اختر مدير" : "Select manager"} />
                    </SelectTrigger>
                    <SelectContent>
                      {managerUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {`${u.firstName} ${u.lastName}`.trim() || u.email} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "نوع النطاق" : "Scope Type"}</Label>
                  <Select value={scopeType} onValueChange={(v) => { setScopeType(v as "branch" | "employee"); setSelectedScope(""); }}>
                    <SelectTrigger data-testid="select-scope-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {language === "ar" ? "فرع" : "Branch"}
                        </div>
                      </SelectItem>
                      <SelectItem value="employee">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {language === "ar" ? "موظف" : "Employee"}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{language === "ar" ? "النطاق" : "Scope"}</Label>
                  <Select value={selectedScope} onValueChange={setSelectedScope}>
                    <SelectTrigger data-testid="select-scope">
                      <SelectValue placeholder={language === "ar" ? "اختر" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {scopeType === "branch" ? (
                        allBranches.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {language === "ar" ? b.nameAr : b.name}
                          </SelectItem>
                        ))
                      ) : (
                        allEmployees.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {language === "ar" ? e.fullNameAr || e.fullName : e.fullName} ({e.employeeNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex items-end">
                  <Button 
                    onClick={handleCreateAssignment}
                    disabled={createAssignmentMutation.isPending || !selectedManager || !selectedScope}
                    data-testid="button-add-assignment"
                  >
                    {createAssignmentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 me-1" />
                        {language === "ar" ? "إضافة" : "Add"}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {loadingAssignments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {language === "ar" ? "لا توجد تعيينات" : "No assignments configured"}
                </p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="capitalize">
                          {assignment.scopeType === "branch" ? (
                            <Building className="h-3 w-3 me-1" />
                          ) : (
                            <User className="h-3 w-3 me-1" />
                          )}
                          {language === "ar" ? (assignment.scopeType === "branch" ? "فرع" : "موظف") : assignment.scopeType}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{getManagerName(assignment.managerUserId)}</p>
                          <p className="text-xs text-muted-foreground">
                            {getScopeName(assignment.scopeType, assignment.scopeId)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        disabled={deleteAssignmentMutation.isPending}
                        data-testid={`button-delete-assignment-${assignment.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  data-testid="input-current-password"
                />
              </div>
              <div></div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} data-testid="button-save-settings">
            <Save className="h-4 w-4 me-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
