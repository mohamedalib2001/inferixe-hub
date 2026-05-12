import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
import { StatusBadge } from "@/components/StatusBadge";
import { EmploymentContractUploadDialog } from "@/components/EmploymentContractUploadDialog";
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  BadgeDollarSign,
  User,
  FileText,
  Clock,
  ClipboardList,
  Edit,
  Upload,
  Download,
  Trash2,
  Plus,
  Camera,
  Loader2,
  Share2,
  CreditCard,
  FileCheck,
  DollarSign,
  Landmark,
} from "lucide-react";
import type { Employee, Department, Attendance, Request, EmployeeDocument, EmployeeContract } from "@shared/schema";

export default function EmployeeProfile() {
  const [, params] = useRoute("/employees/:id");
  const employeeId = params?.id;
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({
    name: "",
    nameAr: "",
    type: "other" as const,
    expiryDate: "",
    issuedDate: "",
    notes: "",
  });
  const [bankForm, setBankForm] = useState({
    bankName: "",
    bankNameAr: "",
    bankCode: "",
    bankAccountNumber: "",
    ibanNumber: "",
    nationalId: "",
    bankCurrency: "SAR",
  });

  const { data: employee, isLoading: employeeLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: !!employeeId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: requests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const { data: documents = [] } = useQuery<EmployeeDocument[]>({
    queryKey: ["/api/employee-documents", employeeId],
    enabled: !!employeeId,
  });

  const { data: employeeContracts = [] } = useQuery<EmployeeContract[]>({
    queryKey: ["/api/employees", employeeId, "contracts"],
    enabled: !!employeeId,
  });

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof documentForm) => {
      const response = await apiRequest("POST", "/api/employee-documents", {
        ...data,
        employeeId,
        uploadedAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
      toast({ title: t("success"), description: "Document added successfully" });
      setIsDocumentDialogOpen(false);
      setDocumentForm({
        name: "",
        nameAr: "",
        type: "other",
        expiryDate: "",
        issuedDate: "",
        notes: "",
      });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to add document", variant: "destructive" });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/employee-documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee-documents", employeeId] });
      toast({ title: t("success"), description: "Document deleted" });
    },
  });

  const updateBankMutation = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      const response = await apiRequest("PATCH", `/api/employees/${employeeId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId] });
      toast({ title: t("success"), description: t("bankInfoUpdated") });
      setIsBankDialogOpen(false);
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to update bank information", variant: "destructive" });
    },
  });

  const openBankDialog = () => {
    if (employee) {
      setBankForm({
        bankName: employee.bankName || "",
        bankNameAr: employee.bankNameAr || "",
        bankCode: employee.bankCode || "",
        bankAccountNumber: employee.bankAccountNumber || "",
        ibanNumber: employee.ibanNumber || "",
        nationalId: employee.nationalId || "",
        bankCurrency: employee.bankCurrency || "SAR",
      });
    }
    setIsBankDialogOpen(true);
  };

  if (employeeLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Employee Not Found</h2>
          <p className="text-muted-foreground mb-4">The employee you're looking for doesn't exist.</p>
          <Link href="/employees">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const department = departments.find((d) => d.id === employee.departmentId);
  const employeeAttendance = attendance.filter((a) => a.employeeId === employee.id);
  const employeeRequests = requests.filter((r) => r.requesterId === employee.id);

  const presentDays = employeeAttendance.filter((a) => a.status === "present").length;
  const absentDays = employeeAttendance.filter((a) => a.status === "absent").length;
  const lateDays = employeeAttendance.filter((a) => a.status === "late").length;

  const documentTypes: Record<string, { label: string; color: string }> = {
    id_card: { label: "ID Card", color: "bg-blue-500" },
    passport: { label: "Passport", color: "bg-green-500" },
    license: { label: "License", color: "bg-purple-500" },
    certificate: { label: "Certificate", color: "bg-orange-500" },
    contract: { label: "Contract", color: "bg-red-500" },
    other: { label: "Other", color: "bg-gray-500" },
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("employeeProfile")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t("viewEmployeeDetails")}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-background shadow-lg">
                  {employee.avatar ? (
                    <AvatarImage src={employee.avatar} alt={employee.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-semibold">
                    {employee.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="button-change-photo"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="text-xl font-semibold mt-4">
                {isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isRTL && employee.positionAr ? employee.positionAr : employee.position || "—"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {employee.employeeNumber}
                </Badge>
                <StatusBadge status={employee.status as any} size="sm" />
              </div>
              
              <div className="flex gap-2 mt-4 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => window.open(`/employee-card/${employee.id}`, '_blank')}
                  data-testid="button-view-card"
                >
                  <CreditCard className="h-4 w-4 me-2" />
                  {t("viewCard")}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={async () => {
                    const url = `${window.location.origin}/employee-card/${employee.id}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: isRTL ? `بطاقة ${employee.fullNameAr || employee.fullName}` : `${employee.fullName}'s Employee Card`,
                          text: isRTL ? "شاهد بطاقتي الوظيفية الرقمية" : "View my digital employee card",
                          url: url,
                        });
                      } catch (err) {
                        console.log("Share cancelled");
                      }
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast({ title: t("success"), description: isRTL ? "تم نسخ الرابط" : "Link copied!" });
                    }
                  }}
                  data-testid="button-share-card"
                >
                  <Share2 className="h-4 w-4 me-2" />
                  {t("shareCard")}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("email")}</p>
                  <p className="text-sm font-medium truncate">{employee.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("phone")}</p>
                  <p className="text-sm font-medium">{employee.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("department")}</p>
                  <p className="text-sm font-medium">
                    {department
                      ? isRTL && department.nameAr
                        ? department.nameAr
                        : department.name
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("hireDate")}</p>
                  <p className="text-sm font-medium">{employee.hireDate || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                  <BadgeDollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("salary")}</p>
                  <p className="text-sm font-medium">
                    {employee.salary ? `${employee.salary.toLocaleString()} SAR` : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setIsEditDialogOpen(true)}
                data-testid="button-edit-employee"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("edit")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start mb-4 h-auto flex-wrap gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
                <User className="h-4 w-4" />
                {t("overview")}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2" data-testid="tab-attendance">
                <Clock className="h-4 w-4" />
                {t("attendance")}
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2" data-testid="tab-requests">
                <ClipboardList className="h-4 w-4" />
                {t("requests")}
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
                <FileText className="h-4 w-4" />
                {t("documents")}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-2" data-testid="tab-contracts">
                <FileCheck className="h-4 w-4" />
                {isRTL ? "عقود العمل" : "Work Contracts"}
              </TabsTrigger>
              <TabsTrigger value="bank" className="gap-2" data-testid="tab-bank">
                <Landmark className="h-4 w-4" />
                {t("bankAccount")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-green-500/10">
                        <Clock className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{presentDays}</p>
                        <p className="text-sm text-muted-foreground">{t("presentDays")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-red-500/10">
                        <Clock className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{absentDays}</p>
                        <p className="text-sm text-muted-foreground">{t("absentDays")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-orange-500/10">
                        <ClipboardList className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{employeeRequests.length}</p>
                        <p className="text-sm text-muted-foreground">{t("totalRequests")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("employmentDetails")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("employeeId")}</p>
                        <p className="font-medium">{employee.employeeNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("position")}</p>
                        <p className="font-medium">
                          {isRTL && employee.positionAr ? employee.positionAr : employee.position || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("department")}</p>
                        <p className="font-medium">
                          {department
                            ? isRTL && department.nameAr
                              ? department.nameAr
                              : department.name
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("hireDate")}</p>
                        <p className="font-medium">{employee.hireDate || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("status")}</p>
                        <StatusBadge status={employee.status as any} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{t("salary")}</p>
                        <p className="font-medium">
                          {employee.salary ? `${employee.salary.toLocaleString()} SAR` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base">{t("attendanceHistory")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      {t("present")}: {presentDays}
                    </Badge>
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                      {t("absent")}: {absentDays}
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">
                      {t("late")}: {lateDays}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {employeeAttendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No attendance records found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employeeAttendance.slice(0, 10).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          data-testid={`attendance-record-${record.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{record.date}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {record.checkIn} - {record.checkOut || "—"}
                            </span>
                            <StatusBadge status={record.status as any} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base">{t("requestHistory")}</CardTitle>
                  <Link href="/requests">
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      {t("newRequest")}
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {employeeRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No requests found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {employeeRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          data-testid={`request-record-${request.id}`}
                        >
                          <div>
                            <p className="font-medium">
                              {isRTL && request.titleAr ? request.titleAr : request.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.type} • {request.createdAt}
                            </p>
                          </div>
                          <StatusBadge status={request.status as any} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base">{t("documents")}</CardTitle>
                  <Button size="sm" onClick={() => setIsDocumentDialogOpen(true)} data-testid="button-add-document">
                    <Plus className="h-4 w-4 mr-1" />
                    {t("addDocument")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No documents uploaded</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsDocumentDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          data-testid={`document-${doc.id}`}
                        >
                          <div
                            className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                              documentTypes[doc.type]?.color || "bg-gray-500"
                            }/10`}
                          >
                            <FileText
                              className={`h-5 w-5 ${
                                documentTypes[doc.type]?.color.replace("bg-", "text-") || "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {isRTL && doc.nameAr ? doc.nameAr : doc.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {documentTypes[doc.type]?.label || doc.type}
                              {doc.expiryDate && ` • Expires: ${doc.expiryDate}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteDocumentMutation.mutate(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base">{isRTL ? "عقود العمل" : "Employment Contracts"}</CardTitle>
                  {employeeId && (
                    <EmploymentContractUploadDialog
                      employeeId={employeeId}
                      trigger={
                        <Button size="sm" data-testid="button-add-employment-contract">
                          <Plus className="h-4 w-4 mr-1" />
                          {isRTL ? "تحليل عقد جديد" : "Analyze Contract"}
                        </Button>
                      }
                      onContractSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "contracts"] });
                      }}
                    />
                  )}
                </CardHeader>
                <CardContent>
                  {employeeContracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{isRTL ? "لا توجد عقود عمل" : "No employment contracts"}</p>
                      <p className="text-sm mt-1">{isRTL ? "قم برفع عقد العمل لاستخراج البيانات تلقائياً" : "Upload a contract to extract data automatically"}</p>
                      {employeeId && (
                        <EmploymentContractUploadDialog
                          employeeId={employeeId}
                          trigger={
                            <Button variant="outline" size="sm" className="mt-4" data-testid="button-upload-first-contract">
                              <Upload className="h-4 w-4 mr-2" />
                              {isRTL ? "رفع عقد العمل" : "Upload Contract"}
                            </Button>
                          }
                          onContractSaved={() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "contracts"] });
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeContracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="p-4 rounded-lg border bg-card"
                          data-testid={`employment-contract-${contract.id}`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                                <FileCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {contract.contractNumber || (isRTL ? "عقد عمل" : "Employment Contract")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {contract.contractType === "definite" 
                                    ? (isRTL ? "محدد المدة" : "Fixed Term")
                                    : (isRTL ? "غير محدد المدة" : "Indefinite")}
                                  {contract.startDate && ` • ${contract.startDate}`}
                                  {contract.endDate && ` - ${contract.endDate}`}
                                </p>
                              </div>
                            </div>
                            <Badge variant={contract.status === "active" ? "default" : "secondary"}>
                              {contract.status === "active" 
                                ? (isRTL ? "ساري" : "Active")
                                : contract.status === "expired"
                                ? (isRTL ? "منتهي" : "Expired")
                                : (isRTL ? "ملغي" : "Cancelled")}
                            </Badge>
                          </div>
                          
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">{isRTL ? "صاحب العمل" : "Employer"}</p>
                              <p className="font-medium truncate">{isRTL ? (contract.employerNameAr || contract.employerName) : contract.employerName || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">{isRTL ? "المسمى الوظيفي" : "Job Title"}</p>
                              <p className="font-medium truncate">{isRTL ? (contract.jobTitleAr || contract.jobTitle) : contract.jobTitle || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">{isRTL ? "الراتب الإجمالي" : "Total Salary"}</p>
                              <p className="font-medium text-green-600">
                                {contract.totalMonthlySalary && !isNaN(parseFloat(contract.totalMonthlySalary))
                                  ? new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
                                      style: "currency",
                                      currency: contract.currency || "SAR",
                                      maximumFractionDigits: 0,
                                    }).format(parseFloat(contract.totalMonthlySalary))
                                  : "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">{isRTL ? "نسبة الثقة" : "AI Confidence"}</p>
                              <Badge variant="outline" className="text-xs">
                                {contract.aiConfidence ? `${Math.round(parseFloat(contract.aiConfidence) * 100)}%` : "-"}
                              </Badge>
                            </div>
                          </div>

                          {(contract.basicSalary || contract.housingAllowance || contract.transportAllowance) && (
                            <div className="mt-4 pt-4 border-t grid sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">{isRTL ? "الراتب الأساسي" : "Basic Salary"}</p>
                                <p className="font-medium">
                                  {contract.basicSalary && !isNaN(parseFloat(contract.basicSalary))
                                    ? new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
                                        style: "currency",
                                        currency: contract.currency || "SAR",
                                        maximumFractionDigits: 0,
                                      }).format(parseFloat(contract.basicSalary))
                                    : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">{isRTL ? "بدل السكن" : "Housing"}</p>
                                <p className="font-medium">
                                  {contract.housingAllowance && !isNaN(parseFloat(contract.housingAllowance))
                                    ? new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
                                        style: "currency",
                                        currency: contract.currency || "SAR",
                                        maximumFractionDigits: 0,
                                      }).format(parseFloat(contract.housingAllowance))
                                    : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">{isRTL ? "بدل النقل" : "Transport"}</p>
                                <p className="font-medium">
                                  {contract.transportAllowance && !isNaN(parseFloat(contract.transportAllowance))
                                    ? new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
                                        style: "currency",
                                        currency: contract.currency || "SAR",
                                        maximumFractionDigits: 0,
                                      }).format(parseFloat(contract.transportAllowance))
                                    : "-"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">{isRTL ? "بدلات أخرى" : "Other Allowances"}</p>
                                <p className="font-medium">
                                  {contract.otherAllowances && !isNaN(parseFloat(contract.otherAllowances))
                                    ? new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
                                        style: "currency",
                                        currency: contract.currency || "SAR",
                                        maximumFractionDigits: 0,
                                      }).format(parseFloat(contract.otherAllowances))
                                    : "-"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="text-base">{t("bankDetails")}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openBankDialog}
                    data-testid="button-edit-bank"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("edit")}
                  </Button>
                </CardHeader>
                <CardContent>
                  {!employee.bankName && !employee.ibanNumber ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Landmark className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t("noBankInfo")}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={openBankDialog}
                        data-testid="button-add-bank"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("add")}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("bankName")}</p>
                          <p className="font-medium">
                            {isRTL && employee.bankNameAr ? employee.bankNameAr : employee.bankName || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("bankCode")}</p>
                          <p className="font-medium font-mono">{employee.bankCode || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("bankAccountNumber")}</p>
                          <p className="font-medium font-mono">{employee.bankAccountNumber || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("ibanNumber")}</p>
                          <p className="font-medium font-mono text-sm break-all">{employee.ibanNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("nationalId")}</p>
                          <p className="font-medium font-mono">{employee.nationalId || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{t("currency")}</p>
                          <p className="font-medium">{employee.bankCurrency || "SAR"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("addDocument")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="docName">Document Name (English) *</Label>
              <Input
                id="docName"
                placeholder="e.g., National ID Card"
                value={documentForm.name}
                onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                data-testid="input-doc-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docNameAr">Document Name (Arabic)</Label>
              <Input
                id="docNameAr"
                placeholder="مثال: بطاقة الهوية الوطنية"
                dir="rtl"
                value={documentForm.nameAr}
                onChange={(e) => setDocumentForm({ ...documentForm, nameAr: e.target.value })}
                data-testid="input-doc-name-ar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="docType">Document Type *</Label>
              <Select
                value={documentForm.type}
                onValueChange={(val: any) => setDocumentForm({ ...documentForm, type: val })}
              >
                <SelectTrigger data-testid="select-doc-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id_card">ID Card</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedDate">Issued Date</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={documentForm.issuedDate}
                  onChange={(e) => setDocumentForm({ ...documentForm, issuedDate: e.target.value })}
                  data-testid="input-issued-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={documentForm.expiryDate}
                  onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                  data-testid="input-expiry-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => {
                if (!documentForm.name) {
                  toast({ title: t("error"), description: "Document name is required", variant: "destructive" });
                  return;
                }
                createDocumentMutation.mutate(documentForm);
              }}
              disabled={createDocumentMutation.isPending}
              data-testid="button-save-document"
            >
              {createDocumentMutation.isPending ? t("loading") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditEmployeeDialog
        employee={employee || null}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />

      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editBankDetails")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">{t("bankName")} (English)</Label>
                <Input
                  id="bankName"
                  placeholder="e.g., Al Rajhi Bank"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  data-testid="input-bank-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankNameAr">{t("bankName")} (عربي)</Label>
                <Input
                  id="bankNameAr"
                  placeholder="مثال: بنك الراجحي"
                  dir="rtl"
                  value={bankForm.bankNameAr}
                  onChange={(e) => setBankForm({ ...bankForm, bankNameAr: e.target.value })}
                  data-testid="input-bank-name-ar"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankCode">{t("bankCode")}</Label>
                <Input
                  id="bankCode"
                  placeholder="e.g., RJHI, NCBK"
                  value={bankForm.bankCode}
                  onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value.toUpperCase() })}
                  data-testid="input-bank-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">{t("bankAccountNumber")}</Label>
                <Input
                  id="bankAccountNumber"
                  placeholder="1234567890"
                  value={bankForm.bankAccountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                  data-testid="input-account-number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ibanNumber">{t("ibanNumber")}</Label>
              <Input
                id="ibanNumber"
                placeholder="SA0000000000000000000000"
                className="font-mono"
                value={bankForm.ibanNumber}
                onChange={(e) => setBankForm({ ...bankForm, ibanNumber: e.target.value.toUpperCase() })}
                data-testid="input-iban"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId">{t("nationalId")}</Label>
                <Input
                  id="nationalId"
                  placeholder="1234567890"
                  value={bankForm.nationalId}
                  onChange={(e) => setBankForm({ ...bankForm, nationalId: e.target.value })}
                  data-testid="input-national-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankCurrency">{t("currency")}</Label>
                <Select
                  value={bankForm.bankCurrency}
                  onValueChange={(val) => setBankForm({ ...bankForm, bankCurrency: val })}
                >
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBankDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => updateBankMutation.mutate(bankForm)}
              disabled={updateBankMutation.isPending}
              data-testid="button-save-bank"
            >
              {updateBankMutation.isPending ? t("loading") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
