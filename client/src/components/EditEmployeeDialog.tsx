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
import type { Employee, Department } from "@shared/schema";

const employeeFormSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  fullNameAr: z.string().optional(),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
  position: z.string().optional(),
  positionAr: z.string().optional(),
  hireDate: z.string().optional(),
  salary: z.number().min(0).optional(),
  status: z.enum(["active", "inactive", "terminated"]).default("active"),
});

type EmployeeFormData = z.infer<typeof employeeFormSchema>;

interface EditEmployeeDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEmployeeDialog({ employee, open, onOpenChange, onSuccess }: EditEmployeeDialogProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      fullName: "",
      fullNameAr: "",
      email: "",
      phone: "",
      departmentId: "",
      position: "",
      positionAr: "",
      hireDate: "",
      salary: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (employee) {
      form.reset({
        fullName: employee.fullName,
        fullNameAr: employee.fullNameAr || "",
        email: employee.email,
        phone: employee.phone || "",
        departmentId: employee.departmentId || "",
        position: employee.position || "",
        positionAr: employee.positionAr || "",
        hireDate: employee.hireDate || "",
        salary: employee.salary || 0,
        status: employee.status || "active",
      });
    }
  }, [employee, form]);

  const updateEmployee = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      const response = await apiRequest("PATCH", `/api/employees/${employee?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees", employee?.id] });
      toast({
        title: isRTL ? "تم الحفظ" : "Saved",
        description: isRTL ? "تم حفظ بيانات الموظف بنجاح" : "Employee information saved successfully",
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

  const onSubmit = (data: EmployeeFormData) => {
    updateEmployee.mutate(data);
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return "";
    return isRTL ? dept.nameAr : dept.name;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isRTL ? "تعديل بيانات الموظف" : "Edit Employee"}</DialogTitle>
          <DialogDescription>
            {isRTL ? "تعديل معلومات الموظف" : "Update employee information"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الاسم" : "Full Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-full-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullNameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الاسم بالعربية" : "Arabic Name"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-full-name-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "البريد الإلكتروني" : "Email"}</FormLabel>
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
                    <FormLabel>{isRTL ? "الهاتف" : "Phone"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "المنصب" : "Position"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-position" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="positionAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "المنصب بالعربية" : "Arabic Position"}</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-position-ar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "القسم" : "Department"}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder={isRTL ? "اختر القسم" : "Select department"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {isRTL ? dept.nameAr : dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="terminated">{isRTL ? "منتهي" : "Terminated"}</SelectItem>
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
                name="hireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "تاريخ التوظيف" : "Hire Date"}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-hire-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRTL ? "الراتب (ريال)" : "Salary (SAR)"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-salary" 
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
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                type="submit" 
                disabled={updateEmployee.isPending}
                data-testid="button-save-employee"
              >
                {updateEmployee.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                {isRTL ? "حفظ" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
