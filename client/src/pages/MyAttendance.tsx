import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Employee, Attendance } from "@shared/schema";

export default function MyAttendance() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

  // Use secure /api/me/* endpoints that return only user's own data
  const { data: myEmployee } = useQuery<Employee>({
    queryKey: ["/api/me", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
  });

  const { data: myAttendance = [], isLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/me", "attendance"],
    queryFn: async () => {
      const res = await fetch("/api/me/attendance");
      if (!res.ok) return [];
      const data = await res.json();
      return data.sort((a: Attendance, b: Attendance) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },
  });

  const presentDays = myAttendance.filter(a => a.status === "present").length;
  const lateDays = myAttendance.filter(a => a.status === "late").length;
  const absentDays = myAttendance.filter(a => a.status === "absent").length;
  const leaveDays = myAttendance.filter(a => a.status === "leave").length;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: typeof CheckCircle; label: string; labelAr: string }> = {
      present: { color: "bg-green-500/10 text-green-600", icon: CheckCircle, label: "Present", labelAr: "حاضر" },
      late: { color: "bg-amber-500/10 text-amber-600", icon: Clock, label: "Late", labelAr: "متأخر" },
      absent: { color: "bg-red-500/10 text-red-600", icon: XCircle, label: "Absent", labelAr: "غائب" },
      leave: { color: "bg-blue-500/10 text-blue-600", icon: CalendarCheck, label: "Leave", labelAr: "إجازة" },
    };
    const s = config[status] || config.absent;
    const Icon = s.icon;
    return (
      <Badge className={s.color}>
        <Icon className="h-3 w-3 me-1" />
        {isRTL ? s.labelAr : s.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!myEmployee) {
    return (
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? "لم يتم ربط حسابك بملف موظف بعد" : "Your account is not linked to an employee profile yet"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">
          {isRTL ? "سجل حضوري" : "My Attendance"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL ? "متابعة سجل الحضور والانصراف" : "Track your attendance history"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{presentDays}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "أيام الحضور" : "Present Days"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{lateDays}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "أيام التأخير" : "Late Days"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{absentDays}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "أيام الغياب" : "Absent Days"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md bg-blue-500/10">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{leaveDays}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "أيام الإجازة" : "Leave Days"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "سجل الحضور" : "Attendance History"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                  <TableHead>{isRTL ? "وقت الدخول" : "Check In"}</TableHead>
                  <TableHead>{isRTL ? "وقت الخروج" : "Check Out"}</TableHead>
                  <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isRTL ? "ملاحظات" : "Notes"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <CalendarCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {isRTL ? "لا توجد سجلات حضور" : "No attendance records found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  myAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{record.checkIn || "-"}</TableCell>
                      <TableCell>{record.checkOut || "-"}</TableCell>
                      <TableCell>{getStatusBadge(record.status || "absent")}</TableCell>
                      <TableCell className="text-muted-foreground">{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
