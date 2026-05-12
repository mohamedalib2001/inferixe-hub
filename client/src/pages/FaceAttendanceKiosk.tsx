import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FaceCapture } from "@/components/FaceCapture";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ScanFace,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Clock,
  Search,
  User,
  ChevronLeft,
  Monitor,
} from "lucide-react";
import type { Employee, Branch, BiometricAttendanceEvent } from "@shared/schema";

export default function FaceAttendanceKiosk() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [captureMode, setCaptureMode] = useState<"check_in" | "check_out" | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const activeBranches = branches.filter(b => b.isActive && b.kioskEnabled);

  const { data: branchEmployeesData = [] } = useQuery<{ employeeId: string; branchId: string }[]>({
    queryKey: ["/api/branches", selectedBranchId, "employees"],
    enabled: !!selectedBranchId,
  });

  const { data: allEmployees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const branchEmployeeIds = branchEmployeesData.map(eb => eb.employeeId);
  const branchEmployees = allEmployees.filter(e => branchEmployeeIds.includes(e.id));

  const { data: enrollment } = useQuery({
    queryKey: ["/api/biometric/enrollment", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const { data: todayEvents = [] } = useQuery<BiometricAttendanceEvent[]>({
    queryKey: ["/api/biometric/today", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const selectedEmployee = allEmployees.find(e => e.id === selectedEmployeeId);
  const isEnrolled = enrollment && (enrollment as any).enrolled;
  const hasCheckedIn = todayEvents.some(e => e.eventType === "check_in" && e.verified);
  const hasCheckedOut = todayEvents.some(e => e.eventType === "check_out" && e.verified);

  const verifyMutation = useMutation({
    mutationFn: async (data: { 
      employeeId: string; 
      faceData: string; 
      eventType: "check_in" | "check_out"; 
      livenessData: any;
      branchId: string;
    }) => {
      const response = await apiRequest("POST", "/api/biometric/verify", {
        ...data,
        deviceInfo: `Kiosk - ${navigator.userAgent}`,
        skipLocationCheck: true,
        isMobileDevice: false,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: isRTL ? "نجاح" : "Success", 
          description: isRTL ? data.messageAr : data.message,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/biometric/today", selectedEmployeeId] });
        queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
        setTimeout(() => {
          resetToEmployeeList();
        }, 3000);
      } else {
        toast({ 
          title: t("error"), 
          description: isRTL ? data.messageAr : data.message,
          variant: "destructive"
        });
      }
      setShowCapture(false);
      setCaptureMode(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t("error"), 
        description: isRTL ? "فشل التحقق" : "Verification failed",
        variant: "destructive"
      });
      setShowCapture(false);
      setCaptureMode(null);
    },
  });

  const resetToEmployeeList = () => {
    setSelectedEmployeeId("");
    setSearchQuery("");
    setCaptureMode(null);
    setShowCapture(false);
  };

  const handleStartCapture = (mode: "check_in" | "check_out") => {
    if (!isEnrolled) {
      toast({
        title: t("error"),
        description: isRTL ? "الموظف غير مسجل في نظام بصمة الوجه" : "Employee not enrolled in face recognition",
        variant: "destructive",
      });
      return;
    }
    setCaptureMode(mode);
    setShowCapture(true);
  };

  const handleCapture = (imageData: string, livenessData: any) => {
    if (!selectedEmployeeId || !captureMode || !selectedBranchId) return;

    verifyMutation.mutate({
      employeeId: selectedEmployeeId,
      faceData: imageData,
      eventType: captureMode,
      livenessData,
      branchId: selectedBranchId,
    });
  };

  const filteredEmployees = branchEmployees.filter(e =>
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.fullNameAr && e.fullNameAr.includes(searchQuery)) ||
    e.employeeNumber.includes(searchQuery)
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(isRTL ? "ar-SA" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (branchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  if (!selectedBranchId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-primary/10">
                <Monitor className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">{t("faceAttendanceKiosk")}</h1>
            <p className="text-muted-foreground">{t("selectBranch")}</p>
          </div>

          <div className="text-center space-y-1">
            <p className="text-4xl font-bold">{formatTime(currentTime)}</p>
            <p className="text-muted-foreground">{formatDate(currentTime)}</p>
          </div>

          {activeBranches.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                <p className="text-muted-foreground">
                  {isRTL ? "لا توجد فروع مفعلة للكشك" : "No branches with kiosk mode enabled"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeBranches.map(branch => (
                <Card 
                  key={branch.id} 
                  className="cursor-pointer hover-elevate transition-all"
                  onClick={() => setSelectedBranchId(branch.id)}
                  data-testid={`card-branch-${branch.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-md bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">
                          {isRTL ? branch.nameAr : branch.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{branch.code}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showCapture && captureMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => { setShowCapture(false); setCaptureMode(null); }} data-testid="button-back-from-capture">
              <ChevronLeft className="h-4 w-4 me-1" />
              {isRTL ? "رجوع" : "Back"}
            </Button>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
            </div>
            <div className="w-20" />
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <ScanFace className="h-6 w-6" />
                {captureMode === "check_in" 
                  ? (isRTL ? "تسجيل الحضور" : "Check In")
                  : (isRTL ? "تسجيل الانصراف" : "Check Out")
                }
              </CardTitle>
              <CardDescription>
                {selectedEmployee && (isRTL && selectedEmployee.fullNameAr ? selectedEmployee.fullNameAr : selectedEmployee.fullName)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FaceCapture
                mode="verification"
                onCapture={handleCapture}
                onCancel={() => { setShowCapture(false); setCaptureMode(null); }}
                isProcessing={verifyMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedEmployeeId && selectedEmployee) {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-background" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={resetToEmployeeList} data-testid="button-back-to-list">
            <ChevronLeft className="h-4 w-4 me-1" />
            {isRTL ? "رجوع" : "Back"}
          </Button>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
            <p className="text-sm text-muted-foreground">
              {selectedBranch && (isRTL ? selectedBranch.nameAr : selectedBranch.name)}
            </p>
          </div>
          <div className="w-20" />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xl space-y-6">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-3xl font-bold text-primary">
                    {selectedEmployee.fullName.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <h2 className="text-2xl font-bold">
                  {isRTL && selectedEmployee.fullNameAr ? selectedEmployee.fullNameAr : selectedEmployee.fullName}
                </h2>
                <p className="text-muted-foreground">{selectedEmployee.employeeNumber}</p>
                <div className="flex justify-center gap-2 mt-3">
                  {isEnrolled ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <CheckCircle className="h-3 w-3 me-1" />
                      {isRTL ? "مسجل" : "Enrolled"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                      <AlertTriangle className="h-3 w-3 me-1" />
                      {isRTL ? "غير مسجل" : "Not Enrolled"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className={hasCheckedIn ? "border-green-500/30 bg-green-500/5" : ""}>
                <CardContent className="p-6 text-center">
                  {hasCheckedIn ? (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-2" />
                      <p className="font-medium text-green-600">{isRTL ? "تم الحضور" : "Checked In"}</p>
                      <p className="text-sm text-muted-foreground">
                        {todayEvents.find(e => e.eventType === "check_in")?.timestamp?.split("T")[1]?.slice(0, 5)}
                      </p>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleStartCapture("check_in")}
                      disabled={!isEnrolled || verifyMutation.isPending}
                      className="w-full h-24 text-lg"
                      data-testid="button-kiosk-check-in"
                    >
                      <LogIn className="h-6 w-6 me-2" />
                      {isRTL ? "تسجيل الحضور" : "Check In"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className={hasCheckedOut ? "border-blue-500/30 bg-blue-500/5" : ""}>
                <CardContent className="p-6 text-center">
                  {hasCheckedOut ? (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                      <p className="font-medium text-blue-600">{isRTL ? "تم الانصراف" : "Checked Out"}</p>
                      <p className="text-sm text-muted-foreground">
                        {todayEvents.find(e => e.eventType === "check_out")?.timestamp?.split("T")[1]?.slice(0, 5)}
                      </p>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleStartCapture("check_out")}
                      disabled={!isEnrolled || !hasCheckedIn || verifyMutation.isPending}
                      className="w-full h-24 text-lg"
                      variant="secondary"
                      data-testid="button-kiosk-check-out"
                    >
                      <LogOut className="h-6 w-6 me-2" />
                      {isRTL ? "تسجيل الانصراف" : "Check Out"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => setSelectedBranchId("")} data-testid="button-change-branch">
          <ChevronLeft className="h-4 w-4 me-1" />
          {isRTL ? "تغيير الفرع" : "Change Branch"}
        </Button>
        <div className="text-center">
          <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
          <p className="text-sm text-muted-foreground">
            {selectedBranch && (isRTL ? selectedBranch.nameAr : selectedBranch.name)}
          </p>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isRTL ? "اختر الموظف" : "Select Employee"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={isRTL ? "بحث بالاسم أو رقم الموظف..." : "Search by name or employee number..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? "pr-10" : "pl-10"}`}
                data-testid="input-search-employee-kiosk"
              />
            </div>
          </CardContent>
        </Card>

        {filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {branchEmployees.length === 0
                  ? (isRTL ? "لا يوجد موظفين معينين لهذا الفرع" : "No employees assigned to this branch")
                  : (isRTL ? "لا توجد نتائج" : "No results found")
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredEmployees.slice(0, 10).map(employee => (
              <Card
                key={employee.id}
                className="cursor-pointer hover-elevate transition-all"
                onClick={() => setSelectedEmployeeId(employee.id)}
                data-testid={`card-employee-kiosk-${employee.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 font-medium text-primary">
                      {employee.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.employeeNumber} - {employee.position}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
