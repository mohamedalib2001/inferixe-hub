import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Trash2, Info, AlertCircle, AlertTriangle, CheckCircle, Megaphone, Clock, Settings, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Notification, NotificationRecipient } from "@shared/schema";

type NotificationType = "info" | "success" | "warning" | "alert" | "announcement" | "reminder" | "system";
type NotificationPriority = "low" | "normal" | "high" | "urgent";

interface UserNotification extends NotificationRecipient {
  notification: Notification;
}

const typeIcons: Record<NotificationType, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500" />,
  success: <CheckCircle className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  alert: <AlertCircle className="h-4 w-4 text-red-500" />,
  announcement: <Megaphone className="h-4 w-4 text-purple-500" />,
  reminder: <Clock className="h-4 w-4 text-orange-500" />,
  system: <Settings className="h-4 w-4 text-gray-500" />,
};

const priorityColors: Record<NotificationPriority, string> = {
  low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  normal: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

const notificationSound = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYAUnLD5daxVRIBQI3i5bKGMQEoWNDhzLFpJQFAbdnfvrRvHAEvZNvXubJ0IgA0a9rTtrJ2HwEpY9rTtrJ2IAEmYdnStrJ3IQEjX9jRtLJ4IgEgXdfQs7J5IwEdW9bOsrJ6JAEaWdXNsbJ7JQEXVtTLsLJ8JgEUU9PKr7J9JwERUNLJrrKAKAEOS9HHrbKBKQELS87Fr7KBKQEJS8zErrKCKQIGScvDrbKCKQMERsnBrLKDKQMCRMi/q7KDKQQAP8a+qrKEKQQAPMS8qbKFKgQAO8K6qLKGKgQAOL+4p7KHKwQAN723prKIKwQANbu1pbKJLAQAM7mzpLKKLAQAMbexo7KLLAQALrWvo7KMLAQALLOtoLKNLAQAKq+rn7KOLDYAL6mnnrKPLQYALqelnLKQLQYALKSjm7KRLAYAL6Kgm7KSLAYAL6Cfm7KTLAYAL5+em7KULQYALp2cm7KVLQYALZubm7KWLQYALJqam7KXLgYAK5mZm7KYLgYAKpiYm7KZLgYAKZeXm7KaLgYAKJaWm7KbLwYAJ5WVm7KcLwYAJpSUm7KdLwYAJZOTm7KeLwYAJJKSm7KfMAYAI5GRm7KgMAYAIpCQm7KhMAYAIY+Pm7KiMQYAII6Om7KjMQYAH42Nm7KkMQYAHoyMm7KlMgYAHYuLm7KmMgYAHIqKm7KnMgYAG4mJm7KoMwYAGoiIm7KpMwYAGYeHm7KqMwYAGIaGm7KrNAYAF4WFm7KsNAYAFoSEm7KtNAYAFYODm7KuNAYAFIKCm7KvNQYAE4GBm7KwNQYAEoCAm7KxNQYAEX9/m7KyNgYAEH5+m7KzNgYAD319m7K0NgYADnx8m7K1NwYADXt7m7K2NwYADHp6m7K3NwYAC3l5m7K4OAYACnh4m7K5OAYACXd3m7K6OAYACHZ2m7K7OQYAh3V1m7K8OQcAhnR0m7K9OQcAhXNzm7K+OgcAhHJym7K/OgcAg3Fxm7LAOgcAgnBwm7LBOwcAgW9vm7LCOwcAgG5um7LDOwcAf21tm7LEPAcAfmxsm7LFPAcAfWtrm7LGPAcAfGpqm7LHPQcAe2lpnLLIPQcAemhoALLJPQgAeWdnALLKPggAeGZm");

export function NotificationBell() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === "ar";
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  const { data: notifications = [], refetch: refetchNotifications } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: unreadData, refetch: refetchCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 5000,
  });

  const unreadCount = unreadData?.count || 0;

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      try {
        notificationSound.currentTime = 0;
        notificationSound.volume = 0.5;
        notificationSound.play().catch(() => {});
      } catch (e) {}
    }
  }, [soundEnabled]);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "inferixe-notification",
      });
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isFirstLoadRef.current) {
      previousCountRef.current = unreadCount;
      isFirstLoadRef.current = false;
      return;
    }

    if (unreadCount > previousCountRef.current) {
      playNotificationSound();
      
      const latestNotification = notifications.find(n => !n.isRead);
      if (latestNotification) {
        const title = language === "ar" && latestNotification.notification.titleAr
          ? latestNotification.notification.titleAr
          : latestNotification.notification.title;
        const content = language === "ar" && latestNotification.notification.contentAr
          ? latestNotification.notification.contentAr
          : latestNotification.notification.content;
        
        showBrowserNotification(title, content);
        
        toast({
          title,
          description: content,
          duration: 5000,
        });
      }
    }
    
    previousCountRef.current = unreadCount;
  }, [unreadCount, notifications, playNotificationSound, showBrowserNotification, toast, language]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("DELETE", `/api/notifications/${notificationId}`);
    },
    onSuccess: () => {
      refetchNotifications();
      refetchCount();
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

  const getTitle = (notif: Notification) => {
    return language === "ar" && notif.titleAr ? notif.titleAr : notif.title;
  };

  const getContent = (notif: Notification) => {
    return language === "ar" && notif.contentAr ? notif.contentAr : notif.content;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0"
        align={isRTL ? "start" : "end"}
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">
            {t("notifications")}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">{t("noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 hover-elevate cursor-pointer transition-colors ${
                    !item.isRead ? "bg-accent/50" : ""
                  }`}
                  onClick={() => {
                    if (!item.isRead) {
                      markAsReadMutation.mutate(item.notificationId);
                    }
                    if (item.notification.actionUrl) {
                      window.location.href = item.notification.actionUrl;
                      setOpen(false);
                    }
                  }}
                  data-testid={`notification-item-${item.id}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {typeIcons[(item.notification.type as NotificationType) || "info"]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium truncate ${!item.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                          {getTitle(item.notification)}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.notification.priority !== "normal" && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] px-1.5 py-0 ${priorityColors[(item.notification.priority as NotificationPriority) || "normal"]}`}
                            >
                              {t(`priority${(item.notification.priority || "normal").charAt(0).toUpperCase() + (item.notification.priority || "normal").slice(1)}` as any)}
                            </Badge>
                          )}
                          {!item.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {getContent(item.notification)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(item.createdAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          {!item.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate(item.notificationId);
                              }}
                              data-testid={`button-mark-read-${item.id}`}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotificationMutation.mutate(item.notificationId);
                            }}
                            data-testid={`button-delete-notification-${item.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full h-8 text-xs"
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/notifications";
                }}
                data-testid="button-view-all-notifications"
              >
                {t("viewAllNotifications")}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
