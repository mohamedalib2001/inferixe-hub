import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  BadgeCheck,
  Download,
  Share2,
  QrCode,
} from "lucide-react";
import type { Employee, Department } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

function EmployeeCardContent() {
  const [, params] = useRoute("/employee-card/:id");
  const employeeId = params?.id;
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", employeeId],
    enabled: !!employeeId,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const department = departments.find((d) => d.id === employee?.departmentId);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRTL ? `بطاقة ${employee?.fullNameAr || employee?.fullName}` : `${employee?.fullName}'s Employee Card`,
          text: isRTL ? "شاهد بطاقتي الوظيفية الرقمية" : "View my digital employee card",
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: t("success"),
        description: isRTL ? "تم نسخ الرابط" : "Link copied to clipboard",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            {isRTL ? "البطاقة غير موجودة" : "Card Not Found"}
          </h2>
          <p className="text-muted-foreground">
            {isRTL ? "لم يتم العثور على بطاقة الموظف المطلوبة" : "The requested employee card was not found"}
          </p>
        </Card>
      </div>
    );
  }

  const displayName = isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName;
  const displayPosition = isRTL && employee.positionAr ? employee.positionAr : employee.position;
  const displayDept = isRTL && department?.nameAr ? department.nameAr : department?.name;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <header className="flex items-center justify-end gap-2 p-4">
        <LanguageToggle />
        <ThemeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60 rounded-3xl transform rotate-3 opacity-20 blur-sm" />
            
            <Card className="relative overflow-hidden rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-card via-card to-card/95">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
              
              <div className="relative pt-16 pb-8 px-6">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-full p-1" />
                    <Avatar className="h-28 w-28 border-4 border-background shadow-xl relative">
                      <AvatarImage src={employee.avatar || undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-background">
                      <BadgeCheck className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-center mb-1" data-testid="text-employee-name">
                    {displayName}
                  </h1>
                  
                  {displayPosition && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-3">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">{displayPosition}</span>
                    </div>
                  )}

                  <Badge variant="secondary" className="mb-6">
                    <Building2 className="h-3 w-3 me-1" />
                    {displayDept || (isRTL ? "غير محدد" : "Unassigned")}
                  </Badge>

                  <div className="w-full bg-muted/50 rounded-2xl p-4 space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{t("email")}</p>
                        <p className="font-medium truncate" data-testid="text-employee-email">{employee.email}</p>
                      </div>
                    </div>

                    {employee.phone && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{t("phone")}</p>
                          <p className="font-medium" data-testid="text-employee-phone">{employee.phone}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                        <QrCode className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{isRTL ? "رقم الموظف" : "Employee ID"}</p>
                        <p className="font-medium font-mono" data-testid="text-employee-number">{employee.employeeNumber}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleShare}
                      data-testid="button-share-card"
                    >
                      <Share2 className="h-4 w-4 me-2" />
                      {isRTL ? "مشاركة" : "Share"}
                    </Button>
                    <Button 
                      className="flex-1"
                      data-testid="button-download-card"
                    >
                      <Download className="h-4 w-4 me-2" />
                      {isRTL ? "تحميل" : "Download"}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>{t("appName")}</span>
                    <span className="mx-1">|</span>
                    <span>{t("tagline")}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {isRTL 
              ? "هذه البطاقة الرقمية صادرة من نظام إنفريكس" 
              : "This digital card is issued by Inferixe System"
            }
          </p>
        </div>
      </main>
    </div>
  );
}

export default function EmployeeCard() {
  return <EmployeeCardContent />;
}
