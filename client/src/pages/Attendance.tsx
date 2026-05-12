import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, Clock, UserCheck, UserX, AlertCircle } from "lucide-react";
import type { Attendance, Employee } from "@shared/schema";

export default function AttendancePage() {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");

  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  const enrichedRecords = attendanceRecords.map((record) => {
    const emp = getEmployee(record.employeeId);
    return {
      ...record,
      employeeName: emp?.fullName || "Unknown",
      employeeNameAr: emp?.fullNameAr,
      department: emp?.position || "",
    };
  });

  const filteredRecords = enrichedRecords.filter((record) =>
    record.employeeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    present: attendanceRecords.filter((a) => a.status === "present").length,
    late: attendanceRecords.filter((a) => a.status === "late").length,
    absent: attendanceRecords.filter((a) => a.status === "absent").length,
    onLeave: attendanceRecords.filter((a) => a.status === "leave").length,
  };

  const columns: Column<typeof enrichedRecords[0]>[] = [
    {
      key: "employeeName",
      header: t("name"),
      render: (record) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {record.employeeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {isRTL && record.employeeNameAr ? record.employeeNameAr : record.employeeName}
            </span>
            <span className="text-xs text-muted-foreground">{record.department}</span>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (record) => (
        <span className="text-sm">
          {new Date(record.date).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "checkIn",
      header: "Check In",
      render: (record) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{record.checkIn || "—"}</span>
        </div>
      ),
    },
    {
      key: "checkOut",
      header: "Check Out",
      render: (record) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{record.checkOut || "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (record) => <StatusBadge status={record.status as any} size="sm" />,
    },
  ];

  if (attendanceLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("attendance")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and manage employee attendance
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.present}</p>
                <p className="text-xs text-muted-foreground">{t("present")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.late}</p>
                <p className="text-xs text-muted-foreground">{t("late")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500/10">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">{t("absent")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-purple-500/10">
                <CalendarCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.onLeave}</p>
                <p className="text-xs text-muted-foreground">{t("onLeave")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title={`Today's ${t("attendance")}`}
        columns={columns}
        data={filteredRecords}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search employees..."
        emptyMessage="No attendance records found"
        emptyIcon={CalendarCheck}
      />
    </div>
  );
}
