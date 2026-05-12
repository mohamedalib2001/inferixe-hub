import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { VehicleDialog } from "@/components/VehicleDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Car,
  CarFront,
  Truck,
  Bus,
  Eye,
  Edit,
  Trash2,
  Wrench,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Vehicle } from "@shared/schema";

const vehicleTypeIcons: Record<string, typeof Car> = {
  sedan: Car,
  suv: CarFront,
  truck: Truck,
  van: CarFront,
  bus: Bus,
};

export default function Fleet() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleDialogMode, setVehicleDialogMode] = useState<"view" | "edit">("view");
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    type: "sedan" as Vehicle["type"],
  });

  const openVehicleDialog = (vehicle: Vehicle, mode: "view" | "edit") => {
    setSelectedVehicle(vehicle);
    setVehicleDialogMode(mode);
    setIsVehicleDialogOpen(true);
  };

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/vehicles", {
        ...data,
        year: parseInt(data.year) || new Date().getFullYear(),
        status: "available",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: t("success"), description: "Vehicle added successfully" });
      setIsAddDialogOpen(false);
      setFormData({ plateNumber: "", make: "", model: "", year: "", color: "", type: "sedan" });
    },
    onError: () => {
      toast({ title: t("error"), description: "Failed to add vehicle", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({ title: t("success"), description: "Vehicle deleted successfully" });
    },
  });

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    available: vehicles.filter((v) => v.status === "available").length,
    inUse: vehicles.filter((v) => v.status === "in_use").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    retired: vehicles.filter((v) => v.status === "retired").length,
  };

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (vehicle) => {
        const Icon = vehicleTypeIcons[vehicle.type || "sedan"] || Car;
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">
                {vehicle.make} {vehicle.model}
              </span>
              <span className="text-xs text-muted-foreground">{vehicle.plateNumber}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "year",
      header: t("year"),
      render: (vehicle) => <span className="text-sm">{vehicle.year}</span>,
    },
    {
      key: "mileage",
      header: t("mileage"),
      render: (vehicle) => (
        <span className="text-sm">
          {vehicle.mileage?.toLocaleString() || 0} km
        </span>
      ),
    },
    {
      key: "status",
      header: t("status"),
      render: (vehicle) => {
        const statusMap: Record<string, "available" | "in_use" | "maintenance" | "retired"> = {
          available: "available",
          in_use: "in_use",
          maintenance: "maintenance",
          retired: "retired",
        };
        return <StatusBadge status={statusMap[vehicle.status || "available"]} size="sm" />;
      },
    },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      render: (vehicle) => (
        <div className="flex items-center justify-end gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openVehicleDialog(vehicle, "view")}
            data-testid={`button-view-${vehicle.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => openVehicleDialog(vehicle, "edit")}
            data-testid={`button-edit-${vehicle.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => deleteMutation.mutate(vehicle.id)}
            data-testid={`button-delete-${vehicle.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    if (!formData.plateNumber || !formData.make || !formData.model) {
      toast({ title: t("error"), description: "Please fill required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("fleet")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage company vehicles and fleet operations
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">{t("available")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-blue-500/10">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.inUse}</p>
                <p className="text-xs text-muted-foreground">{t("inUse")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.maintenance}</p>
                <p className="text-xs text-muted-foreground">{t("maintenance")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-500/5 border-gray-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-gray-500/10">
                <XCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.retired}</p>
                <p className="text-xs text-muted-foreground">{t("retired")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title={`${t("fleet")} (${filteredVehicles.length})`}
        columns={columns}
        data={filteredVehicles}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by plate, make, or model..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel={t("newVehicle")}
        emptyMessage="No vehicles found"
        emptyIcon={Car}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("newVehicle")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">{t("plateNumber")} *</Label>
                <Input
                  id="plateNumber"
                  placeholder="ABC 1234"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  data-testid="input-plate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type || "sedan"}
                  onValueChange={(val) => setFormData({ ...formData, type: val as Vehicle["type"] })}
                >
                  <SelectTrigger data-testid="select-vehicle-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">Sedan</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">{t("make")} *</Label>
                <Input
                  id="make"
                  placeholder="Toyota"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  data-testid="input-make"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{t("model")} *</Label>
                <Input
                  id="model"
                  placeholder="Camry"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  data-testid="input-model"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">{t("year")}</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  data-testid="input-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="White"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  data-testid="input-color"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-save-vehicle"
            >
              {createMutation.isPending ? t("loading") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VehicleDialog
        vehicle={selectedVehicle}
        mode={vehicleDialogMode}
        open={isVehicleDialogOpen}
        onOpenChange={setIsVehicleDialogOpen}
      />
    </div>
  );
}
