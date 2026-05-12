import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { getTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users,
  UserCheck,
  FileText,
  Car,
  CarFront,
  CalendarCheck,
  TrendingUp,
  UserCircle,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { DashboardStats, Request } from "@shared/schema";

export default function Dashboard() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const recentRequests = requests?.slice(0, 4) || [];

  const requestTypeLabels: Record<string, string> = {
    leave: t("leave"),
    maintenance: t("maintenance"),
    transfer: t("transfer"),
    certificate: t("certificate"),
    expense: t("expense"),
    other: t("other"),
  };

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("dashboard")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("welcomeBack")}, {isRTL && user?.fullNameAr ? user.fullNameAr : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/requests" data-testid="link-view-requests">
              <FileText className="h-4 w-4 me-2" />
              {t("viewAll")} {t("requests")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("totalEmployees")}
          value={stats?.totalEmployees || 0}
          icon={Users}
          variant="primary"
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title={t("pendingRequests")}
          value={stats?.pendingRequests || 0}
          icon={FileText}
          variant="warning"
        />
        <StatsCard
          title={t("todayAttendance")}
          value={`${stats?.attendanceRate || 0}%`}
          icon={CalendarCheck}
          variant="success"
          trend={{ value: 2.1, isPositive: true }}
        />
        <StatsCard
          title={t("availableVehicles")}
          value={`${stats?.availableVehicles || 0}/${stats?.totalVehicles || 0}`}
          icon={Car}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("recentRequests")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/requests" data-testid="link-all-requests">
                {t("viewAll")}
                <ArrowRight className="h-4 w-4 ms-2 rtl:rotate-180" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{t("noData")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-4 p-3 rounded-md bg-muted/30 hover-elevate transition-colors"
                    data-testid={`card-request-${request.id}`}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {request.title.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">
                          {isRTL && request.titleAr ? request.titleAr : request.title}
                        </p>
                        <StatusBadge status={request.status as any} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {requestTypeLabels[request.type]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              {t("quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                asChild
              >
                <Link href="/employees" data-testid="link-new-employee">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 me-3">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("newEmployee")}</span>
                    <span className="text-xs text-muted-foreground">
                      Add employee record
                    </span>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                asChild
              >
                <Link href="/requests" data-testid="link-new-request">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-amber-500/10 me-3">
                    <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("newRequest")}</span>
                    <span className="text-xs text-muted-foreground">
                      Submit a new request
                    </span>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                asChild
              >
                <Link href="/fleet" data-testid="link-new-vehicle">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-green-500/10 me-3">
                    <Car className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("newVehicle")}</span>
                    <span className="text-xs text-muted-foreground">
                      Register a vehicle
                    </span>
                  </div>
                </Link>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-3"
                asChild
              >
                <Link href="/attendance" data-testid="link-attendance">
                  <div className="flex items-center justify-center w-9 h-9 rounded-md bg-blue-500/10 me-3">
                    <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{t("attendance")}</span>
                    <span className="text-xs text-muted-foreground">
                      Record attendance
                    </span>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("activeEmployees")}
          value={stats?.activeEmployees || 0}
          icon={UserCheck}
          variant="success"
        />
        <StatsCard
          title={t("activeDrivers")}
          value={stats?.activeDrivers || 0}
          icon={UserCircle}
          variant="primary"
        />
        <StatsCard
          title={t("totalVehicles")}
          value={stats?.totalVehicles || 0}
          icon={CarFront}
          variant="default"
        />
        <StatsCard
          title={t("attendanceRate")}
          value={`${stats?.attendanceRate || 0}%`}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 1.5, isPositive: true }}
        />
      </div>
    </div>
  );
}
