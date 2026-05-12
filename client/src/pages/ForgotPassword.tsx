import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const isRTL = language === "ar";

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: isRTL ? "تم الإرسال" : "Email Sent",
          description: isRTL 
            ? "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" 
            : "Password reset link has been sent to your email",
        });
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

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background p-4 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {emailSent ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Mail className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {emailSent 
              ? (isRTL ? "تم الإرسال" : "Email Sent") 
              : (isRTL ? "نسيت كلمة المرور؟" : "Forgot Password?")}
          </CardTitle>
          <CardDescription>
            {emailSent 
              ? (isRTL 
                  ? "تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور" 
                  : "Check your email for the password reset link")
              : (isRTL 
                  ? "أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور" 
                  : "Enter your email and we'll send you a link to reset your password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "البريد الإلكتروني" : "Email"}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                          {...field}
                          data-testid="input-forgot-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-reset">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRTL ? "جاري الإرسال..." : "Sending..."}
                    </>
                  ) : (
                    isRTL ? "إرسال رابط إعادة التعيين" : "Send Reset Link"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                {isRTL 
                  ? "إذا لم تتلق البريد الإلكتروني، تحقق من مجلد البريد العشوائي" 
                  : "If you don't receive the email, check your spam folder"}
              </p>
              <Button 
                variant="outline" 
                onClick={() => setEmailSent(false)} 
                className="w-full"
                data-testid="button-try-again"
              >
                {isRTL ? "إرسال مرة أخرى" : "Send Again"}
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:underline" data-testid="link-back-login">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
              {isRTL ? "العودة لتسجيل الدخول" : "Back to Login"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
