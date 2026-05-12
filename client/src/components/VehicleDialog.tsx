import { useState, useEffect } from "react";
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
import type { Vehicle } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
  z.number().optional()
);

const vehicleFormSchema = z.object({
  plateNumber: z.string().min(1, "Plate number is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: optionalNumber.pipe(z.number().min(1900).max(2100).optional()),
  color: z.string().optional(),
  type: z.enum(["sedan", "suv", "truck", "van", "bus"]).default("sedan"),
  status: z.enum(["available", "in_use", "maintenance", "retired"]).default("available"),
  mileage: optionalNumber.pipe(z.number().min(0).optional()),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleDialogProps {
  vehicle?: Vehicle | null;
  mode: "view" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function VehicleDialog({ vehicle, mode, open, onOpenChange, onSuccess }: VehicleDialogProps) {
  const { language, isRTL } = useLanguage();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(mode === "edit");

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      plateNumber: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      type: "sedan",
      status: "available",
      mileage: 0,
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || "",
        type: vehicle.type || "sedan",
        status: vehicle.status || "available",
        mileage: vehicle.mileage || 0,
      });
    }
    setIsEditing(mode === "edit");
  }, [vehicle, mode, form]);

  const updateVehicle = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${vehicle?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: isRTL ? "تم الحفظ" : "Saved",
        description: isRTL ? "تم حفظ بيانات المركبة بنجاح" : "Vehicle information saved successfully",
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

  const onSubmit = (data: VehicleFormData) => {
    updateVehicle.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" || isEditing
              ? (isRTL ? "تعديل بيانات المركبة" : "Edit Vehicle")
              : (isRTL ? "تفاصيل المركبة" : "Vehicle Details")}
          </DialogTitle>
          <DialogDescription>
            {isRTL ? "عرض وتعديل بيانات المركبة" : "View and edit vehicle information"}
          </DialogDescription>
        </DialogHeader>

        {mode === "view" && !isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "رقم اللوحة" : "Plate Number"}</p>
                <p className="font-medium font-mono">{vehicle?.plateNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "الشركة المصنعة" : "Make"}</p>
                <p className="font-medium">{vehicle?.make || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "الموديل" : "Model"}</p>
                <p className="font-medium">{vehicle?.model || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "السنة" : "Year"}</p>
                <p className="font-medium">{vehicle?.year || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "اللون" : "Color"}</p>
                <p className="font-medium">{vehicle?.color || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "النوع" : "Type"}</p>
                <p className="font-medium capitalize">{vehicle?.type || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "المسافة المقطوعة" : "Mileage"}</p>
                <p className="font-medium">{vehicle?.mileage?.toLocaleString() || 0} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? "الحالة" : "Status"}</p>
                <p className="font-medium capitalize">{vehicle?.status || "-"}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close">
                {isRTL ? "إغلاق" : "Close"}
              </Button>
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit-vehicle">
                {isRTL ? "تعديل" : "Edit"}
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "رقم اللوحة" : "Plate Number"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-plate-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "الشركة المصنعة" : "Make"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-make" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "الموديل" : "Model"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "السنة" : "Year"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-year" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "اللون" : "Color"}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-color" />
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
                      <FormLabel>{isRTL ? "النوع" : "Type"}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedan">{isRTL ? "سيدان" : "Sedan"}</SelectItem>
                          <SelectItem value="suv">{isRTL ? "دفع رباعي" : "SUV"}</SelectItem>
                          <SelectItem value="truck">{isRTL ? "شاحنة" : "Truck"}</SelectItem>
                          <SelectItem value="van">{isRTL ? "فان" : "Van"}</SelectItem>
                          <SelectItem value="bus">{isRTL ? "حافلة" : "Bus"}</SelectItem>
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
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRTL ? "المسافة المقطوعة (كم)" : "Mileage (km)"}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field} 
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-mileage" 
                        />
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
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">{isRTL ? "متاح" : "Available"}</SelectItem>
                          <SelectItem value="in_use">{isRTL ? "قيد الاستخدام" : "In Use"}</SelectItem>
                          <SelectItem value="maintenance">{isRTL ? "صيانة" : "Maintenance"}</SelectItem>
                          <SelectItem value="retired">{isRTL ? "متقاعد" : "Retired"}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  disabled={updateVehicle.isPending}
                  data-testid="button-save-vehicle"
                >
                  {updateVehicle.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
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
