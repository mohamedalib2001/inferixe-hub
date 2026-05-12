import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { getTranslation } from "@/lib/i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  Car,
  UserCircle,
  DollarSign,
  PieChart,
  Settings,
  LogOut,
  Building2,
  ScanFace,
  UserPlus,
  ScrollText,
  Briefcase,
  Wrench,
  CreditCard,
  ClipboardList,
  User,
} from "lucide-react";

type UserRole = "super_admin" | "admin" | "hr" | "finance" | "operations" | "fleet_manager" | "employee";

const ADMIN_ROLES: UserRole[] = ["super_admin", "admin"];
const HR_ROLES: UserRole[] = ["super_admin", "admin", "hr"];
const OPERATIONS_ROLES: UserRole[] = ["super_admin", "admin", "operations", "fleet_manager"];
const FINANCE_ROLES: UserRole[] = ["super_admin", "admin", "finance"];

export function AppSidebar() {
  const { language, isRTL } = useLanguage();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const userRole = (user?.role as UserRole) || "employee";
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const isHR = HR_ROLES.includes(userRole);
  const isOperations = OPERATIONS_ROLES.includes(userRole);
  const isFinance = FINANCE_ROLES.includes(userRole);
  const isEmployee = userRole === "employee";

  const employeeMenuItems = [
    { title: isRTL ? "لوحة التحكم" : "My Dashboard", url: "/my-dashboard", icon: LayoutDashboard },
    { title: isRTL ? "ملفي الشخصي" : "My Profile", url: "/my-profile", icon: User },
    { title: isRTL ? "طلباتي" : "My Requests", url: "/my-requests", icon: FileText },
    { title: isRTL ? "سجل حضوري" : "My Attendance", url: "/my-attendance", icon: CalendarCheck },
    { title: isRTL ? "بصمة الوجه" : "Face Check-in", url: "/face-attendance", icon: ScanFace },
    { title: isRTL ? "بطاقتي الوظيفية" : "My ID Card", url: "/my-card", icon: CreditCard },
  ];

  const mainMenuItems = [
    { title: t("dashboard"), url: "/dashboard", icon: LayoutDashboard },
  ];

  const hrMenuItems = [
    { title: t("employees"), url: "/employees", icon: Users },
    { title: t("attendance"), url: "/attendance", icon: CalendarCheck },
    { title: isRTL ? "بصمة الوجه" : "Face Check-in", url: "/face-attendance", icon: ScanFace },
    { title: isRTL ? "تسجيل البصمة" : "Face Enrollment", url: "/face-enrollment", icon: UserPlus },
    { title: isRTL ? "كشك الحضور" : "Attendance Kiosk", url: "/kiosk", icon: Building2 },
    { title: t("requests"), url: "/requests", icon: FileText },
    { title: t("recruitment"), url: "/recruitment", icon: Briefcase },
  ];

  const operationsMenuItems = [
    { title: t("branches"), url: "/branches", icon: Building2 },
    { title: t("fleet"), url: "/fleet", icon: Car },
    { title: isRTL ? "طلبات السيارات" : "Vehicle Events", url: "/vehicle-events", icon: Wrench },
    { title: t("drivers"), url: "/drivers", icon: UserCircle },
    { title: t("contracts"), url: "/contracts", icon: ScrollText },
  ];

  const financeMenuItems = [
    { title: t("payroll"), url: "/payroll", icon: DollarSign },
    { title: t("payrollRequests"), url: "/payroll-requests", icon: FileText },
    { title: t("reports"), url: "/reports", icon: PieChart },
  ];

  const renderMenuGroup = (
    label: string,
    items: { title: string; url: string; icon: typeof LayoutDashboard }[]
  ) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="transition-colors"
                >
                  <Link href={item.url} data-testid={`link-sidebar-${item.url.replace("/", "") || "dashboard"}`}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar side={isRTL ? "right" : "left"} className="border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-sidebar-foreground">
              {t("appName")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("tagline")}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {isEmployee ? (
          <>
            {renderMenuGroup(isRTL ? "حسابي" : "My Account", employeeMenuItems)}
          </>
        ) : (
          <>
            {renderMenuGroup(t("overview"), mainMenuItems)}
            {isHR && renderMenuGroup(t("hrManagement"), hrMenuItems)}
            {isOperations && renderMenuGroup(t("operations"), operationsMenuItems)}
            {isFinance && renderMenuGroup(t("finance"), financeMenuItems)}
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-sidebar-foreground">
              {isRTL && user?.fullNameAr ? user.fullNameAr : `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email}
            </span>
            <span className="text-xs text-muted-foreground truncate capitalize">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start"
            asChild
          >
            <Link href="/settings" data-testid="link-sidebar-settings">
              <Settings className="h-4 w-4 me-2" />
              {t("settings")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
