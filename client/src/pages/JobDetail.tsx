import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, MapPin, Clock, Building2, ArrowLeft, Calendar, DollarSign, GraduationCap, Users } from "lucide-react";
import { Link, useParams } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { JobPosting } from "@shared/schema";

export default function JobDetail() {
  const { t, isRTL } = useLanguage();
  const { id } = useParams<{ id: string }>();

  const { data: job, isLoading, error } = useQuery<JobPosting>({
    queryKey: ["/api/jobs", id],
    enabled: !!id,
  });

  const getJobTitle = (job: JobPosting) => isRTL ? (job.titleAr || job.title) : (job.title || job.titleAr);
  const getJobDescription = (job: JobPosting) => isRTL ? (job.descriptionAr || job.description) : (job.description || job.descriptionAr);
  const getJobLocation = (job: JobPosting) => isRTL ? (job.locationAr || job.location) : (job.location || job.locationAr);
  const getJobRequirements = (job: JobPosting) => isRTL ? (job.requirementsAr || job.requirements) : (job.requirements || job.requirementsAr);
  const getJobBenefits = (job: JobPosting) => isRTL ? (job.benefitsAr || job.benefits) : (job.benefits || job.benefitsAr);

  const getJobTypeLabel = (type: string | null) => {
    const types: Record<string, string> = {
      full_time: t("fullTime"),
      part_time: t("partTime"),
      contract: t("contract"),
      temporary: t("temporary"),
      internship: t("internship"),
    };
    return types[type || ""] || type || "";
  };


  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto animate-pulse px-4 py-8">
          <div className="h-8 w-64 rounded bg-muted" />
          <div className="mt-4 h-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 py-8 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">{t("noJobsAvailable")}</h1>
          <Link href="/careers">
            <Button className="mt-4" variant="outline">
              <ArrowLeft className={`mr-2 h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              {t("careers")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/careers">
              <Button variant="ghost" size="icon" data-testid="button-back-careers">
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-job-title">
                      {getJobTitle(job)}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {getJobLocation(job)}
                        </span>
                      )}
                      {job.jobType && (
                        <Badge variant="secondary">{getJobTypeLabel(job.jobType)}</Badge>
                      )}
                    </CardDescription>
                  </div>
                  <Link href={`/careers/${id}/apply`}>
                    <Button size="lg" data-testid="button-apply-now">
                      {t("applyNow")}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-semibold">{t("jobDescription")}</h3>
                  <p className="whitespace-pre-line text-muted-foreground" data-testid="text-job-description">
                    {getJobDescription(job)}
                  </p>
                </div>

                {getJobRequirements(job) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">{t("jobRequirements")}</h3>
                      <p className="whitespace-pre-line text-muted-foreground" data-testid="text-job-requirements">
                        {getJobRequirements(job)}
                      </p>
                    </div>
                  </>
                )}

                {getJobBenefits(job) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="mb-3 text-lg font-semibold">{t("benefits")}</h3>
                      <p className="whitespace-pre-line text-muted-foreground" data-testid="text-job-benefits">
                        {getJobBenefits(job)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("jobDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(job.experienceYearsMin || job.experienceYearsMax) && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("yearsOfExperience")}</p>
                      <p className="font-medium">
                        {job.experienceYearsMin && job.experienceYearsMax
                          ? `${job.experienceYearsMin} - ${job.experienceYearsMax} ${isRTL ? "سنوات" : "years"}`
                          : job.experienceYearsMin
                            ? `${job.experienceYearsMin}+ ${isRTL ? "سنوات" : "years"}`
                            : `${isRTL ? "حتى" : "Up to"} ${job.experienceYearsMax} ${isRTL ? "سنوات" : "years"}`
                        }
                      </p>
                    </div>
                  </div>
                )}
                {job.jobType && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? "نوع العمل" : "Job Type"}</p>
                      <p className="font-medium">{getJobTypeLabel(job.jobType)}</p>
                    </div>
                  </div>
                )}
                {(job.salaryMin || job.salaryMax) && job.showSalary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("salaryExpectation")}</p>
                      <p className="font-medium">
                        {job.salaryMin && job.salaryMax 
                          ? `${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} ${job.currency || "SAR"}`
                          : job.salaryMin 
                            ? `${isRTL ? "من" : "From"} ${job.salaryMin.toLocaleString()} ${job.currency || "SAR"}`
                            : `${isRTL ? "حتى" : "Up to"} ${job.salaryMax?.toLocaleString()} ${job.currency || "SAR"}`
                        }
                      </p>
                    </div>
                  </div>
                )}
                {job.maxApplications && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? "الشواغر" : "Positions"}</p>
                      <p className="font-medium">{job.maxApplications}</p>
                    </div>
                  </div>
                )}
                {job.applicationDeadline && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("applicationDeadline")}</p>
                      <p className="font-medium">
                        {new Date(job.applicationDeadline).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Link href={`/careers/${id}/apply`}>
                  <Button className="w-full" size="lg" data-testid="button-apply-now-sidebar">
                    {t("applyNow")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {t("appName")}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
