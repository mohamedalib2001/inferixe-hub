import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  UserCircle, 
  Clock, 
  Wallet,
  Car,
  FileText,
  Smartphone,
  LayoutDashboard,
  Bell,
  LogIn,
  MousePointer,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Zap
} from "lucide-react";

export default function Landing() {
  const { t, isRTL } = useLanguage();
  const { isAuthenticated } = useAuth();

  const features = [
    { icon: Users, title: t("feature1Title"), desc: t("feature1Desc"), color: "from-blue-500 to-blue-600" },
    { icon: ClipboardCheck, title: t("feature2Title"), desc: t("feature2Desc"), color: "from-emerald-500 to-emerald-600" },
    { icon: BarChart3, title: t("feature3Title"), desc: t("feature3Desc"), color: "from-purple-500 to-purple-600" },
  ];

  const services = [
    { icon: UserCircle, title: t("employeeSystem"), desc: t("employeeSystemDesc") },
    { icon: Clock, title: t("attendanceSystem"), desc: t("attendanceSystemDesc") },
    { icon: Wallet, title: t("payrollSystem"), desc: t("payrollSystemDesc") },
    { icon: Car, title: t("fleetSystem"), desc: t("fleetSystemDesc") },
    { icon: FileText, title: t("requestSystem"), desc: t("requestSystemDesc") },
  ];

  const additionalFeatures = [
    { icon: Smartphone, title: t("selfService"), desc: t("selfServiceDesc") },
    { icon: LayoutDashboard, title: t("smartDashboard"), desc: t("smartDashboardDesc") },
    { icon: Bell, title: t("notifications"), desc: t("notificationsDesc") },
  ];

  const steps = [
    { icon: LogIn, title: t("step1Title"), desc: t("step1Desc"), num: "01" },
    { icon: MousePointer, title: t("step2Title"), desc: t("step2Desc"), num: "02" },
    { icon: CheckCircle2, title: t("step3Title"), desc: t("step3Desc"), num: "03" },
  ];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">{t("appName")}</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#hero" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-home">
                {t("home")}
              </a>
              <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-services">
                {t("services")}
              </a>
              <Link href="/careers" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-careers">
                {t("careers")}
              </Link>
              <a href="#footer" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" data-testid="link-contact">
                {t("contactUs")}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button variant="default" data-testid="button-start-now">
                    {t("enterPlatform")}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="default" data-testid="button-start-now">
                    {t("startNow")}
                    <ArrowRight className={`w-4 h-4 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      <section id="hero" className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              {t("tagline")}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" data-testid="text-hero-title">
              {t("heroTitle")}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
              {t("heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="min-w-[180px]" data-testid="button-enter-platform">
                    {t("enterPlatform")}
                    <ArrowRight className={`w-5 h-5 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="lg" className="min-w-[180px]" data-testid="button-enter-platform">
                    {t("enterPlatform")}
                    <ArrowRight className={`w-5 h-5 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
                  </Button>
                </Link>
              )}
              <a href="#services">
                <Button size="lg" variant="outline" className="min-w-[180px]" data-testid="button-learn-more">
                  {t("learnMore")}
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur p-6 shadow-2xl">
              <div className="absolute -top-3 left-6 flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="bg-primary/10 rounded-lg p-4 text-center" data-testid="stat-employees">
                  <div className="text-3xl font-bold text-primary" data-testid="stat-employees-value">500+</div>
                  <div className="text-sm text-muted-foreground">{t("employees")}</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 text-center" data-testid="stat-attendance">
                  <div className="text-3xl font-bold text-emerald-500" data-testid="stat-attendance-value">98%</div>
                  <div className="text-sm text-muted-foreground">{t("attendanceRate")}</div>
                </div>
                <div className="bg-purple-500/10 rounded-lg p-4 text-center" data-testid="stat-vehicles">
                  <div className="text-3xl font-bold text-purple-500" data-testid="stat-vehicles-value">50+</div>
                  <div className="text-sm text-muted-foreground">{t("totalVehicles")}</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 text-center" data-testid="stat-reports">
                  <div className="text-3xl font-bold text-orange-500" data-testid="stat-reports-value">24/7</div>
                  <div className="text-sm text-muted-foreground">{t("reports")}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate border-0 shadow-lg" data-testid={`card-feature-${index}`}>
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("servicesTitle")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover-elevate group" data-testid={`card-service-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid={`text-service-title-${index}`}>{service.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("additionalFeatures")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center" data-testid={`item-additional-feature-${index}`}>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3" data-testid={`text-additional-feature-title-${index}`}>{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("howItWorks")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative" data-testid={`item-step-${index}`}>
                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                        <step.icon className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary" data-testid={`text-step-number-${index}`}>
                        {step.num.replace("0", "")}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3" data-testid={`text-step-title-${index}`}>{step.title}</h3>
                    <p className="text-muted-foreground">{step.desc}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-border -translate-x-1/2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/login">
              <Button size="lg" data-testid="button-get-started">
                {t("startNow")}
                <ArrowRight className={`w-5 h-5 ${isRTL ? "mr-2 rotate-180" : "ml-2"}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer id="footer" className="bg-card border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">{t("appName")}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {t("heroSubtitle")}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6">{t("quickLinks")}</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#hero" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-home">{t("home")}</a>
                </li>
                <li>
                  <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-services">{t("services")}</a>
                </li>
                <li>
                  <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-careers">{t("careers")}</Link>
                </li>
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-login">{t("login")}</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-foreground mb-6">{t("contactInfo")}</h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-muted-foreground" data-testid="contact-email">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>contact@inferixe.com</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground" data-testid="contact-phone">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>+966 50 000 0000</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground" data-testid="contact-address">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>Riyadh, Saudi Arabia</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm" data-testid="text-copyright">
            <p>&copy; {new Date().getFullYear()} {t("appName")}. {t("allRightsReserved")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
