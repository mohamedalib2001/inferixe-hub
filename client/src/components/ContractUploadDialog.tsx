import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  User,
  FileUp,
} from "lucide-react";

interface ContractAnalysisResult {
  contractNumber: string | null;
  contractType: "commercial_lease" | "unit_lease" | "long_term_lease" | null;
  startDate: string | null;
  endDate: string | null;
  monthlyRent: number | null;
  annualRent: number | null;
  currency: string;
  lessor: {
    name: string | null;
    nameAr: string | null;
    idNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  lessee: {
    name: string | null;
    nameAr: string | null;
    idNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  property: {
    name: string | null;
    address: string | null;
    type: string | null;
    units: Array<{
      unitNumber: string | null;
      floor: number | null;
      area: number | null;
      rooms: number | null;
    }>;
  };
  paymentTerms: string | null;
  specialTerms: string | null;
  confidence: number;
  rawText: string;
}

interface ContractUploadDialogProps {
  trigger: React.ReactNode;
  onAnalysisComplete?: (result: ContractAnalysisResult) => void;
}

export function ContractUploadDialog({ trigger, onAnalysisComplete }: ContractUploadDialogProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [contractText, setContractText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/contracts/analyze", { text });
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
      onAnalysisComplete?.(data);
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
      const response = await apiRequest("POST", "/api/contracts/analyze", { imageBase64, mimeType });
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
      onAnalysisComplete?.(data);
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "فشل التحليل" : "Analysis Failed",
        description: error.message || (isRTL ? "حدث خطأ أثناء تحليل صورة العقد" : "An error occurred while analyzing the contract image"),
        variant: "destructive",
      });
    },
  });

  const extractPdfMutation = useMutation({
    mutationFn: async (pdfBase64: string) => {
      const response = await apiRequest("POST", "/api/contracts/extract-pdf", { pdfBase64 });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Extraction failed" }));
        throw new Error(errorData.message || "Extraction failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedPdfText(data.text);
      toast({
        title: isRTL ? "تم استخراج النص" : "Text Extracted",
        description: isRTL 
          ? `تم استخراج النص من ${data.numPages} صفحة`
          : `Text extracted from ${data.numPages} page(s)`,
      });
      analyzeTextMutation.mutate(data.text);
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "فشل الاستخراج" : "Extraction Failed",
        description: error.message || (isRTL ? "حدث خطأ أثناء استخراج النص من ملف PDF" : "An error occurred while extracting text from PDF"),
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
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

      // Validate file size (10MB max)
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

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: isRTL ? "صيغة غير مدعومة" : "Unsupported Format",
          description: isRTL 
            ? "يرجى رفع ملف PDF فقط"
            : "Please upload a PDF file only",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB max)
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

      setSelectedPdf(file);
      setExtractedPdfText(null);
      setAnalysisResult(null);
    }
  };

  const handleAnalyzePdf = async () => {
    if (!selectedPdf) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      extractPdfMutation.mutate(base64);
    };
    reader.readAsDataURL(selectedPdf);
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
      analyzeImageMutation.mutate({ 
        imageBase64: base64, 
        mimeType: selectedFile.type 
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const resetDialog = () => {
    setContractText("");
    setSelectedFile(null);
    setSelectedPdf(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setExtractedPdfText(null);
  };

  const isAnalyzing = analyzeTextMutation.isPending || analyzeImageMutation.isPending || extractPdfMutation.isPending;

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
    switch (type) {
      case "commercial_lease": return isRTL ? "إيجار تجاري" : "Commercial Lease";
      case "unit_lease": return isRTL ? "إيجار وحدة" : "Unit Lease";
      case "long_term_lease": return isRTL ? "إيجار طويل الأجل" : "Long Term Lease";
      default: return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetDialog(); }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isRTL ? "تحليل العقد" : "Contract Analysis"}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? "قم برفع صورة العقد أو لصق نصه لاستخراج البيانات تلقائياً باستخدام الذكاء الاصطناعي"
              : "Upload a contract image or paste text to automatically extract data using AI"
            }
          </DialogDescription>
        </DialogHeader>

        {!analysisResult ? (
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pdf" data-testid="tab-pdf-upload">
                <FileUp className="h-4 w-4 me-2" />
                {isRTL ? "رفع PDF" : "Upload PDF"}
              </TabsTrigger>
              <TabsTrigger value="image" data-testid="tab-image-upload">
                <Image className="h-4 w-4 me-2" />
                {isRTL ? "رفع صورة" : "Upload Image"}
              </TabsTrigger>
              <TabsTrigger value="text" data-testid="tab-text-input">
                <FileText className="h-4 w-4 me-2" />
                {isRTL ? "لصق النص" : "Paste Text"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
                onClick={() => pdfInputRef.current?.click()}
                data-testid="dropzone-pdf"
              >
                <input
                  type="file"
                  ref={pdfInputRef}
                  accept="application/pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                  data-testid="input-pdf"
                />
                {selectedPdf ? (
                  <div className="space-y-4">
                    <FileUp className="h-16 w-16 mx-auto text-primary" />
                    <p className="text-lg font-medium">{selectedPdf.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedPdf.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileUp className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {isRTL ? "انقر لرفع ملف العقد PDF" : "Click to upload contract PDF"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "PDF (حد أقصى 10MB)" : "PDF (max 10MB)"}
                    </p>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={handleAnalyzePdf}
                disabled={!selectedPdf || isAnalyzing}
                data-testid="button-analyze-pdf"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 me-2" />
                )}
                {isRTL ? "تحليل الملف" : "Analyze PDF"}
              </Button>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone-image"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file"
                />
                {previewUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={previewUrl} 
                      alt="Contract preview" 
                      className="max-h-64 mx-auto rounded-lg border"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {isRTL ? "انقر لرفع صورة العقد" : "Click to upload contract image"}
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
                data-testid="button-analyze-image"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 me-2" />
                )}
                {isRTL ? "تحليل الصورة" : "Analyze Image"}
              </Button>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contract-text">
                  {isRTL ? "نص العقد" : "Contract Text"}
                </Label>
                <Textarea
                  id="contract-text"
                  placeholder={isRTL ? "الصق نص العقد هنا..." : "Paste contract text here..."}
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="min-h-[200px]"
                  data-testid="textarea-contract-text"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleAnalyzeText}
                disabled={!contractText.trim() || isAnalyzing}
                data-testid="button-analyze-text"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 me-2" />
                )}
                {isRTL ? "تحليل النص" : "Analyze Text"}
              </Button>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium">
                  {isRTL ? "تم استخراج البيانات" : "Data Extracted"}
                </span>
              </div>
              <Badge variant={analysisResult.confidence > 0.8 ? "default" : "secondary"}>
                {isRTL ? `ثقة ${Math.round(analysisResult.confidence * 100)}%` : `${Math.round(analysisResult.confidence * 100)}% confidence`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{isRTL ? "بيانات العقد" : "Contract Details"}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "رقم العقد" : "Contract #"}</span>
                      <span className="font-medium">{analysisResult.contractNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "النوع" : "Type"}</span>
                      <span className="font-medium">{getContractTypeLabel(analysisResult.contractType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "البداية" : "Start"}</span>
                      <span className="font-medium">{analysisResult.startDate || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "النهاية" : "End"}</span>
                      <span className="font-medium">{analysisResult.endDate || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="font-medium">{isRTL ? "المالية" : "Financial"}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الإيجار الشهري" : "Monthly Rent"}</span>
                      <span className="font-medium">{formatCurrency(analysisResult.monthlyRent, analysisResult.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الإيجار السنوي" : "Annual Rent"}</span>
                      <span className="font-medium">{formatCurrency(analysisResult.annualRent, analysisResult.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "شروط الدفع" : "Payment Terms"}</span>
                      <span className="font-medium text-end max-w-[150px] truncate">{analysisResult.paymentTerms || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{isRTL ? "المؤجر" : "Lessor"}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الاسم" : "Name"}</span>
                      <span className="font-medium">{isRTL ? (analysisResult.lessor.nameAr || analysisResult.lessor.name) : analysisResult.lessor.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الهوية" : "ID"}</span>
                      <span className="font-medium">{analysisResult.lessor.idNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الهاتف" : "Phone"}</span>
                      <span className="font-medium">{analysisResult.lessor.phone || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{isRTL ? "المستأجر" : "Lessee"}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الاسم" : "Name"}</span>
                      <span className="font-medium">{isRTL ? (analysisResult.lessee.nameAr || analysisResult.lessee.name) : analysisResult.lessee.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الهوية" : "ID"}</span>
                      <span className="font-medium">{analysisResult.lessee.idNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRTL ? "الهاتف" : "Phone"}</span>
                      <span className="font-medium">{analysisResult.lessee.phone || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analysisResult.property && (
                <Card className="md:col-span-2">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-medium">{isRTL ? "العقار" : "Property"}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRTL ? "الاسم" : "Name"}</span>
                        <span className="font-medium">{analysisResult.property.name || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRTL ? "العنوان" : "Address"}</span>
                        <span className="font-medium">{analysisResult.property.address || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{isRTL ? "النوع" : "Type"}</span>
                        <span className="font-medium">{analysisResult.property.type || "-"}</span>
                      </div>
                      {analysisResult.property.units?.length > 0 && (
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground block mb-2">{isRTL ? "الوحدات" : "Units"}</span>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.property.units.map((unit, idx) => (
                              <Badge key={idx} variant="secondary">
                                {unit.unitNumber || `Unit ${idx + 1}`}
                                {unit.area && ` - ${unit.area}m²`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetDialog} data-testid="button-analyze-another">
                {isRTL ? "تحليل عقد آخر" : "Analyze Another"}
              </Button>
              <Button onClick={() => setOpen(false)} data-testid="button-use-data">
                {isRTL ? "استخدام البيانات" : "Use Data"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
