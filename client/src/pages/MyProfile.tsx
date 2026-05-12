import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { Employee, Department } from "@shared/schema";

export default function MyProfile() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

  // Use secure /api/me/* endpoints that return only user's own data
  const { data: myEmployee, isLoading: employeesLoading } = useQuery<Employee>({
    queryKey: ["/api/me", "profile"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      if (!res.ok) throw new Error("Profile not found");
      return res.json();
    },
  });

  const { data: myDepartment } = useQuery<Department>({
    queryKey: ["/api/me", "department"],
    queryFn: async () => {
      const res = await fetch("/api/me/department");
      if (!res.ok) throw new Error("Department not found");
      return res.json();
    },
    enabled: !!myEmployee,
  });

  if (employeesLoading) {
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
            <p className="text-sm text-muted-foreground mt-2">
              {isRTL ? "يرجى التواصل مع الموارد البشرية" : "Please contact HR department"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const InfoItem = ({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) => (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">
          {isRTL ? "ملفي الشخصي" : "My Profile"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL ? "عرض بياناتي الوظيفية" : "View my employment information"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {myEmployee.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">
              {isRTL && myEmployee.fullNameAr ? myEmployee.fullNameAr : myEmployee.fullName}
            </h2>
            <p className="text-muted-foreground">
              {isRTL && myEmployee.positionAr ? myEmployee.positionAr : myEmployee.position}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="outline" className={
                myEmployee.status === "active" 
                  ? "bg-green-500/10 text-green-600 border-green-500/30" 
                  : "bg-red-500/10 text-red-600 border-red-500/30"
              }>
                {myEmployee.status === "active" 
                  ? (isRTL ? "نشط" : "Active") 
                  : (isRTL ? "غير نشط" : "Inactive")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {isRTL ? "رقم الموظف:" : "Employee No:"} {myEmployee.employeeNumber}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{isRTL ? "معلومات الاتصال" : "Contact Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem 
              icon={Mail} 
              label={isRTL ? "البريد الإلكتروني" : "Email"} 
              value={myEmployee.email} 
            />
            <InfoItem 
              icon={Phone} 
              label={isRTL ? "رقم الهاتف" : "Phone Number"} 
              value={myEmployee.phone} 
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{isRTL ? "معلومات العمل" : "Employment Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoItem 
                icon={Building2} 
                label={isRTL ? "القسم" : "Department"} 
                value={isRTL && myDepartment?.nameAr ? myDepartment.nameAr : myDepartment?.name} 
              />
              <InfoItem 
                icon={Briefcase} 
                label={isRTL ? "المسمى الوظيفي" : "Position"} 
                value={isRTL && myEmployee.positionAr ? myEmployee.positionAr : myEmployee.position} 
              />
              <InfoItem 
                icon={Calendar} 
                label={isRTL ? "تاريخ التعيين" : "Hire Date"} 
                value={myEmployee.hireDate ? new Date(myEmployee.hireDate).toLocaleDateString(isRTL ? "ar-SA" : "en-US") : null} 
              />
              <InfoItem 
                icon={DollarSign} 
                label={isRTL ? "الراتب" : "Salary"} 
                value={myEmployee.salary ? `${myEmployee.salary.toLocaleString()} ${isRTL ? "ر.س" : "SAR"}` : null} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
