import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Download, Calendar, Users, FileText, ChevronLeft, ChevronRight, Loader2, Check, Clock, AlertCircle, Printer, CheckCircle, Building2, FileSpreadsheet, Upload, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
const MONTH_NAMES_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", 
                        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

interface PayrollRun {
  id: string;
  year: number;
  month: number;
  periodLabel: string;
  periodLabelAr: string;
  totalEmployees: number;
  totalBaseSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  totalNetPay: number;
  status: "draft" | "processing" | "completed" | "cancelled" | "hr_approved" | "finance_approved";
  createdAt: string;
  processedAt: string;
  hrApprovedBy?: string;
  hrApprovedAt?: string;
  financeApprovedBy?: string;
  financeApprovedAt?: string;
}

interface PayrollItem {
  id: string;
  runId: string;
  employeeId: string;
  employeeName: string;
  employeeNameAr: string;
  employeeNumber: string;
  departmentName: string;
  position: string;
  baseSalary: number;
  totalAdditions: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  status: "pending" | "processed" | "paid" | "on_hold";
  bankName?: string;
  accountNumber?: string;
  iban?: string;
}

interface ApprovalSetting {
  id: string;
  role: "operations" | "supervisor" | "hr" | "finance";
  roleName: string;
  roleNameAr: string;
  orderIndex: number;
  isEnabled: boolean;
  allowedUserRoles: string[];
}

interface RunApproval {
  id: string;
  runId: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
}

