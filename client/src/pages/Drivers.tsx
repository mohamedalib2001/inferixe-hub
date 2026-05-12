import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { DriverDialog } from "@/components/DriverDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, UserCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import type { Driver, Employee } from "@shared/schema";

export default function Drivers() {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "create">("view");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleView = (driver: Driver) => {
    setSelectedDriver(driver);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const getEmployee = (empId: string) => employees.find((e) => e.id === empId);

  const enrichedDrivers = drivers.map((driver) => {
    const emp = getEmployee(driver.employeeId);
    return {
      ...driver,
      employeeName: emp?.fullName || "Unknown",
      employeeNameAr: emp?.fullNameAr,
    };
  });

  const filteredDrivers = enrichedDrivers.filter(
    (d) =>
      d.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    active: drivers.filter((d) => d.status === "active").length,
    suspended: drivers.filter((d) => d.status === "suspended").length,
    inactive: drivers.filter((d) => d.status === "inactive").length,
    totalViolations: drivers.reduce((sum, d) => sum + (d.violations || 0), 0),
  };

  const columns: Column<typeof enrichedDrivers[0]>[] = [
    {
      key: "employeeName",
      header: t("name"),
      render: (driver) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {driver.employeeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {isRTL && driver.employeeNameAr ? driver.employeeNameAr : driver.employeeName}
            </span>
            <span className="text-xs text-muted-foreground">{driver.licenseType}</span>
          </div>
        </div>
      ),
    },
    {
      key: "licenseNumber",
      header: t("licenseNumber"),
      render: (driver) => (
        <span className="text-sm font-mono">{driver.licenseNumber}</span>
      ),
    },
    {
      key: "licenseExpiry",
      header: t("licenseExpiry"),
      render: (driver) => {
        const expiryDate = driver.licenseExpiry ? new Date(driver.licenseExpiry) : null;
        const isExpiringSoon = expiryDate && expiryDate < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        const isExpired = expiryDate && expiryDate < new Date();
        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                isExpired
                  ? "text-red-600 dark:text-red-400"
                  : isExpiringSoon
                  ? "text-amber-600 dark:text-amber-400"
                  : ""
              }`}
            >
              {expiryDate
                ? expiryDate.toLocaleDateString(isRTL ? "ar-SA" : "en-US")
                : "—"}
            </span>
            {isExpired && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        );
      },
    },
    {
      key: "violations",
      header: t("violations"),
      render: (driver) => (
        <Badge
          variant="outline"
          className={
            (driver.violations || 0) > 0
              ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
              : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
          }
        >
          {driver.violations || 0}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (driver) => <StatusBadge status={driver.status as any} size="sm" />,
    },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      render: (driver) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleView(driver)}
            data-testid={`button-view-${driver.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleEdit(driver)}
            data-testid={`button-edit-${driver.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (driversLoading) {
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("drivers")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage driver records and assignments
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">{t("active")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.suspended}</p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-500/5 border-gray-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-500/10">
                <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">{t("inactive")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalViolations}</p>
                <p className="text-xs text-muted-foreground">{t("violations")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title={`${t("drivers")} (${filteredDrivers.length})`}
        columns={columns}
        data={filteredDrivers}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name or license..."
        emptyMessage="No drivers found"
        emptyIcon={UserCircle}
      />

      <DriverDialog
        driver={selectedDriver}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
