import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Share2,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle,
  Phone,
  Mail,
} from "lucide-react";
import type { Employee, Department } from "@shared/schema";

export default function MyCard() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();

  // Use secure /api/me/* endpoints that return only user's own data
  const { data: myEmployee, isLoading } = useQuery<Employee>({
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

  const handleShare = async () => {
    if (!myEmployee) return;
    
    const shareUrl = `${window.location.origin}/employee-card/${myEmployee.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRTL ? "بطاقتي الوظيفية" : "My Employee Card",
          text: isRTL 
            ? `بطاقة ${myEmployee.fullNameAr || myEmployee.fullName} الوظيفية` 
            : `${myEmployee.fullName}'s Employee Card`,
          url: shareUrl,
        });
      } catch (err) {
        navigator.clipboard.writeText(shareUrl);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(isRTL ? "تم نسخ الرابط" : "Link copied to clipboard");
    }
  };

  if (isLoading) {
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? "بطاقتي الوظيفية" : "My ID Card"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? "عرض ومشاركة بطاقتك الوظيفية الرقمية" : "View and share your digital employee card"}
          </p>
        </div>
        <Button onClick={handleShare}>
          <Share2 className="h-4 w-4 me-2" />
          {isRTL ? "مشاركة البطاقة" : "Share Card"}
        </Button>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary to-primary/80" />
            <CardContent className="p-6 -mt-12">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto border-4 border-background">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {myEmployee.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold">
                      {isRTL && myEmployee.fullNameAr ? myEmployee.fullNameAr : myEmployee.fullName}
                    </h2>
                    <Badge className="bg-green-500/10 text-green-600">
                      <CheckCircle className="h-3 w-3 me-1" />
                      {isRTL ? "موثق" : "Verified"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {isRTL && myEmployee.positionAr ? myEmployee.positionAr : myEmployee.position}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{isRTL && myDepartment?.nameAr ? myDepartment.nameAr : myDepartment?.name}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{myEmployee.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span dir="ltr">{myEmployee.phone}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isRTL ? "رقم الموظف" : "Employee No."}</span>
                    <span className="font-mono font-bold">{myEmployee.employeeNumber}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">Inferixe</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
