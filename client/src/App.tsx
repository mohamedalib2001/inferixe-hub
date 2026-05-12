import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import Attendance from "@/pages/Attendance";
import FaceAttendance from "@/pages/FaceAttendance";
import FaceEnrollment from "@/pages/FaceEnrollment";
import Requests from "@/pages/Requests";
import Fleet from "@/pages/Fleet";
import VehicleProfile from "@/pages/VehicleProfile";
import Drivers from "@/pages/Drivers";
import Branches from "@/pages/Branches";
import FaceAttendanceKiosk from "@/pages/FaceAttendanceKiosk";
import Payroll from "@/pages/Payroll";
import PayrollRequests from "@/pages/PayrollRequests";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Contracts from "@/pages/Contracts";
import EmployeeCard from "@/pages/EmployeeCard";
import Careers from "@/pages/Careers";
import JobDetail from "@/pages/JobDetail";
import JobApplication from "@/pages/JobApplication";
import Recruitment from "@/pages/Recruitment";
import VehicleEvents from "@/pages/VehicleEvents";
import MyDashboard from "@/pages/MyDashboard";
import MyRequests from "@/pages/MyRequests";
import MyAttendance from "@/pages/MyAttendance";
import MyProfile from "@/pages/MyProfile";
import MyCard from "@/pages/MyCard";
import Notifications from "@/pages/Notifications";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  
  return <Component />;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { isRTL } = useLanguage();
  
  const style = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <Landing />
      </Route>
      <Route path="/dashboard">
        <AuthenticatedLayout>
          <ProtectedRoute component={Dashboard} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/employees">
        <AuthenticatedLayout>
          <ProtectedRoute component={Employees} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/employees/:id">
        <AuthenticatedLayout>
          <ProtectedRoute component={EmployeeProfile} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/attendance">
        <AuthenticatedLayout>
          <ProtectedRoute component={Attendance} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/face-attendance">
        <AuthenticatedLayout>
          <ProtectedRoute component={FaceAttendance} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/face-enrollment">
        <AuthenticatedLayout>
          <ProtectedRoute component={FaceEnrollment} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/requests">
        <AuthenticatedLayout>
          <ProtectedRoute component={Requests} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/fleet">
        <AuthenticatedLayout>
          <ProtectedRoute component={Fleet} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/fleet/:id">
        <AuthenticatedLayout>
          <ProtectedRoute component={VehicleProfile} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/vehicle-events">
        <AuthenticatedLayout>
          <ProtectedRoute component={VehicleEvents} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/drivers">
        <AuthenticatedLayout>
          <ProtectedRoute component={Drivers} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/payroll">
        <AuthenticatedLayout>
          <ProtectedRoute component={Payroll} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/payroll-requests">
        <AuthenticatedLayout>
          <ProtectedRoute component={PayrollRequests} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/reports">
        <AuthenticatedLayout>
          <ProtectedRoute component={Reports} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/settings">
        <AuthenticatedLayout>
          <ProtectedRoute component={Settings} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/notifications">
        <AuthenticatedLayout>
          <ProtectedRoute component={Notifications} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/branches">
        <AuthenticatedLayout>
          <ProtectedRoute component={Branches} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/contracts">
        <AuthenticatedLayout>
          <ProtectedRoute component={Contracts} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/recruitment">
        <AuthenticatedLayout>
          <ProtectedRoute component={Recruitment} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/my-dashboard">
        <AuthenticatedLayout>
          <ProtectedRoute component={MyDashboard} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/my-requests">
        <AuthenticatedLayout>
          <ProtectedRoute component={MyRequests} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/my-attendance">
        <AuthenticatedLayout>
          <ProtectedRoute component={MyAttendance} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/my-profile">
        <AuthenticatedLayout>
          <ProtectedRoute component={MyProfile} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/my-card">
        <AuthenticatedLayout>
          <ProtectedRoute component={MyCard} />
        </AuthenticatedLayout>
      </Route>
      <Route path="/kiosk">
        <FaceAttendanceKiosk />
      </Route>
      <Route path="/employee-card/:id">
        <EmployeeCard />
      </Route>
      <Route path="/careers">
        <Careers />
      </Route>
      <Route path="/careers/:id">
        <JobDetail />
      </Route>
      <Route path="/careers/:id/apply">
        <JobApplication />
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
