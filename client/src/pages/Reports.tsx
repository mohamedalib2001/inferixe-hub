import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  BarChart3,
  Download,
  Users,
  Car,
  CalendarCheck,
  FileText,
  Printer,
  Building2,
} from "lucide-react";

interface Employee {
  id: string | number;
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  email?: string;
  phone?: string;
  position?: string;
  positionAr?: string;
  departmentId?: string | number;
  status?: string;
  hireDate?: string;
  salary?: number;
}

interface Attendance {
  id: string | number;
  employeeId: string | number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year?: number;
  type?: string;
  status: string;
  currentMileage?: number;
}

interface Request {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  priority?: string;
  description?: string;
  createdAt?: string;
}

type ReportType = "employee" | "attendance" | "fleet" | "request";

const reportTypes = [
  {
    id: "attendance" as const,
    title: "Attendance Report",
    titleAr: "تقرير الحضور",
    description: "Daily, weekly, and monthly attendance records",
    descriptionAr: "سجلات الحضور اليومية والأسبوعية والشهرية",
    icon: CalendarCheck,
    color: "success",
  },
  {
    id: "employee" as const,
    title: "Employee Report",
    titleAr: "تقرير الموظفين",
    description: "Complete employee directory and statistics",
    descriptionAr: "دليل الموظفين الكامل والإحصائيات",
    icon: Users,
    color: "primary",
  },
  {
    id: "request" as const,
    title: "Request Report",
    titleAr: "تقرير الطلبات",
    description: "All workflow requests and their status",
    descriptionAr: "جميع طلبات العمل وحالتها",
    icon: FileText,
    color: "default",
  },
  {
    id: "fleet" as const,
    title: "Fleet Report",
    titleAr: "تقرير الأسطول",
    description: "Vehicle utilization and maintenance records",
    descriptionAr: "استخدام المركبات وسجلات الصيانة",
    icon: Car,
    color: "warning",
  },
];

