import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  User,
  FileText,
  CalendarCheck,
  Clock,
  CreditCard,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { Employee, Request, Attendance } from "@shared/schema";

export default function MyDashboard() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

  // Use secure /api/me/* endpoints that return only user's own data
  const { data: myEmployee, isLoading: profileLoading } = useQuery<Employee>({
    queryKey: ["/api/me", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
  });

  const { data: myRequests = [] } = useQuery<Request[]>({
    queryKey: ["/api/me", "requests"],
    queryFn: async () => {
      const res = await fetch("/api/me/requests");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: myAttendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/me", "attendance"],
    queryFn: async () => {
      const res = await fetch("/api/me/attendance");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const pendingRequests = myRequests.filter(r => r.status === "pending").length;
  const approvedRequests = myRequests.filter(r => r.status === "approved").length;
  const todayAttendance = myAttendance.find(a => a.date === new Date().toISOString().split("T")[0]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string; labelAr: string }> = {
      pending: { color: "bg-amber-500/10 text-amber-600", label: "Pending", labelAr: "قيد الانتظار" },
      approved: { color: "bg-green-500/10 text-green-600", label: "Approved", labelAr: "موافق عليه" },
      rejected: { color: "bg-red-500/10 text-red-600", label: "Rejected", labelAr: "مرفوض" },
      in_progress: { color: "bg-blue-500/10 text-blue-600", label: "In Progress", labelAr: "قيد التنفيذ" },
    };
    const s = config[status] || config.pending;
    return <Badge className={s.color}>{isRTL ? s.labelAr : s.label}</Badge>;
  };

  if (!myEmployee) {
    return (
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? "لم يتم ربط حسابك بملف موظف بعد" : "Your account is not linked to an employee profile yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isRTL ? "يرجى التواصل مع الموارد البشرية" : "Please contact HR department"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isRTL ? "مرحباً" : "Welcome"}, {isRTL && myEmployee.fullNameAr ? myEmployee.fullNameAr : myEmployee.fullName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRTL && myEmployee.positionAr ? myEmployee.positionAr : myEmployee.position}
          </p>
        </div>
        <Button asChild>
          <Link href="/my-requests">
            <Plus className="h-4 w-4 me-2" />
            {isRTL ? "طلب جديد" : "New Request"}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myRequests.length}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي طلباتي" : "My Requests"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequests}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? "قيد الانتظار" : "Pending"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedRequests}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? "موافق عليها" : "Approved"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-500/10">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myAttendance.length}</p>
                <p className="text-xs text-muted-foreground">{isRTL ? "أيام الحضور" : "Attendance Days"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-semibold">
              {isRTL ? "آخر طلباتي" : "My Recent Requests"}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/my-requests">
                {isRTL ? "عرض الكل" : "View All"}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{isRTL ? "لا توجد طلبات" : "No requests yet"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isRTL && request.titleAr ? request.titleAr : request.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                    {getStatusBadge(request.status || "pending")}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {isRTL ? "إجراءات سريعة" : "Quick Actions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/my-requests">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 me-3">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{isRTL ? "تقديم طلب" : "Submit Request"}</span>
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "إجازة، شهادة، نقل..." : "Leave, certificate, transfer..."}
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/face-attendance">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-green-500/10 me-3">
                    <CalendarCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{isRTL ? "تسجيل الحضور" : "Check In/Out"}</span>
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "بصمة الوجه" : "Face attendance"}
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/my-card">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-500/10 me-3">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{isRTL ? "بطاقتي الوظيفية" : "My ID Card"}</span>
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "عرض ومشاركة" : "View and share"}
                    </span>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start h-auto py-3" asChild>
                <Link href="/my-profile">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-purple-500/10 me-3">
                    <User className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{isRTL ? "ملفي الشخصي" : "My Profile"}</span>
                    <span className="text-xs text-muted-foreground">
                      {isRTL ? "عرض بياناتي" : "View my information"}
                    </span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {todayAttendance && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {isRTL ? "حضور اليوم" : "Today's Attendance"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm">{isRTL ? "وقت الدخول:" : "Check-in:"}</span>
                <span className="font-medium">{todayAttendance.checkIn || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm">{isRTL ? "وقت الخروج:" : "Check-out:"}</span>
                <span className="font-medium">{todayAttendance.checkOut || "-"}</span>
              </div>
              <Badge className={
                todayAttendance.status === "present" ? "bg-green-500/10 text-green-600" :
                todayAttendance.status === "late" ? "bg-amber-500/10 text-amber-600" :
                "bg-red-500/10 text-red-600"
              }>
                {todayAttendance.status === "present" ? (isRTL ? "حاضر" : "Present") :
                 todayAttendance.status === "late" ? (isRTL ? "متأخر" : "Late") :
                 (isRTL ? "غائب" : "Absent")}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