export default function Payroll() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const isRTL = language === "ar";
  const printRef = useRef<HTMLDivElement>(null);
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalType, setApprovalType] = useState<string>("hr");

  const monthNames = language === "ar" ? MONTH_NAMES_AR : MONTH_NAMES_EN;
  
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const { data: payrollData, isLoading, refetch } = useQuery<{ run: PayrollRun | null; items: PayrollItem[] } | null>({
    queryKey: [`/api/payroll/period?year=${selectedYear}&month=${selectedMonth}`],
  });

  // Fetch approval settings
  const { data: approvalSettings = [] } = useQuery<ApprovalSetting[]>({
    queryKey: ["/api/payroll/approval-settings"],
  });

  const run = payrollData?.run;
  const items = payrollData?.items || [];

  // Fetch run approvals only when we have a run
  const { data: runApprovals = [], refetch: refetchApprovals } = useQuery<RunApproval[]>({
    queryKey: [`/api/payroll/runs/${run?.id}/approvals`],
    enabled: !!run?.id,
  });

  // Get enabled settings in order
  const enabledSettings = approvalSettings
    .filter(s => s.isEnabled)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const runPayrollMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payroll/run", {
        year: selectedYear,
        month: selectedMonth,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "ar" ? "تم تشغيل الرواتب بنجاح" : "Payroll run completed",
        description: language === "ar" 
          ? `تم معالجة الرواتب لشهر ${monthNames[selectedMonth - 1]} ${selectedYear}`
          : `Payroll processed for ${monthNames[selectedMonth - 1]} ${selectedYear}`,
      });
      setShowRunDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/period"] });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل تشغيل الرواتب" : "Payroll run failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approvePayrollMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest("POST", `/api/payroll/runs/${run?.id}/approve`, {
        role,
      });
      return response.json();
    },
    onSuccess: () => {
      const setting = enabledSettings.find(s => s.role === approvalType);
      toast({
        title: language === "ar" 
          ? `تم اعتماد ${setting?.roleNameAr || approvalType}`
          : `${setting?.roleName || approvalType} Approved`,
        description: language === "ar" 
          ? `تم اعتماد رواتب شهر ${monthNames[selectedMonth - 1]} ${selectedYear}`
          : `Payroll for ${monthNames[selectedMonth - 1]} ${selectedYear} has been approved`,
      });
      setShowApproveDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/payroll/period"] });
      queryClient.invalidateQueries({ queryKey: [`/api/payroll/runs/${run?.id}/approvals`] });
      refetch();
      refetchApprovals();
    },
    onError: (error: Error) => {
      toast({
        title: language === "ar" ? "فشل الاعتماد" : "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRunStatus = () => {
    if (!run) return null;
    if (run.status === "finance_approved") {
      return { label: isRTL ? "معتمد للصرف" : "Ready for Payment", color: "bg-green-500", icon: CheckCircle };
    }
    if (run.status === "hr_approved") {
      return { label: isRTL ? "معتمد من الموارد البشرية" : "HR Approved", color: "bg-blue-500", icon: Check };
    }
    if (run.status === "completed") {
      return { label: isRTL ? "بانتظار الاعتماد" : "Pending Approval", color: "bg-amber-500", icon: Clock };
    }
    return { label: isRTL ? "مسودة" : "Draft", color: "bg-gray-500", icon: FileText };
  };

  // Determine which approval stage can be performed by current user
  const getNextApprovalStage = () => {
    if (!run || run.status === "finance_approved") return null;
    if (run.status !== "completed" && !run.status.endsWith("_approved")) return null;

    for (const setting of enabledSettings) {
      // Check if this stage is already approved
      const stageApproval = runApprovals.find(a => a.role === setting.role);
      if (stageApproval?.status === "approved") continue;

      // Check if user can approve this stage
      const allowedRoles = setting.allowedUserRoles || [];
      if (user?.role && allowedRoles.includes(user.role)) {
        return setting;
      }
      
      // If user can't approve this stage but it's not done, stop here
      return null;
    }
    return null;
  };

  const nextApprovalStage = getNextApprovalStage();
  const canDownload = run?.status === "hr_approved" || run?.status === "finance_approved";

  const stats = [
    { 
      label: language === "ar" ? "إجمالي الرواتب" : "Total Payroll", 
      value: run ? formatCurrency(run.totalNetPay) : formatCurrency(0), 
      icon: DollarSign, 
      variant: "primary" 
    },
    { 
      label: language === "ar" ? "الموظفين المدفوع لهم" : "Employees Paid", 
      value: run?.totalEmployees?.toString() || "0", 
      icon: Users, 
      variant: "success" 
    },
    { 
      label: language === "ar" ? "قيد الانتظار" : "Pending", 
      value: items.filter(i => i.status === "pending").length.toString(), 
      icon: FileText, 
      variant: "warning" 
    },
    { 
      label: language === "ar" ? "الشهر" : "Month", 
      value: `${monthNames[selectedMonth - 1]} ${selectedYear}`, 
      icon: Calendar, 
      variant: "default" 
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-500"><Check className="w-3 h-3 me-1" />{language === "ar" ? "مدفوع" : "Paid"}</Badge>;
      case "processed":
        return <Badge variant="secondary"><Clock className="w-3 h-3 me-1" />{language === "ar" ? "تمت المعالجة" : "Processed"}</Badge>;
      case "on_hold":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 me-1" />{language === "ar" ? "معلق" : "On Hold"}</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 me-1" />{language === "ar" ? "قيد الانتظار" : "Pending"}</Badge>;
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = isRTL 
      ? `كشف رواتب ${monthNames[selectedMonth - 1]} ${selectedYear}` 
      : `Payroll Statement ${monthNames[selectedMonth - 1]} ${selectedYear}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${title} - Inferixe</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; background: white; direction: ${isRTL ? 'rtl' : 'ltr'}; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; }
          .company-info { display: flex; align-items: center; gap: 15px; }
          .company-logo { width: 50px; height: 50px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
          .company-name { font-size: 18pt; font-weight: bold; color: #1e40af; }
          .company-subtitle { font-size: 9pt; color: #666; }
          .report-meta { text-align: ${isRTL ? 'left' : 'right'}; }
          .report-title { font-size: 14pt; font-weight: bold; color: #1e40af; }
          .report-date { font-size: 9pt; color: #666; }
          .summary { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 16px; }
          .summary-value { font-size: 16pt; font-weight: bold; color: #1e40af; }
          .summary-label { font-size: 8pt; color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          th { background: #1e40af; color: white; padding: 8px 10px; text-align: ${isRTL ? 'right' : 'left'}; font-weight: 600; }
          td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: ${isRTL ? 'right' : 'left'}; }
          tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: ${isRTL ? 'left' : 'right'}; }
          .text-green { color: #16a34a; }
          .text-red { color: #dc2626; }
          .font-bold { font-weight: bold; }
          .totals { margin-top: 20px; padding-top: 15px; border-top: 2px solid #1e40af; display: flex; justify-content: flex-end; gap: 30px; }
          .total-item { text-align: ${isRTL ? 'left' : 'right'}; }
          .total-label { font-size: 9pt; color: #666; }
          .total-value { font-size: 14pt; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8pt; color: #666; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8pt; font-weight: 500; }
          .status-approved { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #92400e; }
          @media print { body { padding: 0; } @page { size: A4 landscape; margin: 10mm; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleExportExcel = () => {
    if (!run || !items.length) return;

    const data = items.map((item, index) => ({
      [language === "ar" ? "م" : "#"]: index + 1,
      [language === "ar" ? "رقم الموظف" : "Employee ID"]: item.employeeNumber,
      [language === "ar" ? "اسم الموظف" : "Employee Name"]: language === "ar" ? item.employeeNameAr : item.employeeName,
      [language === "ar" ? "القسم" : "Department"]: item.departmentName || "-",
      [language === "ar" ? "المنصب" : "Position"]: item.position || "-",
      [language === "ar" ? "الراتب الأساسي" : "Base Salary"]: item.baseSalary,
      [language === "ar" ? "الإضافات" : "Additions"]: item.totalAdditions,
      [language === "ar" ? "الخصومات" : "Deductions"]: item.totalDeductions,
      [language === "ar" ? "إجمالي الراتب" : "Gross Pay"]: item.grossPay,
      [language === "ar" ? "صافي الراتب" : "Net Pay"]: item.netPay,
      [language === "ar" ? "البنك" : "Bank"]: item.bankName || "-",
      [language === "ar" ? "رقم الحساب" : "Account Number"]: item.accountNumber || "-",
      [language === "ar" ? "IBAN" : "IBAN"]: item.iban || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    
    ws["!cols"] = [
      { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 28 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, language === "ar" ? "كشف الرواتب" : "Payroll");
    
    const summaryData = [
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "الفترة" : "Period", [language === "ar" ? "القيمة" : "Value"]: `${monthNames[selectedMonth - 1]} ${selectedYear}` },
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "عدد الموظفين" : "Total Employees", [language === "ar" ? "القيمة" : "Value"]: run.totalEmployees },
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "إجمالي الرواتب الأساسية" : "Total Base Salary", [language === "ar" ? "القيمة" : "Value"]: run.totalBaseSalary },
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "إجمالي الإضافات" : "Total Additions", [language === "ar" ? "القيمة" : "Value"]: run.totalAdditions },
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "إجمالي الخصومات" : "Total Deductions", [language === "ar" ? "القيمة" : "Value"]: run.totalDeductions },
      { [language === "ar" ? "البيان" : "Description"]: language === "ar" ? "صافي الرواتب" : "Net Pay", [language === "ar" ? "القيمة" : "Value"]: run.totalNetPay },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, language === "ar" ? "الملخص" : "Summary");
    
    XLSX.writeFile(wb, `payroll_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);

    toast({
      title: language === "ar" ? "تم تصدير الملف" : "File Exported",
      description: language === "ar" 
        ? "تم تصدير ملف Excel بنجاح" 
        : "Excel file exported successfully",
    });
  };

  const handleExportBankCSV = async () => {
    if (!run) return;

    try {
      const response = await fetch(`/api/payroll/runs/${run.id}/export-bank`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        // Handle validation errors with details
        if (error.details && Array.isArray(error.details)) {
          const detailsList = error.details.slice(0, 5).join("\n");
          const moreText = error.totalErrors > 5 
            ? `\n... and ${error.totalErrors - 5} more` 
            : "";
          throw new Error(`${error.message}:\n${detailsList}${moreText}`);
        }
        throw new Error(error.message || "Export failed");
      }
      
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `bank_transfer_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);

      toast({
        title: language === "ar" ? "تم تصدير الملف" : "File Exported",
        description: language === "ar" 
          ? "تم تصدير ملف البنك CSV بنجاح" 
          : "Bank CSV file exported successfully",
      });
    } catch (error: any) {
      toast({
        title: language === "ar" ? "خطأ في التصدير" : "Export Error",
        description: error.message || "Failed to export bank file",
        variant: "destructive",
      });
    }
  };

  const handleExportBankExcel = () => {
    if (!run || !items.length) return;

    const data = items.map((item, index) => ({
      [language === "ar" ? "م" : "#"]: index + 1,
      [language === "ar" ? "رقم الموظف" : "Employee ID"]: item.employeeNumber,
      [language === "ar" ? "اسم الموظف" : "Employee Name"]: language === "ar" ? item.employeeNameAr : item.employeeName,
      [language === "ar" ? "البنك" : "Bank"]: item.bankName || "-",
      [language === "ar" ? "رقم الحساب" : "Account"]: item.accountNumber || "-",
      [language === "ar" ? "IBAN" : "IBAN"]: item.iban || "-",
      [language === "ar" ? "صافي الراتب" : "Net Pay"]: item.netPay,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    
    ws["!cols"] = [
      { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, language === "ar" ? "تحويل البنك" : "Bank Transfer");
    
    XLSX.writeFile(wb, `bank_transfer_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);

    toast({
      title: language === "ar" ? "تم تصدير الملف" : "File Exported",
      description: language === "ar" 
        ? "تم تصدير ملف تحويل البنك بنجاح" 
        : "Bank transfer file exported successfully",
    });
  };

  const handleExportWPS = () => {
    if (!run || !items.length) return;

    const paymentDate = `${selectedYear}${String(selectedMonth).padStart(2, '0')}28`;
    const totalAmount = items.reduce((sum, item) => sum + item.netPay, 0);
    
    const headerRow = {
      "Seq": "H",
      "Employer ID": "EMPLOYER001",
      "Employer Name": "Inferixe",
      "Total Records": items.length.toString(),
      "Total Amount": totalAmount.toFixed(2),
      "Payment Date": paymentDate,
      "Currency": "SAR",
      "File Reference": `WPS-${selectedYear}${String(selectedMonth).padStart(2, '0')}`,
    };

    const detailRows = items.map((item, index) => ({
      "Seq": String(index + 1).padStart(6, '0'),
      "Employee ID": item.employeeNumber,
      "Employee Name": item.employeeName,
      "ID Number": "",
      "Bank Short Name": item.bankName?.substring(0, 4)?.toUpperCase() || "BANK",
      "IBAN": item.iban || "",
      "Account Number": item.accountNumber || "",
      "Salary Amount": item.baseSalary.toFixed(2),
      "Housing Allowance": "0.00",
      "Other Allowances": item.totalAdditions.toFixed(2),
      "Deductions": item.totalDeductions.toFixed(2),
      "Net Pay": item.netPay.toFixed(2),
    }));

    const trailerRow = {
      "Seq": "T",
      "Employer ID": "EMPLOYER001",
      "Employer Name": "Inferixe",
      "Total Records": items.length.toString(),
      "Total Amount": totalAmount.toFixed(2),
      "Payment Date": paymentDate,
      "Currency": "SAR",
      "File Reference": `WPS-${selectedYear}${String(selectedMonth).padStart(2, '0')}`,
    };

    const ws = XLSX.utils.json_to_sheet([headerRow]);
    XLSX.utils.sheet_add_json(ws, detailRows, { origin: -1, skipHeader: true });
    XLSX.utils.sheet_add_json(ws, [trailerRow], { origin: -1, skipHeader: true });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "WPS");
    
    XLSX.writeFile(wb, `wps_payroll_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);

    toast({
      title: language === "ar" ? "تم تصدير الملف" : "File Exported",
      description: language === "ar" 
        ? "تم تصدير ملف WPS بنجاح (قد يحتاج تخصيص للبنك)" 
        : "WPS file exported (may need bank customization)",
    });
  };

  const handleApproveNew = (role: string) => {
    setApprovalType(role);
    setShowApproveDialog(true);
  };

  const runStatus = getRunStatus();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("payroll")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === "ar" ? "إدارة رواتب الموظفين ومعالجة كشوف المرتبات" : "Manage employee salaries and payroll processing"}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {run && (
            <>
              <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-payroll">
                <Printer className="h-4 w-4 me-2" />
                {language === "ar" ? "طباعة" : "Print"}
              </Button>
              
              {canDownload && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-export-dropdown">
                      <FileDown className="h-4 w-4 me-2" />
                      {language === "ar" ? "تنزيل" : "Download"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {language === "ar" ? "تصدير كشف الرواتب" : "Export Payroll"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportExcel} data-testid="button-export-excel">
                      <FileSpreadsheet className="h-4 w-4 me-2" />
                      {language === "ar" ? "ملف Excel (كامل)" : "Excel File (Full)"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>
                      {language === "ar" ? "ملفات البنك" : "Bank Files"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleExportBankExcel} data-testid="button-export-bank-excel">
                      <FileSpreadsheet className="h-4 w-4 me-2" />
                      {language === "ar" ? "تحويل بنكي (Excel)" : "Bank Transfer (Excel)"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportBankCSV} data-testid="button-export-bank-csv">
                      <FileText className="h-4 w-4 me-2" />
                      {language === "ar" ? "تحويل بنكي (CSV)" : "Bank Transfer (CSV)"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportWPS} data-testid="button-export-wps">
                      <Building2 className="h-4 w-4 me-2" />
                      {language === "ar" ? "نظام حماية الأجور (WPS)" : "WPS Format"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {nextApprovalStage && (
                <Button 
                  variant="default" 
                  size="sm" 
                  className={nextApprovalStage.role === "finance" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => handleApproveNew(nextApprovalStage.role)} 
                  data-testid={`button-${nextApprovalStage.role}-approve`}
                >
                  {nextApprovalStage.role === "finance" ? <CheckCircle className="h-4 w-4 me-2" /> : <Check className="h-4 w-4 me-2" />}
                  {language === "ar" ? `اعتماد ${nextApprovalStage.roleNameAr}` : `${nextApprovalStage.roleName} Approve`}
                </Button>
              )}
            </>
          )}
          
          <Dialog open={showRunDialog} onOpenChange={setShowRunDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-run-payroll" disabled={!!run}>
                <DollarSign className="h-4 w-4 me-2" />
                {language === "ar" ? "تشغيل الرواتب" : "Run Payroll"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "ar" ? "تشغيل الرواتب" : "Run Payroll"}</DialogTitle>
                <DialogDescription>
                  {language === "ar" 
                    ? `سيتم معالجة الرواتب لشهر ${monthNames[selectedMonth - 1]} ${selectedYear}. هل أنت متأكد؟`
                    : `This will process payroll for ${monthNames[selectedMonth - 1]} ${selectedYear}. Are you sure?`}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRunDialog(false)}>
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </Button>
                <Button 
                  onClick={() => runPayrollMutation.mutate()} 
                  disabled={runPayrollMutation.isPending}
                  data-testid="button-confirm-run-payroll"
                >
                  {runPayrollMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {language === "ar" ? "تأكيد" : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {(() => {
                const setting = enabledSettings.find(s => s.role === approvalType);
                return language === "ar" 
                  ? `اعتماد ${setting?.roleNameAr || approvalType}` 
                  : `${setting?.roleName || approvalType} Approval`;
              })()}
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const setting = enabledSettings.find(s => s.role === approvalType);
                const roleName = language === "ar" ? setting?.roleNameAr : setting?.roleName;
                return language === "ar" 
                  ? `سيتم اعتماد رواتب شهر ${monthNames[selectedMonth - 1]} ${selectedYear} من ${roleName || approvalType}.`
                  : `Payroll for ${monthNames[selectedMonth - 1]} ${selectedYear} will be approved by ${roleName || approvalType}.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => approvePayrollMutation.mutate(approvalType)} 
              disabled={approvePayrollMutation.isPending}
              className={approvalType === "finance" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {approvePayrollMutation.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {language === "ar" ? "تأكيد الاعتماد" : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-center gap-4 bg-muted/50 rounded-lg p-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousMonth}
          data-testid="button-previous-month"
        >
          {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        
        <div className="flex items-center gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToNextMonth}
          data-testid="button-next-month"
        >
          {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={
              stat.variant === "primary"
                ? "bg-primary/5 border-primary/20"
                : stat.variant === "success"
                ? "bg-green-500/5 border-green-500/20"
                : stat.variant === "warning"
                ? "bg-amber-500/5 border-amber-500/20"
                : ""
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-md ${
                    stat.variant === "primary"
                      ? "bg-primary/10"
                      : stat.variant === "success"
                      ? "bg-green-500/10"
                      : stat.variant === "warning"
                      ? "bg-amber-500/10"
                      : "bg-muted"
                  }`}
                >
                  <stat.icon
                    className={`h-5 w-5 ${
                      stat.variant === "primary"
                        ? "text-primary"
                        : stat.variant === "success"
                        ? "text-green-600 dark:text-green-400"
                        : stat.variant === "warning"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-lg">
            {language === "ar" ? "تفاصيل الرواتب" : "Payroll Details"}
          </CardTitle>
          {run && runStatus && (
            <Badge className={`${runStatus.color} text-white`}>
              <runStatus.icon className="w-3 h-3 me-1" />
              {runStatus.label}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !run ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                <DollarSign className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">
                {language === "ar" 
                  ? `لا توجد رواتب لشهر ${monthNames[selectedMonth - 1]} ${selectedYear}`
                  : `No payroll for ${monthNames[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {language === "ar"
                  ? "اضغط على زر 'تشغيل الرواتب' لمعالجة رواتب هذا الشهر"
                  : "Click 'Run Payroll' to process payroll for this month"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                    <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الراتب الأساسي" : "Base Salary"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الإضافات" : "Additions"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "الخصومات" : "Deductions"}</TableHead>
                    <TableHead className="text-right">{language === "ar" ? "صافي الراتب" : "Net Pay"}</TableHead>
                    <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} data-testid={`payroll-row-${item.employeeNumber}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {language === "ar" ? item.employeeNameAr || item.employeeName : item.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.employeeNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.departmentName || "-"}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.baseSalary)}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.totalAdditions > 0 ? `+${formatCurrency(item.totalAdditions)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.totalDeductions > 0 ? `-${formatCurrency(item.totalDeductions)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.netPay)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {run && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex flex-wrap justify-end gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الراتب الأساسي" : "Total Base Salary"}</p>
                      <p className="text-lg font-semibold">{formatCurrency(run.totalBaseSalary)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الإضافات" : "Total Additions"}</p>
                      <p className="text-lg font-semibold text-green-600">+{formatCurrency(run.totalAdditions)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الخصومات" : "Total Deductions"}</p>
                      <p className="text-lg font-semibold text-red-600">-{formatCurrency(run.totalDeductions)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{language === "ar" ? "صافي الرواتب" : "Net Payroll"}</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(run.totalNetPay)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={printRef} style={{ display: 'none' }}>
        <div className="header">
          <div className="company-info">
            <div className="company-logo">I</div>
            <div>
              <div className="company-name">Inferixe</div>
              <div className="company-subtitle">{isRTL ? "منصة إدارة المؤسسات" : "Enterprise Management Platform"}</div>
            </div>
          </div>
          <div className="report-meta">
            <div className="report-title">{isRTL ? "كشف الرواتب" : "Payroll Statement"}</div>
            <div className="report-date">{monthNames[selectedMonth - 1]} {selectedYear}</div>
          </div>
        </div>

        <div className="summary">
          <div className="summary-card">
            <div className="summary-value">{run?.totalEmployees || 0}</div>
            <div className="summary-label">{isRTL ? "عدد الموظفين" : "Employees"}</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{formatCurrency(run?.totalNetPay || 0)}</div>
            <div className="summary-label">{isRTL ? "إجمالي الرواتب" : "Total Payroll"}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">{isRTL ? "الحالة" : "Status"}</div>
            <div className={`status-badge ${runStatus?.color.includes('green') ? 'status-approved' : 'status-pending'}`}>
              {runStatus?.label}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{isRTL ? "الموظف" : "Employee"}</th>
              <th>{isRTL ? "رقم الموظف" : "ID"}</th>
              <th>{isRTL ? "القسم" : "Department"}</th>
              <th className="text-right">{isRTL ? "الراتب الأساسي" : "Base Salary"}</th>
              <th className="text-right">{isRTL ? "الإضافات" : "Additions"}</th>
              <th className="text-right">{isRTL ? "الخصومات" : "Deductions"}</th>
              <th className="text-right">{isRTL ? "صافي الراتب" : "Net Pay"}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td className="font-bold">{isRTL ? item.employeeNameAr || item.employeeName : item.employeeName}</td>
                <td>{item.employeeNumber}</td>
                <td>{item.departmentName || "-"}</td>
                <td className="text-right">{formatCurrency(item.baseSalary)}</td>
                <td className="text-right text-green">{item.totalAdditions > 0 ? `+${formatCurrency(item.totalAdditions)}` : "-"}</td>
                <td className="text-right text-red">{item.totalDeductions > 0 ? `-${formatCurrency(item.totalDeductions)}` : "-"}</td>
                <td className="text-right font-bold">{formatCurrency(item.netPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="total-item">
            <div className="total-label">{isRTL ? "إجمالي الراتب الأساسي" : "Total Base"}</div>
            <div className="total-value">{formatCurrency(run?.totalBaseSalary || 0)}</div>
          </div>
          <div className="total-item">
            <div className="total-label">{isRTL ? "الإضافات" : "Additions"}</div>
            <div className="total-value text-green">+{formatCurrency(run?.totalAdditions || 0)}</div>
          </div>
          <div className="total-item">
            <div className="total-label">{isRTL ? "الخصومات" : "Deductions"}</div>
            <div className="total-value text-red">-{formatCurrency(run?.totalDeductions || 0)}</div>
          </div>
          <div className="total-item">
            <div className="total-label">{isRTL ? "صافي الرواتب" : "Net Payroll"}</div>
            <div className="total-value" style={{color: '#1e40af'}}>{formatCurrency(run?.totalNetPay || 0)}</div>
          </div>
        </div>

        <div className="footer">
          <div>{isRTL ? "تم إنشاء هذا التقرير بواسطة نظام Inferixe" : "Generated by Inferixe System"}</div>
          <div>{new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</div>
        </div>
      </div>
    </div>
  );
}
