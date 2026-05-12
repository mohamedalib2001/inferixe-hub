import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Users } from "lucide-react";
import type { Employee, Department } from "@shared/schema";

export default function Employees() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    fullNameAr: "",
    email: "",
    departmentId: "",
    position: "",
    positionAr: "",
    employeeNumber: "",
  });

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/employees", {
        ...data,
        status: "active",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: t("success"), description: "Employee added successfully" });
      setIsAddDialogOpen(false);
      setFormData({
        fullName: "",
        fullNameAr: "",
        email: "",
        departmentId: "",
        position: "",
        positionAr: "",
        employeeNumber: "",
      });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to add employee", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({ title: t("success"), description: "Employee deleted successfully" });
    },
  });

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDepartmentName = (deptId: string | null) => {
    if (!deptId) return "—";
    const dept = departments.find((d) => d.id === deptId);
    return dept ? (isRTL && dept.nameAr ? dept.nameAr : dept.name) : "—";
  };

  const columns: Column<Employee>[] = [
    {
      key: "fullName",
      header: t("name"),
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {emp.fullName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {isRTL && emp.fullNameAr ? emp.fullNameAr : emp.fullName}
            </span>
            <span className="text-xs text-muted-foreground">{emp.employeeNumber}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: t("email"),
      render: (emp) => (
        <span className="text-sm text-muted-foreground">{emp.email}</span>
      ),
    },
    {
      key: "departmentId",
      header: t("department"),
      render: (emp) => (
        <span className="text-sm">{getDepartmentName(emp.departmentId)}</span>
      ),
    },
    {
      key: "position",
      header: t("position"),
      render: (emp) => (
        <span className="text-sm">
          {isRTL && emp.positionAr ? emp.positionAr : emp.position || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (emp) => <StatusBadge status={emp.status as any} size="sm" />,
    },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      render: (emp) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/employees/${emp.id}`}>
            <Button variant="ghost" size="icon" data-testid={`button-view-${emp.id}`}>
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/employees/${emp.id}`}>
            <Button variant="ghost" size="icon" data-testid={`button-edit-${emp.id}`}>
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate(emp.id)}
            data-testid={`button-delete-${emp.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.employeeNumber) {
      toast({ title: t("error"), description: "Please fill required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("employees")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage employee records and information
        </p>
      </div>

      <DataTable
        title={`${t("employees")} (${filteredEmployees.length})`}
        columns={columns}
        data={filteredEmployees}
        isLoading={isLoading}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, or ID..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel={t("newEmployee")}
        onExport={() => toast({ title: "Export", description: "Exporting data..." })}
        emptyMessage="No employees found"
        emptyIcon={Users}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("newEmployee")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">Employee ID *</Label>
              <Input
                id="employeeNumber"
                placeholder="EMP007"
                value={formData.employeeNumber}
                onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                data-testid="input-employee-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("name")} (English) *</Label>
                <Input
                  id="fullName"
                  placeholder="Full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  data-testid="input-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">{t("name")} (Arabic)</Label>
                <Input
                  id="fullNameAr"
                  placeholder="الاسم الكامل"
                  dir="rtl"
                  value={formData.fullNameAr}
                  onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                  data-testid="input-fullname-ar"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@inferixe.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-emp-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">{t("department")}</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
                >
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {isRTL ? dept.nameAr : dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">{t("position")}</Label>
                <Input
                  id="position"
                  placeholder="Job title"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  data-testid="input-position"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-save-employee"
            >
              {createMutation.isPending ? t("loading") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
