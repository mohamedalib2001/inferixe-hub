import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  Briefcase,
  Calendar,
  DollarSign,
  User,
  Building2,
  Clock,
  Banknote,
  Save,
} from "lucide-react";

export interface EmploymentContractAnalysisResult {
  contractNumber: string | null;
  contractType: "definite" | "indefinite" | null;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  workStartDate: string | null;
  signedLocation: string | null;
  signedLocationAr: string | null;
  employer: {
    name: string | null;
    nameAr: string | null;
    type: string | null;
    typeAr: string | null;
    nationalId: string | null;
    address: string | null;
    addressAr: string | null;
    phone: string | null;
    email: string | null;
    representativeName: string | null;
    representativeNameAr: string | null;
    representativeId: string | null;
    representativeTitle: string | null;
    representativeTitleAr: string | null;
  };
  employee: {
    name: string | null;
    nameAr: string | null;
    nationality: string | null;
    nationalityAr: string | null;
    idNumber: string | null;
    gender: string | null;
    maritalStatus: string | null;
    dateOfBirth: string | null;
    address: string | null;
    addressAr: string | null;
    qualification: string | null;
    qualificationAr: string | null;
    specialization: string | null;
    specializationAr: string | null;
    phone: string | null;
    email: string | null;
  };
  job: {
    title: string | null;
    titleAr: string | null;
    profession: string | null;
    professionAr: string | null;
    workLocation: string | null;
    workLocationAr: string | null;
    workScope: string | null;
    workScopeAr: string | null;
    isPartTime: boolean;
  };
  duration: {
    days: number | null;
    autoRenewal: boolean;
    probationDays: number | null;
    probationTerms: string | null;
    probationTermsAr: string | null;
  };
  workSchedule: {
    daysPerWeek: number | null;
    hoursPerDay: number | null;
    restDay: string | null;
    restDayAr: string | null;
    annualLeaveDays: number | null;
  };
  compensation: {
    basicSalary: number | null;
    housingAllowance: number | null;
    transportAllowance: number | null;
    otherAllowances: number | null;
    totalMonthlySalary: number | null;
    paymentDueDay: number | null;
    paymentMethod: string | null;
    paymentMethodAr: string | null;
    currency: string;
  };
  bank: {
    name: string | null;
    nameAr: string | null;
    iban: string | null;
  };
  obligations: {
    employer: string | null;
    employerAr: string | null;
    employee: string | null;
    employeeAr: string | null;
  };
  confidence: number;
  rawText: string;
}

interface EmploymentContractUploadDialogProps {
  employeeId: string;
  trigger: React.ReactNode;
  onContractSaved?: () => void;
}