export default function Reports() {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const printRef = useRef<HTMLDivElement>(null);
  
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: selectedReport === "employee" || selectedReport === "attendance" || selectedReport === "request",
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
    enabled: selectedReport === "attendance",
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    enabled: selectedReport === "fleet",
  });

  const { data: requests = [] } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
    enabled: selectedReport === "request",
  });

  const handleGenerateReport = (reportId: ReportType) => {
    setIsLoading(true);
    setSelectedReport(reportId);
    setTimeout(() => setIsLoading(false), 500);
  };

  const getPrintStyles = () => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: white;
      direction: ${isRTL ? 'rtl' : 'ltr'};
    }
    
    .report-container {
      max-width: 100%;
      padding: 20px 30px;
    }
    
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    
    .company-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .company-logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    
    .company-name {
      font-size: 20pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .company-subtitle {
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
    
    .report-meta {
      text-align: ${isRTL ? 'left' : 'right'};
    }
    
    .report-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .report-date {
      font-size: 9pt;
      color: #666;
    }
    
    .report-summary {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 20px;
      min-width: 140px;
    }
    
    .summary-value {
      font-size: 20pt;
      font-weight: bold;
      color: #1e40af;
    }
    
    .summary-label {
      font-size: 9pt;
      color: #666;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10pt;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 10px 12px;
      text-align: ${isRTL ? 'right' : 'left'};
      font-weight: 600;
      white-space: nowrap;
    }
    
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: ${isRTL ? 'right' : 'left'};
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 500;
    }
    
    .status-active, .status-present, .status-approved, .status-available {
      background: #dcfce7;
      color: #166534;
    }
    
    .status-inactive, .status-absent, .status-rejected, .status-maintenance {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .status-pending, .status-late, .status-in_progress {
      background: #fef3c7;
      color: #92400e;
    }
    
    .report-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .report-container {
        padding: 0;
      }
      
      @page {
        size: A4 landscape;
        margin: 10mm;
      }
    }
  `;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const reportTitle = reportTypes.find(r => r.id === selectedReport);
    const title = isRTL ? reportTitle?.titleAr : reportTitle?.title;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${title} - Inferixe</title>
        <style>${getPrintStyles()}</style>
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

  const closeReport = () => {
    setSelectedReport(null);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isRTL ? "ar-SA" : "en-US");
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    if (['active', 'present', 'approved', 'available', 'hired'].includes(s)) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{status}</Badge>;
    }
    if (['inactive', 'absent', 'rejected', 'maintenance', 'retired'].includes(s)) {
      return <Badge variant="destructive">{status}</Badge>;
    }
    if (['pending', 'late', 'in_progress', 'in_use'].includes(s)) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">{status}</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const getStatusClass = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (['active', 'present', 'approved', 'available', 'hired'].includes(s)) return 'status-active';
    if (['inactive', 'absent', 'rejected', 'maintenance', 'retired'].includes(s)) return 'status-inactive';
    return 'status-pending';
  };

  const getEmployeeName = (employeeId: string | number) => {
    const emp = employees.find(e => String(e.id) === String(employeeId));
    if (!emp) return isRTL ? "غير معروف" : "Unknown";
    const firstName = isRTL ? (emp.firstNameAr || emp.firstName || "") : (emp.firstName || "");
    const lastName = isRTL ? (emp.lastNameAr || emp.lastName || "") : (emp.lastName || "");
    const name = `${firstName} ${lastName}`.trim();
    return name || (isRTL ? "غير معروف" : "Unknown");
  };

  const getReportTitle = () => {
    const report = reportTypes.find(r => r.id === selectedReport);
    return isRTL ? report?.titleAr : report?.title;
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReportCount = () => {
    switch (selectedReport) {
      case "employee": return employees.length;
      case "attendance": return attendance.length;
      case "fleet": return vehicles.length;
      case "request": return requests.length;
      default: return 0;
    }
  };

  const getReportCountLabel = () => {
    switch (selectedReport) {
      case "employee": return isRTL ? "إجمالي الموظفين" : "Total Employees";
      case "attendance": return isRTL ? "إجمالي السجلات" : "Total Records";
      case "fleet": return isRTL ? "إجمالي المركبات" : "Total Vehicles";
      case "request": return isRTL ? "إجمالي الطلبات" : "Total Requests";
      default: return "";
    }
  };

  const renderEmployeeTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary">
          <TableHead className="text-primary-foreground font-semibold">#</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الاسم" : "Name"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "المنصب" : "Position"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "البريد الإلكتروني" : "Email"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الهاتف" : "Phone"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "تاريخ التعيين" : "Hire Date"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الحالة" : "Status"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp, index) => {
          const firstName = isRTL ? (emp.firstNameAr || emp.firstName || "") : (emp.firstName || "");
          const lastName = isRTL ? (emp.lastNameAr || emp.lastName || "") : (emp.lastName || "");
          const fullName = `${firstName} ${lastName}`.trim() || "-";
          return (
            <TableRow key={String(emp.id)} className={index % 2 === 0 ? "" : "bg-muted/30"}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{fullName}</TableCell>
              <TableCell>{isRTL ? (emp.positionAr || emp.position || "-") : (emp.position || "-")}</TableCell>
              <TableCell>{emp.email || "-"}</TableCell>
              <TableCell>{emp.phone || "-"}</TableCell>
              <TableCell>{formatDate(emp.hireDate)}</TableCell>
              <TableCell>{getStatusBadge(emp.status || "active")}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const renderAttendanceTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary">
          <TableHead className="text-primary-foreground font-semibold">#</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الموظف" : "Employee"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "التاريخ" : "Date"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "وقت الحضور" : "Check In"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "وقت الانصراف" : "Check Out"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الحالة" : "Status"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendance.map((att, index) => (
          <TableRow key={String(att.id)} className={index % 2 === 0 ? "" : "bg-muted/30"}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{getEmployeeName(att.employeeId)}</TableCell>
            <TableCell>{formatDate(att.date)}</TableCell>
            <TableCell>{att.checkIn || "-"}</TableCell>
            <TableCell>{att.checkOut || "-"}</TableCell>
            <TableCell>{getStatusBadge(att.status || "present")}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderFleetTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary">
          <TableHead className="text-primary-foreground font-semibold">#</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "رقم اللوحة" : "Plate Number"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الشركة المصنعة" : "Make"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الموديل" : "Model"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "السنة" : "Year"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "النوع" : "Type"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الحالة" : "Status"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.map((vehicle, index) => (
          <TableRow key={vehicle.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
            <TableCell>{vehicle.make}</TableCell>
            <TableCell>{vehicle.model}</TableCell>
            <TableCell>{vehicle.year || "-"}</TableCell>
            <TableCell>{vehicle.type || "-"}</TableCell>
            <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderRequestTable = () => (
    <Table>
      <TableHeader>
        <TableRow className="bg-primary">
          <TableHead className="text-primary-foreground font-semibold">#</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الموظف" : "Employee"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "النوع" : "Type"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الأولوية" : "Priority"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "التاريخ" : "Date"}</TableHead>
          <TableHead className="text-primary-foreground font-semibold">{isRTL ? "الحالة" : "Status"}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((req, index) => (
          <TableRow key={req.id} className={index % 2 === 0 ? "" : "bg-muted/30"}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{getEmployeeName(req.employeeId)}</TableCell>
            <TableCell>{req.type}</TableCell>
            <TableCell>{req.priority || "-"}</TableCell>
            <TableCell>{formatDate(req.createdAt)}</TableCell>
            <TableCell>{getStatusBadge(req.status)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderPrintableContent = () => {
    return (
      <div ref={printRef} style={{ display: 'none' }}>
        <div className="report-container">
          <div className="report-header">
            <div className="company-info">
              <div className="company-logo">I</div>
              <div>
                <div className="company-name">Inferixe</div>
                <div className="company-subtitle">
                  {isRTL ? "منصة إدارة المؤسسات" : "Enterprise Management Platform"}
                </div>
              </div>
            </div>
            <div className="report-meta">
              <div className="report-title">{getReportTitle()}</div>
              <div className="report-date">{getCurrentDate()}</div>
            </div>
          </div>

          <div className="report-summary">
            <div className="summary-card">
              <div className="summary-value">{getReportCount()}</div>
              <div className="summary-label">{getReportCountLabel()}</div>
            </div>
          </div>

          {selectedReport === "employee" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isRTL ? "الاسم" : "Name"}</th>
                  <th>{isRTL ? "المنصب" : "Position"}</th>
                  <th>{isRTL ? "البريد الإلكتروني" : "Email"}</th>
                  <th>{isRTL ? "الهاتف" : "Phone"}</th>
                  <th>{isRTL ? "تاريخ التعيين" : "Hire Date"}</th>
                  <th>{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => {
                  const firstName = isRTL ? (emp.firstNameAr || emp.firstName || "") : (emp.firstName || "");
                  const lastName = isRTL ? (emp.lastNameAr || emp.lastName || "") : (emp.lastName || "");
                  const fullName = `${firstName} ${lastName}`.trim() || "-";
                  return (
                    <tr key={String(emp.id)}>
                      <td>{index + 1}</td>
                      <td><strong>{fullName}</strong></td>
                      <td>{isRTL ? (emp.positionAr || emp.position || "-") : (emp.position || "-")}</td>
                      <td>{emp.email || "-"}</td>
                      <td>{emp.phone || "-"}</td>
                      <td>{formatDate(emp.hireDate)}</td>
                      <td><span className={`status-badge ${getStatusClass(emp.status || 'active')}`}>{emp.status || "active"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {selectedReport === "attendance" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isRTL ? "الموظف" : "Employee"}</th>
                  <th>{isRTL ? "التاريخ" : "Date"}</th>
                  <th>{isRTL ? "وقت الحضور" : "Check In"}</th>
                  <th>{isRTL ? "وقت الانصراف" : "Check Out"}</th>
                  <th>{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att, index) => (
                  <tr key={String(att.id)}>
                    <td>{index + 1}</td>
                    <td><strong>{getEmployeeName(att.employeeId)}</strong></td>
                    <td>{formatDate(att.date)}</td>
                    <td>{att.checkIn || "-"}</td>
                    <td>{att.checkOut || "-"}</td>
                    <td><span className={`status-badge ${getStatusClass(att.status || 'present')}`}>{att.status || "present"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === "fleet" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isRTL ? "رقم اللوحة" : "Plate Number"}</th>
                  <th>{isRTL ? "الشركة المصنعة" : "Make"}</th>
                  <th>{isRTL ? "الموديل" : "Model"}</th>
                  <th>{isRTL ? "السنة" : "Year"}</th>
                  <th>{isRTL ? "النوع" : "Type"}</th>
                  <th>{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle, index) => (
                  <tr key={vehicle.id}>
                    <td>{index + 1}</td>
                    <td><strong>{vehicle.plateNumber}</strong></td>
                    <td>{vehicle.make}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.year || "-"}</td>
                    <td>{vehicle.type || "-"}</td>
                    <td><span className={`status-badge ${getStatusClass(vehicle.status)}`}>{vehicle.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === "request" && (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isRTL ? "الموظف" : "Employee"}</th>
                  <th>{isRTL ? "النوع" : "Type"}</th>
                  <th>{isRTL ? "الأولوية" : "Priority"}</th>
                  <th>{isRTL ? "التاريخ" : "Date"}</th>
                  <th>{isRTL ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => (
                  <tr key={req.id}>
                    <td>{index + 1}</td>
                    <td><strong>{getEmployeeName(req.employeeId)}</strong></td>
                    <td>{req.type}</td>
                    <td>{req.priority || "-"}</td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td><span className={`status-badge ${getStatusClass(req.status)}`}>{req.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="report-footer">
            <div>{isRTL ? "تم إنشاء هذا التقرير بواسطة نظام Inferixe" : "This report was generated by Inferixe System"}</div>
            <div>{getCurrentDate()}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">Inferixe</h3>
              <p className="text-sm text-muted-foreground">
                {isRTL ? "منصة إدارة المؤسسات" : "Enterprise Management Platform"}
              </p>
            </div>
          </div>
          <div className="text-start sm:text-end">
            <h4 className="font-semibold text-lg">{getReportTitle()}</h4>
            <p className="text-sm text-muted-foreground">{getCurrentDate()}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1">
            <div className="text-3xl font-bold text-primary">{getReportCount()}</div>
            <div className="text-sm text-muted-foreground">{getReportCountLabel()}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} data-testid="button-print-report">
              <Printer className="h-4 w-4 me-2" />
              {isRTL ? "طباعة" : "Print"}
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} data-testid="button-download-pdf">
              <Download className="h-4 w-4 me-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {selectedReport === "employee" && renderEmployeeTable()}
          {selectedReport === "attendance" && renderAttendanceTable()}
          {selectedReport === "fleet" && renderFleetTable()}
          {selectedReport === "request" && renderRequestTable()}
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
          <span>{isRTL ? "تم إنشاء هذا التقرير بواسطة نظام Inferixe" : "Generated by Inferixe System"}</span>
          <span>{getCurrentDate()}</span>
        </div>

        {renderPrintableContent()}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("reports")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isRTL ? "إنشاء وتصدير تقارير الأعمال" : "Generate and export business reports"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <Card key={report.id} className="hover-elevate transition-colors">
            <CardHeader className="flex flex-row items-start gap-4">
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-md ${
                  report.color === "primary"
                    ? "bg-primary/10"
                    : report.color === "success"
                    ? "bg-green-500/10"
                    : report.color === "warning"
                    ? "bg-amber-500/10"
                    : "bg-muted"
                }`}
              >
                <report.icon
                  className={`h-6 w-6 ${
                    report.color === "primary"
                      ? "text-primary"
                      : report.color === "success"
                      ? "text-green-600 dark:text-green-400"
                      : report.color === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">{isRTL ? report.titleAr : report.title}</CardTitle>
                <CardDescription className="mt-1">{isRTL ? report.descriptionAr : report.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleGenerateReport(report.id)}
                  data-testid={`button-generate-${report.id}`}
                >
                  <BarChart3 className="h-4 w-4 me-2" />
                  {isRTL ? "عرض" : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isRTL ? "لوحة التحليلات" : "Analytics Dashboard"}</CardTitle>
          <CardDescription>{isRTL ? "التحليلات المرئية وتتبع مؤشرات الأداء" : "Visual analytics and KPI tracking"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
              <PieChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {isRTL ? "لوحة التحليلات قريباً" : "Analytics dashboard coming soon"}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {isRTL 
                ? "سيتضمن هذا القسم مخططات تفاعلية وتتبع مؤشرات الأداء الرئيسية وتصور البيانات لجميع مقاييس الأعمال."
                : "This section will include interactive charts, KPI tracking, and data visualization for all business metrics."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && closeReport()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRTL 
                ? reportTypes.find(r => r.id === selectedReport)?.titleAr 
                : reportTypes.find(r => r.id === selectedReport)?.title}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? reportTypes.find(r => r.id === selectedReport)?.descriptionAr 
                : reportTypes.find(r => r.id === selectedReport)?.description}
            </DialogDescription>
          </DialogHeader>
          
          {renderReportContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
