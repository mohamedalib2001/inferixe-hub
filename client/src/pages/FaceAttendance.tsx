import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FaceCapture } from "@/components/FaceCapture";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  User,
  Calendar,
  MapPin,
  Navigation,
  Building2,
  Smartphone,
} from "lucide-react";
import type { Employee, BiometricAttendanceEvent, Branch, EmployeeBranch } from "@shared/schema";

export default function FaceAttendance() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [captureMode, setCaptureMode] = useState<"check_in" | "check_out" | null>(null);
  const [showCapture, setShowCapture] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["/api/biometric/enrollment", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const { data: todayEvents = [], refetch: refetchEvents } = useQuery<BiometricAttendanceEvent[]>({
    queryKey: ["/api/biometric/today", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  const { data: employeeBranches = [] } = useQuery<EmployeeBranch[]>({
    queryKey: ["/api/employees", selectedEmployeeId, "branches"],
    enabled: !!selectedEmployeeId,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const assignedBranch = employeeBranches.length > 0 
    ? branches.find(b => b.id === (employeeBranches.find(eb => eb.isPrimary)?.branchId || employeeBranches[0]?.branchId))
    : null;

  useEffect(() => {
    if (selectedEmployeeId && employeeBranches.length > 0) {
      getCurrentLocation();
    }
  }, [selectedEmployeeId, employeeBranches.length]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(isRTL ? "المتصفح لا يدعم تحديد الموقع" : "Geolocation not supported");
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(isRTL ? "تم رفض صلاحية تحديد الموقع" : "Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(isRTL ? "الموقع غير متاح" : "Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError(isRTL ? "انتهى وقت تحديد الموقع" : "Location request timed out");
            break;
          default:
            setLocationError(isRTL ? "خطأ في تحديد الموقع" : "Location error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const verifyMutation = useMutation({
    mutationFn: async (data: { 
      employeeId: string; 
      faceData: string; 
      eventType: "check_in" | "check_out"; 
      livenessData: any;
      latitude?: number;
      longitude?: number;
      locationAccuracy?: number;
      isMobileDevice?: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/biometric/verify", {
        ...data,
        deviceInfo: navigator.userAgent,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const branchMessage = data.branchName 
          ? (isRTL ? ` في ${data.branchName}` : ` at ${data.branchName}`)
          : "";
        toast({ 
          title: t("success"), 
          description: (isRTL ? "تم التحقق بنجاح" : "Verification successful") + branchMessage
        });
        queryClient.invalidateQueries({ queryKey: ["/api/biometric/today", selectedEmployeeId] });
        queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      } else {
        toast({ 
          title: t("error"), 
          description: isRTL ? (data.messageAr || "فشل التحقق من الهوية") : (data.message || "Identity verification failed"),
          variant: "destructive"
        });
      }
      setShowCapture(false);
      setCaptureMode(null);
    },
    onError: (error: any) => {
      const errorData = error?.response?.data;
      toast({ 
        title: t("error"), 
        description: isRTL ? (errorData?.messageAr || "فشل التحقق من الهوية") : (errorData?.message || "Verification failed"),
        variant: "destructive"
      });
      setShowCapture(false);
      setCaptureMode(null);
    },
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const hasCheckedIn = todayEvents.some(e => e.eventType === "check_in" && e.verified);
  const hasCheckedOut = todayEvents.some(e => e.eventType === "check_out" && e.verified);
  const isEnrolled = enrollment && (enrollment as any).enrolled;

  const requiresLocation = employeeBranches.length > 0 && assignedBranch && assignedBranch.latitude && assignedBranch.longitude;
  const canAttemptCheckIn = isEnrolled && (!requiresLocation || (currentLocation && !locationError));

  const handleStartCapture = (mode: "check_in" | "check_out") => {
    if (!isEnrolled) {
      toast({
        title: t("error"),
        description: isRTL ? "الموظف غير مسجل في نظام بصمة الوجه. يرجى التسجيل أولاً." : "Employee not enrolled in face recognition. Please enroll first.",
        variant: "destructive",
      });
      return;
    }

    if (requiresLocation && !currentLocation) {
      toast({
        title: t("error"),
        description: isRTL ? "يرجى تحديد موقعك أولاً" : "Please allow location access first",
        variant: "destructive",
      });
      getCurrentLocation();
      return;
    }

    setCaptureMode(mode);
    setShowCapture(true);
  };

  const handleCapture = (imageData: string, livenessData: any) => {
    if (!selectedEmployeeId || !captureMode) return;

    verifyMutation.mutate({
      employeeId: selectedEmployeeId,
      faceData: imageData,
      eventType: captureMode,
      livenessData,
      latitude: currentLocation?.latitude,
      longitude: currentLocation?.longitude,
      locationAccuracy: currentLocation?.accuracy,
      isMobileDevice,
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

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
          <ScanFace className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isRTL ? "الحضور ببصمة الوجه" : "Face Attendance"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? "تسجيل الحضور والانصراف باستخدام التعرف على الوجه" : "Check in and out using face recognition"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            {isRTL ? "اختر الموظف" : "Select Employee"}
          </CardTitle>
          <CardDescription>
            {isRTL ? "اختر الموظف لتسجيل الحضور" : "Choose an employee to record attendance"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-full" data-testid="select-employee">
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
              </div>
            </CardContent>
          </Card>

          {assignedBranch && (
            <Card className={locationError ? "border-red-500/30 bg-red-500/5" : currentLocation ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-md ${locationError ? "bg-red-500/10" : currentLocation ? "bg-green-500/10" : "bg-amber-500/10"}`}>
                      {isLoadingLocation ? (
                        <Navigation className="h-5 w-5 text-primary animate-pulse" />
                      ) : locationError ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : currentLocation ? (
                        <MapPin className="h-5 w-5 text-green-600" />
                      ) : (
                        <MapPin className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {isRTL ? assignedBranch.nameAr : assignedBranch.name}
                        </span>
                        {isMobileDevice && (
                          <Badge variant="outline" className="text-xs">
                            <Smartphone className="h-3 w-3 me-1" />
                            {isRTL ? "جوال" : "Mobile"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {locationError ? (
                          <span className="text-red-500">{locationError}</span>
                        ) : currentLocation ? (
                          <span className="text-green-600">
                            {isRTL ? "تم تحديد الموقع" : "Location captured"} 
                            {` (±${Math.round(currentLocation.accuracy)}m)`}
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            {isRTL ? "يتطلب تحديد الموقع للحضور" : "Location required for attendance"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    data-testid="button-refresh-location"
                  >
                    <Navigation className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"} ${isLoadingLocation ? "animate-spin" : ""}`} />
                    {isRTL ? "تحديث" : "Refresh"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Card className={hasCheckedIn ? "border-green-500/30 bg-green-500/5" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-md ${hasCheckedIn ? "bg-green-500/10" : "bg-primary/10"}`}>
                    <LogIn className={`h-5 w-5 ${hasCheckedIn ? "text-green-600" : "text-primary"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{isRTL ? "تسجيل الحضور" : "Check In"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "بداية يوم العمل" : "Start your workday"}
                    </p>
                  </div>
                </div>
                
                {hasCheckedIn ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {isRTL ? "تم تسجيل الحضور" : "Checked in"}
                    </span>
                    <span className="text-sm text-muted-foreground ms-auto">
                      {todayEvents.find(e => e.eventType === "check_in")?.timestamp?.split("T")[1]?.slice(0, 5)}
                    </span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleStartCapture("check_in")} 
                    className="w-full"
                    disabled={!isEnrolled || verifyMutation.isPending}
                    data-testid="button-check-in"
                  >
                    <ScanFace className="h-4 w-4 me-2" />
                    {isRTL ? "تسجيل الحضور" : "Check In"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className={hasCheckedOut ? "border-blue-500/30 bg-blue-500/5" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-md ${hasCheckedOut ? "bg-blue-500/10" : "bg-primary/10"}`}>
                    <LogOut className={`h-5 w-5 ${hasCheckedOut ? "text-blue-600" : "text-primary"}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{isRTL ? "تسجيل الانصراف" : "Check Out"}</h4>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? "نهاية يوم العمل" : "End your workday"}
                    </p>
                  </div>
                </div>
                
                {hasCheckedOut ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      {isRTL ? "تم تسجيل الانصراف" : "Checked out"}
                    </span>
                    <span className="text-sm text-muted-foreground ms-auto">
                      {todayEvents.find(e => e.eventType === "check_out")?.timestamp?.split("T")[1]?.slice(0, 5)}
                    </span>
                  </div>
                ) : (
                  <Button 
                    onClick={() => handleStartCapture("check_out")} 
                    className="w-full"
                    variant="outline"
                    disabled={!isEnrolled || !hasCheckedIn || verifyMutation.isPending}
                    data-testid="button-check-out"
                  >
                    <ScanFace className="h-4 w-4 me-2" />
                    {isRTL ? "تسجيل الانصراف" : "Check Out"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {showCapture && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {captureMode === "check_in" 
                    ? (isRTL ? "التحقق من الهوية للحضور" : "Identity Verification - Check In")
                    : (isRTL ? "التحقق من الهوية للانصراف" : "Identity Verification - Check Out")
                  }
                </CardTitle>
                <CardDescription>
                  {isRTL 
                    ? "انظر مباشرة إلى الكاميرا واتبع التعليمات"
                    : "Look directly at the camera and follow the instructions"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FaceCapture
                  mode="verification"
                  onCapture={handleCapture}
                  onCancel={() => {
                    setShowCapture(false);
                    setCaptureMode(null);
                  }}
                  isProcessing={verifyMutation.isPending}
                />
              </CardContent>
            </Card>
          )}

          {todayEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {isRTL ? "سجل اليوم" : "Today's Activity"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-3 p-3 rounded-md bg-muted/50"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-md ${
                        event.verified 
                          ? "bg-green-500/10" 
                          : "bg-red-500/10"
                      }`}>
                        {event.eventType === "check_in" 
                          ? <LogIn className={`h-4 w-4 ${event.verified ? "text-green-600" : "text-red-600"}`} />
                          : <LogOut className={`h-4 w-4 ${event.verified ? "text-green-600" : "text-red-600"}`} />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {event.eventType === "check_in" 
                            ? (isRTL ? "تسجيل حضور" : "Check In")
                            : (isRTL ? "تسجيل انصراف" : "Check Out")
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString(isRTL ? "ar-SA" : "en-US")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.verified ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle className="h-3 w-3 me-1" />
                            {isRTL ? "موثق" : "Verified"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <XCircle className="h-3 w-3 me-1" />
                            {isRTL ? "فشل" : "Failed"}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {event.livenessVerdict}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
