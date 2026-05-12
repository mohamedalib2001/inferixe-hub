import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ContractUploadDialog } from "@/components/ContractUploadDialog";
import { AddContractDialog } from "@/components/AddContractDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Building2,
  CalendarCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
  Upload,
  Eye,
  FileSearch,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Contract, ContractStats } from "@shared/schema";

export default function Contracts() {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const { data: stats, isLoading: statsLoading } = useQuery<ContractStats>({
    queryKey: ["/api/contracts/stats"],
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "expired": return "danger";
      case "pending": return "warning";
      case "draft": return "default";
      case "terminated": return "danger";
      default: return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return t("active");
      case "expired": return t("expired");
      case "pending": return t("pending");
      case "draft": return t("draft");
      case "terminated": return t("terminated");
      default: return status;
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case "commercial_lease": return t("commercialLease");
      case "unit_lease": return t("unitLease");
      case "long_term_lease": return t("longTermLease");
      default: return type;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isRTL ? "ar-SA" : "en-GB");
  };

  const occupancyRate = stats ? 
    Math.round((stats.occupiedUnits / (stats.occupiedUnits + stats.availableUnits)) * 100) || 0 
    : 0;

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
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
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            {t("contractsDashboard")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("contractManagement")}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ContractUploadDialog
            trigger={
              <Button variant="outline" size="sm" data-testid="button-upload-contract">
                <Upload className="h-4 w-4 me-2" />
                {t("uploadContract")}
              </Button>
            }
            onAnalysisComplete={(result) => {
              console.log("Contract analysis result:", result);
            }}
          />
          <AddContractDialog
            trigger={
              <Button size="sm" data-testid="button-add-contract">
                <Plus className="h-4 w-4 me-2" />
                {t("addContract")}
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("totalContracts")}
          value={stats?.totalContracts || 0}
          icon={FileText}
          variant="primary"
        />
        <StatsCard
          title={t("activeContracts")}
          value={stats?.activeContracts || 0}
          icon={CheckCircle}
          variant="success"
        />
        <StatsCard
          title={t("expiringThisMonth")}
          value={stats?.expiringThisMonth || 0}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatsCard
          title={t("overduePayments")}
          value={stats?.overduePayments || 0}
          icon={XCircle}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t("totalMonthlyRent")}
          value={formatCurrency(stats?.totalMonthlyRent || 0)}
          icon={DollarSign}
          variant="default"
        />
        <StatsCard
          title={t("totalAnnualRent")}
          value={formatCurrency(stats?.totalAnnualRent || 0)}
          icon={TrendingUp}
          variant="primary"
        />
        <StatsCard
          title={t("totalProperties")}
          value={stats?.totalProperties || 0}
          icon={Building2}
          variant="default"
        />
        <StatsCard
          title={t("pendingPayments")}
          value={stats?.pendingPayments || 0}
          icon={Clock}
          variant="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                {t("contracts")}
              </CardTitle>
              <CardDescription>{t("recentActivity")}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" data-testid="button-view-all-contracts">
              {t("viewAll")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {contractsLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !contracts || contracts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t("noContracts")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("contractNumber")}</TableHead>
                    <TableHead>{t("contractTitle")}</TableHead>
                    <TableHead>{t("contractType")}</TableHead>
                    <TableHead>{t("annualRent")}</TableHead>
                    <TableHead>{t("endDate")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.slice(0, 5).map((contract) => (
                    <TableRow key={contract.id} data-testid={`row-contract-${contract.id}`}>
                      <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                      <TableCell>{contract.title || "-"}</TableCell>
                      <TableCell>{getContractTypeLabel(contract.type)}</TableCell>
                      <TableCell>{formatCurrency(contract.annualRent)}</TableCell>
                      <TableCell>{formatDate(contract.endDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={contract.status as any} />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          data-testid={`button-view-contract-${contract.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {t("propertyUnits")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("occupiedUnits")}</span>
                <span className="font-semibold">{stats?.occupiedUnits || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("availableUnits")}</span>
                <span className="font-semibold">{stats?.availableUnits || 0}</span>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {isRTL ? "نسبة الإشغال" : "Occupancy Rate"}
                  </span>
                  <span className="text-xs font-medium">{occupancyRate}%</span>
                </div>
                <Progress value={occupancyRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                {t("documentAnalysis")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL 
                  ? "قم برفع عقد لتحليله واستخراج البيانات تلقائياً"
                  : "Upload a contract to analyze and extract data automatically"
                }
              </p>
              <ContractUploadDialog
                trigger={
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    data-testid="button-analyze-document"
                  >
                    <Upload className="h-4 w-4 me-2" />
                    {t("uploadContract")}
                  </Button>
                }
                onAnalysisComplete={(result) => {
                  console.log("Contract analysis result:", result);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                {t("paymentSchedule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-md bg-amber-500/10">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">{t("pendingPayments")}</span>
                </div>
                <span className="font-semibold text-amber-600">{stats?.pendingPayments || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{t("overduePayments")}</span>
                </div>
                <span className="font-semibold text-destructive">{stats?.overduePayments || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
