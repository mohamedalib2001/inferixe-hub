import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FaceCapture } from "@/components/FaceCapture";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  ScanFace,
  UserPlus,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Trash2,
  User,
  Info,
} from "lucide-react";
import type { Employee, BiometricEnrollment } from "@shared/schema";

export default function FaceEnrollment() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [showCapture, setShowCapture] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: enrollment, isLoading: enrollmentLoading, refetch } = useQuery({
    queryKey: ["/api/biometric/enrollment", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { employeeId: string; faceData: string }) => {
      const response = await apiRequest("POST", "/api/biometric/enroll", {
        ...data,
        consentGiven: true,
        deviceInfo: navigator.userAgent,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ 
          title: t("success"), 
          description: isRTL ? "تم تسجيل بصمة الوجه بنجاح" : "Face enrolled successfully" 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/biometric/enrollment", selectedEmployeeId] });
      } else {
        toast({ 
          title: t("error"), 
          description: data.message,
          variant: "destructive"
        });
      }
      setShowCapture(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t("error"), 
        description: error.message || "Enrollment failed",
        variant: "destructive"
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (employeeId: string) => {
      await apiRequest("DELETE", `/api/biometric/enrollment/${employeeId}`);
    },
    onSuccess: () => {
      toast({ 
        title: t("success"), 
        description: isRTL ? "تم حذف التسجيل بنجاح" : "Enrollment deleted successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric/enrollment", selectedEmployeeId] });
    },
    onError: () => {
      toast({ 
        title: t("error"), 
        description: isRTL ? "فشل حذف التسجيل" : "Failed to delete enrollment",
        variant: "destructive"
      });
    },
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const isEnrolled = enrollment && (enrollment as any).enrolled;

  const handleCapture = (imageData: string, livenessData: any) => {
    if (!selectedEmployeeId) return;

    enrollMutation.mutate({
      employeeId: selectedEmployeeId,
      faceData: imageData,
    });
  };

  if (employeesLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isRTL ? "تسجيل بصمة الوجه" : "Face Enrollment"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? "تسجيل الموظفين في نظام التعرف على الوجه" : "Enroll employees in face recognition system"}
          </p>
        </div>
      </div>

      <Card className="bg-amber-500/10 border-amber-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              {isRTL ? "وضع العرض التوضيحي" : "Demo Mode Only"}
            </p>
            <p className="text-amber-600 dark:text-amber-500">
              {isRTL 
                ? "هذا النظام للعرض التوضيحي فقط وغير مخصص للاستخدام الإنتاجي. يتطلب النظام الفعلي تكاملاً مع خدمة بيومترية معتمدة."
                : "This system is for demonstration purposes only and not intended for production use. A real system requires integration with a certified biometric service."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <p className="font-medium mb-1">
              {isRTL ? "نظام حماية متقدم" : "Advanced Security System"}
            </p>
            <p>
              {isRTL 
                ? "نظام بصمة الوجه يستخدم تقنيات متقدمة للتحقق من الهوية وكشف التزوير، بما في ذلك اكتشاف الرمش وحركة الرأس."
                : "Our face recognition system uses advanced liveness detection including blink detection and head movement tracking to prevent spoofing attempts."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {isRTL ? "اختر الموظف" : "Select Employee"}
          </CardTitle>
          <CardDescription>
            {isRTL ? "اختر الموظف لتسجيل بصمة الوجه" : "Choose an employee to enroll in face recognition"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-full" data-testid="select-employee-enrollment">
              <SelectValue placeholder={isRTL ? "اختر موظف..." : "Select an employee..."} />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  <div className="flex items-center gap-2">
                    <span>{isRTL && emp.fullNameAr ? emp.fullNameAr : emp.fullName}</span>
                    <span className="text-muted-foreground">({emp.employeeNumber})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {selectedEmployee.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-medium">
                    {isRTL && selectedEmployee.fullNameAr ? selectedEmployee.fullNameAr : selectedEmployee.fullName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.position} - {selectedEmployee.employeeNumber}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {enrollmentLoading ? (
                      <Skeleton className="h-5 w-24" />
                    ) : isEnrolled ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        <CheckCircle className="h-3 w-3 me-1" />
                        {isRTL ? "مسجل في النظام" : "Enrolled"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3 me-1" />
                        {isRTL ? "غير مسجل" : "Not Enrolled"}
                      </Badge>
                    )}
                  </div>
                </div>
                {isEnrolled && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 me-2" />
                        {isRTL ? "حذف التسجيل" : "Remove Enrollment"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {isRTL ? "تأكيد الحذف" : "Confirm Deletion"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {isRTL 
                            ? "هل أنت متأكد من حذف تسجيل بصمة الوجه لهذا الموظف؟ لن يتمكن الموظف من تسجيل الحضور بالوجه."
                            : "Are you sure you want to remove this employee's face enrollment? They will no longer be able to check in using face recognition."
                          }
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteMutation.mutate(selectedEmployeeId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isRTL ? "حذف" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

          {!isEnrolled && !showCapture && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {isRTL ? "الموافقة على التسجيل" : "Enrollment Consent"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50">
                  <Checkbox 
                    id="consent" 
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
                    data-testid="checkbox-consent"
                  />
                  <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                    {isRTL 
                      ? "أوافق على تسجيل بصمة وجهي في نظام الحضور والانصراف. أفهم أن بياناتي البيومترية ستخزن بشكل آمن وتستخدم فقط لأغراض تسجيل الحضور."
                      : "I consent to having my face biometric data enrolled in the attendance system. I understand that my biometric data will be securely stored and used only for attendance verification purposes."
                    }
                  </Label>
                </div>

                <Button 
                  onClick={() => setShowCapture(true)}
                  disabled={!consentGiven}
                  className="w-full"
                  data-testid="button-start-enrollment"
                >
                  <ScanFace className="h-4 w-4 me-2" />
                  {isRTL ? "بدء التسجيل" : "Start Enrollment"}
                </Button>
              </CardContent>
            </Card>
          )}

          {showCapture && !isEnrolled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanFace className="h-5 w-5 text-primary" />
                  {isRTL ? "تسجيل بصمة الوجه" : "Face Capture"}
                </CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "انظر مباشرة إلى الكاميرا واتبع التعليمات"
                    : "Look directly at the camera and follow the on-screen instructions"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FaceCapture
                  mode="enrollment"
                  onCapture={handleCapture}
                  onCancel={() => setShowCapture(false)}
                  isProcessing={enrollMutation.isPending}
                />
              </CardContent>
            </Card>
          )}

          {isEnrolled && (
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-700 dark:text-green-400">
                    {isRTL ? "تم التسجيل بنجاح" : "Successfully Enrolled"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {isRTL 
                      ? "يمكن لهذا الموظف الآن استخدام بصمة الوجه لتسجيل الحضور والانصراف"
                      : "This employee can now use face recognition for attendance check-in and check-out"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRTL ? "تاريخ التسجيل:" : "Enrolled on:"} {new Date((enrollment as any).enrolledAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
