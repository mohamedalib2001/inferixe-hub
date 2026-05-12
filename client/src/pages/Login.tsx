import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Building2, LogIn, Shield, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

type LoginStep = "credentials" | "totp";

export default function Login() {
  const { language } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  const { refetch } = useAuth();
  
  const [step, setStep] = useState<LoginStep>("credentials");
  const [isLoading, setIsLoading] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleCredentialsSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email: data.email,
        password: data.password,
      });

      const result = await response.json();

      if (result.requiresTOTP) {
        setStep("totp");
      } else if (result.user) {
        await refetch();
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      const message = error.message || "Login failed";
      let displayMessage = message;
      
      if (message.includes("invalid_credentials")) {
        displayMessage = language === "ar" ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password";
      } else if (message.includes("account_locked")) {
        displayMessage = language === "ar" ? "الحساب مقفل. حاول مرة أخرى لاحقاً" : "Account locked. Try again later";
      } else if (message.includes("account_disabled")) {
        displayMessage = language === "ar" ? "الحساب معطل" : "Account is disabled";
      }
      
      toast({
        title: language === "ar" ? "خطأ في تسجيل الدخول" : "Login Error",
        description: displayMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTOTPSubmit = async () => {
    if (totpCode.length !== 6) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-totp", {
        code: totpCode,
      });

      const result = await response.json();

      if (result.user) {
        await refetch();
        window.location.href = "/dashboard";
      }
    } catch (error: any) {
      toast({
        title: language === "ar" ? "رمز خاطئ" : "Invalid Code",
        description: language === "ar" ? "رمز التحقق غير صحيح. حاول مرة أخرى" : "Invalid verification code. Please try again.",
        variant: "destructive",
      });
      setTotpCode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep("credentials");
    setTotpCode("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-card-border shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                  {step === "credentials" ? (
                    <Building2 className="h-8 w-8 text-primary" />
                  ) : (
                    <Shield className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold">
                {step === "credentials" ? t("welcomeBack") : (language === "ar" ? "التحقق بخطوتين" : "Two-Factor Authentication")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {step === "credentials" 
                  ? t("signInToContinue")
                  : (language === "ar" 
                      ? "أدخل الرمز من تطبيق المصادقة الخاص بك" 
                      : "Enter the code from your authenticator app")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === "credentials" ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCredentialsSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "ar" ? "البريد الإلكتروني" : "Email"}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={language === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                              data-testid="input-email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{language === "ar" ? "كلمة المرور" : "Password"}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={language === "ar" ? "أدخل كلمة المرور" : "Enter your password"}
                              data-testid="input-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                      data-testid="button-login"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      ) : (
                        <LogIn className="h-4 w-4 me-2" />
                      )}
                      {t("login")}
                    </Button>
                    <div className="text-center">
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                        data-testid="link-forgot-password"
                      >
                        {language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                      </Link>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={totpCode}
                      onChange={(value) => setTotpCode(value)}
                      data-testid="input-totp"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleTOTPSubmit}
                      className="w-full"
                      size="lg"
                      disabled={isLoading || totpCode.length !== 6}
                      data-testid="button-verify-totp"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 me-2" />
                      )}
                      {language === "ar" ? "تحقق" : "Verify"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleBackToLogin}
                      className="w-full"
                      data-testid="button-back"
                    >
                      <ArrowLeft className="h-4 w-4 me-2" />
                      {language === "ar" ? "العودة" : "Back"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  {language === "ar" ? "تسجيل دخول آمن ومشفر" : "Secure encrypted login"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Inferixe. All rights reserved.</p>
      </footer>
    </div>
  );
}
