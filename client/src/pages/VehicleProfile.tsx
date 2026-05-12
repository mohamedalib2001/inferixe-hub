import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Car,
  CarFront,
  Truck,
  Bus,
  ChevronLeft,
  Wrench,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  MapPin,
  Fuel,
  Shield,
  DollarSign,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  User,
  ArrowRightLeft,
  ClipboardList,
  Settings,
  Receipt,
  Tag,
} from "lucide-react";
import type { Vehicle, Driver, Employee, VehicleEvent, VehicleDriverHistory } from "@shared/schema";

const vehicleTypeIcons: Record<string, typeof Car> = {
  sedan: Car,
  suv: CarFront,
  truck: Truck,
  van: CarFront,
  bus: Bus,
};

const eventTypeConfig: Record<string, { icon: typeof Car; color: string; labelEn: string; labelAr: string }> = {
  accident: { icon: AlertTriangle, color: "text-red-500 bg-red-500/10", labelEn: "Accident", labelAr: "حادث" },
  receipt: { icon: Receipt, color: "text-blue-500 bg-blue-500/10", labelEn: "Receipt", labelAr: "استلام" },
  sale: { icon: Tag, color: "text-purple-500 bg-purple-500/10", labelEn: "Sale", labelAr: "بيع" },
  maintenance: { icon: Wrench, color: "text-amber-500 bg-amber-500/10", labelEn: "Maintenance", labelAr: "صيانة" },
  oil_change: { icon: Fuel, color: "text-yellow-500 bg-yellow-500/10", labelEn: "Oil Change", labelAr: "تغيير زيت" },
  tire_change: { icon: Settings, color: "text-slate-500 bg-slate-500/10", labelEn: "Tire Change", labelAr: "تغيير إطارات" },
  assignment: { icon: ArrowRightLeft, color: "text-green-500 bg-green-500/10", labelEn: "Assignment", labelAr: "تسليم" },
  return: { icon: ArrowRightLeft, color: "text-teal-500 bg-teal-500/10", labelEn: "Return", labelAr: "إرجاع" },
  inspection: { icon: ClipboardList, color: "text-indigo-500 bg-indigo-500/10", labelEn: "Inspection", labelAr: "فحص" },
  fuel: { icon: Fuel, color: "text-orange-500 bg-orange-500/10", labelEn: "Fuel", labelAr: "وقود" },
  insurance: { icon: Shield, color: "text-cyan-500 bg-cyan-500/10", labelEn: "Insurance", labelAr: "تأمين" },
  registration: { icon: FileText, color: "text-pink-500 bg-pink-500/10", labelEn: "Registration", labelAr: "تسجيل" },
  other: { icon: Settings, color: "text-gray-500 bg-gray-500/10", labelEn: "Other", labelAr: "أخرى" },
};

