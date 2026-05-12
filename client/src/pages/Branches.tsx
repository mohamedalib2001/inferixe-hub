import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Navigation,
  Smartphone,
  Monitor,
  Users,
  Copy,
  RefreshCw,
} from "lucide-react";
import type { Branch } from "@shared/schema";

export default function Branches() {
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();
  const t = (key: keyof typeof import("@/lib/i18n").translations.en) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    code: "",
    address: "",
    addressAr: "",
    latitude: "",
    longitude: "",
    radiusMeters: "100",
    isActive: true,
    kioskEnabled: false,
    mobileAttendanceEnabled: false,
  });

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/branches", {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        radiusMeters: parseInt(data.radiusMeters) || 100,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: t("success"), description: language === "ar" ? "تم إضافة الفرع بنجاح" : "Branch added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: t("error"), description: language === "ar" ? "فشل إضافة الفرع" : "Failed to add branch", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/branches/${id}`, {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        radiusMeters: parseInt(data.radiusMeters) || 100,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: t("success"), description: language === "ar" ? "تم تحديث الفرع بنجاح" : "Branch updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedBranch(null);
      resetForm();
    },
    onError: () => {
      toast({ title: t("error"), description: language === "ar" ? "فشل تحديث الفرع" : "Failed to update branch", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/branches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: t("success"), description: language === "ar" ? "تم حذف الفرع" : "Branch deleted" });
    },
    onError: () => {
      toast({ title: t("error"), description: language === "ar" ? "فشل حذف الفرع" : "Failed to delete branch", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      code: "",
      address: "",
      addressAr: "",
      latitude: "",
      longitude: "",
      radiusMeters: "100",
      isActive: true,
      kioskEnabled: false,
      mobileAttendanceEnabled: false,
    });
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      nameAr: branch.nameAr,
      code: branch.code,
      address: branch.address || "",
      addressAr: branch.addressAr || "",
      latitude: branch.latitude?.toString() || "",
      longitude: branch.longitude?.toString() || "",
      radiusMeters: branch.radiusMeters?.toString() || "100",
      isActive: branch.isActive,
      kioskEnabled: branch.kioskEnabled,
      mobileAttendanceEnabled: branch.mobileAttendanceEnabled,
    });
    setIsEditDialogOpen(true);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: t("error"), description: "Geolocation not supported", variant: "destructive" });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLoadingLocation(false);
        toast({ title: t("success"), description: language === "ar" ? "تم تحديد الموقع" : "Location captured" });
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({ 
          title: t("error"), 
          description: language === "ar" ? "فشل تحديد الموقع" : "Failed to get location", 
          variant: "destructive" 
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const generateKioskToken = () => {
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    return token;
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameAr.includes(searchQuery) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: branches.length,
    active: branches.filter((b) => b.isActive).length,
    withLocation: branches.filter((b) => b.latitude && b.longitude).length,
    kioskEnabled: branches.filter((b) => b.kioskEnabled).length,
  };

  const BranchForm = ({ onSubmit, isEdit = false }: { onSubmit: () => void; isEdit?: boolean }) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("branchName")} (EN)</Label>
          <Input
            id="name"
            data-testid="input-branch-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Main Branch"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameAr">{t("branchName")} (AR)</Label>
          <Input
            id="nameAr"
            data-testid="input-branch-name-ar"
            dir="rtl"
            value={formData.nameAr}
            onChange={(e) => setFormData(prev => ({ ...prev, nameAr: e.target.value }))}
            placeholder="الفرع الرئيسي"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">{t("branchCode")}</Label>
        <Input
          id="code"
          data-testid="input-branch-code"
          value={formData.code}
          onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
          placeholder="HQ01"
          maxLength={10}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">{t("address")} (EN)</Label>
          <Textarea
            id="address"
            data-testid="input-address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main Street"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressAr">{t("address")} (AR)</Label>
          <Textarea
            id="addressAr"
            data-testid="input-address-ar"
            dir="rtl"
            value={formData.addressAr}
            onChange={(e) => setFormData(prev => ({ ...prev, addressAr: e.target.value }))}
            placeholder="123 الشارع الرئيسي"
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("gpsCoordinates")}
        </Label>
        <div className="grid grid-cols-5 gap-2">
          <Input
            className="col-span-2"
            data-testid="input-latitude"
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
            placeholder={t("latitude")}
          />
          <Input
            className="col-span-2"
            data-testid="input-longitude"
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
            placeholder={t("longitude")}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            data-testid="button-get-location"
          >
            {isLoadingLocation ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="radius">{t("geofenceRadius")}</Label>
        <div className="flex items-center gap-2">
          <Input
            id="radius"
            data-testid="input-radius"
            type="number"
            value={formData.radiusMeters}
            onChange={(e) => setFormData(prev => ({ ...prev, radiusMeters: e.target.value }))}
            placeholder="100"
            min="10"
            max="5000"
          />
          <span className="text-sm text-muted-foreground">{language === "ar" ? "متر" : "meters"}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="isActive">{t("branchActivation")}</Label>
          </div>
          <Switch
            id="isActive"
            data-testid="switch-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="kioskEnabled">{t("kioskMode")}</Label>
          </div>
          <Switch
            id="kioskEnabled"
            data-testid="switch-kiosk"
            checked={formData.kioskEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, kioskEnabled: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="mobileEnabled">{t("mobileAttendanceEnabled")}</Label>
          </div>
          <Switch
            id="mobileEnabled"
            data-testid="switch-mobile"
            checked={formData.mobileAttendanceEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mobileAttendanceEnabled: checked }))}
          />
        </div>
      </div>

      <DialogFooter className="pt-4">
        <Button variant="outline" onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false)}>
          {t("cancel")}
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={!formData.name || !formData.nameAr || !formData.code}
          data-testid="button-save-branch"
        >
          {t("save")}
        </Button>
      </DialogFooter>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("branchManagement")}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة الفروع ومواقعها الجغرافية" : "Manage branches and their GPS locations"}
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-branch">
          <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t("addBranch")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("branches")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("active")}</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("location")}</p>
                <p className="text-2xl font-bold">{stats.withLocation}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("kioskMode")}</p>
                <p className="text-2xl font-bold">{stats.kioskEnabled}</p>
              </div>
              <Monitor className="h-8 w-8 text-purple-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder={`${t("search")}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-testid="input-search-branches"
        />
      </div>

      {filteredBranches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("noBranches")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.map((branch) => (
            <Card key={branch.id} className={`relative ${!branch.isActive ? "opacity-60" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {language === "ar" ? branch.nameAr : branch.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{branch.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(branch)}
                      data-testid={`button-edit-branch-${branch.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(branch.id)}
                      data-testid={`button-delete-branch-${branch.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(branch.address || branch.addressAr) && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {language === "ar" ? branch.addressAr : branch.address}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Badge variant={branch.isActive ? "default" : "secondary"}>
                    {branch.isActive ? t("active") : t("inactive")}
                  </Badge>
                  {branch.latitude && branch.longitude && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {branch.radiusMeters || 100}m
                    </Badge>
                  )}
                  {branch.kioskEnabled && (
                    <Badge variant="outline" className="gap-1">
                      <Monitor className="h-3 w-3" />
                      {t("kioskMode")}
                    </Badge>
                  )}
                  {branch.mobileAttendanceEnabled && (
                    <Badge variant="outline" className="gap-1">
                      <Smartphone className="h-3 w-3" />
                      {t("mobileAttendance")}
                    </Badge>
                  )}
                </div>

                {(!branch.latitude || !branch.longitude) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {language === "ar" ? "الموقع غير محدد - الحضور بالوجه غير متاح" : "No GPS - Face attendance disabled"}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addBranch")}</DialogTitle>
          </DialogHeader>
          <BranchForm onSubmit={() => createMutation.mutate(formData)} />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editBranch")}</DialogTitle>
          </DialogHeader>
          <BranchForm 
            isEdit 
            onSubmit={() => selectedBranch && updateMutation.mutate({ id: selectedBranch.id, data: formData })} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
