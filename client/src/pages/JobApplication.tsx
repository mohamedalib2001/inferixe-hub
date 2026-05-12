import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Briefcase, ArrowLeft, ArrowRight, User, Phone, GraduationCap, Award, FileText, Check, Plus, Trash2, Upload } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JobPosting } from "@shared/schema";

const applicationSchema = z.object({
  firstName: z.string().min(1, "Required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Required"),
  firstNameAr: z.string().optional(),
  middleNameAr: z.string().optional(),
  lastNameAr: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().min(8, "Invalid phone"),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  nationalId: z.string().optional(),
  passportNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  salaryExpectation: z.coerce.number().optional(),
  noticePeriod: z.string().optional(),
  availableFrom: z.string().optional(),
  coverLetter: z.string().optional(),
  additionalNotes: z.string().optional(),
  experiences: z.array(z.object({
    companyName: z.string().min(1, "Required"),
    jobTitle: z.string().min(1, "Required"),
    startDate: z.string().min(1, "Required"),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    responsibilities: z.string().optional(),
    reasonForLeaving: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string().min(1, "Required"),
    degree: z.string().min(1, "Required"),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    grade: z.string().optional(),
  })).optional(),
  skills: z.array(z.object({
    skillName: z.string().min(1, "Required"),
    proficiencyLevel: z.string().optional(),
    yearsOfExperience: z.coerce.number().optional(),
  })).optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const steps = [
  { id: 1, icon: User, labelKey: "personalInformation" },
  { id: 2, icon: Phone, labelKey: "contactInformation" },
  { id: 3, icon: Briefcase, labelKey: "workExperience" },
  { id: 4, icon: GraduationCap, labelKey: "educationBackground" },
  { id: 5, icon: Award, labelKey: "skillsAndCertificates" },
  { id: 6, icon: FileText, labelKey: "documents" },
];

export default function JobApplication() {
  const { t, isRTL } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [submittedAppNumber, setSubmittedAppNumber] = useState<string | null>(null);

  const { data: job, isLoading: jobLoading } = useQuery<JobPosting>({
    queryKey: ["/api/jobs", id],
    enabled: !!id,
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      experiences: [],
      education: [],
      skills: [],
    },
  });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({
    control: form.control,
    name: "experiences",
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const applicationData = {
        jobId: id,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        firstNameAr: data.firstNameAr,
        middleNameAr: data.middleNameAr,
        lastNameAr: data.lastNameAr,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        nationality: data.nationality,
        nationalId: data.nationalId,
        passportNumber: data.passportNumber,
        address: data.address,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
        salaryExpectation: data.salaryExpectation,
        noticePeriod: data.noticePeriod,
        availableFrom: data.availableFrom,
        coverLetter: data.coverLetter,
        additionalNotes: data.additionalNotes,
      };

      const res = await apiRequest("POST", "/api/applications", applicationData);
      const application = await res.json();

      if (data.experiences && data.experiences.length > 0) {
        for (const exp of data.experiences) {
          await apiRequest("POST", `/api/applications/${application.id}/experiences`, exp);
        }
      }

      if (data.education && data.education.length > 0) {
        for (const edu of data.education) {
          await apiRequest("POST", `/api/applications/${application.id}/education`, edu);
        }
      }

      if (data.skills && data.skills.length > 0) {
        for (const skill of data.skills) {
          await apiRequest("POST", `/api/applications/${application.id}/skills`, skill);
        }
      }

      return application;
    },
    onSuccess: (application) => {
      setSubmittedAppNumber(application.applicationNumber);
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: t("applicationSubmitted"),
        description: `${t("applicationNumber")}: ${application.applicationNumber}`,
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: ApplicationFormData) => {
    submitMutation.mutate(data);
  };

  const getJobTitle = (job: JobPosting) => isRTL ? (job.titleAr || job.title) : (job.title || job.titleAr);

  if (submittedAppNumber) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">{t("appName")}</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-lg text-center">
            <CardContent className="pt-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold" data-testid="text-application-submitted">
                {t("thankYouForApplying")}
              </h1>
              <p className="mb-4 text-muted-foreground">
                {t("applicationReceived")}
              </p>
              <div className="mb-6 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{t("applicationNumber")}</p>
                <p className="text-2xl font-bold text-primary" data-testid="text-application-number">
                  {submittedAppNumber}
                </p>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("applicationTrackingInfo")}
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/careers">
                  <Button variant="outline" data-testid="button-back-to-careers">
                    {t("careers")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto animate-pulse px-4 py-8">
          <div className="h-8 w-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 py-8 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">{t("noJobsAvailable")}</h1>
          <Link href="/careers">
            <Button className="mt-4" variant="outline">
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
            <Link href={`/careers/${id}`}>
              <Button variant="ghost" size="icon" data-testid="button-back-job">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold" data-testid="text-apply-title">
            {t("applyNow")}: {getJobTitle(job)}
          </h1>
          <p className="text-muted-foreground">{t("applicationForm")}</p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : currentStep > step.id
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t(step.labelKey as any)}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card className="mx-auto max-w-2xl">
              <CardHeader>
                <CardTitle>{t(steps[currentStep - 1].labelKey as any)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep === 1 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("firstName")} *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="middleName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("middleName")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-middle-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("lastName")} *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="firstNameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("firstNameAr")}</FormLabel>
                            <FormControl>
                              <Input {...field} dir="rtl" data-testid="input-first-name-ar" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="middleNameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("middleNameAr")}</FormLabel>
                            <FormControl>
                              <Input {...field} dir="rtl" data-testid="input-middle-name-ar" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastNameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("lastNameAr")}</FormLabel>
                            <FormControl>
                              <Input {...field} dir="rtl" data-testid="input-last-name-ar" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("dateOfBirth")}</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-dob" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("gender")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-gender">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">{t("male")}</SelectItem>
                                <SelectItem value="female">{t("female")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("nationality")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-nationality" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("idNumber")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-national-id" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("passportNumber")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-passport" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("email")} *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("phone")} *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="alternatePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("alternatePhone")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-alt-phone" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Separator />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("address")}</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("city")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("country")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-country" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("postalCode")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-postal" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    {experienceFields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="font-medium">{t("workExperience")} #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExperience(index)}
                            data-testid={`button-remove-exp-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`experiences.${index}.companyName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("companyName")} *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`experiences.${index}.jobTitle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("jobTitle")} *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`experiences.${index}.startDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("startDate")} *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`experiences.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("endDate")}</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`experiences.${index}.responsibilities`}
                          render={({ field }) => (
                            <FormItem className="mt-4">
                              <FormLabel>{t("responsibilities")}</FormLabel>
                              <FormControl>
                                <Textarea {...field} rows={3} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendExperience({ companyName: "", jobTitle: "", startDate: "" })}
                      className="w-full"
                      data-testid="button-add-experience"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addExperience")}
                    </Button>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    {educationFields.map((field, index) => (
                      <div key={field.id} className="rounded-lg border p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="font-medium">{t("educationBackground")} #{index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEducation(index)}
                            data-testid={`button-remove-edu-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`education.${index}.institution`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("institution")} *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`education.${index}.degree`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("degree")} *</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name={`education.${index}.fieldOfStudy`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("fieldOfStudy")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`education.${index}.grade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("grade")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendEducation({ institution: "", degree: "" })}
                      className="w-full"
                      data-testid="button-add-education"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addEducation")}
                    </Button>
                  </>
                )}

                {currentStep === 5 && (
                  <>
                    {skillFields.map((field, index) => (
                      <div key={field.id} className="flex items-end gap-4">
                        <FormField
                          control={form.control}
                          name={`skills.${index}.skillName`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>{t("skillName")} *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`skills.${index}.proficiencyLevel`}
                          render={({ field }) => (
                            <FormItem className="w-32">
                              <FormLabel>{t("proficiencyLevel")}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="beginner">{t("beginner")}</SelectItem>
                                  <SelectItem value="intermediate">{t("intermediate")}</SelectItem>
                                  <SelectItem value="advanced">{t("advanced")}</SelectItem>
                                  <SelectItem value="expert">{t("expert")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSkill(index)}
                          data-testid={`button-remove-skill-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendSkill({ skillName: "" })}
                      className="w-full"
                      data-testid="button-add-skill"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t("addSkill")}
                    </Button>
                    <Separator />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="salaryExpectation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("salaryExpectation")}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} data-testid="input-salary" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="noticePeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("noticePeriod")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 2 weeks" data-testid="input-notice" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="availableFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("availableFrom")}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-available" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {currentStep === 6 && (
                  <>
                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-2 font-medium">{t("uploadDocuments")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("dragAndDrop")} {t("orClickToUpload")}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("supportedFormats")}: PDF, DOC, DOCX, JPG, PNG
                      </p>
                      <input type="file" className="hidden" id="file-upload" multiple />
                      <Button type="button" variant="outline" className="mt-4" onClick={() => document.getElementById("file-upload")?.click()}>
                        {t("uploadDocuments")}
                      </Button>
                    </div>
                    <Separator />
                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("coverLetter")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={5} data-testid="input-cover-letter" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("additionalNotes")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} data-testid="input-notes" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <div className="mx-auto mt-6 flex max-w-2xl justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                data-testid="button-prev-step"
              >
                <ArrowLeft className={`mr-2 h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                {isRTL ? "التالي" : "Previous"}
              </Button>
              {currentStep < steps.length ? (
                <Button type="button" onClick={handleNext} data-testid="button-next-step">
                  {isRTL ? "السابق" : "Next"}
                  <ArrowRight className={`ml-2 h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {submitMutation.isPending ? t("loading") : t("submitApplication")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}
