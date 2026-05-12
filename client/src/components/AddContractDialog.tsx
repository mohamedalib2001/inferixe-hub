import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const contractFormSchema = z.object({
  contractNumber: z.string().min(1, "Contract number is required"),
  type: z.enum(["commercial_lease", "unit_lease", "long_term_lease"]),
  status: z.enum(["draft", "pending", "active", "expired", "terminated"]).default("draft"),
  title: z.string().min(1, "Title is required"),
  titleAr: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  signingDate: z.string().optional(),
  annualRent: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface AddContractDialogProps {
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function AddContractDialog({ trigger, onSuccess }: AddContractDialogProps) {
  const [open, setOpen] = useState(false);
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      contractNumber: "",
      type: "commercial_lease",
      status: "draft",
      title: "",
      titleAr: "",
      description: "",
      startDate: "",
      endDate: "",
      signingDate: "",
      annualRent: 0,
      deposit: 0,
    },
  });

  const createContract = useMutation({
    mutationFn: async (data: ContractFormData) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/stats"] });
      toast({
        title: isRTL ? "تم إنشاء العقد" : "Contract Created",
        description: isRTL ? "تم إنشاء العقد بنجاح" : "Contract has been created successfully",
      });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContractFormData) => {
    createContract.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "إضافة عقد جديد" : "Add New Contract"}</DialogTitle>
          <DialogDescription>
            {isRTL ? "أدخل تفاصيل العقد الجديد" : "Enter the details for the new contract"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contractNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "رقم العقد" : "Contract Number"}</FormLabel>
                    <FormControl>
                      <Input placeholder={isRTL ? "مثال: C-2026-001" : "e.g., C-2026-001"} {...field} data-testid="input-contract-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "نوع العقد" : "Contract Type"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contract-type">
                          <SelectValue placeholder={isRTL ? "اختر النوع" : "Select type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="commercial_lease">{isRTL ? "إيجار تجاري" : "Commercial Lease"}</SelectItem>
                        <SelectItem value="unit_lease">{isRTL ? "إيجار وحدة" : "Unit Lease"}</SelectItem>
                        <SelectItem value="long_term_lease">{isRTL ? "إيجار طويل الأمد" : "Long Term Lease"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "عنوان العقد" : "Contract Title"}</FormLabel>
                    <FormControl>
                      <Input placeholder={isRTL ? "عنوان العقد" : "Contract title"} {...field} data-testid="input-contract-title" />
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
                    <FormLabel>{isRTL ? "عنوان العقد بالعربية" : "Arabic Title"}</FormLabel>
                    <FormControl>
                      <Input placeholder={isRTL ? "عنوان العقد بالعربية" : "Arabic title"} {...field} data-testid="input-contract-title-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "الوصف" : "Description"}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isRTL ? "وصف العقد..." : "Contract description..."} 
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الحالة" : "Status"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder={isRTL ? "اختر الحالة" : "Select status"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{isRTL ? "مسودة" : "Draft"}</SelectItem>
                        <SelectItem value="pending">{isRTL ? "قيد الانتظار" : "Pending"}</SelectItem>
                        <SelectItem value="active">{isRTL ? "نشط" : "Active"}</SelectItem>
                        <SelectItem value="expired">{isRTL ? "منتهي" : "Expired"}</SelectItem>
                        <SelectItem value="terminated">{isRTL ? "ملغى" : "Terminated"}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "تاريخ التوقيع" : "Signing Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-signing-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "تاريخ البدء" : "Start Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-start-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "تاريخ الانتهاء" : "End Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-end-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="annualRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الإيجار السنوي (ريال)" : "Annual Rent (SAR)"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-annual-rent" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "مبلغ التأمين (ريال)" : "Deposit (SAR)"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-deposit" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={createContract.isPending}
                data-testid="button-submit-contract"
              >
                {createContract.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {isRTL ? "إنشاء العقد" : "Create Contract"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