export function EmploymentContractUploadDialog({ 
  employeeId, 
  trigger, 
  onContractSaved 
}: EmploymentContractUploadDialogProps) {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [open, setOpen] = useState(false);
  const [contractText, setContractText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<EmploymentContractAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/contracts/analyze`, { text });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Analysis failed" }));
        throw new Error(errorData.message || "Analysis failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: isRTL ? "تم التحليل بنجاح" : "Analysis Complete",
        description: isRTL 
          ? `تم استخراج البيانات بنسبة ثقة ${Math.round(data.confidence * 100)}%`
          : `Data extracted with ${Math.round(data.confidence * 100)}% confidence`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "فشل التحليل" : "Analysis Failed",
        description: error.message || (isRTL ? "حدث خطأ أثناء تحليل العقد" : "An error occurred while analyzing the contract"),
        variant: "destructive",
      });
    },
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async ({ imageBase64, mimeType }: { imageBase64: string; mimeType: string }) => {
      const response = await apiRequest("POST", `/api/employees/${employeeId}/contracts/analyze`, { imageBase64, mimeType });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Analysis failed" }));
        throw new Error(errorData.message || "Analysis failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: isRTL ? "تم التحليل بنجاح" : "Analysis Complete",
        description: isRTL 
          ? `تم استخراج البيانات بنسبة ثقة ${Math.round(data.confidence * 100)}%`
          : `Data extracted with ${Math.round(data.confidence * 100)}% confidence`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "فشل التحليل" : "Analysis Failed",
        description: error.message || (isRTL ? "حدث خطأ أثناء تحليل صورة العقد" : "An error occurred while analyzing the contract image"),
        variant: "destructive",
      });
    },
  });

  const saveContractMutation = useMutation({
    mutationFn: async (data: EmploymentContractAnalysisResult) => {
      const contractData = {
        contractNumber: data.contractNumber,
        contractType: data.contractType,
        signedDate: data.signedDate,
        startDate: data.startDate,
        endDate: data.endDate,
        workStartDate: data.workStartDate,
        signedLocation: data.signedLocation,
        signedLocationAr: data.signedLocationAr,
        employerName: data.employer.name,
        employerNameAr: data.employer.nameAr,
        employerType: data.employer.type,
        employerTypeAr: data.employer.typeAr,
        employerNationalId: data.employer.nationalId,
        employerAddress: data.employer.address,
        employerAddressAr: data.employer.addressAr,
        employerPhone: data.employer.phone,
        employerEmail: data.employer.email,
        employerRepName: data.employer.representativeName,
        employerRepNameAr: data.employer.representativeNameAr,
        employerRepId: data.employer.representativeId,
        employerRepTitle: data.employer.representativeTitle,
        employerRepTitleAr: data.employer.representativeTitleAr,
        employeeName: data.employee.name,
        employeeNameAr: data.employee.nameAr,
        nationality: data.employee.nationality,
        nationalityAr: data.employee.nationalityAr,
        employeeIdNumber: data.employee.idNumber,
        gender: data.employee.gender,
        maritalStatus: data.employee.maritalStatus,
        dateOfBirth: data.employee.dateOfBirth,
        employeeAddress: data.employee.address,
        employeeAddressAr: data.employee.addressAr,
        qualification: data.employee.qualification,
        qualificationAr: data.employee.qualificationAr,
        specialization: data.employee.specialization,
        specializationAr: data.employee.specializationAr,
        employeePhone: data.employee.phone,
        employeeEmail: data.employee.email,
        jobTitle: data.job.title,
        jobTitleAr: data.job.titleAr,
        profession: data.job.profession,
        professionAr: data.job.professionAr,
        workLocation: data.job.workLocation,
        workLocationAr: data.job.workLocationAr,
        workScope: data.job.workScope,
        workScopeAr: data.job.workScopeAr,
        isPartTime: data.job.isPartTime,
        durationDays: data.duration.days,
        autoRenewal: data.duration.autoRenewal,
        probationDays: data.duration.probationDays,
        probationTerms: data.duration.probationTerms,
        probationTermsAr: data.duration.probationTermsAr,
        workDaysPerWeek: data.workSchedule.daysPerWeek,
        workHoursPerDay: data.workSchedule.hoursPerDay,
        restDay: data.workSchedule.restDay,
        restDayAr: data.workSchedule.restDayAr,
        annualLeaveDays: data.workSchedule.annualLeaveDays,
        basicSalary: data.compensation.basicSalary?.toString(),
        housingAllowance: data.compensation.housingAllowance?.toString(),
        transportAllowance: data.compensation.transportAllowance?.toString(),
        otherAllowances: data.compensation.otherAllowances?.toString(),
        totalMonthlySalary: data.compensation.totalMonthlySalary?.toString(),
        paymentDueDay: data.compensation.paymentDueDay,
        paymentMethod: data.compensation.paymentMethod,
        paymentMethodAr: data.compensation.paymentMethodAr,
        currency: data.compensation.currency,
        bankName: data.bank.name,
        bankNameAr: data.bank.nameAr,
        iban: data.bank.iban,
        employerObligations: data.obligations.employer,
        employerObligationsAr: data.obligations.employerAr,
        employeeObligations: data.obligations.employee,
        employeeObligationsAr: data.obligations.employeeAr,
        aiConfidence: data.confidence.toString(),
        rawText: data.rawText,
        status: "active",
      };
      
      const response = await apiRequest("POST", `/api/employees/${employeeId}/contracts`, contractData);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Save failed" }));
        throw new Error(errorData.message || "Save failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employeeId, "contracts"] });
      toast({
        title: isRTL ? "تم الحفظ بنجاح" : "Saved Successfully",
        description: isRTL ? "تم حفظ عقد العمل في ملف الموظف" : "Employment contract saved to employee profile",
      });
      setOpen(false);
      resetDialog();
      onContractSaved?.();
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "فشل الحفظ" : "Save Failed",
        description: error.message || (isRTL ? "حدث خطأ أثناء حفظ العقد" : "An error occurred while saving the contract"),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        toast({
          title: isRTL ? "صيغة غير مدعومة" : "Unsupported Format",
          description: isRTL 
            ? "لا يمكن تحليل ملفات PDF مباشرة. يرجى نسخ النص من الملف واستخدام خيار لصق النص"
            : "PDF files cannot be analyzed directly. Please copy the text and use the paste text option",
          variant: "destructive",
        });
        return;
      }

      const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: isRTL ? "صيغة غير مدعومة" : "Unsupported Format",
          description: isRTL 
            ? "يرجى رفع صورة بصيغة PNG, JPG, أو WEBP"
            : "Please upload an image in PNG, JPG, or WEBP format",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: isRTL ? "الملف كبير جداً" : "File Too Large",
          description: isRTL 
            ? "الحد الأقصى لحجم الملف هو 10 ميجابايت"
            : "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeText = () => {
    if (contractText.trim().length < 50) {
      toast({
        title: isRTL ? "نص غير كافٍ" : "Insufficient Text",
        description: isRTL ? "يرجى إدخال نص العقد كاملاً" : "Please enter the complete contract text",
        variant: "destructive",
      });
      return;
    }
    analyzeTextMutation.mutate(contractText);
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      analyzeImageMutation.mutate({ imageBase64: base64, mimeType: selectedFile.type });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSaveContract = () => {
    if (analysisResult) {
      saveContractMutation.mutate(analysisResult);
    }
  };

  const resetDialog = () => {
    setContractText("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
  };

  const isAnalyzing = analyzeTextMutation.isPending || analyzeImageMutation.isPending;
  const isSaving = saveContractMutation.isPending;

  const formatCurrency = (amount: number | null, currency: string) => {
    if (!amount) return "-";
    return new Intl.NumberFormat(isRTL ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: currency || "SAR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getContractTypeLabel = (type: string | null) => {
    if (!type) return "-";
    return type === "definite" 
      ? (isRTL ? "محدد المدة" : "Fixed Term")
      : (isRTL ? "غير محدد المدة" : "Indefinite");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetDialog(); }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle data-testid="text-employment-contract-dialog-title">
            {isRTL ? "تحليل عقد العمل" : "Employment Contract Analysis"}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? "قم برفع صورة عقد العمل أو لصق نصه لاستخراج البيانات تلقائياً (معايير قوى/نظام العمل السعودي)"
              : "Upload an employment contract image or paste text to extract data automatically (Qiwa/Saudi Labor Law standards)"
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {!analysisResult ? (
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image" data-testid="tab-employment-image-upload">
                  <Image className="h-4 w-4 me-2" />
                  {isRTL ? "رفع صورة" : "Upload Image"}
                </TabsTrigger>
                <TabsTrigger value="text" data-testid="tab-employment-text-input">
                  <FileText className="h-4 w-4 me-2" />
                  {isRTL ? "لصق النص" : "Paste Text"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-employment-image"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-employment-file"
                  />
                  {previewUrl ? (
                    <div className="space-y-4">
                      <img src={previewUrl} alt="Contract preview" className="max-h-64 mx-auto rounded-lg border" />
                      <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-lg font-medium">
                        {isRTL ? "انقر لرفع صورة عقد العمل" : "Click to upload employment contract image"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? "PNG, JPG, WEBP (حد أقصى 10MB)" : "PNG, JPG, WEBP (max 10MB)"}
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleAnalyzeImage}
                  disabled={!selectedFile || isAnalyzing}
                  data-testid="button-analyze-employment-image"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <CheckCircle className="h-4 w-4 me-2" />}
                  {isRTL ? "تحليل الصورة" : "Analyze Image"}
                </Button>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employment-contract-text">
                    {isRTL ? "نص عقد العمل" : "Employment Contract Text"}
                  </Label>
                  <Textarea
                    id="employment-contract-text"
                    placeholder={isRTL ? "الصق نص عقد العمل هنا..." : "Paste employment contract text here..."}
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    className="min-h-[200px]"
                    data-testid="textarea-employment-contract-text"
                  />
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleAnalyzeText}
                  disabled={!contractText.trim() || isAnalyzing}
                  data-testid="button-analyze-employment-text"
                >
                  {isAnalyzing ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <CheckCircle className="h-4 w-4 me-2" />}
                  {isRTL ? "تحليل النص" : "Analyze Text"}
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6 p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{isRTL ? "تم استخراج البيانات" : "Data Extracted"}</span>
                </div>
                <Badge variant={analysisResult.confidence > 0.8 ? "default" : "secondary"}>
                  {isRTL ? `ثقة ${Math.round(analysisResult.confidence * 100)}%` : `${Math.round(analysisResult.confidence * 100)}% confidence`}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "بيانات العقد" : "Contract Info"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "رقم العقد" : "Contract #"}</span>
                        <span className="font-medium truncate">{analysisResult.contractNumber || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "النوع" : "Type"}</span>
                        <span className="font-medium">{getContractTypeLabel(analysisResult.contractType)}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "تاريخ التوقيع" : "Signed"}</span>
                        <span className="font-medium">{analysisResult.signedDate || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "البداية" : "Start"}</span>
                        <span className="font-medium">{analysisResult.startDate || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "النهاية" : "End"}</span>
                        <span className="font-medium">{analysisResult.endDate || "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "صاحب العمل" : "Employer"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الاسم" : "Name"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.employer.nameAr || analysisResult.employer.name) : analysisResult.employer.name || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "السجل" : "ID"}</span>
                        <span className="font-medium">{analysisResult.employer.nationalId || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الممثل" : "Rep"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.employer.representativeNameAr || analysisResult.employer.representativeName) : analysisResult.employer.representativeName || "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "الموظف" : "Employee"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الاسم" : "Name"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.employee.nameAr || analysisResult.employee.name) : analysisResult.employee.name || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الهوية" : "ID"}</span>
                        <span className="font-medium">{analysisResult.employee.idNumber || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الجنسية" : "Nationality"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.employee.nationalityAr || analysisResult.employee.nationality) : analysisResult.employee.nationality || "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "الوظيفة" : "Job Details"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "المسمى" : "Title"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.job.titleAr || analysisResult.job.title) : analysisResult.job.title || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "المهنة" : "Profession"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.job.professionAr || analysisResult.job.profession) : analysisResult.job.profession || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "مكان العمل" : "Location"}</span>
                        <span className="font-medium truncate">{isRTL ? (analysisResult.job.workLocationAr || analysisResult.job.workLocation) : analysisResult.job.workLocation || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "دوام جزئي" : "Part-time"}</span>
                        <span className="font-medium">{analysisResult.job.isPartTime ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "ساعات العمل" : "Work Schedule"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "أيام/أسبوع" : "Days/Week"}</span>
                        <span className="font-medium">{analysisResult.workSchedule.daysPerWeek || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "ساعات/يوم" : "Hours/Day"}</span>
                        <span className="font-medium">{analysisResult.workSchedule.hoursPerDay || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "يوم الراحة" : "Rest Day"}</span>
                        <span className="font-medium">{isRTL ? (analysisResult.workSchedule.restDayAr || analysisResult.workSchedule.restDay) : analysisResult.workSchedule.restDay || "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "الإجازة السنوية" : "Annual Leave"}</span>
                        <span className="font-medium">{analysisResult.workSchedule.annualLeaveDays ? `${analysisResult.workSchedule.annualLeaveDays} ${isRTL ? "يوم" : "days"}` : "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "المدة والتجربة" : "Duration & Probation"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "مدة العقد" : "Duration"}</span>
                        <span className="font-medium">{analysisResult.duration.days ? `${analysisResult.duration.days} ${isRTL ? "يوم" : "days"}` : "-"}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "تجديد تلقائي" : "Auto Renew"}</span>
                        <span className="font-medium">{analysisResult.duration.autoRenewal ? (isRTL ? "نعم" : "Yes") : (isRTL ? "لا" : "No")}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground shrink-0">{isRTL ? "فترة التجربة" : "Probation"}</span>
                        <span className="font-medium">{analysisResult.duration.probationDays ? `${analysisResult.duration.probationDays} ${isRTL ? "يوم" : "days"}` : "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "الراتب والبدلات" : "Salary & Allowances"}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "الراتب الأساسي" : "Basic Salary"}</span>
                        <span className="font-medium text-lg">{formatCurrency(analysisResult.compensation.basicSalary, analysisResult.compensation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "بدل السكن" : "Housing"}</span>
                        <span className="font-medium text-lg">{formatCurrency(analysisResult.compensation.housingAllowance, analysisResult.compensation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "بدل النقل" : "Transport"}</span>
                        <span className="font-medium text-lg">{formatCurrency(analysisResult.compensation.transportAllowance, analysisResult.compensation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "بدلات أخرى" : "Other"}</span>
                        <span className="font-medium text-lg">{formatCurrency(analysisResult.compensation.otherAllowances, analysisResult.compensation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "الإجمالي الشهري" : "Total Monthly"}</span>
                        <span className="font-medium text-lg text-green-600">{formatCurrency(analysisResult.compensation.totalMonthlySalary, analysisResult.compensation.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">{isRTL ? "يوم الصرف" : "Pay Day"}</span>
                        <span className="font-medium text-lg">{analysisResult.compensation.paymentDueDay || "-"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(analysisResult.bank.name || analysisResult.bank.iban) && (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Banknote className="h-4 w-4 text-primary" />
                        <span className="font-medium">{isRTL ? "بيانات البنك" : "Bank Details"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{isRTL ? "اسم البنك" : "Bank"}</span>
                          <span className="font-medium">{isRTL ? (analysisResult.bank.nameAr || analysisResult.bank.name) : analysisResult.bank.name || "-"}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground shrink-0">{isRTL ? "الآيبان" : "IBAN"}</span>
                          <span className="font-medium font-mono text-xs">{analysisResult.bank.iban || "-"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={resetDialog} data-testid="button-analyze-another-employment">
                  {isRTL ? "تحليل عقد آخر" : "Analyze Another"}
                </Button>
                <Button onClick={handleSaveContract} disabled={isSaving} data-testid="button-save-employment-contract">
                  {isSaving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
                  {isRTL ? "حفظ في الملف" : "Save to Profile"}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
