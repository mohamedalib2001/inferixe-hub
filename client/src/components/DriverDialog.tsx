import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Driver, Employee } from "@shared/schema";

const driverFormSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().optional(),
  licenseType: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
  violations: z.number().min(0).default(0),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

interface DriverDialogProps {
  driver?: Driver | null;
  mode: "view" | "edit" | "create";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DriverDialog({ driver, mode, open, onOpenChange, onSuccess }: DriverDialogProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(mode === "edit" || mode === "create");

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      employeeId: "",
      licenseNumber: "",
      licenseExpiry: "",
      licenseType: "",
      status: "active",
      violations: 0,
    },
  });

  useEffect(() => {
    if (driver && mode !== "create") {
      form.reset({
        employeeId: driver.employeeId,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: driver.licenseExpiry || "",
        licenseType: driver.licenseType || "",
        status: driver.status || "active",
        violations: driver.violations || 0,
      });
    } else if (mode === "create") {
      form.reset({
        employeeId: "",
        licenseNumber: "",
        licenseExpiry: "",
        licenseType: "",
        status: "active",
        violations: 0,
      });
    }
    setIsEditing(mode === "edit" || mode === "create");
  }, [driver, mode, form]);

  const updateDriver = useMutation({
    mutationFn: async (data: DriverFormData) => {
      if (mode === "create") {
        const response = await apiRequest("POST", "/api/drivers", data);
        return response.json();
      } else {
        const response = await apiRequest("PATCH", `/api/drivers/${driver?.id}`, data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: isRTL ? "تم الحفظ" : "Saved",
        description: isRTL ? "تم حفظ بيانات السائق بنجاح" : "Driver information saved successfully",
      });
      onOpenChange(false);
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

  const onSubmit = (data: DriverFormData) => {
    updateDriver.mutate(data);
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return empId;
    return isRTL && emp.fullNameAr ? emp.fullNameAr : emp.fullName;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(isRTL ? "ar-SA" : "en-US");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" 
              ? (isRTL ? "إضافة سائق جديد" : "Add New Driver")
              : mode === "edit" || isEditing
              ? (isRTL ? "تعديل بيانات السائق" : "Edit Driver")
              : (isRTL ? "تفاصيل السائق" : "Driver Details")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? (isRTL ? "أدخل بيانات السائق الجديد" : "Enter new driver information")
              : (isRTL ? "عرض وتعديل بيانات السائق" : "View and edit driver information")}
          </DialogDescription>
        </DialogHeader>

        {mode === "view" && !isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "الموظف" : "Employee"}</p>
                <p className="font-medium">{getEmployeeName(driver?.employeeId || "")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "رقم الرخصة" : "License Number"}</p>
                <p className="font-medium font-mono">{driver?.licenseNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "نوع الرخصة" : "License Type"}</p>
                <p className="font-medium">{driver?.licenseType || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "تاريخ الانتهاء" : "Expiry Date"}</p>
                <p className="font-medium">{formatDate(driver?.licenseExpiry)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "الحالة" : "Status"}</p>
                <p className="font-medium capitalize">{driver?.status || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "المخالفات" : "Violations"}</p>
                <p className="font-medium">{driver?.violations || 0}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
                {isRTL ? "إغلاق" : "Close"}
              </Button>
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-driver">
                {isRTL ? "تعديل" : "Edit"}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الموظف" : "Employee"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-employee">
                          <SelectValue placeholder={isRTL ? "اختر الموظف" : "Select employee"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {isRTL && emp.fullNameAr ? emp.fullNameAr : emp.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "رقم الرخصة" : "License Number"}</FormLabel>
                      <FormControl>
                        <Input placeholder="DL-2024-001" {...field} data-testid="input-license-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licenseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "نوع الرخصة" : "License Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-license-type">
                            <SelectValue placeholder={isRTL ? "اختر النوع" : "Select type"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Heavy Vehicle">{isRTL ? "مركبة ثقيلة" : "Heavy Vehicle"}</SelectItem>
                          <SelectItem value="Commercial">{isRTL ? "تجاري" : "Commercial"}</SelectItem>
                          <SelectItem value="Light Vehicle">{isRTL ? "مركبة خفيفة" : "Light Vehicle"}</SelectItem>
                          <SelectItem value="Motorcycle">{isRTL ? "دراجة نارية" : "Motorcycle"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="licenseExpiry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "تاريخ الانتهاء" : "Expiry Date"}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-license-expiry" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="active">{isRTL ? "نشط" : "Active"}</SelectItem>
                          <SelectItem value="inactive">{isRTL ? "غير نشط" : "Inactive"}</SelectItem>
                          <SelectItem value="suspended">{isRTL ? "معلق" : "Suspended"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="violations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "عدد المخالفات" : "Violations"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-violations" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (mode === "view") {
                      setIsEditing(false);
                    } else {
                      onOpenChange(false);
                    }
                  }}
                  data-testid="button-cancel"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDriver.isPending}
                  data-testid="button-save-driver"
                >
                  {updateDriver.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {isRTL ? "حفظ" : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