const statusConfig: Record<string, { color: string; labelEn: string; labelAr: string }> = {
  pending: { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", labelEn: "Pending", labelAr: "قيد الانتظار" },
  in_progress: { color: "bg-blue-500/10 text-blue-600 border-blue-500/30", labelEn: "In Progress", labelAr: "قيد التنفيذ" },
  completed: { color: "bg-green-500/10 text-green-600 border-green-500/30", labelEn: "Completed", labelAr: "مكتمل" },
  cancelled: { color: "bg-red-500/10 text-red-600 border-red-500/30", labelEn: "Cancelled", labelAr: "ملغى" },
};

const priorityConfig: Record<string, { color: string; labelEn: string; labelAr: string }> = {
  low: { color: "bg-gray-500/10 text-gray-600", labelEn: "Low", labelAr: "منخفضة" },
  medium: { color: "bg-blue-500/10 text-blue-600", labelEn: "Medium", labelAr: "متوسطة" },
  high: { color: "bg-amber-500/10 text-amber-600", labelEn: "High", labelAr: "عالية" },
  urgent: { color: "bg-red-500/10 text-red-600", labelEn: "Urgent", labelAr: "عاجلة" },
};

export default function VehicleProfile() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);
  const [, params] = useRoute("/fleet/:id");
  const vehicleId = params?.id;

  const [activeTab, setActiveTab] = useState("overview");
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>("maintenance");
  const [eventFormData, setEventFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    priority: "medium",
    cost: "",
    mileageAtEvent: "",
    location: "",
    scheduledDate: "",
    notes: "",
  });

  const { data: vehicle, isLoading: vehicleLoading } = useQuery<Vehicle>({
    queryKey: ["/api/vehicles", vehicleId],
    enabled: !!vehicleId,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<VehicleEvent[]>({
    queryKey: ["/api/vehicles", vehicleId, "events"],
    enabled: !!vehicleId,
  });

  const { data: driverHistory = [], isLoading: historyLoading } = useQuery<VehicleDriverHistory[]>({
    queryKey: ["/api/vehicles", vehicleId, "driver-history"],
    enabled: !!vehicleId,
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });


  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/vehicle-events", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "events"] });
      toast({ title: t("success"), description: isRTL ? "تم إنشاء الحدث بنجاح" : "Event created successfully" });
      setIsEventDialogOpen(false);
      resetEventForm();
    },
    onError: () => {
      toast({ title: t("error"), description: isRTL ? "فشل إنشاء الحدث" : "Failed to create event", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/vehicle-events/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "events"] });
      toast({ title: t("success"), description: isRTL ? "تم تحديث الحدث بنجاح" : "Event updated successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: isRTL ? "فشل تحديث الحدث" : "Failed to update event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vehicle-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", vehicleId, "events"] });
      toast({ title: t("success"), description: isRTL ? "تم حذف الحدث بنجاح" : "Event deleted successfully" });
    },
    onError: () => {
      toast({ title: t("error"), description: isRTL ? "فشل حذف الحدث" : "Failed to delete event", variant: "destructive" });
    },
  });

  const resetEventForm = () => {
    setEventFormData({
      title: "",
      titleAr: "",
      description: "",
      descriptionAr: "",
      priority: "medium",
      cost: "",
      mileageAtEvent: "",
      location: "",
      scheduledDate: "",
      notes: "",
    });
    setSelectedEventType("maintenance");
  };

  const handleCreateEvent = () => {
    createEventMutation.mutate({
      vehicleId,
      eventType: selectedEventType,
      title: eventFormData.title,
      titleAr: eventFormData.titleAr,
      description: eventFormData.description,
      descriptionAr: eventFormData.descriptionAr,
      priority: eventFormData.priority,
      cost: eventFormData.cost ? parseInt(eventFormData.cost) : undefined,
      mileageAtEvent: eventFormData.mileageAtEvent ? parseInt(eventFormData.mileageAtEvent) : undefined,
      location: eventFormData.location,
      scheduledDate: eventFormData.scheduledDate || undefined,
      notes: eventFormData.notes,
      createdBy: user?.id,
      status: "pending",
    });
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      const employee = employees.find(e => e.id === driver.employeeId);
      return employee ? (isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName) : driverId;
    }
    return driverId;
  };

  const getCreatorName = (createdBy: string) => {
    const employee = employees.find(e => e.userId === createdBy);
    if (employee) {
      return isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName;
    }
    return isRTL ? "مستخدم النظام" : "System User";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (vehicleLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container mx-auto p-6" dir={isRTL ? "rtl" : "ltr"}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{isRTL ? "المركبة غير موجودة" : "Vehicle not found"}</p>
            <Link href="/fleet">
              <Button variant="outline" className="mt-4">
                <ChevronLeft className="h-4 w-4 me-1" />
                {isRTL ? "العودة للأسطول" : "Back to Fleet"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const VehicleIcon = vehicleTypeIcons[vehicle.type || "sedan"] || Car;
  const currentDriver = vehicle.assignedDriverId ? drivers.find(d => d.id === vehicle.assignedDriverId) : null;
  const currentDriverEmployee = currentDriver ? employees.find(e => e.id === currentDriver.employeeId) : null;

  const vehicleStats = {
    totalEvents: events.length,
    maintenanceCount: events.filter(e => e.eventType === "maintenance").length,
    accidentCount: events.filter(e => e.eventType === "accident").length,
    driversCount: driverHistory.length,
    pendingEvents: events.filter(e => e.status === "pending").length,
    totalCost: events.reduce((sum, e) => sum + (e.cost || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/fleet">
            <Button variant="ghost" size="icon" data-testid="button-back-fleet">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
              <VehicleIcon className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
              <p className="text-muted-foreground">{vehicle.plateNumber} • {vehicle.year}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            vehicle.status === "available" ? "bg-green-500/10 text-green-600 border-green-500/30" :
            vehicle.status === "in_use" ? "bg-blue-500/10 text-blue-600 border-blue-500/30" :
            vehicle.status === "maintenance" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" :
            "bg-gray-500/10 text-gray-600 border-gray-500/30"
          }>
            {vehicle.status === "available" ? (isRTL ? "متاح" : "Available") :
             vehicle.status === "in_use" ? (isRTL ? "قيد الاستخدام" : "In Use") :
             vehicle.status === "maintenance" ? (isRTL ? "صيانة" : "Maintenance") :
             (isRTL ? "متقاعد" : "Retired")}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <Car className="h-4 w-4 me-1" />
            {isRTL ? "نظرة عامة" : "Overview"}
          </TabsTrigger>
          <TabsTrigger value="events" data-testid="tab-events">
            <ClipboardList className="h-4 w-4 me-1" />
            {isRTL ? "الأحداث" : "Events"}
            {vehicleStats.pendingEvents > 0 && (
              <Badge variant="secondary" className="ms-1 text-xs">{vehicleStats.pendingEvents}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drivers" data-testid="tab-drivers">
            <Users className="h-4 w-4 me-1" />
            {isRTL ? "السائقين" : "Drivers"}
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            <Wrench className="h-4 w-4 me-1" />
            {isRTL ? "الصيانة" : "Maintenance"}
          </TabsTrigger>
          <TabsTrigger value="accidents" data-testid="tab-accidents">
            <AlertTriangle className="h-4 w-4 me-1" />
            {isRTL ? "الحوادث" : "Accidents"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-500/10">
                    <ClipboardList className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vehicleStats.totalEvents}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الأحداث" : "Total Events"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                    <Wrench className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vehicleStats.maintenanceCount}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "عمليات الصيانة" : "Maintenance"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vehicleStats.accidentCount}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "الحوادث" : "Accidents"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vehicleStats.totalCost.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي التكاليف" : "Total Costs"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {isRTL ? "معلومات المركبة" : "Vehicle Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "الشركة المصنعة" : "Make"}</p>
                    <p className="font-medium">{vehicle.make}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "الموديل" : "Model"}</p>
                    <p className="font-medium">{vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "السنة" : "Year"}</p>
                    <p className="font-medium">{vehicle.year || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "اللون" : "Color"}</p>
                    <p className="font-medium">{vehicle.color || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "رقم اللوحة" : "Plate Number"}</p>
                    <p className="font-medium">{vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "النوع" : "Type"}</p>
                    <p className="font-medium capitalize">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "المسافة المقطوعة" : "Mileage"}</p>
                    <p className="font-medium">{vehicle.mileage?.toLocaleString() || "0"} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "آخر صيانة" : "Last Maintenance"}</p>
                    <p className="font-medium">{formatDate(vehicle.lastMaintenanceDate || "")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {isRTL ? "السائق الحالي" : "Current Driver"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentDriverEmployee ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-xl font-bold text-primary">
                      {currentDriverEmployee.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {isRTL && currentDriverEmployee.fullNameAr ? currentDriverEmployee.fullNameAr : currentDriverEmployee.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">{currentDriverEmployee.employeeNumber}</p>
                      {currentDriver && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {isRTL ? "رخصة:" : "License:"} {currentDriver.licenseNumber}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">{isRTL ? "لا يوجد سائق معين" : "No driver assigned"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {isRTL ? "آخر الأحداث" : "Recent Events"}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("events")} data-testid="button-view-all-events">
                {isRTL ? "عرض الكل" : "View All"}
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">{isRTL ? "لا توجد أحداث" : "No events yet"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map(event => {
                    const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
                    const EventIcon = config.icon;
                    const status = statusConfig[event.status || "pending"];
                    return (
                      <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border" data-testid={`event-item-${event.id}`}>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-md ${config.color}`}>
                          <EventIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {isRTL && event.titleAr ? event.titleAr : event.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? config.labelAr : config.labelEn} • {formatDateTime(event.createdAt)}
                          </p>
                        </div>
                        <Badge variant="outline" className={status.color}>
                          {isRTL ? status.labelAr : status.labelEn}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6 mt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">{isRTL ? "جميع الأحداث" : "All Events"}</h2>
            <Button onClick={() => setIsEventDialogOpen(true)} data-testid="button-add-event">
              <Plus className="h-4 w-4 me-1" />
              {isRTL ? "إضافة حدث" : "Add Event"}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(eventTypeConfig).map(([type, config]) => {
              const Icon = config.icon;
              const count = events.filter(e => e.eventType === type).length;
              return (
                <Card key={type} className="cursor-pointer hover-elevate transition-all" data-testid={`event-type-filter-${type}`}>
                  <CardContent className="p-4 text-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-md mx-auto mb-2 ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? config.labelAr : config.labelEn}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-0">
              {eventsLoading ? (
                <div className="p-4">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">{isRTL ? "لا توجد أحداث مسجلة" : "No events recorded"}</p>
                  <Button className="mt-4" onClick={() => setIsEventDialogOpen(true)}>
                    <Plus className="h-4 w-4 me-1" />
                    {isRTL ? "إضافة أول حدث" : "Add First Event"}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "النوع" : "Type"}</TableHead>
                      <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "الأولوية" : "Priority"}</TableHead>
                      <TableHead>{isRTL ? "التكلفة" : "Cost"}</TableHead>
                      <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{isRTL ? "الإجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map(event => {
                      const config = eventTypeConfig[event.eventType] || eventTypeConfig.other;
                      const EventIcon = config.icon;
                      const status = statusConfig[event.status || "pending"];
                      const priority = priorityConfig[event.priority || "medium"];
                      return (
                        <TableRow key={event.id} data-testid={`event-row-${event.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-md ${config.color}`}>
                                <EventIcon className="h-4 w-4" />
                              </div>
                              <span className="text-sm">{isRTL ? config.labelAr : config.labelEn}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {isRTL && event.titleAr ? event.titleAr : event.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {isRTL ? status.labelAr : status.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priority.color}>
                              {isRTL ? priority.labelAr : priority.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.cost?.toLocaleString() || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(event.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {event.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updateEventMutation.mutate({ id: event.id, data: { status: "completed" } })}
                                  data-testid={`button-complete-event-${event.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteEventMutation.mutate(event.id)}
                                data-testid={`button-delete-event-${event.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6 mt-6">
          <h2 className="text-xl font-semibold">{isRTL ? "سجل السائقين" : "Driver History"}</h2>
          <Card>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-4">
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : driverHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">{isRTL ? "لا يوجد سجل سائقين" : "No driver history"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "السائق" : "Driver"}</TableHead>
                      <TableHead>{isRTL ? "تاريخ الاستلام" : "Assigned Date"}</TableHead>
                      <TableHead>{isRTL ? "تاريخ الإرجاع" : "Return Date"}</TableHead>
                      <TableHead>{isRTL ? "المسافة عند الاستلام" : "Mileage at Assignment"}</TableHead>
                      <TableHead>{isRTL ? "المسافة عند الإرجاع" : "Mileage at Return"}</TableHead>
                      <TableHead>{isRTL ? "ملاحظات" : "Notes"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverHistory.map(record => (
                      <TableRow key={record.id} data-testid={`driver-history-row-${record.id}`}>
                        <TableCell className="font-medium">{getDriverName(record.driverId)}</TableCell>
                        <TableCell>{formatDateTime(record.assignedAt)}</TableCell>
                        <TableCell>{record.returnedAt ? formatDateTime(record.returnedAt) : (isRTL ? "لم يُرجع بعد" : "Not returned")}</TableCell>
                        <TableCell>{record.mileageAtAssignment?.toLocaleString() || "-"} km</TableCell>
                        <TableCell>{record.mileageAtReturn?.toLocaleString() || "-"} km</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {isRTL && record.notesAr ? record.notesAr : record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 mt-6">
          <h2 className="text-xl font-semibold">{isRTL ? "سجل الصيانة" : "Maintenance History"}</h2>
          <Card>
            <CardContent className="p-0">
              {events.filter(e => e.eventType === "maintenance").length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">{isRTL ? "لا يوجد سجل صيانة" : "No maintenance records"}</p>
                  <Button className="mt-4" onClick={() => { setSelectedEventType("maintenance"); setIsEventDialogOpen(true); }}>
                    <Plus className="h-4 w-4 me-1" />
                    {isRTL ? "إضافة صيانة" : "Add Maintenance"}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "الوصف" : "Description"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "التكلفة" : "Cost"}</TableHead>
                      <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{isRTL ? "الموقع" : "Location"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.filter(e => e.eventType === "maintenance").map(event => {
                      const status = statusConfig[event.status || "pending"];
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {isRTL && event.titleAr ? event.titleAr : event.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {isRTL ? status.labelAr : status.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.cost?.toLocaleString() || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(event.createdAt)}</TableCell>
                          <TableCell className="text-sm">{event.location || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accidents" className="space-y-6 mt-6">
          <h2 className="text-xl font-semibold">{isRTL ? "سجل الحوادث" : "Accident History"}</h2>
          <Card>
            <CardContent className="p-0">
              {events.filter(e => e.eventType === "accident").length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-lg">{isRTL ? "لا يوجد سجل حوادث" : "No accident records"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{isRTL ? "هذا أمر جيد!" : "That's good news!"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? "الوصف" : "Description"}</TableHead>
                      <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                      <TableHead>{isRTL ? "التكلفة" : "Cost"}</TableHead>
                      <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{isRTL ? "الموقع" : "Location"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.filter(e => e.eventType === "accident").map(event => {
                      const status = statusConfig[event.status || "pending"];
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">
                            {isRTL && event.titleAr ? event.titleAr : event.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.color}>
                              {isRTL ? status.labelAr : status.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.cost?.toLocaleString() || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(event.createdAt)}</TableCell>
                          <TableCell className="text-sm">{event.location || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isRTL ? "إضافة حدث جديد" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? "نوع الحدث" : "Event Type"}</Label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      {isRTL ? config.labelAr : config.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "العنوان (إنجليزي)" : "Title (English)"}</Label>
                <Input
                  value={eventFormData.title}
                  onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                  placeholder="Event title"
                  data-testid="input-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input
                  value={eventFormData.titleAr}
                  onChange={(e) => setEventFormData({ ...eventFormData, titleAr: e.target.value })}
                  placeholder="عنوان الحدث"
                  dir="rtl"
                  data-testid="input-event-title-ar"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "الوصف" : "Description"}</Label>
              <Textarea
                value={eventFormData.description}
                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                placeholder={isRTL ? "وصف الحدث..." : "Event description..."}
                data-testid="textarea-event-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "الأولوية" : "Priority"}</Label>
                <Select value={eventFormData.priority} onValueChange={(v) => setEventFormData({ ...eventFormData, priority: v })}>
                  <SelectTrigger data-testid="select-event-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {isRTL ? config.labelAr : config.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "التكلفة" : "Cost"}</Label>
                <Input
                  type="number"
                  value={eventFormData.cost}
                  onChange={(e) => setEventFormData({ ...eventFormData, cost: e.target.value })}
                  placeholder="0"
                  data-testid="input-event-cost"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "الموقع" : "Location"}</Label>
                <Input
                  value={eventFormData.location}
                  onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                  placeholder={isRTL ? "الموقع" : "Location"}
                  data-testid="input-event-location"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "التاريخ المجدول" : "Scheduled Date"}</Label>
                <Input
                  type="date"
                  value={eventFormData.scheduledDate}
                  onChange={(e) => setEventFormData({ ...eventFormData, scheduledDate: e.target.value })}
                  data-testid="input-event-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleCreateEvent} disabled={!eventFormData.title || !user?.id || createEventMutation.isPending} data-testid="button-submit-event">
              {createEventMutation.isPending ? (isRTL ? "جاري الإنشاء..." : "Creating...") : (isRTL ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
