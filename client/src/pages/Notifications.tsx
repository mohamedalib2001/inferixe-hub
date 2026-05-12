import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, Info, AlertCircle, AlertTriangle, CheckCircle, Megaphone, Clock, Settings, Send, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { SendNotificationDialog } from "@/components/SendNotificationDialog";
import { useAuth } from "@/hooks/use-auth";
import type { Notification, NotificationRecipient } from "@shared/schema";

type NotificationType = "info" | "success" | "warning" | "alert" | "announcement" | "reminder" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface UserNotification extends NotificationRecipient {
  notification: Notification;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  alert: <AlertCircle className="h-5 w-5 text-red-500" />,
  announcement: <Megaphone className="h-5 w-5 text-purple-500" />,
  reminder: <Clock className="h-5 w-5 text-orange-500" />,
  system: <Settings className="h-5 w-5 text-gray-500" />,
};

const priorityColors: Record<NotificationPriority, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  normal: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

const targetTypeLabels: Record<string, { en: string; ar: string }> = {
  all: { en: "All Users", ar: "جميع المستخدمين" },
  employees: { en: "Specific Employees", ar: "موظفين محددين" },
  department: { en: "Department", ar: "قسم" },
  branch: { en: "Branch", ar: "فرع" },
  role: { en: "Role", ar: "دور" },
};

export default function Notifications() {
  const { language, t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const isManagement = user && ["super_admin", "admin", "hr", "finance", "operations", "fleet_manager"].includes(user.role || "");

  const { data: notifications = [], refetch: refetchNotifications } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: sentNotifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications/sent"],
    enabled: isManagement && ["super_admin", "admin"].includes(user?.role || ""),
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });

  const unreadCount = unreadData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: language === "ar" ? ar : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPp", {
        locale: language === "ar" ? ar : enUS,
      });
    } catch {
      return dateStr;
    }
  };

  const getTitle = (notif: Notification) => {
    return language === "ar" && notif.titleAr ? notif.titleAr : notif.title;
  };

  const getContent = (notif: Notification) => {
    return language === "ar" && notif.contentAr ? notif.contentAr : notif.content;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread" && n.isRead) return false;
    if (typeFilter !== "all" && n.notification.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            {t("notificationCenter")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `${unreadCount} ${t("unreadNotifications")}`
              : t("noNotifications")
            }
          </p>
        </div>
        {isManagement && <SendNotificationDialog />}
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <Bell className="h-4 w-4" />
            {t("allNotifications")}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          {isManagement && ["super_admin", "admin"].includes(user?.role || "") && (
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              {t("sentNotifications")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="inbox" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">{t("allNotifications")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filter} onValueChange={(v: "all" | "unread") => setFilter(v)}>
                    <SelectTrigger className="w-[140px]" data-testid="select-notification-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("viewAll")}</SelectItem>
                      <SelectItem value="unread">{t("unreadNotifications")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]" data-testid="select-notification-type-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("viewAll")}</SelectItem>
                      <SelectItem value="info">{t("typeInfo")}</SelectItem>
                      <SelectItem value="success">{t("typeSuccess")}</SelectItem>
                      <SelectItem value="warning">{t("typeWarning")}</SelectItem>
                      <SelectItem value="alert">{t("typeAlert")}</SelectItem>
                      <SelectItem value="announcement">{t("typeAnnouncement")}</SelectItem>
                      <SelectItem value="reminder">{t("typeReminder")}</SelectItem>
                      <SelectItem value="system">{t("typeSystem")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                      data-testid="button-mark-all-read"
                    >
                      <CheckCheck className="h-4 w-4 mr-2" />
                      {t("markAllRead")}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg">{t("noNotifications")}</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          !item.isRead ? "bg-accent/30 border-accent" : "border-border"
                        }`}
                        data-testid={`notification-item-${item.id}`}
                      >
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {typeIcons[(item.notification.type as NotificationType) || "info"]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`font-medium ${!item.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                {getTitle(item.notification)}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {item.notification.priority !== "normal" && (
                                  <Badge
                                    variant="secondary"
                                    className={priorityColors[(item.notification.priority as NotificationPriority) || "normal"]}
                                  >
                                    {t(`priority${(item.notification.priority || "normal").charAt(0).toUpperCase() + (item.notification.priority || "normal").slice(1)}` as any)}
                                  </Badge>
                                )}
                                {!item.isRead && (
                                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {getContent(item.notification)}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{formatTime(item.createdAt)}</span>
                                {item.notification.senderName && (
                                  <span>• {item.notification.senderName}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {!item.isRead && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(item.notificationId)}
                                    data-testid={`button-mark-read-${item.id}`}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    {t("markAllRead").split(" ")[0]}
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteNotificationMutation.mutate(item.notificationId)}
                                  data-testid={`button-delete-notification-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {item.notification.actionUrl && (
                              <Button
                                variant="link"
                                className="p-0 h-auto mt-2"
                                onClick={() => window.location.href = item.notification.actionUrl!}
                              >
                                {language === "ar" && item.notification.actionLabelAr
                                  ? item.notification.actionLabelAr
                                  : item.notification.actionLabel || t("viewAll")
                                }
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isManagement && ["super_admin", "admin"].includes(user?.role || "") && (
          <TabsContent value="sent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("sentNotifications")}</CardTitle>
              </CardHeader>
              <CardContent>
                {sentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Send className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">{t("noNotifications")}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {sentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 rounded-lg border border-border"
                          data-testid={`sent-notification-${notif.id}`}
                        >
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                              {typeIcons[(notif.type as NotificationType) || "info"]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-medium">{getTitle(notif)}</h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge variant="secondary">
                                    {language === "ar"
                                      ? targetTypeLabels[notif.targetType || "all"]?.ar
                                      : targetTypeLabels[notif.targetType || "all"]?.en
                                    }
                                  </Badge>
                                  {notif.priority !== "normal" && (
                                    <Badge
                                      variant="secondary"
                                      className={priorityColors[(notif.priority as NotificationPriority) || "normal"]}
                                    >
                                      {t(`priority${(notif.priority || "normal").charAt(0).toUpperCase() + (notif.priority || "normal").slice(1)}` as any)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {getContent(notif)}
                              </p>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(notif.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
