import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Clock, Building2, Search, ChevronRight, Users, Award, Heart, Zap, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { JobPosting } from "@shared/schema";

export default function Careers() {
  const { t, language, isRTL } = useLanguage();
  const { theme } = useTheme();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: jobs = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs", { published: "true" }],
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.titleAr?.includes(searchQuery) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.descriptionAr?.includes(searchQuery);
    
    const matchesDepartment = departmentFilter === "all" || job.departmentId === departmentFilter;
    const matchesType = typeFilter === "all" || job.jobType === typeFilter;
    
    return matchesSearch && matchesDepartment && matchesType;
  });

  const departments = Array.from(new Set(jobs.map(j => j.departmentId).filter(Boolean)));
  const jobTypes = Array.from(new Set(jobs.map(j => j.jobType).filter(Boolean)));

  const getJobTitle = (job: JobPosting) => isRTL ? (job.titleAr || job.title) : (job.title || job.titleAr);
  const getJobDescription = (job: JobPosting) => isRTL ? (job.descriptionAr || job.description) : (job.description || job.descriptionAr);
  const getJobLocation = (job: JobPosting) => isRTL ? (job.locationAr || job.location) : (job.location || job.locationAr);

  const getEmploymentTypeBadge = (type: string | null) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      full_time: { label: t("fullTime"), variant: "default" },
      part_time: { label: t("partTime"), variant: "secondary" },
      contract: { label: t("contract"), variant: "outline" },
      temporary: { label: t("temporary"), variant: "outline" },
      internship: { label: t("internship"), variant: "secondary" },
    };
    return types[type || ""] || { label: type, variant: "outline" as const };
  };

  const getWorkModeBadge = (mode: string | null) => {
    const modes: Record<string, string> = {
      remote: t("remote"),
      on_site: t("onSite"),
      hybrid: t("hybrid"),
    };
    return modes[mode || ""] || mode;
  };

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{t("appName")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl" data-testid="text-careers-title">
            {t("joinOurTeam")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            {t("discoverCareer")}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-semibold">{t("whyWorkWithUs")}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("competitiveSalary")}</h3>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("professionalGrowth")}</h3>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("workLifeBalance")}</h3>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{t("dynamicEnvironment")}</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-2xl font-semibold">{t("jobOpenings")}</h2>
          
          <div className="mb-8 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                placeholder={t("searchJobs")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
                data-testid="input-search-jobs"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-employment-type">
                <SelectValue placeholder={t("filterByType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("viewAll")}</SelectItem>
                <SelectItem value="full_time">{t("fullTime")}</SelectItem>
                <SelectItem value="part_time">{t("partTime")}</SelectItem>
                <SelectItem value="contract">{t("contract")}</SelectItem>
                <SelectItem value="internship">{t("internship")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 rounded bg-muted" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg text-muted-foreground">{t("noJobsAvailable")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="hover-elevate cursor-pointer transition-all"
                  onClick={() => setLocation(`/careers/${job.id}`)}
                  data-testid={`card-job-${job.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{getJobTitle(job)}</CardTitle>
                      <Badge {...getEmploymentTypeBadge(job.jobType)}>
                        {getEmploymentTypeBadge(job.jobType).label}
                      </Badge>
                    </div>
                    <CardDescription className="flex flex-wrap items-center gap-3 pt-2">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {getJobLocation(job)}
                        </span>
                      )}
                      {job.jobType && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {getEmploymentTypeBadge(job.jobType).label}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {getJobDescription(job)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    {job.applicationDeadline && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(job.applicationDeadline).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                      </span>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-view-job-${job.id}`}>
                      {t("jobDetails")}
                      <ChevronRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-xl font-semibold">{t("trackApplication")}</h2>
          <p className="mb-6 text-muted-foreground">
            {t("applicationTrackingInfo")}
          </p>
          <div className="mx-auto flex max-w-md gap-2">
            <Input 
              placeholder={t("applicationNumber")} 
              data-testid="input-track-application"
            />
            <Button data-testid="button-track-application">
              {t("trackApplication")}
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t("appName")}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
