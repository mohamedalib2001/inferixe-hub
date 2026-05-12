import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Loader2, Lock, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isRTL = language === "ar";

  const token = new URLSearchParams(window.location.search).get("token");

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        setIsTokenValid(response.ok);
      } catch {
        setIsTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: isRTL ? "تم بنجاح" : "Success",
          description: isRTL 
            ? "تم إعادة تعيين كلمة المرور بنجاح" 
            : "Password has been reset successfully",
        });
        setTimeout(() => setLocation("/login"), 3000);
      } else {
        toast({
          title: isRTL ? "خطأ" : "Error",
          description: result.message || (isRTL ? "حدث خطأ" : "An error occurred"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "حدث خطأ في الاتصال" : "Connection error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isRTL ? "رابط غير صالح" : "Invalid Link"}
            </CardTitle>
            <CardDescription>
              {isRTL 
                ? "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" 
                : "This password reset link is invalid or has expired"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/forgot-password">
              <Button className="w-full" data-testid="button-request-new-link">
                {isRTL ? "طلب رابط جديد" : "Request New Link"}
              </Button>
            </Link>
            <div className="mt-4">
              <Link href="/login" className="text-primary hover:underline" data-testid="link-back-login">
                {isRTL ? "العودة لتسجيل الدخول" : "Back to Login"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isRTL ? "تم بنجاح!" : "Success!"}
            </CardTitle>
            <CardDescription>
              {isRTL 
                ? "تم إعادة تعيين كلمة المرور. سيتم توجيهك لصفحة تسجيل الدخول..." 
                : "Password has been reset. Redirecting to login..."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRTL ? "إعادة تعيين كلمة المرور" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? "أدخل كلمة المرور الجديدة" 
              : "Enter your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "كلمة المرور الجديدة" : "New Password"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={isRTL ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                          {...field}
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={isRTL ? "أعد إدخال كلمة المرور" : "Confirm password"}
                          {...field}
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-reset-password">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRTL ? "جاري الحفظ..." : "Saving..."}
                  </>
                ) : (
                  isRTL ? "إعادة تعيين كلمة المرور" : "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
