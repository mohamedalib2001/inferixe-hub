import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getTranslation } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Car,
  Wrench,
  AlertTriangle,
  FileText,
  Calendar,
  Fuel,
  Shield,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  ArrowRightLeft,
  ClipboardList,
  Settings,
  Receipt,
  Tag,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import type { Vehicle, VehicleEvent, Employee } from "@shared/schema";

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

export default function VehicleEvents() {
  const { language, isRTL } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [activeTab, setActiveTab] = useState("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VehicleEvent | null>(null);
  const [formData, setFormData] = useState({
    vehicleId: "",
    eventType: "maintenance",
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

  const { data: events = [], isLoading: eventsLoading } = useQuery<VehicleEvent[]>({
    queryKey: ["/api/vehicle-events"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        cost: data.cost ? parseInt(data.cost) : null,
        mileageAtEvent: data.mileageAtEvent ? parseInt(data.mileageAtEvent) : null,
        createdBy: user?.id || "system",
        createdAt: new Date().toISOString(),
      };
      return apiRequest("POST", "/api/vehicle-events", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-events"] });
      toast({
        title: isRTL ? "تم إنشاء الطلب بنجاح" : "Event created successfully",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: isRTL ? "حدث خطأ" : "Error occurred",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/vehicle-events/${id}`, {
        status,
        updatedAt: new Date().toISOString(),
        completedDate: status === "completed" ? new Date().toISOString().split("T")[0] : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-events"] });
      toast({
        title: isRTL ? "تم تحديث الحالة" : "Status updated",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/vehicle-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-events"] });
      toast({
        title: isRTL ? "تم الحذف بنجاح" : "Deleted successfully",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      vehicleId: "",
      eventType: "maintenance",
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
    setSelectedEvent(null);
  };

  const filteredEvents = events.filter((event) => {
    if (filterStatus !== "all" && event.status !== filterStatus) return false;
    if (filterType !== "all" && event.eventType !== filterType) return false;
    if (activeTab !== "all" && event.eventType !== activeTab) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = event.title?.toLowerCase().includes(query);
      const matchesTitleAr = event.titleAr?.toLowerCase().includes(query);
      const vehicle = vehicles.find((v) => v.id === event.vehicleId);
      const matchesVehicle = vehicle?.plateNumber?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesTitleAr && !matchesVehicle) return false;
    }
    return true;
  });

  const stats = {
    total: events.length,
    pending: events.filter((e) => e.status === "pending").length,
    inProgress: events.filter((e) => e.status === "in_progress").length,
    completed: events.filter((e) => e.status === "completed").length,
    maintenance: events.filter((e) => e.eventType === "maintenance").length,
    accidents: events.filter((e) => e.eventType === "accident").length,
    oilChange: events.filter((e) => e.eventType === "oil_change").length,
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(isRTL ? "ar-SA" : "en-US");
  };

  const getVehiclePlate = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.plateNumber || vehicleId;
  };

  const getCreatorName = (createdBy: string | null | undefined) => {
    if (!createdBy) return isRTL ? "غير محدد" : "Unknown";
    const employee = employees.find((e) => e.userId === createdBy);
    if (employee) {
      return isRTL && employee.fullNameAr ? employee.fullNameAr : employee.fullName;
    }
    return isRTL ? "مستخدم النظام" : "System User";
  };

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            {isRTL ? "طلبات السيارات" : "Vehicle Events"}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? "إدارة جميع طلبات وأحداث السيارات" : "Manage all vehicle requests and events"}
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-event">
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? "إضافة طلب جديد" : "Add New Event"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الطلبات" : "Total Events"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "قيد الانتظار" : "Pending"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "قيد التنفيذ" : "In Progress"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "مكتمل" : "Completed"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.maintenance}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "صيانة" : "Maintenance"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.accidents}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "حوادث" : "Accidents"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.oilChange}</p>
            <p className="text-xs text-muted-foreground">{isRTL ? "تغيير زيت" : "Oil Change"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>{isRTL ? "قائمة الطلبات" : "Events List"}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? "بحث..." : "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-48"
                  data-testid="input-search"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36" data-testid="select-filter-status">
                  <SelectValue placeholder={isRTL ? "الحالة" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="pending">{isRTL ? "قيد الانتظار" : "Pending"}</SelectItem>
                  <SelectItem value="in_progress">{isRTL ? "قيد التنفيذ" : "In Progress"}</SelectItem>
                  <SelectItem value="completed">{isRTL ? "مكتمل" : "Completed"}</SelectItem>
                  <SelectItem value="cancelled">{isRTL ? "ملغى" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-36" data-testid="select-filter-type">
                  <SelectValue placeholder={isRTL ? "النوع" : "Type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
                  {Object.entries(eventTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {isRTL ? config.labelAr : config.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 flex-wrap h-auto gap-1">
              <TabsTrigger value="all" data-testid="tab-all">
                {isRTL ? "الكل" : "All"}
              </TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">
                {isRTL ? "صيانة" : "Maintenance"}
              </TabsTrigger>
              <TabsTrigger value="oil_change" data-testid="tab-oil-change">
                {isRTL ? "تغيير زيت" : "Oil Change"}
              </TabsTrigger>
              <TabsTrigger value="accident" data-testid="tab-accident">
                {isRTL ? "حوادث" : "Accidents"}
              </TabsTrigger>
              <TabsTrigger value="receipt" data-testid="tab-receipt">
                {isRTL ? "استلام" : "Receipt"}
              </TabsTrigger>
              <TabsTrigger value="sale" data-testid="tab-sale">
                {isRTL ? "بيع" : "Sale"}
              </TabsTrigger>
              <TabsTrigger value="fuel" data-testid="tab-fuel">
                {isRTL ? "وقود" : "Fuel"}
              </TabsTrigger>
              <TabsTrigger value="inspection" data-testid="tab-inspection">
                {isRTL ? "فحص" : "Inspection"}
              </TabsTrigger>
            </TabsList>

            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "السيارة" : "Vehicle"}</TableHead>
                    <TableHead>{isRTL ? "النوع" : "Type"}</TableHead>
                    <TableHead>{isRTL ? "العنوان" : "Title"}</TableHead>
                    <TableHead>{isRTL ? "مقدم الطلب" : "Requester"}</TableHead>
                    <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isRTL ? "الأولوية" : "Priority"}</TableHead>
                    <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isRTL ? "التكلفة" : "Cost"}</TableHead>
                    <TableHead className="text-end">{isRTL ? "إجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {isRTL ? "لا توجد طلبات" : "No events found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => {
                      const typeConfig = eventTypeConfig[event.eventType] || eventTypeConfig.other;
                      const TypeIcon = typeConfig.icon;
                      const eventStatus = statusConfig[event.status || "pending"];
                      const eventPriority = priorityConfig[event.priority || "medium"];

                      return (
                        <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              {getVehiclePlate(event.vehicleId)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-md w-fit ${typeConfig.color}`}>
                              <TypeIcon className="h-4 w-4" />
                              <span className="text-sm">{isRTL ? typeConfig.labelAr : typeConfig.labelEn}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isRTL ? event.titleAr || event.title : event.title}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{getCreatorName(event.createdBy)}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={eventStatus.color}>
                              {isRTL ? eventStatus.labelAr : eventStatus.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={eventPriority.color}>
                              {isRTL ? eventPriority.labelAr : eventPriority.labelEn}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(event.scheduledDate || event.createdAt)}</TableCell>
                          <TableCell>
                            {event.cost ? `${event.cost.toLocaleString()} ${isRTL ? "ر.س" : "SAR"}` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {event.status === "pending" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => updateStatusMutation.mutate({ id: event.id, status: "in_progress" })}
                                  title={isRTL ? "بدء العمل" : "Start"}
                                  data-testid={`button-start-${event.id}`}
                                >
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              {event.status === "in_progress" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => updateStatusMutation.mutate({ id: event.id, status: "completed" })}
                                  title={isRTL ? "إكمال" : "Complete"}
                                  data-testid={`button-complete-${event.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(event.id)}
                                title={isRTL ? "حذف" : "Delete"}
                                data-testid={`button-delete-${event.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{isRTL ? "إضافة طلب جديد" : "Add New Event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "السيارة" : "Vehicle"} *</Label>
                <Select
                  value={formData.vehicleId}
                  onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                >
                  <SelectTrigger data-testid="select-vehicle">
                    <SelectValue placeholder={isRTL ? "اختر السيارة" : "Select vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.plateNumber} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "نوع الطلب" : "Event Type"} *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {isRTL ? config.labelAr : config.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isRTL ? "عنوان الطلب" : "Event title"}
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "العنوان (عربي)" : "Title (Arabic)"}</Label>
                <Input
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder={isRTL ? "عنوان الطلب بالعربي" : "Event title in Arabic"}
                  dir="rtl"
                  data-testid="input-title-ar"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "الأولوية" : "Priority"}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-priority">
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
                <Label>{isRTL ? "التاريخ المجدول" : "Scheduled Date"}</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  data-testid="input-scheduled-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? "التكلفة (ر.س)" : "Cost (SAR)"}</Label>
                <Input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0"
                  data-testid="input-cost"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? "قراءة العداد" : "Mileage"}</Label>
                <Input
                  type="number"
                  value={formData.mileageAtEvent}
                  onChange={(e) => setFormData({ ...formData, mileageAtEvent: e.target.value })}
                  placeholder="0"
                  data-testid="input-mileage"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "الموقع" : "Location"}</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={isRTL ? "موقع الصيانة أو الحدث" : "Maintenance or event location"}
                data-testid="input-location"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "الوصف" : "Description"}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isRTL ? "وصف تفصيلي للطلب" : "Detailed description of the event"}
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={isRTL ? "ملاحظات إضافية" : "Additional notes"}
                rows={2}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} data-testid="button-cancel">
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.vehicleId || !formData.title || createMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRTL ? (
                "إضافة"
              ) : (
                "Add Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
