import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Users, FileText, Calendar, Search, Plus, Eye, Edit, MoreVertical, Clock, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StatsCard } from "@/components/StatsCard";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JobPosting, JobApplication } from "@shared/schema";

const jobPostingSchema = z.object({
  title: z.string().min(1, "Required"),
  titleAr: z.string().optional(),
  description: z.string().min(1, "Required"),
  descriptionAr: z.string().optional(),
  requirements: z.string().optional(),
  requirementsAr: z.string().optional(),
  benefits: z.string().optional(),
  benefitsAr: z.string().optional(),
  location: z.string().optional(),
  locationAr: z.string().optional(),
  jobType: z.string().default("full_time"),
  experienceYearsMin: z.coerce.number().optional(),
  experienceYearsMax: z.coerce.number().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  applicationDeadline: z.string().optional(),
  status: z.string().default("draft"),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

export default function Recruitment() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: stats } = useQuery<{
    totalJobs: number;
    publishedJobs: number;
    totalApplications: number;
    newApplications: number;
    shortlisted: number;
    interviewScheduled: number;
    offered: number;
    hired: number;
  }>({
    queryKey: ["/api/recruitment/stats"],
  });

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: applications = [], isLoading: applicationsLoading } = useQuery<JobApplication[]>({
    queryKey: ["/api/applications"],
  });

  const form = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      status: "draft",
      jobType: "full_time",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobPostingFormData) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruitment/stats"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: t("success"),
        description: "Job posting created successfully",
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        variant: "destructive",
      });
    },
  });

  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/jobs/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruitment/stats"] });
      toast({
        title: t("success"),
      });
    },
  });

  const getJobTitle = (job: JobPosting) => isRTL ? (job.titleAr || job.title) : (job.title || job.titleAr);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      draft: { variant: "outline", label: t("draft") },
      published: { variant: "default", label: isRTL ? "منشور" : "Published" },
      closed: { variant: "secondary", label: isRTL ? "مغلق" : "Closed" },
      submitted: { variant: "outline", label: t("submitted") },
      under_review: { variant: "secondary", label: t("underReview") },
      shortlisted: { variant: "default", label: t("shortlisted") },
      interview_scheduled: { variant: "default", label: t("interviewScheduled") },
      interviewed: { variant: "secondary", label: t("interviewed") },
      evaluation: { variant: "secondary", label: t("evaluation") },
      offer_pending: { variant: "default", label: t("offerPending") },
      offer_sent: { variant: "default", label: t("offerSent") },
      offer_accepted: { variant: "default", label: t("offerAccepted") },
      offer_declined: { variant: "destructive", label: t("offerDeclined") },
      hired: { variant: "default", label: t("hired") },
      rejected: { variant: "destructive", label: t("rejected") },
      withdrawn: { variant: "outline", label: t("withdrawn") },
    };
    return variants[status || ""] || { variant: "outline" as const, label: status };
  };

  const getApplicantName = (app: JobApplication) => {
    if (isRTL && (app.firstNameAr || app.lastNameAr)) {
      return `${app.firstNameAr || ""} ${app.lastNameAr || ""}`.trim();
    }
    return `${app.firstName} ${app.lastName}`;
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-recruitment-title">
            {t("recruitmentDashboard")}
          </h1>
          <p className="text-muted-foreground">{t("recruitment")}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-job">
              <Plus className="mr-2 h-4 w-4" />
              {isRTL ? "إنشاء وظيفة" : "Create Job Posting"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isRTL ? "وظيفة جديدة" : "New Job Posting"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createJobMutation.mutate(data))} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "المسمى الوظيفي (إنجليزي)" : "Job Title (English)"} *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-job-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titleAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "المسمى الوظيفي (عربي)" : "Job Title (Arabic)"}</FormLabel>
                        <FormControl>
                          <Input {...field} dir="rtl" data-testid="input-job-title-ar" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("location") || "Location"}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "نوع العمل" : "Job Type"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_time">{t("fullTime")}</SelectItem>
                            <SelectItem value="part_time">{t("partTime")}</SelectItem>
                            <SelectItem value="contract">{t("contract")}</SelectItem>
                            <SelectItem value="internship">{t("internship")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("jobDescription")} *</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} data-testid="input-job-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("jobRequirements")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="benefits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("benefits")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="experienceYearsMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "الخبرة (من)" : "Experience (Min)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experienceYearsMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "الخبرة (إلى)" : "Experience (Max)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("applicationDeadline")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="salaryMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "الراتب (من)" : "Salary (Min)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salaryMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{isRTL ? "الراتب (إلى)" : "Salary (Max)"}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">{t("draft")}</SelectItem>
                          <SelectItem value="published">{isRTL ? "منشور" : "Published"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createJobMutation.isPending} data-testid="button-save-job">
                    {createJobMutation.isPending ? t("loading") : t("save")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={isRTL ? "الوظائف المنشورة" : "Published Jobs"}
          value={stats?.publishedJobs || 0}
          icon={Briefcase}
        />
        <StatsCard
          title={t("totalApplications")}
          value={stats?.totalApplications || 0}
          icon={FileText}
        />
        <StatsCard
          title={t("interviews")}
          value={stats?.interviewScheduled || 0}
          icon={Calendar}
        />
        <StatsCard
          title={t("hired")}
          value={stats?.hired || 0}
          icon={UserCheck}
        />
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" data-testid="tab-applications">
            {t("recentApplications")}
          </TabsTrigger>
          <TabsTrigger value="jobs" data-testid="tab-jobs">
            {t("jobOpenings")}
          </TabsTrigger>
          <TabsTrigger value="pipeline" data-testid="tab-pipeline">
            {t("applicationPipeline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
                data-testid="input-search-applications"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder={t("status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("viewAll")}</SelectItem>
                <SelectItem value="submitted">{t("submitted")}</SelectItem>
                <SelectItem value="under_review">{t("underReview")}</SelectItem>
                <SelectItem value="shortlisted">{t("shortlisted")}</SelectItem>
                <SelectItem value="interview_scheduled">{t("interviewScheduled")}</SelectItem>
                <SelectItem value="hired">{t("hired")}</SelectItem>
                <SelectItem value="rejected">{t("rejected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("applicationNumber")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("email")}</TableHead>
                    <TableHead>{t("jobTitle")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applicationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        {t("loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t("noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app) => (
                      <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                        <TableCell className="font-mono text-sm">{app.applicationNumber}</TableCell>
                        <TableCell className="font-medium">{getApplicantName(app)}</TableCell>
                        <TableCell>{app.email}</TableCell>
                        <TableCell>
                          {jobs.find(j => j.id === app.jobId)?.title || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge {...getStatusBadge(app.status)}>
                            {getStatusBadge(app.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US") : "-"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" data-testid={`button-view-app-${app.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobsLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))
            ) : jobs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                {t("noJobsAvailable")}
              </div>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} data-testid={`card-job-admin-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{getJobTitle(job)}</CardTitle>
                      <Badge {...getStatusBadge(job.status)}>
                        {getStatusBadge(job.status).label}
                      </Badge>
                    </div>
                    <CardDescription>
                      {job.location} {job.jobType && `• ${job.jobType.replace("_", " ")}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {isRTL ? (job.descriptionAr || job.description) : job.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {applications.filter(a => a.jobId === job.id).length} {isRTL ? "متقدم" : "applicants"}
                      </span>
                      <div className="flex gap-2">
                        {job.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => updateJobStatusMutation.mutate({ id: job.id, status: "published" })}
                            data-testid={`button-publish-${job.id}`}
                          >
                            {t("publishJob")}
                          </Button>
                        )}
                        {job.status === "published" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateJobStatusMutation.mutate({ id: job.id, status: "closed" })}
                            data-testid={`button-close-${job.id}`}
                          >
                            {t("closeJob")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { status: "submitted", label: t("submitted"), icon: Clock, color: "bg-blue-100 dark:bg-blue-900" },
              { status: "shortlisted", label: t("shortlisted"), icon: FileText, color: "bg-yellow-100 dark:bg-yellow-900" },
              { status: "interview_scheduled", label: t("interviewScheduled"), icon: Calendar, color: "bg-purple-100 dark:bg-purple-900" },
              { status: "offer_sent", label: t("offerSent"), icon: CheckCircle, color: "bg-green-100 dark:bg-green-900" },
              { status: "hired", label: t("hired"), icon: UserCheck, color: "bg-emerald-100 dark:bg-emerald-900" },
            ].map((stage) => {
              const stageApps = applications.filter(a => a.status === stage.status);
              return (
                <Card key={stage.status} className={stage.color}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <stage.icon className="h-4 w-4" />
                      <CardTitle className="text-sm">{stage.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{stageApps.length}</p>
                    <div className="mt-2 space-y-1">
                      {stageApps.slice(0, 3).map((app) => (
                        <div key={app.id} className="truncate text-xs">
                          {getApplicantName(app)}
                        </div>
                      ))}
                      {stageApps.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{stageApps.length - 3} more
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
